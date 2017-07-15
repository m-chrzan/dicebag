const { lex } = require('./lexer.js')

let symbols = {}

let newSymbol = (type, nud, lbp, led) => {
  symbols[type] = { type, nud, lbp, led }
}

let lexemeToToken = lexeme => {
  let token = Object.create(symbols[lexeme.type])
  token.value = lexeme.value
  return token
}

newSymbol('constant', function() {
  return { type: 'constant', value: this.value }
})

newSymbol('(', function(parser) {
  const value = parser.expression(1)
  parser.match(')')
  return value
})

newSymbol(')')

newSymbol('d', null, 30, (left, parser) => {
  return {
    type: 'd',
    left: left,
    right: parser.expression(29)
  }
})

newSymbol('+', null, 20, (left, parser) => {
  return {
    type: 'add',
    left: left,
    right: parser.expression(20)
  }
})

newSymbol('-', null, 20, (left, parser) => {
  return {
    type: 'subtract',
    left: left,
    right: parser.expression(20)
  }
})

newSymbol('end', null, -1)

const newParser = (tokens) => {
  return {
    tokens,
    currentToken: 0,
    token: function() { return this.tokens[this.currentToken] },
    advanceToken: function() { this.currentToken++ },
    expression: function(rbp) {
      let symbol = this.token()
      let left = symbol.nud()
      this.advanceToken()

      while (rbp < this.token().lbp) {
        symbol = this.token()
        this.advanceToken()
        left = symbol.led(left, this)
      }

      return left
    }
  }
}

const parse = expressionString => {
  const tokens = lex(expressionString).map(lexemeToToken)
  tokens.push(symbols.end)

  const parser = newParser(tokens)
  return parser.expression(0)
}


exports.parse = parse
