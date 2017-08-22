const P = require('./src/parser.js')
const D = require('./src/dice.js')

const interpret = tree => {
  switch(tree.type) {
  case 'constant':
    return D.constant(tree.value)
  case 'd':
    return D.d(interpret(tree.left), interpret(tree.right))
  case 'E':
    return D.explode(interpret(tree.left), interpret(tree.right))
  case 'K':
    return D.keepHigh(interpret(tree.left), interpret(tree.right))
  case 'k':
    return D.keepLow(interpret(tree.left), interpret(tree.right))
  case 'add':
    return D.add(interpret(tree.left), interpret(tree.right))
  case 'subtract':
    return D.subtract(interpret(tree.left), interpret(tree.right))
  case 'negative':
    return D.negative(interpret(tree.value))
  case 'bonusAdd':
    return D.bonusAdd(interpret(tree.left), interpret(tree.right))
  }
}

const parse = expressionString => {
  const tree = P.parse(expressionString)
  return interpret(tree)
}

exports.parse = parse
exports.roll = D.roll
exports.pool = D.pool
