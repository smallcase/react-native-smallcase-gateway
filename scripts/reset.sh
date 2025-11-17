#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

clean_dir() {
  local dir="$1"
  echo "[reset] Cleaning $dir"
  rm -rf "$dir/node_modules" || true
  rm -f "$dir/yarn.lock" "$dir/package-lock.json" "$dir/pnpm-lock.yaml" || true
  rm -rf "$dir/lib" "$dir/build" "$dir/dist" || true
  rm -rf "$dir/.gradle" "$dir/.idea" "$dir/.kotlin" "$dir/.cxx" || true
  rm -rf "$dir/.turbo" "$dir/.expo" "$dir/.parcel-cache" "$dir/.cache" || true
}

clean_android() {
  local android_dir="$1/android"
  if [ -d "$android_dir" ]; then
    echo "[reset] Cleaning Android at $android_dir"
    rm -rf "$android_dir/.gradle" "$android_dir/.idea" "$android_dir/.cxx" || true
    rm -rf "$android_dir/app/build" "$android_dir/build" || true
    rm -rf "$android_dir/**/build" || true
  fi
}

clean_ios() {
  local ios_dir="$1/ios"
  if [ -d "$ios_dir" ]; then
    echo "[reset] Cleaning iOS at $ios_dir"
    rm -rf "$ios_dir/build" "$ios_dir/Pods" "$ios_dir/Podfile.lock" || true
    # DerivedData
    if command -v xcrun >/dev/null 2>&1; then
      DERIVED=$(xcrun --show-sdk-platform-path 2>/dev/null || true)
    fi
    rm -rf "$HOME/Library/Developer/Xcode/DerivedData" || true
  fi
}

clean_watchman() {
  if command -v watchman >/dev/null 2>&1; then
    echo "[reset] watchman watch-del-all"
    watchman watch-del-all || true
  fi
}

clean_metro() {
  echo "[reset] Cleaning Metro cache"
  rm -rf "$HOME/.metro" "$TMPDIR/metro-*" 2>/dev/null || true
}

clean_gradle_cache() {
  echo "[reset] Cleaning Gradle caches (local project only)"
  rm -rf "$ROOT_DIR/.gradle" || true
}

main() {
  clean_watchman
  clean_metro
  clean_gradle_cache

  # Library root
  clean_dir "$ROOT_DIR"
  clean_android "$ROOT_DIR"
  clean_ios "$ROOT_DIR"

  # Example app
  EXAMPLE="$ROOT_DIR/smart_investing_react_native"
  if [ -d "$EXAMPLE" ]; then
    clean_dir "$EXAMPLE"
    clean_android "$EXAMPLE"
    clean_ios "$EXAMPLE"
  fi

  echo "[reset] Done"
}

main "$@"
