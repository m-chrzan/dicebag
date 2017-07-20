const constant = n => () => [() => n]

const pool = (die) => {
  return die().map((d) => d())
}

const roll = (die) => {
  return pool(die).reduce((a, b) => (a + b), 0)
}

const d = (number, sides) => {
  return () => {
    let pool = []

    const currentNumber = roll(number)
    const currentSides = roll(sides)

    for (let i = 0; i < currentNumber; i++) {
      pool.push(() => (1 + Math.floor(Math.random() * currentSides)))
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
    return die().map(die => () => (-die()))
  }
}

const subtract = (die1, die2) => {
  return () => {
    return die1().concat(negative(die2)())
  }
}

const explode = (die1, die2) => {
  return () => {
    const explodeOn = roll(die1)
    return die2().map(die => () => {
      let lastRoll = die()
      let total = lastRoll
      while (lastRoll >= explodeOn) {
        lastRoll = die()
        total += lastRoll
      }
      return total
    })
  }
}

const keepHigh = (die1, die2) => {
  return () => {
    const numberToKeep = roll(die1)
    let rolls = die2().map(die => [die, die()])
    rolls.sort((a, b) => (a[1] - b[1])).reverse()
    return rolls.slice(0, numberToKeep).map(pair => {
      let returnedOriginal = false
      return () => {
        if (!returnedOriginal) {
          returnedOriginal = true
          return pair[1]
        } else {
          return pair[0]()
        }
      }
    })
  }
}

exports.pool = pool
exports.roll = roll
exports.constant = constant
exports.d = d
exports.add = add
exports.subtract = subtract
exports.negative = negative
exports.explode = explode
exports.keepHigh = keepHigh
