# Local MF order testing

This sample consumes the parent React Native wrapper directly, including its
unpublished native adapters. The **MF Orders** tab opens first. Defaults:
`staging`, `gatewaydemo-stag`, and `https://mf-stag.smallcase.com`.

## Install and prepare

Use Node 20.19+ and JDK 17. Install the sample dependencies with the checked-in
Yarn lockfile (skip the parent package's publishing/build lifecycle):

```sh
cd smart_investing_react_native
YARN_IGNORE_PATH=1 yarn install --frozen-lockfile --ignore-scripts
```

From the wrapper root, prepare the Android SDK using the sibling
`gw-mob-android` checkout containing the new order API:

```sh
python3 scripts/prepare-mf-local-sdks.py android
```

This builds a debug AAR and a Maven POM with runtime dependencies under the ignored
`smart_investing_react_native/build/local-sdk/` directory. It does not publish to
Artifactory. Rerun it after changing native SDK source. Use `--android-source`
when the native checkout lives elsewhere. The native checkout must already have
its usual Android SDK and Gradle setup.

## Android phone

Enable USB debugging and authorize this computer on the phone. Confirm it appears
in `adb devices`. Add the Android SDK path to `android/local.properties` if needed.

Start Metro from this sample directory:

```sh
npm start
```

In another terminal, build from `smart_investing_react_native/android`:

```sh
MF_LOCAL_SDK=1 ./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Then install and connect Metro (use `adb -s DEVICE_ID` if several devices are connected):

```sh
adb install -r --user 0 app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.smart_investing_react_native/.MainActivity
```

`MF_LOCAL_SDK=1` selects the local AAR. Without it, the wrapper uses its configured
artifact version, which must support the new API. Metro and native autolinking
both point at the parent wrapper sources, so JS edits reload without reinstalling
the package. Native changes require rebuilding and reinstalling the app.

## Test steps

1. Confirm **Native order API: available**, then tap **Check native bridge**.
   A `passed: true` result verifies a real JS-to-native Promise call. It sends an
   invalid URL which native configuration validation rejects before any network
   request; it needs no JWT and does not place an order.
2. Enter the staging user ID and tap **Initialize staging SDK**. This
   retrieves the authentication JWT from the staging login endpoint (`https://api-stag.smartinvesting.io/user/login`).
   For a different partner, supply its gateway name and an SDK JWT explicitly.
   Credentials are held in memory and are not written to the event log.
3. Enter an MF **order** transaction ID belonging to that user/session. Holdings
   import IDs exercise a different API. Keep the default staging web URL.
4. Launch the order and inspect **Callbacks and results** after returning.
   Metadata is an editable JSON object; test light/dark preferences and additional
   nested keys. The test screen records native-action callbacks without navigating.
5. Repeat with analytics disabled, back/close cancellation, and a second launch.
   Expect one terminal Promise result and no duplicated callbacks from prior runs.

The selected web deployment must contain the `sdkBridge=1` bridge. On 2026-09-17,
the staging main bundle did not contain READY/INIT bridge support; deploy the
MF platform bridge change to staging before testing this order API. Authentication,
backend order status, and successful completion require valid staging data.
The token-free smoke check only verifies the RN/native boundary.

The same token-free native check can be run from the sample directory while the
phone is unlocked and the app is open:

```sh
npm run test:mf-native
```

It uses the app's development inspector to call the real wrapper twice and
checks that Android returns `INVALID_CONFIG` both times, including cleanup
between launches.

Verified locally on 2026-09-17: Android debug APK built and installed on a Samsung
SM-S921B; the real native bridge smoke check passed twice; all 17 wrapper unit
tests passed; the new MF test screen passed a scoped TypeScript check. The full
sample typecheck still reports errors in other sample screens. The development
web bundle contains READY/INIT bridge support. Authenticated order completion
has not yet been tested with a valid development user and transaction.

## iOS simulator (optional)

Prepare a simulator XCFramework from the sibling `gw-mob-ios` checkout:

```sh
python3 scripts/prepare-mf-local-sdks.py ios
```

An existing up-to-date build can be reused with `--ios-derived /path/to/DerivedData`.
Then, from this sample's `ios` directory:

```sh
MF_LOCAL_SDK=1 pod update SCGateway --no-repo-update
```

Run the workspace on a simulator with Metro running. The generated local pod is
simulator-only; a physical iPhone requires a device framework and signing setup.
The local pod version (`0.0.1`) is only a development resolver placeholder.

The checked-in Podfile.lock records this local simulator SDK setup. Generate the local SDK before running CocoaPods with `MF_LOCAL_SDK=1`. The Gateway framework and its 21 simulator tests pass; the complete sample app currently hits an existing fmt consteval compilation error with Xcode 26.6. Physical-device iOS checkout has not been verified.
