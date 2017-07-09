const d = (number, sides) => {
  return () => {
    let pool = []

    for (let i = 0; i < number; i++) {
      pool.push(1 + Math.floor(Math.random() * sides))
    }

    return pool
  }
}

const roll = (die) => {
  return die().reduce((a, b) => (a + b))
}

exports.d = d
exports.roll = roll
