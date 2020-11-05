#!/usr/bin/env node

// example script showing how to use run interactive
// script takes a rails project with rubocop, sorbet and rspec integrated
// and runs the series of commands that the user wants on changed files
// user can choose to test the changes made since last commit or since master

const { runInteractive, getChangedFiles, promptSelect, scriptError } = require('../src/utils');
const { getCurrentBranch } = require('../src/git');
const fs = require('fs');

async function run () {
  const currentBranch = await getCurrentBranch();

  const testAgainst = await promptSelect('Test changes against which base?', [{ title: 'Last Commit', value: currentBranch }, { title: 'Master', value: 'origin/master' }]);

  const rubyFiles = await getChangedFiles({ extensions: ['.rb', '.rake'], branch: testAgainst });
  const lintableFiles = rubyFiles.filter(file => file.match(/^(app|lib|spec|config)\//))

  // look for spec files by assuming the filenames match up
  const specFiles = lintableFiles.map((file) => {
    return file.replace(/^(app|lib|spec|config)\//, 'spec/')
               .replace(/controllers\/api\//, 'requests/')
               .replace(/(_spec|_controller)?\.(rb|rake)$/, '_spec.rb')
  }).filter(fs.existsSync)
  
  const shouldLint = lintableFiles.length !== 0;
  const shouldCheckSpecs = specFiles.length !== 0;

  const commands = [
    { title: 'Rubocop', value: 'rubocop', disabled: !shouldLint, selected: shouldLint, bundler: true, docker: false },
    { title: 'Sorbet', value: 'srb tc', disabled: !shouldLint, selected: shouldLint },
    { title: 'RSpec', value: `rspec --fail-fast ${specFiles.join(' ')}`, disabled: !shouldCheckSpecs, selected: shouldCheckSpecs, docker: true, bundler: true },
  ]

  if (!shouldLint && !shouldCheckSpecs) process.exit(0);

  const exitCode = await runInteractive(commands, { prompt: 'Which features would you like to test?', warn: '- No Files to test.' });

  process.exit(exitCode)
}

run().catch(scriptError)