const { parse } = require('../src/parser.js')

describe('parse', () => {
  describe('error handling', () => {
    it('throws when a binary operation lacks an argument', () => {
      expect(() => { parse('1d') }).toThrow(/Syntax error/)
      expect(() => { parse('2+3+') }).toThrow(/Syntax error/)
    })

    it('throws when two binary operations follow each other', () => {
      expect(() => { parse('1++2') }).toThrow(/Syntax error/)
    })

    it('throws when two dice not combined with a binary operation', () => {
      expect(() => { parse('(1d4)(1d6)') }).toThrow(/Syntax error/)
      expect(() => { parse('1 2') }).toThrow(/Syntax error/)
    })
  })

  it('parses a constant', () => {
    expect(parse('5')).toEqual({ type: 'constant', value: 5 })
  })

  it('parses a simple die with no left side', () => {
    expect(parse('d6')).toEqual({
      type: 'd',
      left: { type: 'constant', value: 1 },
      right: { type: 'constant', value: 6 }
    })
  })

  it('parses a simple die (1d6)', () => {
    expect(parse('1d6')).toEqual({
      type: 'd',
      left: { type: 'constant', value: 1 },
      right: { type: 'constant', value: 6 }
    })
  })

  it('parses a simple die (10d42)', () => {
    expect(parse('10d42')).toEqual({
      type: 'd',
      left: { type: 'constant', value: 10 },
      right: { type: 'constant', value: 42 }
    })
  })

  it('parses a compound die (1d2d3)', () => {
    expect(parse('1d2d3')).toEqual({
      type: 'd',
      left: { type: 'constant', value: 1 },
      right: {
        type: 'd',
        left: { type: 'constant', value: 2 },
        right: { type: 'constant', value: 3 }
      }
    })
  })

  it('parses constant addition', () => {
    expect(parse('1 + 2')).toEqual({
      type: 'add',
      left: { type: 'constant', value: 1 },
      right: { type: 'constant', value: 2 }
    })
  })

  it('parses dice addition', () => {
    expect(parse('2d8 + d6')).toEqual({
      type: 'add',
      left: {
        type: 'd',
        left: { type: 'constant', value: 2 },
        right: { type: 'constant', value: 8 }
      },
      right: {
        type: 'd',
        left: { type: 'constant', value: 1 },
        right: { type: 'constant', value: 6 }
      }
    })
  })

  it('parses dice subtraction', () => {
    expect(parse('1d6 - 2d8')).toEqual({
      type: 'subtract',
      left: {
        type: 'd',
        left: { type: 'constant', value: 1 },
        right: { type: 'constant', value: 6 }
      },
      right: {
        type: 'd',
        left: { type: 'constant', value: 2 },
        right: { type: 'constant', value: 8 }
      }
    })
  })

  it('parses negatives', () => {
    expect(parse('-1 + (-(2d6))')).toEqual({
      type: 'add',
      left: {
        type: 'negative',
        value: { type: 'constant', value: 1 }
      },
      right: {
        type: 'negative',
        value: {
          type: 'd',
          left: { type: 'constant', value: 2 },
          right: { type: 'constant', value: 6 }
        }
      }
    })
  })

  it('parses exploding dice', () => {
    expect(parse('1E1d6')).toEqual({
      type: 'E',
      left: { type: 'constant', value: 1 },
      right: {
        type: 'd',
        left: { type: 'constant', value: 1 },
        right: { type: 'constant', value: 6 }
      }
    })
  })

  describe('parsing parentheses', () => {
    test('(1d6)d6', () => {
      expect(parse('(1d6)d6')).toEqual({
        type: 'd',
        left: {
          type: 'd',
          left: { type: 'constant', value: 1 },
          right: { type: 'constant', value: 6 }
        },
        right: { type: 'constant', value: 6 },
      })
    })

    test('2d(6+3)d4', () => {
      expect(parse('2d(6+3)d4')).toEqual({
        type: 'd',
        left: { type: 'constant', value: 2 },
        right: {
          type: 'd',
          left: {
            type: 'add',
            left: { type: 'constant', value: 6 },
            right: { type: 'constant', value: 3 }
          },
          right: { type: 'constant', value: 4 }
        },
      })
    })
  })
})
