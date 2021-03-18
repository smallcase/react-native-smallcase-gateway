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
source 'https://gitlab.com/scGatewayOS/cocoapodspecs.git'

# default source for all other pods
source 'https://cdn.cocoapods.org'

# update the ios version if it was previously below 11.0
platform :ios, '11.0'
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

## Debug / Contribution

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
