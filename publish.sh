#!/bin/sh

error(){
  echo $1
  exit 1
}

echo '1. update docs && recompile'
echo '2. reflected changes in todo.txt'
echo '3. changed uhc.config.json.swp'
echo '4. change CHANGELOG.md'
echo '5. update the uhc template and change config version'
echo 'confirm pusblish?'
read null
echo 'commit version code'
read null

echo "compiling docs"
sh docs/compile.sh

update-npm

echo "publishing"
npm publish || error 'publishing error'

git push origin master || error 'pushing to origin error'

merge-master-release uhc || error "merge error"
echo "merge complete"

echo 'successfully published'
