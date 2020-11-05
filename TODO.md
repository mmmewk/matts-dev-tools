- RunInteractive modes:
  - Fast Fail (current default)
    - Instantly stop if one task fails
  - Parallel
    - Run all tasks in parallel
    - Don't fail out if any of them fail
  - Execute all
    - Execute all tasks syncronously
    - Don't fail out if any of them fail
  - Verbose
    - instead of ora spinner show the normal output of the task

- Create Full test suite

- Implement git worktree
  - Currently git checkout interactive doesn't work if you have pending changes
  - Git worktree would allow you to just leave those changes in the branch without commiting them as you move to another branch

