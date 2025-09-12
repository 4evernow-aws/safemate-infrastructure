# SafeMate Dynamic Team Workflow Guide

## 🎯 Overview
Dynamic team branches for flexible collaboration.

## 🚀 Quick Start
1. Create team branch: `./create-team-branch.sh team/feature-name`
2. Work on feature in your branch
3. Merge to dev: `./merge-team-to-dev.sh team/feature-name`
4. Promote environments: `./promote-to-preprod.sh`

## �� Branch Structure
- main (or dev-build-main) ← Production
- prod ← Production environment
- preprod ← Pre-production environment  
- dev ← Development environment
- team/* ← Dynamic team branches

## ��️ Available Scripts
- `create-team-branch.sh` - Create new team branch
- `merge-team-to-dev.sh` - Merge team branch to dev
- `promote-to-preprod.sh` - Promote dev to preprod
- `promote-to-production.sh` - Promote preprod to production
