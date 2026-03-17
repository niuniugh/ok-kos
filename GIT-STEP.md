## Quick Reference

```
git checkout main                        # go to main
git pull origin main                     # get latest changes
git checkout -b feature/your-name        # create your branch
# ... edit files ...
git status                               # see what changed
git add .                                # stage all changes
git commit -m "feat: your message"       # commit
git push origin feature/your-name        # push to GitHub
# open PR on GitHub → wait for CI → get review → merge
git checkout main                        # back to main
git pull origin main                     # sync merged changes
git branch -d feature/your-name          # delete local branch
```