
import React
import SCGateway
import Loans

@objc(SmallcaseGateway)
class SmallcaseGateway: NSObject {

    // MARK: SDK version helpers
    @objc(setHybridSdkVersion:)
    func setHybridSdkVersion(_ sdkVersion: String) {
        SCGateway.shared.setSDKType(type: "react-native")
        SCGateway.shared.setHybridSDKVersion(version: sdkVersion)
    }
    
    @objc(getSdkVersion:resolver:rejecter:)
    func getSdkVersion(reactNativeSdkVersion: String,
                       withResolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            let nativeSdkString = "ios:\(SCGateway.shared.getSdkVersion())"
            let reactNativeSdkString = ",react-native:\(reactNativeSdkVersion)"
            let result = nativeSdkString + reactNativeSdkString
            
            resolve(result)
        }
    }

    
    // MARK: SDK setup
    @objc(setConfigEnvironment:gateway:isLeprechaunActive:isAmoEnabled:preProvidedBrokers:resolver:rejecter:)
    func setConfigEnvironment(envName: String,
                               gateway: String,
                               isLeprechaunActive: NSNumber,
                               isAmoEnabled: NSNumber,
                               preProvidedBrokers: [Any],
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            let environment: Int
            switch envName {
            case "production":
                environment = Environment.production.rawValue
            case "development":
                environment = Environment.development.rawValue
            default:
                environment = Environment.staging.rawValue
            }
            
            guard let brokerList = preProvidedBrokers as? [String] else {
                let error = NSError(domain: "preProvidedBrokers is not of type [String]", code: -1, userInfo: nil)
                reject("brokerList_error", "Broker list is not of the expected type [String]", error)
                return
            }

            let config = GatewayConfig(gatewayName: gateway,
                                       brokerConfig: brokerList,
                                       apiEnvironment: Environment(rawValue: environment)!,
                                       isLeprechaunActive: isLeprechaunActive.boolValue,
                                       isAmoEnabled: isAmoEnabled.boolValue)

            SCGateway.shared.setup(config: config) { success, error in
                if success {
                    resolve(true)
                } else {
                    var responseDict = [String: Any]()
                    if let error = error as NSError? {
                        responseDict["errorCode"] = error.code
                        responseDict["errorMessage"] = error.domain
                        let err = NSError(domain: error.domain, code: error.code, userInfo: responseDict)
                        reject("setConfigEnvironment", "Env setup failed", err)
                    }
                }
            }
        }
    }


    // MARK: SDK init    
    @objc(initSDK:resolver:rejecter:)
    func initSDK(sdkToken: String,
                 withResolver resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        SCGateway.shared.initializeGateway(sdkToken) { success, error in
            if !success.isEmpty {
                resolve(true)
            } else {
                if let error = error as? NSError {
                    let responseDict: [String: Any] = [
                        "errorCode": error.code,
                        "errorMessage": error.domain
                    ]
                    let err = NSError(domain: error.domain, code: error.code, userInfo: responseDict)
                    reject("initSDK", "Error during initSDK", err)
                } else {
                    reject("initSDK", "Error during initSDK", error)
                }
            }
        }
    }




// MARK: Trigger Mf Transaction
    @objc(triggerMfTransaction:resolver:rejecter:)
    func triggerMfTransaction(transactionId: String,
                              triggerTransactionWithResolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            SCGateway.shared.triggerMfTransaction(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!,
                                                   transactionId: transactionId) { response, error in
                if let error = error {
                    let responseDict: [String: Any] = [
                        "errorCode": error.code,
                        "errorMessage": error.domain,
                        "data": error.userInfo["data"] ?? NSNull()
                    ]
                    let err = NSError(domain: error.domain, code: error.code, userInfo: responseDict)
                    reject("triggerMfTransaction", "Error during transaction", err)
                } else {
                    var responseDict: [String: Any] = [:]
                    if let trxResponse = response as? _ObjCTransactionIntentMfHoldingsImport {
                        responseDict["transaction"] = "TRANSACTION"
                        if let decodedStringData = Data(base64Encoded: trxResponse.data!) {
                            let decodedResponse = String(data: decodedStringData, encoding: .utf8) ?? ""
                            responseDict["data"] = trxResponse.data
                            resolve(responseDict)
                        } else {
                            reject("triggerMfTransaction", "Error decoding data", NSError(domain: "com.smallcase.gateway", code: 0, userInfo: ["Error reason": "data decoding error"]))
                        }
                    } else {
                        let err = NSError(domain: "com.smallcase.gateway", code: 0, userInfo: ["Error reason": "no matching response type"])
                        reject("triggerMfTransaction", "no matching response type", err)
                    }
                }
            }
        }
    }



// MARK: Trigger Transaction
@objc(triggerTransaction:utmParams:brokerList:resolver:rejecter:)
func triggerTransaction(transactionId: String,
                               utmParams: [String: Any],
                               brokerList: [[String: Any]],
                               triggerTransactionWithResolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
        
        guard let utmParams = utmParams as? [String: String] else {
                    reject("error", "Invalid UTM parameters", nil)
                    return
                }
        let brokerConfig = brokerList.compactMap { $0["brokerName"] as? String }

        SCGateway.shared.triggerTransactionFlow(transactionId: transactionId,
                                                presentingController: (UIApplication.shared.keyWindow?.rootViewController)!,
                                                utmParams: utmParams,
                                                brokerConfig: brokerConfig) { response, error in
            if let error = error {
                let responseDict: [String: Any] = [
                    "errorCode": error.code,
                    "errorMessage": error.domain,
                    "data": error.userInfo["data"] ?? NSNull()
                ]
                let err = NSError(domain: error.domain, code: error.code, userInfo: responseDict)
                reject("triggerTransaction", "Error during transaction", err)
            } else {
                var responseDict: [String: Any] = ["success": true]
                if let trxResponse = response as? _ObjcTransactionIntentTransaction {
                    responseDict["transaction"] = "TRANSACTION"
                    if let decodedStringData = Data(base64Encoded: trxResponse.transaction!) {
                        let decodedResponse = String(data: decodedStringData, encoding: .utf8) ?? ""
                        responseDict["data"] = decodedResponse
                        resolve(responseDict)
                    } else {
                        reject("triggerTransaction", "Error decoding data", NSError(domain: "com.smallcase.gateway", code: 0, userInfo: ["Error reason": "data decoding error"]))
                    }
                } else if let trxResponse = response as? _ObjcMfTransactionIntentTransaction {
                    responseDict["transaction"] = "TRANSACTION"
                    responseDict["data"] = trxResponse.data
                    resolve(responseDict)
                } else if let trxResponse = response as? _ObjCTransactionIntentConnect {
                    responseDict["transaction"] = "CONNECT"
                    responseDict["data"] = trxResponse.response ?? NSNull()
                    resolve(responseDict)
                } else if let trxResponse = response as? _ObjCTransactionIntentOnboarding {
                    responseDict["transaction"] = "ONBOARDING"
                    responseDict["data"] = trxResponse.response ?? NSNull()
                    resolve(responseDict)
                } else if let trxResponse = response as? _ObjcTransactionIntentHoldingsImport {
                    responseDict["transaction"] = "HOLDING_IMPORT"
                    let dict: [String: Any] = [
                        "smallcaseAuthToken": trxResponse.authToken,
                        "transactionId": trxResponse.transactionId,
                        "broker": trxResponse.broker,
                        "signup": trxResponse.signup
                    ]
                    responseDict["data"] = dict
                    resolve(responseDict)
                } else if let trxResponse = response as? _ObjcTransactionIntentFetchFunds {
                    responseDict["transaction"] = "FETCH_FUNDS"
                    let dict: [String: Any] = [
                        "smallcaseAuthToken": trxResponse.authToken,
                        "transactionId": trxResponse.transactionId,
                        "signup": trxResponse.signup,
                        "fund": trxResponse.fund
                    ]
                    responseDict["data"] = dict
                    resolve(responseDict)
                } else if let trxResponse = response as? _ObjcTransactionIntentSipSetup {
                    responseDict["transaction"] = "SIP_SETUP"
                    let dict: [String: Any] = [
                        "smallcaseAuthToken": trxResponse.authToken,
                        "transactionId": trxResponse.transactionId,
                        "sipAction": trxResponse.sipAction,
                        "sipType": trxResponse.sipType,
                        "frequency": trxResponse.frequency,
                        "iscid": trxResponse.iscid,
                        "scheduledDate": trxResponse.scheduledDate,
                        "scid": trxResponse.scid,
                        "sipActive": trxResponse.sipActive ? "YES" : "NO",
                        "sipAmount": trxResponse.sipAmount,
                        "signup": trxResponse.signup
                    ]
                    responseDict["data"] = dict
                    resolve(responseDict)
                } else if let trxResponse = response as? _ObjcTransactionIntentAuthoriseHoldings {
                    responseDict["transaction"] = "AUTHORISE_HOLDINGS"
                    let dict: [String: Any] = [
                        "smallcaseAuthToken": trxResponse.authToken,
                        "transactionId": trxResponse.transactionId,
                        "signup": trxResponse.signup,
                        "status": trxResponse.status
                    ]
                    responseDict["data"] = dict
                    resolve(responseDict)
                } else {
                    let err = NSError(domain: "com.smallcase.gateway", code: 0, userInfo: ["Error reason": "no matching response type"])
                    reject("triggerTransaction", "no matching response type", err)
                }
            }
        }
    }
}


    // MARK: Show orders
    @objc(showOrders:rejecter:)
    func showOrders(withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            SCGateway.shared.showOrders(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!) { success, error in
                if success {
                    resolve(true)
                } else {
                    var responseDict = [String: Any]()
                    if let error = error as? NSError {
                        responseDict["errorCode"] = error.code
                        responseDict["error"] = error.domain
                        responseDict["data"] = error.userInfo["data"]
                    }
                    resolve(responseDict)
                }
            }
        }
    }

    // MARK: Smallplug
    @objc(launchSmallplug:params:resolver:rejecter:)
    func launchSmallplug(targetEndpoint: String, params: String, withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
        let smallplugData = SmallplugData(targetEndpoint, params)

        SCGateway.shared.launchSmallPlug(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, smallplugData: smallplugData) { smallplugResponse, error in
            var responseDict = [String: Any]()
            
            if let error = error as? NSError {
                print(error.domain)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    responseDict["success"] = false
                    responseDict["errorCode"] = error.code
                    responseDict["error"] = error.domain
                    resolve(responseDict)
                }
                return
            }
            
            if let smallplugResponse = smallplugResponse as? String {
                print(smallplugResponse)
                responseDict["success"] = true
                responseDict["smallcaseAuthToken"] = smallplugResponse
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    resolve(responseDict)
                }
            }
        }
    }
}

    // MARK: Smallplug with branding
    @objc(launchSmallplugWithBranding:params:headerColor:headerOpacity:backIconColor:backIconOpacity:resolver:rejecter:)
     func launchSmallplugWithBranding(targetEndpoint: String, params: String, headerColor: String, headerOpacity: NSNumber, backIconColor: String, backIconOpacity: NSNumber, withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            let smallplugData = SmallplugData(targetEndpoint, params)
            let smallplugUiConfig = SmallplugUiConfig(smallplugHeaderColor: headerColor, headerColorOpacity: headerOpacity, backIconColor: backIconColor, backIconColorOpacity: backIconOpacity)

            SCGateway.shared.launchSmallPlug(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, smallplugData: smallplugData, smallplugUiConfig: smallplugUiConfig) { smallplugResponse, error in
                var responseDict = [String: Any]()

                if let error = error as? NSError {
                    print(error.domain)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        responseDict["success"] = false
                        responseDict["errorCode"] = error.code
                        responseDict["error"] = error.domain
                        resolve(responseDict)
                    }
                    return
                }
                
                if let smallplugResponse = smallplugResponse as? String {
                    print(smallplugResponse)
                    responseDict["success"] = true
                    responseDict["smallcaseAuthToken"] = smallplugResponse
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        resolve(responseDict)
                    }
                }
            }
        }
    }

    // MARK: Archive smallcase
    @objc(archiveSmallcase:resolver:rejecter:)
    func archiveSmallcase(iscid: String, withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        SCGateway.shared.markSmallcaseArchive(iscid: iscid) { response, error in
            if let error = error as NSError? {
                var responseDict = [String: Any]()
                responseDict["errorCode"] = error.code
                responseDict["errorMessage"] = error.domain
                let err = NSError(domain: error.domain, code: error.code, userInfo: responseDict)
                reject("archiveSmallcase", "Error during transaction", err)
                return
            }
            
            let archiveResponseString = String(data: response!, encoding: .utf8) ?? ""
            var responseDict = [String: Any]()
            responseDict["success"] = true
            responseDict["data"] = archiveResponseString
            resolve(responseDict)
        }
    }


    // MARK: Lead Gen
    @objc(triggerLeadGenWithStatus:resolver:rejecter:)
    func triggerLeadGenWithStatus(userParams: [String: Any], withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            guard let userParams = userParams as? [String: String] else {
                reject("error", "Invalid UTM parameters", nil)
                return
            }
            SCGateway.shared.triggerLeadGen(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, params: userParams) { leadGenResponse in
                resolve(leadGenResponse)
            }
        }
    }

    @objc(triggerLeadGen:utmParams:)
    func triggerLeadGen(userParams: [String: Any], utmParams: [String: Any]) {
        DispatchQueue.main.async {
            
            guard let utmParams = utmParams as? [String: String],
                  let userParams = userParams as? [String: String]
            else {
                return
            }
            SCGateway.shared.triggerLeadGen(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, params: userParams, utmParams: utmParams)
        }
    }

    @objc(triggerLeadGenWithLoginCta:userParams:utmParams:resolver:rejecter:)
    func triggerLeadGenWithLoginCta(userParams: [String: Any], utmParams: [String: Any], showLoginCta: Bool, withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            guard let utmParams = utmParams as? [String: String],
                  let userParams = userParams as? [String: String]
            else {
                reject("error", "Invalid UTM parameters", nil)
                return
            }
            
            SCGateway.shared.triggerLeadGen(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, params: userParams, utmParams: utmParams, retargeting: false, showLoginCta: showLoginCta) { leadGenResponse in
                resolve(leadGenResponse)
            }
        }
    }


    // MARK: User logout
    @objc(logoutUser:rejecter:)
    func logoutUser(withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            SCGateway.shared.logoutUser(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!) { success, error in
                if success {
                    resolve(true)
                } else {
                    reject("logout", "Error during logout", error)
                }
            }
        }
    }

    // MARK: Loans
    @objc(setupLoans:withResolver:rejecter:)
        func setupLoans(_ loanConfig: [String: Any],
                        withResolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
            DispatchQueue.main.async {
                if let gatewayName = loanConfig["gatewayName"] as? String {
                    print(" ----------- Gateway Name: \(gatewayName)")

                    let envName = loanConfig["environment"] as? String ?? ""
                    print(" ----------- Env Name: \(envName)")

                    let lasEnv: NSNumber
                    switch envName {
                    case "production":
                        lasEnv = 0
                    case "development":
                        lasEnv = 1
                    default:
                        lasEnv = 2
                    }

                    let gatewayLoanConfig = ScLoanConfig(gatewayName: gatewayName, environment: lasEnv)

                    ScLoan.instance.setup(config: gatewayLoanConfig) { success, error in
                        if let error = error {
                            reject("\(error.errorCode)", error.errorMessage, self.scLoanErrorToDict(error))
                        } else {
                            resolve(self.scLoanSuccessToDict(success!))
                        }
                    }
                }
            }
        }


    @objc(apply:resolver:rejecter:)
    func apply(loanInfo: [String: Any], withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if let interactionToken = loanInfo["interactionToken"] as? String {
                print(" ----------- Interaction Token: \(interactionToken)")
                
                let gatewayLoanInfo = ScLoanInfo(interactionToken: interactionToken)
                
                ScLoan.instance.apply(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, loanInfo: gatewayLoanInfo) { success, error in
                    if let error = error {
                        reject("\(error.errorCode)", error.errorMessage, self.scLoanErrorToDict(error))
                    } else {
                        resolve(self.scLoanSuccessToDict(success!))
                    }
                }
            }
        }
    }


    @objc(pay:resolver:rejecter:)
    func pay(loanInfo: [String: Any], withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if let interactionToken = loanInfo["interactionToken"] as? String {
                print(" ----------- Interaction Token: \(interactionToken)")
                
                let gatewayLoanInfo = ScLoanInfo(interactionToken: interactionToken)
                
                ScLoan.instance.pay(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, loanInfo: gatewayLoanInfo) { success, error in
                    if let error = error {
                        reject("\(error.errorCode)", error.errorMessage, self.scLoanErrorToDict(error))
                    } else {
                        resolve(self.scLoanSuccessToDict(success!))
                    }
                }
            }
        }
    }


    @objc(withdraw:resolver:rejecter:)
    func withdraw(loanInfo: [String: Any], withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if let interactionToken = loanInfo["interactionToken"] as? String {
                print(" ----------- Interaction Token: \(interactionToken)")
                
                let gatewayLoanInfo = ScLoanInfo(interactionToken: interactionToken)
                
                ScLoan.instance.withdraw(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, loanInfo: gatewayLoanInfo) { success, error in
                    if let error = error {
                        reject("\(error.errorCode)", error.errorMessage, self.scLoanErrorToDict(error))
                    } else {
                        resolve(self.scLoanSuccessToDict(success!))
                    }
                }
            }
        }
    }


    @objc(service:resolver:rejecter:)
    func service(loanInfo: [String: Any], withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if let interactionToken = loanInfo["interactionToken"] as? String {
                print(" ----------- Interaction Token: \(interactionToken)")
                
                let gatewayLoanInfo = ScLoanInfo(interactionToken: interactionToken)
                
                ScLoan.instance.service(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, loanInfo: gatewayLoanInfo) { success, error in
                    if let error = error {
                        reject("\(error.errorCode)", error.errorMessage, self.scLoanErrorToDict(error))
                    } else {
                        resolve(self.scLoanSuccessToDict(success!))
                    }
                }
            }
        }
    }


    @objc(triggerInteraction:resolver:rejecter:)
    func triggerInteraction(loanInfo: [String: Any], withResolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if let interactionToken = loanInfo["interactionToken"] as? String {
                print(" ----------- Interaction Token: \(interactionToken)")
                
                let gatewayLoanInfo = ScLoanInfo(interactionToken: interactionToken)
                
                ScLoan.instance.triggerInteraction(presentingController: (UIApplication.shared.keyWindow?.rootViewController)!, loanInfo: gatewayLoanInfo) { success, error in
                    if let error = error {
                        reject("\(error.errorCode)", error.errorMessage, self.scLoanErrorToDict(error))
                    } else {
                        resolve(self.scLoanSuccessToDict(success!))
                    }
                }
            }
        }
    }


    // Helper methods
    private func scLoanSuccessToDict(_ success: ScLoanSuccess) -> [String: Any] {
        var successDict: [String: Any] = ["isSuccess": success.isSuccess]
        if let data = success.data {
            successDict["data"] = data
        }
        return successDict
    }

    private func scLoanErrorToDict(_ error: ScLoanError) -> NSError {
        let responseDict: [String: Any] = [
            "code": error.errorCode,
            "message": error.errorMessage,
            "data": error.data ?? NSNull(),
            "isSuccess": false
        ]
        return NSError(domain: error.domain, code: error.code, userInfo: responseDict)
    }



}

