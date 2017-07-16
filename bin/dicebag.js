#!/usr/bin/env node
/* eslint no-console: 0 */

const { parse, roll, pool } = require('../index.js')

const parseArgs = () => {
  const args = process.argv.slice(2)
  const parsedArgs = {
    roller: roll,
    expression: null
  }

  while (args.length > 0) {
    const arg = args.shift()
    if (arg === '-p') {
      parsedArgs.roller = pool
    } else {
      parsedArgs.expression = arg
    }
  }

  return parsedArgs
}

const rollDie = (string, roller) => {
  try {
    const die = parse(string.trim())
    console.log(roller(die))
  } catch (error) {
    console.log(error.message)
  }
}

const runIoLoop = (roller) => {
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (string) => {
    rollDie(string, roller)
  })
}

const parsedArgs = parseArgs()
if (parsedArgs.expression) {
  rollDie(parsedArgs.expression, parsedArgs.roller)
} else {
  runIoLoop(parsedArgs.roller)
}
