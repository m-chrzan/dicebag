const {
  pool,
  constant,
  d,
  add,
  subtract,
  bonusAdd,
  bonusSubtract,
  negative,
  explodeAbove,
  explodeUnder,
  keepHigh,
  keepLow,
  againAbove,
  againUnder,
  thresholdHigh,
  thresholdLow
} = require('../src/dice.js')

const defaultNumberRolls = 500
const defaultError = 0.2

const isWithinError = (value, expected, error) => {
  if (expected < 0) {
    value *= -1
    expected *= -1
  }

  const margin = expected * error
  return value >= expected - margin && value <= expected + margin
}

expect.extend({
  toBeOnAverage(received, expected, error = defaultError) {
    const average = received.reduce(plus) / received.length
    const pass = isWithinError(average, expected, error)

    return {
      pass,
      message: () => (
        `expected average to${pass ? ' not ' : ' '}be around ${expected} (error: ${error * 100}%), got ${average}`
      )
    }
  },
  toBeBetween(received, low, high) {
    const pass = received.reduce((allOk, value) => {
      return allOk && value >= low && value <= high
    }, true)

    return {
      pass,
      message: () => (
        `expected all to${pass ? ' not ' : ' '}be between ${low} and ${high}`
      )
    }
  },
  toAllBe(received, expected) {
    const pass = received.reduce((allOk, value) => {
      return allOk && value === expected
    }, true)

    return {
      pass,
      message: () => (
        `expected all to${pass ? ' not ' : ' '}be equal to ${expected}`
      )
    }
  },
  toHaveVariance(received, expected, error = defaultError) {
    const average = received.reduce(plus) / received.length
    const variance = received.map((value) => (Math.pow(value - average, 2)))
      .reduce(plus) / (received.length - 1)
    const pass = isWithinError(variance, expected, error)

    return {
      pass,
      message: () => (
        `expected variance to${pass ? ' not ' : ' '}be around ${expected} (error: ${error * 100}%), got ${variance}`
      )
    }
  }
})

const plus = (a, b) => a + b
const times = (a, b) => a * b

const rollForTest = (die, numberRolls) => {
  let pools = []
  let rolls = []

  for (let i = 0; i < numberRolls; i++) {
    let rolled = pool(die)
    pools.push(rolled)
    rolls.push(rolled.reduce(plus, 0))
  }

  return { pools, rolls }
}

const testDie = (die, testSpecs, numberRolls = defaultNumberRolls) => {
  let { pools, rolls } = rollForTest(die, numberRolls)

  if ('diceCount' in testSpecs) {
    it(`rolls ${testSpecs.diceCount} dice`, () => {
      expect(pools.map((pool) => (pool.length))).toAllBe(testSpecs.diceCount)
    })
  }

  if ('variableDiceCount' in testSpecs) {
    const {min, max} = testSpecs.variableDiceCount
    it(`rolls between ${min} and ${max} dice`, () => {
      expect(pools.map((pool) => (pool.length))).toBeBetween(min, max)
    })
  }

  if ('average' in testSpecs) {
    let { average, error } = testSpecs.average

    it(`has an expected value of ${average}`, () => {
      expect(rolls).toBeOnAverage(average, error)
    })
  }

  if ('variance' in testSpecs) {
    let { variance, error } = testSpecs.variance

    it(`has a variance of ${variance}`, () => {
      expect(rolls).toHaveVariance(variance, error)
    })
  }

  if ('bounds' in testSpecs) {
    let { low, high, expectLow, expectHigh } = testSpecs.bounds

    it(`rolls between ${low} and ${high}`, () => {
      expect(rolls).toBeBetween(low, high)
    })

    if (expectLow) {
      it('attains its minimum', () => {
        expect(rolls).toContain(low)
      })
    }

    if (expectHigh) {
      it('attains its maximum', () => {
        expect(rolls).toContain(high)
      })
    }
  }
}

const basicDieTestSpecs = (number, sides, negative = false) => {
  const multiplier = negative ? -1 : 1
  const low = negative ? -(number * sides) : number
  const high = negative ? -number : number * sides
  const expectExtrema = number * sides < 50
  return {
    diceCount: number,
    average: {
      average: (number * (sides + 1)) / 2 * multiplier
    },
    variance: {
      variance: (number * (sides * sides - 1)) / 12
    },
    bounds: {
      low: low,
      high: high,
      expectLow: expectExtrema,
      expectHigh: expectExtrema
    }
  }
}

const combinedDiceTestSpecs = (dieSpecs) => {
  const individualTestSpecs =
    dieSpecs.map(spec => (
      basicDieTestSpecs(spec.number, spec.sides, spec.negative)
    ))

  const combineSpecField = (fieldGetter) => {
    return individualTestSpecs.reduce((total, spec) => {
      return total + fieldGetter(spec)
    }, 0)
  }

  const expectExtrema =
    dieSpecs.map(spec => (Math.pow(spec.sides, spec.number)))
      .reduce(times) < 50
  return {
    diceCount: combineSpecField(spec => (spec.diceCount)),
    average: {
      average: combineSpecField(spec => (spec.average.average))
    },
    variance: {
      variance: combineSpecField(spec => (spec.variance.variance))
    },
    bounds: {
      low: combineSpecField(spec => (spec.bounds.low)),
      high: combineSpecField(spec => (spec.bounds.high)),
      expectLow: expectExtrema,
      expectHigh: expectExtrema
    }
  }
}

const describeBasicDie = (number, sides, numberRolls = defaultNumberRolls,
  neg = false) => {
  describe(`${number}d${sides}`, () => {
    let die = d(constant(number), constant(sides))
    if (neg) {
      die = negative(die)
    }
    testDie(die, basicDieTestSpecs(number, sides, neg), numberRolls)
  })
}

const getDieString = diceSpecs => (
  diceSpecs.reduce((string, spec, index) => (
    string + `${spec.number}d${spec.sides}` +
    (index < diceSpecs.length - 1 ?
      (diceSpecs[index + 1].negative ? ' - ' : ' + ')
      : '')
  ), '')
)

const combineDiceSpecs = diceSpecs => (
  diceSpecs.slice(1).reduce((die, spec) => {
    const combinator = spec.negative ? subtract : add
    return combinator(die, d(constant(spec.number), constant(spec.sides)))
  }, d(constant(diceSpecs[0].number), constant(diceSpecs[0].sides)))
)

const describeCompoundDice = (diceSpecs, numberRolls = defaultNumberRolls) => {
  const dieString = getDieString(diceSpecs)
  const die = combineDiceSpecs(diceSpecs)
  describe(dieString, () => testDie(die, combinedDiceTestSpecs(diceSpecs),
    numberRolls))
}

describe('constant', () => {
  describe('1', () => {
    const die = constant(1)
    testDie(die, {
      diceCount: 1,
      average: { average: 1 },
      variance: { variance: 0 },
      bounds: {
        low: 1,
        high: 1,
        expectLow: true,
      }
    }, 10)
  })

  describe('10', () => {
    const die = constant(10)
    testDie(die, {
      diceCount: 1,
      average: { average: 10 },
      variance: { variance: 0 },
      bounds: {
        low: 10,
        high: 10,
        expectLow: true,
      }
    }, 10)
  })

  describe('-5', () => {
    const die = constant(-5)
    testDie(die, {
      diceCount: 1,
      average: { average: -5 },
      variance: { variance: 0 },
      bounds: {
        low: -5,
        high: -5,
        expectLow: true,
      }
    }, 10)
  })
})

describe('basic dice', () => {
  describeBasicDie(1, 6)
  describeBasicDie(0, 6)
  describeBasicDie(2, 8, 500)
  describeBasicDie(20, 1)
})

describe('add', () => {
  describeCompoundDice([ { number: 1, sides: 6 }, { number: 1, sides: 4 } ])
  describeCompoundDice([
    { number: 3, sides: 6 },
    { number: 2, sides: 8 },
    { number: 1, sides: 1 }
  ])
})

describe('subtract', () => {
  describeCompoundDice([
    { number: 1, sides: 6 },
    { number: 1, sides: 4, negative: true }
  ])
  describe('3d6 - 2d8 - 1d1', () => {
    const diceSpecs = [
      { number: 3, sides: 6 },
      { number: 2, sides: 8, negative: true },
      { number: 1, sides: 1, negative: true }
    ]
    const die = combineDiceSpecs(diceSpecs)
    const testSpecs = combinedDiceTestSpecs(diceSpecs)
    testSpecs.average.error = 1
    describe('3d6 - 2d8 - 1d1', () => testDie(die, testSpecs, 700))
  })
})

describe('bonusAdd', () => {
  describe('1d20+3', () => {
    const die = bonusAdd(d(constant(1), constant(20)), constant(3))
    testDie(die, {
      diceCount: 1,
      average: {
        average: 13.5
      },
      variance: {
        variance: 33.25
      },
      bounds: {
        low: 4,
        high: 23,
        expectLow: true,
        expectHigh: true
      }
    })
  })

  describe('3d4+1', () => {
    const die = bonusAdd(d(constant(3), constant(4)), constant(1))
    testDie(die, {
      diceCount: 3,
      average: {
        average: 10.5
      },
      variance: {
        variance: 3.75
      },
      bounds: {
        low: 6,
        high: 15,
        expectLow: true,
        expectHigh: true
      }
    })
  })

  describe('2d6+1d6', () => {
    const die = bonusAdd(d(constant(2), constant(6)),
      d(constant(1), constant(6)))
    testDie(die, {
      diceCount: 2,
      average: {
        average: 14
      },
      variance: {
        variance: 11.67
      },
      bounds: {
        low: 4,
        high: 24,
        expectLow: false,
        expectHigh: false
      }
    })
  })
})

describe('bonusSubtract', () => {
  describe('1d20-3', () => {
    const die = bonusSubtract(d(constant(1), constant(20)), constant(3))
    testDie(die, {
      diceCount: 1,
      average: {
        average: 7.5
      },
      variance: {
        variance: 33.25
      },
      bounds: {
        low: -2,
        high: 17,
        expectLow: true,
        expectHigh: true
      }
    })
  })

  describe('3d4-1', () => {
    const die = bonusSubtract(d(constant(3), constant(4)), constant(1))
    testDie(die, {
      diceCount: 3,
      average: {
        average: 4.5
      },
      variance: {
        variance: 3.75
      },
      bounds: {
        low: 0,
        high: 9,
        expectLow: true,
        expectHigh: true
      }
    })
  })
})

describe('negative', () => {
  describeBasicDie(1, 6, defaultNumberRolls, true)
  describeBasicDie(0, 6, defaultNumberRolls, true)
  describeBasicDie(2, 8, defaultNumberRolls, true)
})

describe('compound dice', () => {
  describe('(1d4)d(1d6)', () => {
    const die = d(d(constant(1), constant(4)), d(constant(1), constant(6)))
    const testSpec = {
      variableDiceCount: {
        min: 1,
        max: 4,
      },
      average: {
        average: 5.625
      },
      bounds: {
        low: 1,
        high: 24,
        expectLow: true
      }
    }

    testDie(die, testSpec)
  })

  describe('(2d1)d(2d1)', () => {
    const die = d(d(constant(2), constant(1)), d(constant(2), constant(1)))

    testDie(die, basicDieTestSpecs(2, 2))
  })
})

describe('exploding dice', () => {
  describe('6E1d6', () => {
    const die = explodeAbove(constant(6), d(constant(1), constant(6)))
    testDie(die, {
      diceCount: 1,
      average: {
        average: 4.2
      },
      variance: {
        variance: 10.64
      },
      bounds: {
        low: 1,
        expectLow: true,
        high: Infinity
      }
    })
  })

  describe('6E2d6', () => {
    const die = explodeAbove(constant(6), d(constant(2), constant(6)))
    testDie(die, {
      diceCount: 2,
      average: {
        average: 2 * 4.2
      },
      variance: {
        variance: 2 * 10.64
      },
      bounds: {
        low: 2,
        expectLow: true,
        high: Infinity
      }
    })
  })

  describe('1e1d6', () => {
    const die = explodeUnder(constant(1), d(constant(1), constant(6)))
    testDie(die, {
      diceCount: 1,
      average: {
        average: 4.2
      },
      variance: {
        variance: 2.24
      },
      bounds: {
        low: 2,
        expectLow: true,
        high: Infinity
      }
    })
  })
})

describe('keep', () => {
  describe('1K2d20', () => {
    const die = keepHigh(constant(1), d(constant(2), constant(20)))

    testDie(die, {
      diceCount: 1,
      average: {
        average: 13.825
      },
      variance: {
        variance: 22.104
      },
      bounds: {
        low: 1,
        high: 20,
        expectLow: true,
        expectHigh: true
      }
    }, 800)
  })

  describe('2K1d20', () => {
    const die = keepHigh(constant(2), d(constant(1), constant(20)))
    testDie(die, basicDieTestSpecs(1, 20))
  })

  describe('1k2d20', () => {
    const die = keepLow(constant(1), d(constant(2), constant(20)))

    testDie(die, {
      diceCount: 1,
      average: {
        average: 7.175
      },
      variance: {
        variance: 22.194
      },
      bounds: {
        low: 1,
        high: 20,
        expectLow: true,
        expectHigh: true
      }
    }, 800)
  })

  describe('2k1d20', () => {
    const die = keepLow(constant(2), d(constant(1), constant(20)))
    testDie(die, basicDieTestSpecs(1, 20))
  })
})

describe('again', () => {
  describe('10A1d10', () => {
    const die = againAbove(constant(10), d(constant(1), constant(10)))

    testDie(die, {
      variableDiceCount: {
        min: 1,
        max: Infinity
      },
      average: {
        average: 6.11
      },
      variance: {
        variance: 19.03
      },
      bounds: {
        low: 1,
        high: Infinity,
        expectLow: true,
        expectHigh: false
      }
    })
  })

  describe('1a1d6', () => {
    const die = againUnder(constant(1), d(constant(1), constant(6)))

    testDie(die, {
      variableDiceCount: {
        min: 1,
        max: Infinity
      },
      average: {
        average: 4.2
      },
      variance: {
        variance: 2.24
      },
      bounds: {
        low: 2,
        high: Infinity,
        expectLow: true,
        expectHigh: false
      }
    })
  })
})

describe('threshold', () => {
  describe('8T3d10', () => {
    const die = thresholdHigh(constant(8), d(constant(3), constant(10)))

    testDie(die, {
      diceCount: 3,
      average: {
        average: 0.9
      },
      variance: {
        variance: 0.63
      },
      bounds: {
        low: 0,
        high: 3,
        expectLow: true,
        expectHigh: true
      }
    })
  })

  describe('4t3d10', () => {
    const die = thresholdLow(constant(4), d(constant(3), constant(10)))

    testDie(die, {
      diceCount: 3,
      average: {
        average: 1.2
      },
      variance: {
        variance: 0.72
      },
      bounds: {
        low: 0,
        high: 3,
        expectLow: true,
        expectHigh: true
      }
    })
  })
})
