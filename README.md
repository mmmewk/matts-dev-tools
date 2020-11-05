# matts-dev-tools
Developer tools making life in a rails, git, jira environment easier

# installation
`yarn global add matts-dev-tools`

# jira integration
- `yarn global add jira-cl`
- create a [api token](https://id.atlassian.com/manage-profile/security/api-tokens)
- Run `jira` and input your api token as the password

# errors
if your project has a `/tmp` folder it will store error messages in `/tmp/errors.txt`.
otherwise it will just show the entire error in the console.
setup this way because sometimes I don't want to see the entire error.
to see the last 100 lines of error run `tail -100 ./tmp/errors.txt`

# Git Checkout Interactive
Usage: `gci`
Boots up an interactive git checkout.
- displays all of your branches
- current branch is disabled
- shows the commit information as a hint
- if jira is enabled
  - it shows the ticket summary for any branches with the ticket-number in the branch name
  - it gives an option to create a branch for any tickets assigned to you in the current sprint that don't have a branch
  
# Git Clean Branches
Usage: `gcb`
Boots up an interactive terminal where you can clean out old branches.
- displays all of your branches
- current branch and master are disabled
- if jira is enabled
  - it shows the ticket summary for any branches with the ticket-number in the branch name
- allows you to mark a set of branches for deletion (old branches you had forgotten about and are already merged)
- reconfirms that you want to delete that set of branches
 
# Utils
- example: examples/check-changed-files
- execCommand executes a shell command and silences the console output replacing it with a spinner
- runInteractive will prompt you to select a set of commands from a list to run. It will fail instantly if any command fails
- prompt accepts a y/n question and returns a boolean base on user feadback
- promptSelect prompts the user to select an option from a passed in array
- getChangedFiles returns all files that git thinks have changed compared to a specific branch. Filterable by file extension and change type

# Jira
- example: git-checkout-interactive.js
- getTickets returns the tickets that the command `jira issue` returns
- findTicket given a branch name and the return of getTickets, finds the ticket corresponding to the branch if one exists

# Rails
- example: git.js checkout method
- getCurrentMigration gets the current migration version for a rails database
- getMigrations returns an array of migration version numbers
- diffMigrations returns { current: oldest migration that doesn't exist in other branch, common: oldest migration thats common between the two, other: oldest migration that doesn't exist in current branch }
- migrate migrates to a specific version or all the way up

# Git
- example: git-checkout-interactive.js
- getCurrentBranch returns current branch name
- getBranches returns branch objects with flag, branch name and commit info
- checkout checks if other branch has differences in database migrations, migrates database properly, checkouts out other branch (or creates if in create mode), migrates up if neeeded

# Inspiration
- [git-checkout-interactive](https://github.com/CookPete/git-checkout-interactive)
- [prompts](https://github.com/terkelg/prompts)
- [ora](https://github.com/sindresorhus/ora)
