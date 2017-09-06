const greaterThanOrEqual = (a, b) => a >= b
const lessThanOrEqual = (a, b) => a <= b

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

const multiply = (die1, die2) => {
  return () => {
    return [() => roll(die1) * roll(die2)]
  }
}

const divide = (die1, die2) => {
  return () => {
    return [() => Math.floor(roll(die1) / roll(die2))]
  }
}

const bonusAdd = (die1, die2) => {
  return () => {
    return die1().map(die => {
      return () => die() + roll(die2)
    })
  }
}

const bonusSubtract = (die1, die2) => {
  const negative2 = negative(die2)
  return () => {
    return die1().map(die => {
      return () => die() + roll(negative2)
    })
  }
}

const bonusMultiply = (die1, die2) => {
  return () => {
    return die1().map(die => {
      return () => die() * roll(die2)
    })
  }
}

const bonusDivide = (die1, die2) => {
  return () => {
    return die1().map(die => {
      return () => Math.floor(die() / roll(die2))
    })
  }
}

const explode = (comparison, die1, die2) => {
  return () => {
    const explodeOn = roll(die1)
    return die2().map(die => () => {
      let lastRoll = die()
      let total = lastRoll
      while (comparison(lastRoll, explodeOn)) {
        lastRoll = die()
        total += lastRoll
      }
      return total
    })
  }
}

const explodeAbove = (die1, die2) => {
  return explode(greaterThanOrEqual, die1, die2)
}

const explodeUnder = (die1, die2) => {
  return explode(lessThanOrEqual, die1, die2)
}



const keep = (order, die1, die2) => {
  return () => {
    const numberToKeep = roll(die1)
    let rolls = die2().map(die => [die, die()])
    rolls.sort(order)
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

const keepHigh = (die1, die2) => {
  return keep((a, b) => (b[1] - a[1]), die1, die2)
}

const keepLow = (die1, die2) => {
  return keep((a, b) => (a[1] - b[1]), die1, die2)
}

const again = (comparison, die1, die2) => {
  return () => {
    const againOn = roll(die1)
    let rolls = []
    let rollAgain = []

    const rollDie = (die) => {
      const roll = die()

      if (comparison(roll, againOn)) {
        rollAgain.push(die)
      }

      let returnedOriginal = false
      rolls.push(() => {
        if (!returnedOriginal) {
          returnedOriginal = true
          return roll
        } else {
          return die()
        }
      })
    }

    die2().forEach(rollDie)

    while (rollAgain.length > 0) {
      const oldRollAgain = rollAgain
      rollAgain = []
      oldRollAgain.forEach(rollDie)
    }

    return rolls
  }
}

const againAbove = (die1, die2) => {
  return again(greaterThanOrEqual, die1, die2)
}

const againUnder = (die1, die2) => {
  return again(lessThanOrEqual, die1, die2)
}

const threshold = (comparison, die1, die2) => {
  return () => {
    const cutoff = roll(die1)

    return die2().map(die => {
      return () => {
        if (comparison(die(), cutoff)) {
          return 1
        } else {
          return 0
        }
      }
    })
  }
}

const thresholdHigh = (die1, die2) => {
  return threshold(greaterThanOrEqual, die1, die2)
}

const thresholdLow = (die1, die2) => {
  return threshold(lessThanOrEqual, die1, die2)
}

const repeat = (die1, die2) => {
  return () => {
    const times = roll(die2)

    let results = []
    for (let i = 0; i < times; i++) {
      results = results.concat(die1())
    }

    return results
  }
}

exports.pool = pool
exports.roll = roll
exports.constant = constant
exports.d = d
exports.add = add
exports.subtract = subtract
exports.multiply = multiply
exports.divide = divide
exports.bonusAdd = bonusAdd
exports.bonusSubtract = bonusSubtract
exports.bonusMultiply = bonusMultiply
exports.bonusDivide = bonusDivide
exports.negative = negative
exports.explodeAbove = explodeAbove
exports.explodeUnder = explodeUnder
exports.keepHigh = keepHigh
exports.keepLow = keepLow
exports.againAbove = againAbove
exports.againUnder = againUnder
exports.thresholdHigh = thresholdHigh
exports.thresholdLow = thresholdLow
exports.repeat = repeat
