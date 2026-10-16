#!/usr/bin/env bash
# Vendors the iOS SDK XCFrameworks pinned in the podspec (IOS_SDKS) from their SPM releases into ios/Frameworks.
# Needs `gh` authenticated with read access to the SPM distribution repos (GH_TOKEN in CI).
set -euo pipefail
cd "$(dirname "$0")/.."

out=ios/Frameworks
mkdir -p "$out"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

grep -E "native-sdk: ios-" react-native-smallcase-gateway.podspec | sed -E "s/^ *'([A-Za-z]+)' => '([^']+)'.*/\1 \2/" |
  while read -r module tag; do
    # A tag with a prerelease part is an internal build, released to the internal distribution repo.
    case "$module:$tag" in
      SCGateway:*-*) repo=solutions-ios-sdk-internal ;;
      SCGateway:*) repo=gw-mob-ios-swift-package ;;
      Loans:*-*) repo=credit-ios-sdk-internal ;;
      Loans:*) repo=credit-ios-sdk ;;
      *) echo "unknown iOS SDK: $module" >&2; exit 1 ;;
    esac

    manifest=$(gh api "repos/smallcase/$repo/contents/Package.swift?ref=$tag" --jq .content | base64 --decode)
    url=$(sed -nE 's/.*url: *"([^"]+)".*/\1/p' <<<"$manifest")
    checksum=$(sed -nE 's/.*checksum: *"([0-9a-f]+)".*/\1/p' <<<"$manifest")
    [ -n "$url" ] && [ -n "$checksum" ] || { echo "no binary target in $repo@$tag" >&2; exit 1; }

    if [ "$(cat "$out/.$module.checksum" 2>/dev/null)" = "$checksum" ] && [ -d "$out/$module.xcframework" ]; then
      echo "$module $tag: up to date"
      continue
    fi

    zip="$tmp/$module.zip"
    if [[ $url == https://github.com/smallcase/*/releases/download/* ]]; then
      # GitHub release assets of private repos need auth; gh handles both.
      gh release download "$tag" -R "smallcase/$repo" -p "${url##*/}" -O "$zip"
    else
      curl -fsSL "$url" -o "$zip"
    fi
    actual=$(shasum -a 256 "$zip" | cut -d' ' -f1)
    [ "$actual" = "$checksum" ] || { echo "$module $tag: checksum $actual, expected $checksum" >&2; exit 1; }

    rm -rf "$out/$module.xcframework" "$tmp/unzip"
    unzip -q "$zip" -d "$tmp/unzip"
    mv "$(find "$tmp/unzip" -maxdepth 2 -type d -name "$module.xcframework" | head -1)" "$out/"
    echo "$checksum" >"$out/.$module.checksum"
    echo "$module $tag: vendored from $repo"
  done
