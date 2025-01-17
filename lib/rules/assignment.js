const { against, when, not, match, otherwise, anyOf } = require('match-iz')
const { makeSettingGetter, getConstruct } = require('../settings')
const { withImportDeclaration } = require('../helpers')

//
// Assignment expressions/methods
//

const arithmeticAssignmentMethods = {
  '+=': 'plus',
  '-=': 'minus',
  '/=': 'dividedBy',
  '*=': 'multipliedBy',
  '**=': 'exponentiatedBy',
  '%=': 'modulo'
}

const bitwiseAssignmentMethods = {
  '>>=': 'shiftedBy',
  '>>>=': 'shiftedBy',
  '<<=': ['${L}', 'shiftedBy', '-${R}']
}

const isAdvancedReplacer = method =>
  Array.isArray(method) && method.length === 3

const assignmentMethods = {
  ...arithmeticAssignmentMethods,
  ...bitwiseAssignmentMethods
}

const getAssignmentMethods = makeSettingGetter('assignment', assignmentMethods)
const getSupportsBitwise = makeSettingGetter('supportsBitwise', true)

function assignmentEntry(context) {
  const construct = getConstruct(context)

  const assignmentMethods = getAssignmentMethods(context)
  const isArithmeticAssignmentOp = anyOf(
    Object.keys(arithmeticAssignmentMethods)
  )
  const isBitwiseAssignmentOp = anyOf(Object.keys(bitwiseAssignmentMethods))
  const isBitwiseSupported = getSupportsBitwise(context)

  const isNotAlreadyBigNumber = not({ type: 'Identifier', name: construct })
  const SuggestArithmeticReplacement = SuggestReplacement

  return against(
    when({
      type: 'AssignmentExpression',
      operator: isArithmeticAssignmentOp,
      left: isNotAlreadyBigNumber
    })(SuggestArithmeticReplacement),

    when({
      type: 'AssignmentExpression',
      operator: isBitwiseAssignmentOp,
      left: isNotAlreadyBigNumber
    })(SuggestBitwiseReplacement)
  )

  function SuggestReplacement(node) {
    const original = context.getSource(node)

    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer => {
        const L = context.getSource(node.left)
        const R = context.getSource(node.right)

        const [left, method, right] = match(assignmentMethods[node.operator])(
          when(isAdvancedReplacer)($ =>
            $.map(one =>
              one
                .replace('__CONSTRUCT__', construct)
                .replace('${L}', L)
                .replace('${R}', R)
            )
          ),

          otherwise(method => [L, method, R])
        )

        return fixer.replaceText(
          node,
          `${left} = ${construct}(${left}).${method}(${right})`
        )
      }
    })
  }

  function SuggestBitwiseReplacement(node) {
    if (isBitwiseSupported) {
      return SuggestReplacement(node)
    }

    const original = context.getSource(node)

    context.report({
      node,
      message:
        `is '${original}' a financial calculation? ` +
        `If so, bitwise methods are not supported by ${construct}\n`
    })
  }
}

//
// Expose
//

module.exports = {
  create: context => ({
    AssignmentExpression: withImportDeclaration(
      context,
      assignmentEntry(context)
    )
  }),
  meta: {
    category: 'Financial, Currency',
    description:
      'Replace JavaScript assignment-expressions with BigNumber equivalents',
    fixable: 'code'
  }
}
