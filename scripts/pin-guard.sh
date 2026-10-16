#!/usr/bin/env bash
# Fails if a release pin is a prerelease (internal) native build. Runs before every npm publish.
set -euo pipefail
cd "$(dirname "$0")/.."

if grep -nE 'native-sdk:' android/build.gradle react-native-smallcase-gateway.podspec | grep -E -- "[0-9]+\.[0-9]+\.[0-9]+-"; then
  echo '::error::Release pins above are internal native builds. Pin production native versions before an npm release.'
  exit 1
fi
echo 'All native pins are production versions.'
