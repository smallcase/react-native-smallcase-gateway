//import SCGateway
import Loans
@objc(SmallcaseGateway)
class SmallcaseGateway: NSObject {
    @objc public func signInWith(_ provider: String, resolver resolve: @escaping RCTPromiseResolveBlock,  rejecter reject: @escaping RCTPromiseRejectBlock) {
        // let nativeSdkString = "ios:" + SCGateway.shared.getSdkVersion()
        //     let reactNativeSdkString = ",react-native:" + reactNativeSdkVersion
        //     let result = nativeSdkString + reactNativeSdkString

        //    resolve(result)
            resolve("experimenting 9999999")
    }
}