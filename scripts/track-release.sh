#!/usr/bin/env bash
# Tracks an npm release in small-things (Slack notification).
# Non-critical: failures are logged but do not affect the release.
#
# Usage: track-release.sh --version <version>
set -o pipefail

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version) VERSION="$2"; shift 2 ;;
        *) echo "Unknown argument: $1"; exit 1 ;;
    esac
done

if [[ -z "$VERSION" ]]; then
    echo "Warning: No version provided. Skipping release tracking."
    exit 0
fi

SDK_NAME="react-native-smallcase-gateway"
RELEASE_TYPE="${RELEASE_TYPE:-prod}"

echo "Tracking release: $SDK_NAME v$VERSION (type: $RELEASE_TYPE)"

SMALL_THINGS_PATH="${SMALL_THINGS_PATH:-../small-things}"

if [[ ! -d "$SMALL_THINGS_PATH" ]]; then
    echo "Warning: small-things not found at $SMALL_THINGS_PATH. Skipping release tracking."
    exit 0
fi

if ! command -v deno &>/dev/null; then
    echo "Warning: Deno not found. Skipping release tracking."
    exit 0
fi

TRACK_ARGS=(
    --platform react-native
    --sdkName "$SDK_NAME"
    --version "$VERSION"
    --publishTarget "npm"
    --releaseType "$RELEASE_TYPE"
)
[ -n "${NOTIFY_WEBHOOK_URL:-}" ] && TRACK_ARGS+=( --webhookUrl "$NOTIFY_WEBHOOK_URL" )

ORIGINAL_DIR=$(pwd)
cd "$SMALL_THINGS_PATH"
deno run --allow-all main.ts gw track-release "${TRACK_ARGS[@]}" 2>&1 || {
    echo "Warning: Failed to track release in small-things (non-critical - release was successful)"
}
cd "$ORIGINAL_DIR"
