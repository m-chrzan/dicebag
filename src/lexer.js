const lexemeTypes = []

const newLexemeType = (type, regex, adder) => {
  lexemeTypes.push({
    type,
    regex: new RegExp(`^(${regex})(.*)$`),
    adder: adder || (lexemes => { lexemes.push({ type }) })
  })
}

const newValueLexeme = (type, regex, converter = v => v) => {
  newLexemeType(type, regex, (lexemes, value) => {
    lexemes.push({ type, value: converter(value) })
  })
}

newValueLexeme('number', '\\d+', Number)
newLexemeType('d', 'd')

const lex = (expressionString) => {
  let lexemes = []

  while (expressionString.length > 0) {
    let matched = false

    lexemeTypes.forEach(lexemeType => {
      let matches = lexemeType.regex.exec(expressionString)

      if (matches) {
        matched = true
        lexemeType.adder(lexemes, matches[1])
        expressionString = matches[2]
      }
    })

    if (!matched) {
      return 'error'
    }
  }

  return lexemes
}

exports.lex = lex
