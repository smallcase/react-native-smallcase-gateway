#!/usr/bin/env bash
# Self-check for apply-native-pins.sh and pin-guard.sh. Restores the pin files on exit.
set -uo pipefail
cd "$(dirname "$0")/.."
cp android/build.gradle /tmp/rnsg-gradle.$$ && cp react-native-smallcase-gateway.podspec /tmp/rnsg-podspec.$$ && cp native-sdk-debug.json /tmp/rnsg-debug.$$
trap 'mv /tmp/rnsg-gradle.$$ android/build.gradle; mv /tmp/rnsg-podspec.$$ react-native-smallcase-gateway.podspec; mv /tmp/rnsg-debug.$$ native-sdk-debug.json' EXIT

fail() { echo "FAIL: $*"; exit 1; }
run() { scripts/apply-native-pins.sh "$@" >/dev/null 2>&1; }

scripts/pin-guard.sh >/dev/null || fail 'guard rejects committed pins'
run android-scg=9.8.7 ios-loans=1.2.3 || fail 'valid pins'
grep -q "com.smallcase.gateway:sdk:9.8.7' // native-sdk: android-scg" android/build.gradle || fail 'android-scg not written'
grep -q "'Loans' => '1.2.3', # native-sdk: ios-loans" react-native-smallcase-gateway.podspec || fail 'ios-loans not written'
changed=$( (diff /tmp/rnsg-gradle.$$ android/build.gradle; diff /tmp/rnsg-podspec.$$ react-native-smallcase-gateway.podspec) | grep -c '^>')
[ "$changed" = 2 ] || fail "expected 2 changed lines, got $changed"
scripts/pin-guard.sh >/dev/null || fail 'guard rejects release pins'
run ios-scg=7.3.1-rc.1645 || fail 'prerelease pin'
scripts/pin-guard.sh >/dev/null 2>&1 && fail 'guard accepts a prerelease pin'
run bogus=1.0.0 && fail 'unknown key accepted'
run android-loans='1.0.0;rm -rf /' && fail 'bad version accepted'
run android-loans=latest && fail 'non-semver accepted'
run --debug ios-scg=7.3.1-rc-debug.1644 || fail 'debug pin'
[ "$(jq -r '."ios-scg"' native-sdk-debug.json)" = 7.3.1-rc-debug.1644 ] || fail 'debug pin not written'
grep -q "rc-debug" react-native-smallcase-gateway.podspec && fail 'debug pin touched a marker line'
run --debug bogus=1.0.0 && fail 'unknown debug key accepted'
echo 'native pin checks passed'
