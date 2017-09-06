const P = require('./src/parser.js')
const D = require('./src/dice.js')

const interpret = tree => {
  switch(tree.type) {
  case 'constant':
    return D.constant(tree.value)
  case 'd':
    return D.d(interpret(tree.left), interpret(tree.right))
  case 'E':
    return D.explodeAbove(interpret(tree.left), interpret(tree.right))
  case 'e':
    return D.explodeUnder(interpret(tree.left), interpret(tree.right))
  case 'K':
    return D.keepHigh(interpret(tree.left), interpret(tree.right))
  case 'k':
    return D.keepLow(interpret(tree.left), interpret(tree.right))
  case 'A':
    return D.againAbove(interpret(tree.left), interpret(tree.right))
  case 'a':
    return D.againUnder(interpret(tree.left), interpret(tree.right))
  case 'T':
    return D.thresholdHigh(interpret(tree.left), interpret(tree.right))
  case 't':
    return D.thresholdLow(interpret(tree.left), interpret(tree.right))
  case 'add':
    return D.add(interpret(tree.left), interpret(tree.right))
  case 'subtract':
    return D.subtract(interpret(tree.left), interpret(tree.right))
  case 'multiply':
    return D.multiply(interpret(tree.left), interpret(tree.right))
  case 'divide':
    return D.divide(interpret(tree.left), interpret(tree.right))
  case 'negative':
    return D.negative(interpret(tree.value))
  case 'bonusAdd':
    return D.bonusAdd(interpret(tree.left), interpret(tree.right))
  case 'bonusSubtract':
    return D.bonusSubtract(interpret(tree.left), interpret(tree.right))
  case 'bonusMultiply':
    return D.bonusMultiply(interpret(tree.left), interpret(tree.right))
  case 'bonusDivide':
    return D.bonusDivide(interpret(tree.left), interpret(tree.right))
  case 'repeat':
    return D.repeat(interpret(tree.left), interpret(tree.right))
  }
}

const parse = expressionString => {
  const tree = P.parse(expressionString)
  return interpret(tree)
}

exports.parse = parse
exports.roll = D.roll
exports.pool = D.pool
