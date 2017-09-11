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
    const die = parse(string)
    console.log(roller(die))
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
