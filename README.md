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
 
