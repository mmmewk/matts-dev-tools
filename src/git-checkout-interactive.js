#!/usr/bin/env node

const colors = require('colors'); 
const fs = require('fs');
const commandExists = require('command-exists').sync;

const {
  promptSelect,
  scriptError,
} = require('./utils');

const { getTickets, findTicket } = require('./jira');
const { getBranches, checkout } = require('./git');

async function run () {
  let tickets = {};
  if (commandExists('jira')) {
    tickets = await getTickets();
  }
  const branches = await getBranches({ verbose: true });

  if (branches.length === 1) {
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
    return { title, value: branch, hint: commitInfo, disabled: flag === '*' };
  });

  // any tickets with not associated branch
  Object.values(tickets).forEach((ticket) => {
    title = `Create Branch for ${ticket.num}: ${colors.blue(ticket?.summary)}`;
    choices.push({ title, value: { num: ticket.num, create: true }, hint: ticket.summary });
  });

  let branch = await promptSelect('Switch Branch', choices, { warn: 'current branch' });
  const create = branch.create;

  if (branch.create) {
    const ticketType = await promptSelect('What type of ticket is this?', ['feature', 'bug', 'chore', 'hotfix']);
    branch = `${ticketType}/${branch.num}`;
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
    if (currentBranch !== 'master') await checkout('master', checkoutOptions);
    await checkout(branch, { create: true });
  } else {
    await checkout(branch, checkoutOptions)
  }

  process.exit(0);
}

run().catch(scriptError);