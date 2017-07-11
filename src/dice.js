const constant = n => () => [n]

const d = (number, sides) => {
  return () => {
    let pool = []

    const currentNumber = number()
    const currentSides = sides()

    for (let i = 0; i < currentNumber; i++) {
      pool.push(1 + Math.floor(Math.random() * currentSides))
    }

    return pool
  }
}

const add = (die1, die2) => {
  return () => {
    return die1().concat(die2())
  }
}

const negative = (die) => {
  return () => {
    return die().map(value => -value)
  }
}

const subtract = (die1, die2) => {
  return () => {
    return die1().concat(negative(die2)())
  }
}

const roll = (die) => {
  return die().reduce((a, b) => (a + b))
}

exports.constant = constant
exports.d = d
exports.add = add
exports.subtract = subtract
exports.roll = roll
