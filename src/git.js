const { exec, execCommand, prompt } = require('./utils');
const { migrate, diffMigrations } = require('./rails');
const replace = require('lodash/replace');
const fs = require('fs');

async function getCurrentBranch(options = {}) {
  const { stdout: currentBranch } = await exec('git rev-parse --abbrev-ref HEAD', options);
  return currentBranch.trim();
}

async function getBranches(options = {}) {
  const { stdout: branchString } = await exec('git branch -v --sort=-committerdate', options);
  let branches = branchString.split(/\n/).map(branch => branch.trim()).filter(branch => !!branch);
  if (options.verbose) {
    branches = branches.map((branchString) => {
      let [, flag, branch, commitInfo] = branchString.match(/(\*)?\s*([\w-_/\\]+) +(.+)/);
      return { flag, branch, commitInfo };
    });
  } else {
    branches = branches.map(branch => replace(branch, /^\*\s*/, '').split(' ')[0]);
  }
  return branches;
}

const migrationPrompt = 'The branch you want to checkout has a different database migration than your branch. Do you want to run migrations?';

async function checkout(branch, options = {}) {
  if (!branch) return;
  let migrateUp = false;
  if (options.migrate) {
    // current branches migrations, oldest common migration between the two, and other branches migration
    let { current, common, other } = await diffMigrations(branch, options);
    let migrationConfirmed = false;
    // confirm that the user wants to migrate
    if (current !== undefined || other !== undefined) migrationConfirmed = await prompt(migrationPrompt);
    if (current !== undefined && migrationConfirmed) {
      await migrate({ version: common, ...options });
      if (fs.existsSync('db/structure.sql')) await exec('git checkout db/structure.sql');
      if (fs.existsSync('db/schema.rb')) await exec('git checkout db/schema.rb');
    }
    // migrate up if "other" branch has a migration this branch doesn't
    migrateUp = (other !== undefined && migrationConfirmed);
  }
  const command = `git checkout ${options.create ? '-b' : ''} ${branch}`;
  const action = options.create ? 'Create' : 'Checkout';
  const success = await execCommand(command, { context: `${action} ${branch}` });
  if (options.pull) await execCommand('git pull', { context: 'Update base branch' });
  if (migrateUp) await migrate({ ...options });
  return success;
}


module.exports = {
  getCurrentBranch,
  getBranches,
  checkout,
};