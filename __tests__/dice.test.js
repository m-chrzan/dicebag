const { d } = require('../src/dice.js')

const defaultNumberRolls = 100

expect.extend({
  toBeOnAverage(received, expected, margin = 0.3) {
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
  }
})

const plus = (a, b) => (a + b)

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

const testDie = (die, numberRolls, testSpecs) => {
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

  if ('bounds' in testSpecs) {
    let { low, high } = testSpecs.bounds

    it(`rolls between ${low} and ${high}`, () => {
      expect(rolls).toBeBetween(low, high)
    })

    it('attains its minimum', () => {
      expect(rolls).toContain(low)
    })

    it('attains its maximum', () => {
      expect(rolls).toContain(high)
    })
  }
}

const describeBasicDie = (number, sides, numberRolls = defaultNumberRolls) => {
  describe(`${number}d${sides}`, () => {
    const die = d(number, sides)
    const min = number
    const max = number * sides

    const testSpecs = {
      diceCount: number,
      average: {
        average: (min + max) / 2,
      },
      bounds: {
        low: min,
        high: max,
        expectLow: true,
        expectHigh: true
      }
    }

    testDie(die, numberRolls, testSpecs)
  })
}

describe('basic dice', () => {
  describeBasicDie(1, 6)
  describeBasicDie(2, 8)
  describeBasicDie(20, 1)
})
