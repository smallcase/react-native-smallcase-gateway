# react-native-smallcase-gateway

## Getting started

`$ yarn add https://gitlab.com/smallcase/mobile/gateway/react-native-smallcase-gateway`

## ios setup

add these lines at the top of your `Podfile`

```ruby
# private podspec for smallcase
source 'https://gitlab.com/smallcase/mobile/gateway/cocoapodspecs.git'

# default source for all other pods
source 'https://github.com/CocoaPods/Specs.git'
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
              username "${artifactory_user}"
              password "${artifactory_password}"
          }
      }
    }
}
```

Either replace `artifactory_user` and `artifactory_password` directly here or add them to your `gradle.properties`

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
```

## Example Usage

```javascript
// import gateway into your file
import SmallcaseGateway from "react-native-smallcase-gateway";

// configure environment
await SmallcaseGateway.setConfigEnvironment({
  isLeprechaun: true,
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

- make sure you have react native dev environment set up
- run `yarn install` in the root directory
- change directory to `android/`
- add a file called `gradle.properties` and add `artifactory_user` and `artifactory_password`
- open this folder in android studio
- let gradle sync complete
- remove `node_modules` from root directory

- change directory to `example/`
- run `yarn install`
- run `yarn start` (important to get symlinks to work)
- run `yarn android` to build example project for android
