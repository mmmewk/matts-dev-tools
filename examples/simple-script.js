#!/usr/bin/env node

// example script showing how to use run interactive
// script takes a rails project with rubocop, sorbet and rspec integrated
// and runs the series of commands that the user wants on changed files
// user can choose to test the changes made since last commit or since master

const { runInteractive, scriptError } = require('../src/utils');

async function run () {
  const commands = [
    { title: 'Execute 1', value: 'sleep 1; echo 1', selected: true },
    { title: 'Execute 2', value: 'sleep 2; echo 2', selected: true },
    { title: 'Optional Command 3', value: 'sleep 3; echo 3', selected: false },
    { title: 'Failing Command 4', value: 'asdf', selected: false },
    { title: 'Disabled Command 5', value: 'sleep 5; echo 5', disabled: true },
  ]

  const exitCode = await runInteractive(commands, { prompt: 'Which commands would you like to run?', warn: 'Command disabled' });

  process.exit(exitCode)
}

run().catch(scriptError)