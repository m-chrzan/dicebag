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

const explodeUnder = (die1, die2) => {
  return () => {
    const explodeOn = roll(die1)
    return die2().map(die => () => {
      let lastRoll = die()
      let total = lastRoll
      while (lastRoll <= explodeOn) {
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

const keepLow = (die1, die2) => {
  return () => {
    const numberToKeep = roll(die1)
    let rolls = die2().map(die => [die, die()])
    rolls.sort((a, b) => (a[1] - b[1]))
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

const again = (die1, die2) => {
  return () => {
    const againOn = roll(die1)
    let rolls = []
    let rollAgain = []

    const rollDie = (die) => {
      const roll = die()

      if (roll >= againOn) {
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

const againUnder = (die1, die2) => {
  return () => {
    const againOn = roll(die1)
    let rolls = []
    let rollAgain = []

    const rollDie = (die) => {
      const roll = die()

      if (roll <= againOn) {
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

const threshold = (die1, die2) => {
  return () => {
    const cutoff = roll(die1)

    return die2().map(die => {
      return () => {
        if (die() >= cutoff) {
          return 1
        } else {
          return 0
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
exports.bonusAdd = bonusAdd
exports.bonusSubtract = bonusSubtract
exports.negative = negative
exports.explode = explode
exports.explodeUnder = explodeUnder
exports.keepHigh = keepHigh
exports.keepLow = keepLow
exports.again = again
exports.againUnder = againUnder
exports.threshold = threshold
