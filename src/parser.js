const { lex } = require('./lexer.js')

let symbols = {}

let throwSyntaxError = () => {
  throw new Error('Syntax error: unexpected token')
}

let newSymbol = (type, nud, lbp, led) => {
  symbols[type] = {
    type,
    nud: nud || throwSyntaxError,
    lbp,
    led: led || throwSyntaxError
  }
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

newSymbol('d', (parser) => {
  return {
    type: 'd',
    left: { type: 'constant', value: 1 },
    right: parser.expression(29)
  }
}, 30, (left, parser) => {
  return {
    type: 'd',
    left: left,
    right: parser.expression(29)
  }
})

newSymbol('E', null, 30, (left, parser) => {
  return {
    type: 'E',
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

newSymbol('-', (parser) => {
  return {
    type: 'negative',
    value: parser.expression(40)
  }
}, 20, (left, parser) => {
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
    match: function(token) {
      if (this.token().type === token) {
        this.advanceToken()
      } else {
        throw throwSyntaxError()
      }
    },
    expression: function(rbp) {
      let symbol = this.token()
      this.advanceToken()
      let left = symbol.nud(this)

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
  const expression = parser.expression(0)
  parser.match('end')

  return expression
}


exports.parse = parse
