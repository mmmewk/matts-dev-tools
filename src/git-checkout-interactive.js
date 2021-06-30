#!/usr/bin/env node

const colors = require('colors'); 
const fs = require('fs');
const commandExists = require('command-exists').sync;

const {
  promptSelect,
  scriptError,
  enableKeypressListeners,
  addKeypressListener,
  exec,
} = require('./utils');


const { getTickets, findTicket } = require('./jira');
const { getBranches, checkout } = require('./git');

async function run () {
  enableKeypressListeners();
  let tickets = {};
  if (commandExists('jira')) {
    tickets = await getTickets();
  }
  const branches = await getBranches({ verbose: true });

  // No outstanding tickets or branches other than master
  if (branches.length === 1 && Object.keys(tickets).length === 0) {
    console.log(colors.yellow('Only one branch exists'));
    process.exit(0);
  }

  let currentBranch;
  const choices = branches.map(({ flag, branch, commitInfo }) => {
    const ticket = findTicket(branch, tickets);
    // keep track of which tickets are assigned to branches
    if (ticket) delete tickets[ticket.num];
    if (flag === '*') currentBranch = branch;
    title = branch;
    if (ticket) title += `: ${colors.blue(ticket.summary)}`;
    return { title, value: branch, hint: commitInfo, disabled: flag === '*', ticket };
  });

  // any tickets with not associated branch
  Object.values(tickets).forEach((ticket) => {
    title = `Create Branch for ${ticket.num}: ${colors.blue(ticket.summary)}`;
    choices.push({ title, value: { num: ticket.num, create: true }, hint: ticket.summary, ticket });
  });

  let currentTicket = null;
  addKeypressListener((str, key) => {
    if (key.name === 'o' && currentTicket) exec(`jira open ${currentTicket.num}`);
  });

  let branch = await promptSelect(
    'Switch Branch ("o" to open ticket in jira)',
    choices,
    {
      warn: 'current branch',
      onState: (choice) => {
        let defaultTicket;
        if (typeof choice.value === 'string') {
          const ticketMatch = choice.value.match(/(\w+-\d+)/);
          defaultTicket = ticketMatch ? { num: ticketMatch[0] } : null;
        }
        currentTicket = choice.ticket || defaultTicket;
      },
    }
  );

  if (!branch) process.exit(0);

  const create = branch.create;
  let baseBranch = 'master';
  const baseChoices = choices.filter((choice) => !choice.title.match(/^Create Branch for/))
                             .map((choice) => {
                               choice.disabled = false;
                               choice.selected = choice.value === baseBranch;
                               return choice;
                             })

  if (branch.create) {
    const ticketType = await promptSelect('What type of ticket is this?', ['feature', 'bug', 'chore', 'hotfix', 'refactor']);
    baseBranch = await promptSelect('Select a base branch', baseChoices)
    branch = `${ticketType}/${branch.num}`;
    if (!ticketType) process.exit(1);
  }

  // TODO: set up a configuration file so users can explicitly set this on a project to project basis
  checkoutOptions = {
    // if there is a db/migrate file run migrations when switching branches
    migrate: fs.existsSync('./db/migrate'),
    // if there is a docker compose file assume migrations have to happen inside docker
    docker: fs.existsSync('./docker-compose.yml'),
    // all migrations happen with bundler
    bundler: true,
  }

  if (create) {
    checkoutOptions['pull'] = true;
    if (currentBranch !== baseBranch) await checkout(baseBranch, checkoutOptions);
    await checkout(branch, { create: true });
  } else {
    await checkout(branch, checkoutOptions)
  }

  process.exit(0);
}

run().catch(scriptError);
