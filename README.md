# react-native-smallcase-gateway

## Getting started

`$ yarn add https://gitlab.com/smallcase/mobile/gateway/react-native-smallcase-gateway`

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
