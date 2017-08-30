const { lex } = require('../src/lexer.js')

describe('lex', () => {
  it('lexes the empty string', () => {
    expect(lex('')).toEqual([])
  })

  it('throws on unexpected input', () => {
    expect(() => { lex('q') }).toThrow(/Syntax error/)
  })

  it('throws on unexpected input at the end', () => {
    expect(() => { lex('1d6`') }).toThrow(/Syntax error/)
  })

  it('throws on unexpected input in the middle', () => {
    expect(() => { lex('2d3 + b3d4') }).toThrow(/Syntax error/)
  })

  describe('throws on unexpected whitespace', () => {
    it('2 d 4', () => {
      expect(() => { lex('2 d 4') }).toThrow(/Syntax error/)
    })

    it('   1d8', () => {
      expect(() => { lex('   1d8') }).toThrow(/Syntax error/)
    })

    it('3d4   ', () => {
      expect(() => { lex('3d4   ') }).toThrow(/Syntax error/)
    })
  })

  describe('lexes basic dice', () => {
    it('1d6', () => {
      expect(lex('1d6')).toEqual([
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 6 }
      ])
    })

    it('42d172', () => {
      expect(lex('42d172')).toEqual([
        { type: 'constant', value: 42 },
        { type: 'd' },
        { type: 'constant', value: 172 }
      ])
    })
  })

  describe('lexes addition', () => {
    it('1d6 + 1d4', () => {
      expect(lex('1d6 + 1d4')).toEqual([
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 6 },
        { type: 'bigPlus' },
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 4 }
      ])
    })

    it('2d17 + 4', () => {
      expect(lex('2d17 + 4')).toEqual([
        { type: 'constant', value: 2 },
        { type: 'd' },
        { type: 'constant', value: 17 },
        { type: 'bigPlus' },
        { type: 'constant', value: 4 }
      ])
    })
  })

  describe('lexes subtraction', () => {
    it('1d6 - 1d4', () => {
      expect(lex('1d6 - 1d4')).toEqual([
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 6 },
        { type: 'bigMinus' },
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 4 }
      ])
    })

    it('2d17 - 4', () => {
      expect(lex('2d17 - 4')).toEqual([
        { type: 'constant', value: 2 },
        { type: 'd' },
        { type: 'constant', value: 17 },
        { type: 'bigMinus' },
        { type: 'constant', value: 4 }
      ])
    })
  })

  describe('lexes multiplication', () => {
    it('1d6 * 1d4', () => {
      expect(lex('1d6 * 1d4')).toEqual([
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 6 },
        { type: 'bigTimes' },
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 4 }
      ])
    })

    it('2d17 * 4', () => {
      expect(lex('2d17 * 4')).toEqual([
        { type: 'constant', value: 2 },
        { type: 'd' },
        { type: 'constant', value: 17 },
        { type: 'bigTimes' },
        { type: 'constant', value: 4 }
      ])
    })
  })

  describe('lexes parentheses', () => {
    it('(1d6)d6', () => {
      expect(lex('(1d6)d6')).toEqual([
        { type: '(' },
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 6 },
        { type: ')' },
        { type: 'd' },
        { type: 'constant', value: 6 }
      ])
    })

    it('2d(6 + 3)d4', () => {
      expect(lex('2d(6 + 3)d4')).toEqual([
        { type: 'constant', value: 2 },
        { type: 'd' },
        { type: '(' },
        { type: 'constant', value: 6 },
        { type: 'bigPlus' },
        { type: 'constant', value: 3 },
        { type: ')' },
        { type: 'd' },
        { type: 'constant', value: 4 }
      ])
    })
  })

  describe('lexes negatives', () => {
    it('-(1d6)', () => {
      expect(lex('-(1d6)')).toEqual([
        { type: 'minus' },
        { type: '(' },
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 6 },
        { type: ')' }
      ])
    })
  })

  describe('exploding dice', () => {
    test('1E1d6', () => {
      expect(lex('1E1d6')).toEqual([
        { type: 'constant', value: 1 },
        { type: 'E' },
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 6 }
      ])
    })

    test('1e1d6', () => {
      expect(lex('1e1d6')).toEqual([
        { type: 'constant', value: 1 },
        { type: 'e' },
        { type: 'constant', value: 1 },
        { type: 'd' },
        { type: 'constant', value: 6 }
      ])
    })
  })

  describe('keep', () => {
    test('1K2d20', () => {
      expect(lex('1K2d20')).toEqual([
        { type: 'constant', value: 1 },
        { type: 'K' },
        { type: 'constant', value: 2 },
        { type: 'd' },
        { type: 'constant', value: 20 }
      ])
    })
    test('1k2d20', () => {
      expect(lex('1k2d20')).toEqual([
        { type: 'constant', value: 1 },
        { type: 'k' },
        { type: 'constant', value: 2 },
        { type: 'd' },
        { type: 'constant', value: 20 }
      ])
    })
  })

  describe('bonusAdd', () => {
    test('3d4+1', () => {
      expect(lex('3d4+1')).toEqual([
        { type: 'constant', value: 3 },
        { type: 'd' },
        { type: 'constant', value: 4 },
        { type: 'plus' },
        { type: 'constant', value: 1 }
      ])
    })
  })

  describe('again', () => {
    test('6A3d6', () => {
      expect(lex('6A3d6')).toEqual([
        { type: 'constant', value: 6 },
        { type: 'A' },
        { type: 'constant', value: 3 },
        { type: 'd' },
        { type: 'constant', value: 6 }
      ])
    })

    test('6a3d6', () => {
      expect(lex('6a3d6')).toEqual([
        { type: 'constant', value: 6 },
        { type: 'a' },
        { type: 'constant', value: 3 },
        { type: 'd' },
        { type: 'constant', value: 6 }
      ])
    })
  })

  describe('threshold', () => {
    test('8T3d10', () => {
      expect(lex('8T3d10')).toEqual([
        { type: 'constant', value: 8 },
        { type: 'T' },
        { type: 'constant', value: 3 },
        { type: 'd' },
        { type: 'constant', value: 10 }
      ])
    })

    test('8t3d10', () => {
      expect(lex('8t3d10')).toEqual([
        { type: 'constant', value: 8 },
        { type: 't' },
        { type: 'constant', value: 3 },
        { type: 'd' },
        { type: 'constant', value: 10 }
      ])
    })
  })
})
