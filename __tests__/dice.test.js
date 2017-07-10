const { d, add } = require('../src/dice.js')

const defaultNumberRolls = 500

expect.extend({
  toBeOnAverage(received, expected, margin = 0.5) {
    const average = received.reduce(plus) / received.length
    const pass = average > expected - margin && average < expected + margin

    return {
      pass,
      message: () => (
        `expected average to${pass ? ' not ' : ' '}be around ${expected} (margin: ${margin}), got ${average}`
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
  toHaveVariance(received, expected, margin = 0.5) {
    const average = received.reduce(plus) / received.length
    const variance = received.map((value) => (Math.pow(value - average, 2)))
      .reduce(plus) / (received.length - 1)
    const pass = variance > expected - margin && variance < expected + margin

    return {
      pass,
      message: () => (
        `expected variance to${pass ? ' not ' : ' '}be around ${expected} (margin: ${margin}), got ${variance}`
      )
    }
  }
})

const plus = (a, b) => a + b

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

  if ('average' in testSpecs) {
    let { average, margin } = testSpecs.average

    it(`has an expected value of ${average}`, () => {
      expect(rolls).toBeOnAverage(average, margin)
    })
  }

  if ('variance' in testSpecs) {
    let { variance, margin } = testSpecs.variance

    it(`has a variance of ${variance}`, () => {
      expect(rolls).toHaveVariance(variance, margin)
    })
  }

  if ('bounds' in testSpecs) {
    let { low, high, expectExtrema } = testSpecs.bounds

    it(`rolls between ${low} and ${high}`, () => {
      expect(rolls).toBeBetween(low, high)
    })

    if (expectExtrema) {
      it('attains its minimum', () => {
        expect(rolls).toContain(low)
      })

      it('attains its maximum', () => {
        expect(rolls).toContain(high)
      })
    }
  }
}

const basicDieTestSpecs = (number, sides) => {
  return {
    diceCount: number,
    average: {
      average: (number * (sides + 1)) / 2
    },
    variance: {
      variance: (number * (sides * sides - 1)) / 12
    },
    bounds: {
      low: number,
      high: number * sides,
      expectExtrema: true
    }
  }
}

const combinedDiceTestSpecs = (dieSpecs) => {
  const individualTestSpecs =
    dieSpecs.map(spec => (basicDieTestSpecs(spec.number, spec.sides)))

  const combineSpecField = (fieldGetter) => {
    return individualTestSpecs.reduce((total, spec) => {
      return total + fieldGetter(spec)
    }, 0)
  }

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
    }
  }
}

const describeBasicDie = (number, sides, numberRolls = defaultNumberRolls) => {
  describe(`${number}d${sides}`, () => {
    const die = d(number, sides)
    testDie(die, basicDieTestSpecs(number, sides), numberRolls)
  })
}

const describeCompoundDice = (diceSpecs, numberRolls = defaultNumberRolls) => {
  const dieString = diceSpecs.reduce((string, spec, index) => (
    string + `${spec.number}d${spec.sides}` +
      (index < diceSpecs.length - 1 ? ' + ' : '')
  ), '')

  const die = diceSpecs.slice(1).reduce((die, spec) => {
    return add(die, d(spec.number, spec.sides))
  }, d(diceSpecs[0].number, diceSpecs[0].sides))

  describe(dieString, () => testDie(die, combinedDiceTestSpecs(diceSpecs),
    numberRolls))
}

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
