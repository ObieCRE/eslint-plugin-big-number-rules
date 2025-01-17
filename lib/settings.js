const { isPojo } = require('match-iz')

function makeSettingGetter(setting = 'construct', value = 'BigNumber') {
  return context => {
    const { settings } = context

    const override = settings[`big-number-rules`]?.[setting] ?? value
    const output =
      isPojo(value) && isPojo(override) && value !== override
        ? { ...value, ...override }
        : override

    return output
  }
}

const getConstruct = makeSettingGetter('construct', 'BigNumber')
const getImportDeclaration = makeSettingGetter(
  'importDeclaration',
  '__IGNORE__'
)
const getImportSpecifier = makeSettingGetter('importSpecifier', '__IGNORE__')

module.exports = {
  makeSettingGetter,
  isPojo,
  getConstruct,
  getImportDeclaration,
  getImportSpecifier
}
