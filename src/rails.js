const { execCommand, exec, getChangedFiles } = require('./utils');

function getMigrationVersions(files) {
  return files.filter(file => file.match(/^db\/migrate\//))
              .map(file => parseInt(file.match(/^db\/migrate\/(\d*)/)[1]))
              .sort();
}

async function getMigrations(options) {
  const { stdout: migrationFiles } = await exec('git ls-files ./db/migrate', options);
  if (!migrationFiles) return [0];
  return [0, ...getMigrationVersions(migrationFiles.split(/\n/).filter(file => !!file.trim()))].sort();
}

async function getCurrentMigration(options = { bundler: true }) {
  const command = inContext('rails db:version', options);
  const { stdout: migrationText } = await exec(command, options);
  return parseInt(migrationText.replace('Current version: ', '').trim());
}

async function diffMigrations(branch, options) {
  const all = await getMigrations(options);
  const addedFiles = await getChangedFiles({ extensions: ['.rb'], types: ['A'], branch, ...options });
  const removedFiles = await getChangedFiles({ extensions: ['.rb'], types: ['D'], branch, ...options });
  const added = getMigrationVersions(addedFiles);
  const removed = getMigrationVersions(removedFiles);
  const youngestAdded = added.shift();

  // for common migration get the last migration before the youngest new migration
  const common = all.filter(migration => migration < youngestAdded);
  
  return { current: added.pop() || youngestAdded, other: removed.pop(), common: common.pop() };
}

async function migrate(options = {}) {
  options = Object.assign({ bundler: true }, options);
  let command = 'rails db:migrate';
  if (options.version !== undefined) command += ` VERSION=${options.version}`;
  let context = 'Migrate Database';
  if (options.version !== undefined) context += ` to version: ${options.version}`;
  return await execCommand(command, { context, ...options });
}

module.exports = {
  getCurrentMigration,
  getMigrations,
  diffMigrations,
  migrate,
};