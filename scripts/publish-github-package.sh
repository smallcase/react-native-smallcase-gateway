#!/usr/bin/env bash
# Publishes an internal build (rc, rc-debug, debug, preview) to GitHub Packages. Pins and name change are made in the
# workspace only, never committed.
# Usage: scripts/publish-github-package.sh <version> <dist-tag> [pin-key=version ...]
# Env: NODE_AUTH_TOKEN (packages: write), GH_TOKEN (read access to the iOS SPM repos).
set -euo pipefail
cd "$(dirname "$0")/.."

version=$1 tag=$2
shift 2
[ $# -eq 0 ] || scripts/apply-native-pins.sh "$@"

# GitHub Packages only accepts names in the owner's scope. Consumers install it with an npm alias.
npm pkg set name=@smallcase/react-native-smallcase-gateway version="$version"
npm publish --registry=https://npm.pkg.github.com --tag "$tag" # prepack vendors the iOS SDKs

{
  echo "### Published \`@smallcase/react-native-smallcase-gateway@$version\` (\`$tag\`)"
  echo
  echo '```'
  grep -hE 'native-sdk:' android/build.gradle react-native-smallcase-gateway.podspec | sed -E 's/^ +//'
  echo '```'
  echo
  echo 'Install (needs `@smallcase:registry=https://npm.pkg.github.com` in `.npmrc`):'
  echo
  echo '```json'
  echo "\"react-native-smallcase-gateway\": \"npm:@smallcase/react-native-smallcase-gateway@$version\""
  echo '```'
} >>"${GITHUB_STEP_SUMMARY:-/dev/stdout}"
