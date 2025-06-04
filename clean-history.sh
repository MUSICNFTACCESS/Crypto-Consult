#!/bin/bash
set -e

# Remove all traces of these files
FILES_TO_REMOVE=(
  ".bash_history"
  ".git-credentials"
)

for FILE in "${FILES_TO_REMOVE[@]}"; do
  git filter-branch --force --index-filter "git rm --cached --ignore-unmatch $FILE"     --prune-empty --tag-name-filter cat -- --all
done

# Cleanup backup refs GitHub might reject
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
