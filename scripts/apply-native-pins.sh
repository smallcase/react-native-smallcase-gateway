#!/usr/bin/env bash
# Rewrites native SDK pins on their `native-sdk: <key>` marker lines. The only writer of those lines.
# Usage: scripts/apply-native-pins.sh android-scg=6.2.0-rc.1 ios-loans=7.6.0 ...
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION_RE='^[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$'

for pair in "$@"; do
  key=${pair%%=*} version=${pair#*=}
  case $key in
    android-scg | android-loans) file=android/build.gradle ;;
    ios-scg | ios-loans) file=react-native-smallcase-gateway.podspec ;;
    *) echo "unknown pin key: $key" >&2; exit 1 ;;
  esac
  [[ $version =~ $VERSION_RE ]] || { echo "invalid version for $key: $version" >&2; exit 1; }

  grep -q "native-sdk: $key\$" "$file" || { echo "no marker for $key in $file" >&2; exit 1; }
  # The pin is the only quoted version on the marker line: 'group:artifact:1.2.3' or 'Module' => '1.2.3'.
  sed -E -i.bak "/native-sdk: $key\$/s/[0-9]+\.[0-9]+\.[0-9]+[-.0-9A-Za-z]*'/$version'/" "$file"
  rm "$file.bak"
  grep -q "$version'.*native-sdk: $key\$" "$file" || { echo "failed to pin $key" >&2; exit 1; }
  echo "pinned $key = $version"
done
