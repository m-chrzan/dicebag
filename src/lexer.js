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

newValueLexeme('constant', '\\d+', Number)
newLexemeType('d', 'd')
newLexemeType('bigPlus', ' \\+ ' )
newLexemeType('bigMinus', ' - ')
newLexemeType('minus', '-')
newLexemeType('(', '\\(')
newLexemeType(')', '\\)')
newLexemeType('E', 'E')
newLexemeType('K', 'K')

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
      throw new Error('Syntax error: unrecognized token')
    }
  }

  return lexemes
}

exports.lex = lex
