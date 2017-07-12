const { constant, d, add, subtract } = require('../src/dice.js')

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
    })

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
    let rolled = die()
    pools.push(rolled)
    rolls.push(rolled.reduce(plus))
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

const describeBasicDie = (number, sides, numberRolls = defaultNumberRolls) => {
  describe(`${number}d${sides}`, () => {
    const die = d(constant(number), constant(sides))
    testDie(die, basicDieTestSpecs(number, sides), numberRolls)
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

const describeCompoundDice = (diceSpecs, numberRolls = defaultNumberRolls) => {
  const dieString = getDieString(diceSpecs)
  const die = diceSpecs.slice(1).reduce((die, spec) => {
    const combinator = spec.negative ? subtract : add
    return combinator(die, d(constant(spec.number), constant(spec.sides)))
  }, d(constant(diceSpecs[0].number), constant(diceSpecs[0].sides)))

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
  describeCompoundDice([
    { number: 3, sides: 6 },
    { number: 2, sides: 8, negative: true },
    { number: 1, sides: 1, negative: true }
  ], defaultNumberRolls, { varianceError: 1 })
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
