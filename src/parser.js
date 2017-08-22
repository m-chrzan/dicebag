const { lex } = require('./lexer.js')

let symbols = {}

let throwSyntaxError = () => {
  throw new Error('Syntax error: unexpected token')
}

let lexemeToToken = lexeme => {
  let token = Object.create(symbols[lexeme.type])
  token.value = lexeme.value
  return token
}

const dieBindingPower = 30

let newSymbol = (type, nud, lbp, led) => {
  const symbol = symbols[type] || {}
  symbols[type] = {
    type,
    nud: nud || symbol.nud || throwSyntaxError,
    lbp: symbol.lbp || lbp,
    led: led || symbol.led || throwSyntaxError
  }
}

const newInfix = (symbol, lbp, options) => {
  const type = options.type || symbol
  const rbp = options.rbp || lbp
  newSymbol(symbol, null, lbp, (left, parser) => {
    return {
      type: type,
      left: left,
      right: parser.expression(rbp)
    }
  })
}

const newDieOperation = (symbol) => {
  newInfix(symbol, dieBindingPower, { rbp: dieBindingPower - 1 })
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

newDieOperation('d')
newSymbol('d', (parser) => {
  return {
    type: 'd',
    left: { type: 'constant', value: 1 },
    right: parser.expression(dieBindingPower - 1)
  }
})
newDieOperation('E')
newDieOperation('K')
newDieOperation('k')

newInfix('bigPlus', 20, { type: 'add' })
newInfix('bigMinus', 20, { type: 'subtract' })
newInfix('plus', 25, { type: 'bonusAdd' })
newInfix('minus', 25, { type: 'bonusSubtract' })
newSymbol('minus', (parser) => {
  return {
    type: 'negative',
    value: parser.expression(40)
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
