const { exec, execCommand, prompt } = require('./utils');
const { migrate, diffMigrations } = require('./rails');
const replace = require('lodash/replace');

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
  if (options.migrate && await prompt(migrationPrompt)) {
    let { current, common, other } = await diffMigrations(branch, options);
    if (current !== undefined) {
      await migrate({ version: common, ...options });
      // when you migrate down it modifies structure.sql
      await exec('git checkout db/structure.sql');
    }
    // migrate up if "other" branch has a migration this branch doesn't
    migrateUp = (other !== undefined);
  }
  const command = `git checkout ${options.create ? '-b' : ''} ${branch}`;
  const action = options.create ? 'Create' : 'Checkout';
  const success = await execCommand(command, { context: `${action} ${branch}` });
  if (migrateUp) await migrate({ ...options });
  return success;
}


module.exports = {
  getCurrentBranch,
  getBranches,
  checkout,
};