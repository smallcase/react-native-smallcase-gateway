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

# Determine the target triple for the current platform
OS=$(uname -s)
ARCH=$(uname -m)
case "$OS-$ARCH" in
    Darwin-arm64)  TARGET="aarch64-apple-darwin" ;;
    Darwin-x86_64) TARGET="x86_64-apple-darwin" ;;
    Linux-aarch64) TARGET="aarch64-unknown-linux-gnu" ;;
    Linux-x86_64)  TARGET="x86_64-unknown-linux-gnu" ;;
    *)
        echo "Warning: Unsupported platform $OS-$ARCH. Skipping release tracking."
        exit 0
        ;;
esac

SMALL_THINGS_BIN=$(mktemp /tmp/small-things.XXXXXX)
DOWNLOAD_URL="https://github.com/smallcase/small-things/releases/latest/download/small-things-$TARGET"

if ! curl -fsSL "$DOWNLOAD_URL" -o "$SMALL_THINGS_BIN" 2>&1; then
    echo "Warning: Failed to download small-things binary. Skipping release tracking."
    rm -f "$SMALL_THINGS_BIN"
    exit 0
fi
chmod +x "$SMALL_THINGS_BIN"

TRACK_ARGS=(
    --platform react-native
    --sdkName "$SDK_NAME"
    --version "$VERSION"
    --publishTarget "npm"
    --releaseType "$RELEASE_TYPE"
)
[ -n "${NOTIFY_WEBHOOK_URL:-}" ] && TRACK_ARGS+=( --webhookUrl "$NOTIFY_WEBHOOK_URL" )

"$SMALL_THINGS_BIN" gw track-release "${TRACK_ARGS[@]}" 2>&1 || {
    echo "Warning: Failed to track release in small-things (non-critical - release was successful)"
}
rm -f "$SMALL_THINGS_BIN"
