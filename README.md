# react-native-smallcase-gateway

[📖 Complete Guide](https://developers.gateway.smallcase.com/docs/react-native-integration)

## Getting started

`$ yarn add react-native-smallcase-gateway`

or

`$ npm install react-native-smallcase-gateway`

## ios setup

add these lines at the top of your `Podfile`

```ruby
# private podspec for smallcase
source 'git@github.com:smallcase/cocoapodspecs.git'

# default source for all other pods
source 'https://cdn.cocoapods.org'

# update the ios version if it was previously below 13.0
platform :ios, '13.0'
```

then run
`cd ios; pod update`

## android setup

Add these lines to your project level `build.gradle`

```groovy
allprojects {
    repositories {
        // .. you other repositories
        maven {
          url "http://artifactory.smallcase.com/artifactory/gradle-dev-local"
          credentials {
            username "react_native_user"
            password "reactNativeUser123"
          }
      }
    }
}
```

add these lines in `AndroidManifest.xml` in the main `<application />` tag

```xml
<activity android:name="com.smallcase.gateway.screens.transaction.activity.TransactionProcessActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />

    <category android:name="android.intent.category.BROWSABLE" />
    <category android:name="android.intent.category.DEFAULT" />
    <data
      android:host="{YOUR_HOST_NAME}"
      android:scheme="scgateway" />
  </intent-filter>
</activity>

<activity android:name="com.smallcase.gateway.screens.common.RedirectActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />

    <category android:name="android.intent.category.BROWSABLE" />
    <category android:name="android.intent.category.DEFAULT" />

    <data
      android:host="{YOUR_HOST_NAME}"
      android:scheme="scgatewayredirect"
    />
  </intent-filter>
</activity>
```

## Example Usage

```javascript
// import gateway into your file
import SmallcaseGateway from "react-native-smallcase-gateway";

// configure environment
await SmallcaseGateway.setConfigEnvironment({
  isLeprechaun: true,
  isAmoEnabled: true,
  gatewayName: "smallcase-website",
  environmentName: SmallcaseGateway.ENV.PROD,
  brokerList: ["kite", "aliceblue", "trustline"],
});

// initialize session
await SmallcaseGateway.init(sdkToken);

// execute a transaction
const res = await SmallcaseGateway.triggerTransaction(transactionId);

// start lead generation flow
SmallcaseGateway.triggerLeadGen({ email: "test@gmail.com" });
```

## Mutual fund orders

After configuring and initializing the SDK, launch MF orders with one options object:

```typescript
import SmallcaseGateway from 'react-native-smallcase-gateway';

const result = await SmallcaseGateway.launchMutualFundOrder({
  transactionId,
  metadata: { theme: { preference: 'dark' } }, // optional JSON object
  // webclientUrl: 'https://your-mf-webclient.example', // optional base override
  onAnalyticsEvent: (events) => { // optional
    events.forEach(({ label, data, integrations }) => {
      // Forward to the app's analytics destinations.
    });
  },
  onNativeAction: (intent, metadata) => {
    // Required: handle an action in the parent app while the order stays open.
  },
});

// The Promise settles after the flow closes. There is no onComplete callback.
// result: { success, reason, intent?, data?, error?, errorCode? }
// data contains the order response; intent optionally identifies the next destination.
```

`metadata` accepts nested JSON values and is snapshotted at launch. Native code
passes it to the web flow through the READY/INIT message handshake. Transaction
and authentication parameters stay in the URL returned by the API.
`webclientUrl` replaces the web base while retaining the API URL's path and query.
The MF web deployment must support the `sdkBridge=1` order protocol.

Callbacks are scoped to each launch, and event listeners are removed when its
Promise settles. A second concurrent launch returns `FLOW_IN_PROGRESS`.
Validation and normal flow failures resolve with `success: false`; unexpected
React Native bridge failures reject the Promise and should be caught by the app.
Types are exported as `MutualFundOrderOptions`, `MutualFundOrderResult`,
`MutualFundAnalyticsEvent`, `JsonObject`, and `JsonValue`.

### Native dependencies for this change

This source requires the matching MF-capable changes in `gw-mob-android` and
`gw-mob-ios`. The existing default pins (Android `6.1.1`, iOS `7.2.0`) predate this
API and **cannot compile this wrapper change**. Select updated internal builds
while developing; update both default pins to their released versions before
publishing this wrapper. No new native release version is assumed here.

For Android, set `SmallcaseGateway_sdkDependency` in the host's `gradle.properties`
to the full Maven coordinate of the updated build. For a source integration,
include the native SDK module in the host's `settings.gradle` and set
`SmallcaseGateway_nativeProject` to its Gradle project path (for example,
`:smallcase_gateway`). The project override takes precedence over the artifact.
Use Android compile SDK 34 or newer and Kotlin 1.8.10 or newer, subject to the
host React Native version's own requirements.

For iOS, set `SMALLCASE_GATEWAY_POD_NAME` and `SMALLCASE_GATEWAY_POD_VERSION` to the
updated native pod before running `pod install`/`pod update`. The pod name defaults
to `SCGateway`; an internal build may use its branch-specific pod name. Keep these
environment values consistent on developer machines and CI. iOS 13+ is required.

Rebuild the native app after selecting these dependencies; a JS-only update does
not add the native API. Calling the new method in an older app binary returns
`NATIVE_API_UNAVAILABLE`.

## Debug / Contribution

For the current MF test app, follow [local MF order testing](smart_investing_react_native/README.md).

Make sure you have react native dev environment set up

### ios

- remove `node_modules` in the root directory
- run `yarn install` in `example/`
- run `pod update` in `example/ios`
- open `SmallcaseGateway.xcworkspace` in xcode
- run `yarn start` (important to get symlinks to work)
- run in debug mode
- in xcode, navigate to Pods > Development Pods > react-native-smallcase-gateway
- you can now edit these file directly and test the results on the running app

### android without example app

- run `yarn install` in the root directory
- change directory to `android/`
- add a file called `gradle.properties`
- add `artifactory_user` and `artifactory_password`
- open this folder in android studio
- let gradle sync complete
- you can now write code with just the android folder in context

### android with example app

- run `yarn install` in `example/`
- add a file called `gradle.properties` in `example/android`
- add these lines

```
android.useAndroidX=true
android.enableJetifier=true

FLIPPER_VERSION=version_string

artifactory_user=sampleUser
artifactory_password=samplePassword
```

- run `yarn start` (important to get symlinks to work)
- run `yarn android` to build example project for android
