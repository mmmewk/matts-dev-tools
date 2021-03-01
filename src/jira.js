const { exec, log } = require('./utils');
const colors = require('colors');
const commandExists = require('command-exists').sync;

const ticketRegex = /\w+-\d+/;

async function getTickets() {
  if (!commandExists('jira')) {
    log(`
      ${colors.yellow('Jira cli is not installed.')}
      Run: ${colors.blue('yarn global add jira-cl')}
      Then go to: ${colors.blue('https://id.atlassian.com/manage-profile/security/api-tokens')} and generate an api token
      Then Run: ${colors.blue('jira')} and set your password to the api token.
    `);
    return false;
  }

  const { stdout } = await exec('jira i');

  return stdout.split(/\n/)
               .filter(string => !!string.trim())
               .map(string => string.replace(new RegExp(/\x1B\[\d{2}m/,'g'), '').trim())
               .reduce((tickets, string) => {
    const ticketInfo = string.split(/\s{2,}/);
    if (ticketInfo.length < 3) return tickets;
    const num = ticketInfo[0].trim();
    if (!num.match(ticketRegex)) return tickets;
    tickets[num] = {
      num,
      status: ticketInfo[1].trim(),
      summary: ticketInfo[2].trim(),
    };
    return tickets;
  }, {});
}

// given a branch get the ticket corresponding to that branch
function findTicket(branch, tickets) {
  return Object.values(tickets).find((ticket) => branch.match(ticket.num));
}

module.exports = {
  getTickets,
  findTicket,
};