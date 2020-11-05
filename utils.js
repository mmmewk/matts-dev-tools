
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const logSymbols = require('log-symbols');
const ora = require('ora');
const prompts = require('prompts');
const spinnerColors = ['yellow', 'blue', 'magenta', 'cyan'];
const sample = require('lodash/sample');
const fs = require('fs');

const colors = require('colors');

function log(msg) {
  if (process.env.NODE_ENV !== 'test') console.log(msg);
}

async function runInteractive(commands, options = {}) {
  const { steps } = await prompts({
    type: 'multiselect',
    name: 'steps',
    instructions: false,
    message: options.prompt || 'Choose Actions you would like to take',
    choices: commands,
    ...options,
  });

  if (!steps) return;
  const exitCodes = []

  // if a single step fails stop the entire process
  while (steps.length > 0 && exitCodes.every(code => code === 0)) {
    step = steps.shift();
    commandInfo = commands.find(command => command.value === step);
    const exitCode = await execCommand(step, {
      context: commandInfo.title,
      ...commandInfo,
    });
    exitCodes.push(exitCode);
  }

  // if the last exit code was successful then the whole thing worked.
  return exitCodes.pop();
};


const inDocker = 'docker-compose run --rm web';
const withBundle = 'bundle exec';

function inContext(command, { bundler = false, docker = false } = {}) {
  if (bundler) command = `${withBundle} ${command}`;
  if (docker) command = `${inDocker} ${command}`;
  return command;
}

async function execCommand(command, options = {}) {
  command = inContext(command, options);
  if (options.context) log(`${colors.yellow(options.context)}`);
  log(`${colors.blue(command)}`);
  const spinner = ora().start();
  spinner.color = sample(spinnerColors);
  spinner.text = `Time Elapsed: ${0}s\n`;
  let clock = 0;

  setInterval(() => {
    clock += 1;
    spinner.text = `Time Elapsed: ${clock}s\n`;
  }, 1000);

  try {
    await exec(command, options);

    spinner.stopAndPersist({ symbol: logSymbols.success, color: 'green' });
    return 0;
  } catch(error) {
    spinner.stopAndPersist({ symbol: logSymbols.error, color: 'red' });
    storeError(error);
    return 1;
  }
}

function storeError(error) {
  const errorsDir = './tmp';
  const errorFile = `${errorsDir}/errors.txt`;
  if (!fs.existsSync(errorsDir)) {
    log(colors.red(error.stdout || error.stderr));
    return;
  }
  buffer = new Uint8Array(Buffer.from(error.stdout || error.stderr));
  fs.writeFileSync(errorFile, buffer);
  log('To get the last 100 lines of error message run:');
  log(colors.blue('tail -100 ./tmp/errors.txt'));
}

async function verifyDirectory(directory, options = { silent: false }) {
  if (process.cwd() !== directory) {
    if (!options.silent) log(colors.red(`You must be in ${directory} to clone the database`));
    return false;
  }
  return true;
}

async function prompt(message) {
  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message,
  });
  return confirmed;
}

async function promptSelect(message, choices, options) {
  const transformedChoices = choices.map((choice) => {
    if (typeof choice === 'string') return { title: choice, hint: choice, value: choice };

    if (!choice.hint) choice.hint = choice.value;
    if (!choice.title) choice.title = choice.value;
    return choice;
  })

  const { selected } = await prompts({
    type: 'select',
    name: 'selected',
    message,
    choices: transformedChoices,
    hint: transformedChoices[0].hint,
    onState ({ value }) {
      this.hint = transformedChoices.find(c => c.value === value).hint
    },
    ...options,
  });

  return selected;
}

// This should be in git.js but is causing a circular dependancy
async function getChangedFiles({ extensions = ['\w*'], types = ['A','M','R','T', 'U'], branch = 'master' } = {}) {
  let { stdout: untractedFiles } = await exec('git ls-files --others --exclude-standard');
  untractedFiles = untractedFiles.split(/\n/).filter(file => !!file.trim()).map(file => `A\t${file}`).join('\n');
  let { stdout: changedFiles } = await exec(`git diff --name-status ${branch}`);
  if (types.includes('A')) changedFiles = `${changedFiles}${untractedFiles}`;
  return changedFiles.split(/\n/)
                     .filter(file => file.match(new RegExp(`^[${types.join('|')}]`)))
                     .filter(file => file.match(new RegExp(`\.(${extensions.join('|')})$`)))
                     .map(file => file.replace(new RegExp(`^[${types.join('|')}]\s*\\t`), ''))
                     .map(file => file.trim())
                     .filter(file => !!file)
}

function scriptError (e) {
  if (e.stderr) {
    log(e.stderr)
  } else {
    log(e)
  }
}

module.exports = {
  runInteractive,
  execCommand,
  prompt,
  promptSelect,
  inContext,
  verifyDirectory,
  exec,
  scriptError,
  getChangedFiles,
  log,
};