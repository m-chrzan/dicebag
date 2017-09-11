#!/usr/bin/env node
/* eslint no-console: 0 */

const { parse, roll, pool } = require('../index.js')

const rollRoller = {
  roll: roll,
  format: value => value
}

const poolRoller = {
  roll: pool,
  format: values => {
    if (values.length === 0) {
      return '[]'
    } else {
      return '[ ' + values.reduce((acc, next) => (
        acc + ', ' + String(next)
      )) + ' ]'
    }
  }
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  const parsedArgs = {
    roller: rollRoller,
    expression: null
  }

  while (args.length > 0) {
    const arg = args.shift()
    if (arg === '-p') {
      parsedArgs.roller = poolRoller
    } else {
      parsedArgs.expression = arg
    }
  }

  return parsedArgs
}

const rollDie = (string, roller) => {
  try {
    const die = parse(string)
    const roll = roller.roll(die)
    console.log(roller.format(roll))
  } catch (error) {
    console.log(error.message)
  }
}

const runIoLoop = (roller) => {
  console.log("Type 'quit' or 'exit' to exit")
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (string) => {
    string = string.trim()
    if (string === 'exit' || string === 'quit') {
      process.exit(0)
    }

    rollDie(string, roller)
  })
}

const parsedArgs = parseArgs()
if (parsedArgs.expression) {
  rollDie(parsedArgs.expression, parsedArgs.roller)
} else {
  runIoLoop(parsedArgs.roller)
}
