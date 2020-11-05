#!/usr/bin/env node

const colors = require('colors');
const prompts = require('prompts');
const { execCommand, prompt } = require('./utils');
const { getBranches } = require('./git');
const { getTickets, findTicket } = require('./jira');

async function run () {
  // TODO: make a config file so users can set this
  const protectedBranches = ['master'];

  const branches = await getBranches({ verbose: true });

  if (branches.length === 1) {
    console.log(colors.yellow('Only one branch exists'));
    process.exit(0);
  }
  
  const tickets = await getTickets();

  const choices = branches.map(({ flag, branch }) => {
    const ticket = findTicket(branch, tickets);
    title = branch;
    if (ticket) title += `: ${colors.blue(ticket.summary)}`;
    return { title, value: branch, disabled: flag === '*' || protectedBranches.includes(branch) }
  });

  const { toDelete } = await prompts({
    type: 'multiselect',
    name: 'toDelete',
    message: 'Select branches to mark for deletion',
    choices,
    instructions: false,
    warn: "- Branch is Protected -",
  });

  if (!toDelete) process.exit(1);

  const confirmed = await prompt(`Warning this will delete the following branches do you want to continue: \n${toDelete.join('\n')}\n`);

  if (!confirmed) process.exit(1);

  await deleteBranches(toDelete)

  process.exit(0);
}

async function deleteBranches (branches) {
  if (!branches) return
  while (branches.length > 0) await execCommand(`git branch -D ${branches.pop()}`);
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)