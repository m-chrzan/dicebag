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

  it('parses dice multiplication', () => {
    expect(parse('1d6 * 2d8')).toEqual({
      type: 'multiply',
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

  it('parses dice division', () => {
    expect(parse('1d6 / 2d8')).toEqual({
      type: 'divide',
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

  it('parses additive bonuses', () => {
    expect(parse('3d4+1')).toEqual({
      type: 'bonusAdd',
      left: {
        type: 'd',
        left: { type: 'constant', value: 3 },
        right: { type: 'constant', value: 4 }
      },
      right: { type: 'constant', value: 1 }
    })
  })

  it('parses negative bonuses', () => {
    expect(parse('3d4-1')).toEqual({
      type: 'bonusSubtract',
      left: {
        type: 'd',
        left: { type: 'constant', value: 3 },
        right: { type: 'constant', value: 4 }
      },
      right: { type: 'constant', value: 1 }
    })
  })

  it('parses multiplicative bonuses', () => {
    expect(parse('3d4*1')).toEqual({
      type: 'bonusMultiply',
      left: {
        type: 'd',
        left: { type: 'constant', value: 3 },
        right: { type: 'constant', value: 4 }
      },
      right: { type: 'constant', value: 1 }
    })
  })

  test('bonus binds stronger than addition', () => {
    expect(parse('2d6 + 2d6+2d6')).toEqual({
      type: 'add',
      left: {
        type: 'd',
        left: { type: 'constant', value: 2 },
        right: { type: 'constant', value: 6 }
      },
      right: {
        type: 'bonusAdd',
        left: {
          type: 'd',
          left: { type: 'constant', value: 2 },
          right: { type: 'constant', value: 6 }
        },
        right: {
          type: 'd',
          left: { type: 'constant', value: 2 },
          right: { type: 'constant', value: 6 }
        }
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

    expect(parse('1e1d6')).toEqual({
      type: 'e',
      left: { type: 'constant', value: 1 },
      right: {
        type: 'd',
        left: { type: 'constant', value: 1 },
        right: { type: 'constant', value: 6 }
      }
    })
  })

  it('parses dice with keep high', () => {
    expect(parse('1K2d20')).toEqual({
      type: 'K',
      left: { type: 'constant', value: 1 },
      right: {
        type: 'd',
        left: { type: 'constant', value: 2 },
        right: { type: 'constant', value: 20 }
      }
    })
  })

  it('parses dice with keep low', () => {
    expect(parse('1k2d20')).toEqual({
      type: 'k',
      left: { type: 'constant', value: 1 },
      right: {
        type: 'd',
        left: { type: 'constant', value: 2 },
        right: { type: 'constant', value: 20 }
      }
    })
  })

  it('parases dice with again', () => {
    expect(parse('10A3d10')).toEqual({
      type: 'A',
      left: { type: 'constant', value: 10 },
      right: {
        type: 'd',
        left: { type: 'constant', value: 3 },
        right: { type: 'constant', value: 10 }
      }
    })

    expect(parse('10a3d10')).toEqual({
      type: 'a',
      left: { type: 'constant', value: 10 },
      right: {
        type: 'd',
        left: { type: 'constant', value: 3 },
        right: { type: 'constant', value: 10 }
      }
    })
  })

  it('parases dice with threshold', () => {
    expect(parse('7T4d8')).toEqual({
      type: 'T',
      left: { type: 'constant', value: 7 },
      right: {
        type: 'd',
        left: { type: 'constant', value: 4 },
        right: { type: 'constant', value: 8 }
      }
    })

    expect(parse('7t4d8')).toEqual({
      type: 't',
      left: { type: 'constant', value: 7 },
      right: {
        type: 'd',
        left: { type: 'constant', value: 4 },
        right: { type: 'constant', value: 8 }
      }
    })
  })

  it('parses dice with repeat', () => {
    expect(parse('1d6 x 1d4')).toEqual({
      type: 'repeat',
      left: {
        type: 'd',
        left: { type: 'constant', value: 1 },
        right: { type: 'constant', value: 6 }
      },
      right: {
        type: 'd',
        left: { type: 'constant', value: 1 },
        right: { type: 'constant', value: 4 }
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

    test('2d(6 + 3)d4', () => {
      expect(parse('2d(6 + 3)d4')).toEqual({
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

  describe('order of operations', () => {
    test('2 * 3 + 4', () => {
      expect(parse('2 * 3 + 4')).toEqual({
        type: 'add',
        left: {
          type: 'multiply',
          left: { type: 'constant', value: 2 },
          right: { type: 'constant', value: 3 },
        },
        right: { type: 'constant', value: 4 },
      })
    })

    test('2 + 3 * 4', () => {
      expect(parse('2 + 3 * 4')).toEqual({
        type: 'add',
        left: { type: 'constant', value: 2 },
        right: {
          type: 'multiply',
          left: { type: 'constant', value: 3 },
          right: { type: 'constant', value: 4 },
        }
      })
    })
  })
})
