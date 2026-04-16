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

if [ -z "${GITHUB_ACCESS_TOKEN:-}" ]; then
    echo "Warning: GITHUB_ACCESS_TOKEN not set. Skipping release tracking."
    exit 0
fi

if ! curl -fsSL -H "Authorization: token $GITHUB_ACCESS_TOKEN" \
    https://raw.githubusercontent.com/smallcase/small-things/main/install.sh | bash -s -- latest "$GITHUB_ACCESS_TOKEN"; then
    echo "Warning: Failed to install small-things. Skipping release tracking."
    exit 0
fi

export PATH="$HOME/.deno/bin:$PATH"

TRACK_ARGS=(
    --platform react-native
    --sdkName "$SDK_NAME"
    --version "$VERSION"
    --publishTarget "npm"
    --releaseType "$RELEASE_TYPE"
)
[ -n "${NOTIFY_WEBHOOK_URL:-}" ] && TRACK_ARGS+=( --webhookUrl "$NOTIFY_WEBHOOK_URL" )

small-things gw track-release "${TRACK_ARGS[@]}" 2>&1 || {
    echo "Warning: Failed to track release in small-things (non-critical - release was successful)"
}
