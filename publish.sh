#!/bin/sh

error(){
  echo $1
  exit 1
}

echo '1. update docs'
echo '2. reflected changes in todo.txt'
echo '3. changed hhc.config.json.swp'
echo '4. change CHANGELOG.md'
echo 'confirm pusblish?'
read null
echo 'commit version code'
read null

update-npm

echo "publishing"
npm publish || error 'publishing error'

# pushing to master
git push origin master || error 'pushing to origin error'

merge-master-release || error "merge error"
echo "merge complete"

echo 'successfully published'
