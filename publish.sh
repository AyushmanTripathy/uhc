#!/bin/sh

error(){
  echo $1
  exit 1
}

echo '1. update docs'
echo '2. reflected changes in todo.txt'
echo '3. changed hhc.config.json.swp'
echo '4. commited version code'
echo 'confirm pusblish?'
read null

update-npm
npm version minor || error "version change error"

echo "publishing"
npm publish || error 'publishing error'

# pushing to master
git push origin master || error 'pushing to origin error'

echo "merging master --> release"

curl \
  -X POST \
  -u "AyushmanTripathy":$(cat ~/.pat/git) \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/AyushmanTripathy/hcc/merges" \
  -d '{"base":"release","head":"master"}' | error 'merging error'
echo "merge complete"

echo 'successfully published'
