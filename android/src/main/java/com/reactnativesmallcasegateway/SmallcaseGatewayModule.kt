package com.reactnativesmallcasegateway

import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.*
import com.smallcase.gateway.data.SmallcaseGatewayListeners
import com.smallcase.gateway.data.SmallcaseLogoutListener
import com.smallcase.gateway.data.listeners.*
import com.smallcase.gateway.data.models.*
import com.smallcase.gateway.data.requests.InitRequest
import com.smallcase.gateway.portal.SmallcaseGatewaySdk
import com.smallcase.gateway.portal.SmallplugPartnerProps
import com.smallcase.loans.core.external.*
import com.google.gson.Gson

class SmallcaseGatewayModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val TAG = "SmallcaseGatewayModule"
    }

    override fun getName(): String {
        return "SmallcaseGateway"
    }


    @ReactMethod
    fun setConfigEnvironment(envName: String, gateway: String, isLeprechaunActive: Boolean, isAmoEnabled: Boolean, preProvidedBrokers: ReadableArray, promise: Promise) {
        try {
            val brokerList = ArrayList<String>()
            for (index in 0 until preProvidedBrokers.size()) {
                val broker = preProvidedBrokers.getString(index)
                if (broker != null) {
                    brokerList.add(broker)
                }
            }

            val protocol = getProtocol(envName)

            val env = Environment(gateway = gateway, buildType = protocol, isAmoEnabled = isAmoEnabled, preProvidedBrokers = brokerList, isLeprachaunActive = isLeprechaunActive)
        
        // Set userIdentification if provided - For Now, we are not accepting this on Gateway SDK
        // if (!userId.isNullOrEmpty()) {
        //    env.userId = userIdentification
        // }

            SmallcaseGatewaySdk.setConfigEnvironment(environment = env, smallcaseGatewayListeners = object : SmallcaseGatewayListeners {
                override fun onGatewaySetupSuccessfull() {
                    promise.resolve(true)
                }

                override fun onGatewaySetupFailed(error: String) {
                    promise.reject(Throwable(error))
                }
            })
        } catch (e: Exception) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun setHybridSdkVersion(sdkVersion: String) {
        SmallcaseGatewaySdk.setSDKType("react-native")
        SmallcaseGatewaySdk.setHybridSDKVersion(sdkVersion)
    }

    @ReactMethod
    fun getSdkVersion(reactNativeSdkVersion: String, promise: Promise) {
        val sdkString = "android:${SmallcaseGatewaySdk.getSdkVersion()},react-native:$reactNativeSdkVersion"
        promise.resolve(sdkString)
    }

    @ReactMethod
    fun init(sdkToken: String, externalMeta: ReadableMap?, promise: Promise) {
        // externalMeta is accepted but not used on Android (iOS only feature)
        // Extract externalIdentifier if needed in future
        val initReq = InitRequest(sdkToken)
        SmallcaseGatewaySdk.init(authRequest = initReq, gatewayInitialisationListener = object : DataListener<InitialisationResponse> {
            override fun onFailure(errorCode: Int, errorMessage: String, data: String?) {
                val err = createErrorJSON(errorCode, errorMessage, data)
                promise.reject("error", err)
            }

            override fun onSuccess(response: InitialisationResponse) {
                promise.resolve(true)
            }

        })
    }

    @ReactMethod
    fun triggerTransaction(transactionId: String, utmParams: ReadableMap?, brokerList: ReadableArray?, promise: Promise) {

        var safeBrokerList = listOf<String>()

        if (brokerList != null) {
            safeBrokerList = brokerList.toArrayList().map { it as String }
        }


        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
            val utm = readableMapToStrHashMap(utmParams)
            SmallcaseGatewaySdk.triggerTransaction(utmParams = utm,
                activity = activity,
                transactionId = transactionId,
                preProvidedBrokers = safeBrokerList,
                transactionResponseListener = object : TransactionResponseListener {
                    override fun onSuccess(transactionResult: TransactionResult) {
                        val res = resultToWritableMap(transactionResult, true)
                        promise.resolve(res)
                    }

                    override fun onError(errorCode: Int, errorMessage: String, data: String?) {
                        val err = createErrorJSON(errorCode, errorMessage, data)
                        promise.reject("error", err)
                    }
                })
        } else {
            promise.reject(Throwable("no activity"))
        }
    }

    @ReactMethod
    fun triggerMfTransaction(transactionId: String, promise: Promise) {

        val activity = reactApplicationContext.currentActivity
        if(activity !=  null) {

            SmallcaseGatewaySdk.triggerMfTransaction(
                activity = activity,
                transactionId = transactionId,
                listener = object : MFHoldingsResponseListener {

                    override fun onSuccess(transactionResult: TransactionResult) {
                        val res = resultToWritableMap(transactionResult, true)
                        promise.resolve(res)
                    }

                    override fun onError(errorCode: Int, errorMessage: String, data: String?) {
                        val err = createErrorJSON(errorCode, errorMessage, data)
                        promise.reject("error", err)
                    }
                })
        } else {
            promise.reject(Throwable("no activity"))
        }
    }

    @ReactMethod
    fun showOrders(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
            SmallcaseGatewaySdk.showOrders(activity = activity, showOrdersResponseListener = object : DataListener<Any> {
                override fun onSuccess(response: Any) {
                    promise.resolve(true)
                }

                override fun onFailure(errorCode: Int, errorMessage: String, data: String?) {
                    val err = createErrorJSON(errorCode, errorMessage, data)
                    promise.reject("error", err)
                }
            })
        }
    }

    @ReactMethod
    fun launchSmallplug(targetEndpoint: String, params: String, promise: Promise) {

        val activity = reactApplicationContext.currentActivity ?: run {
            promise.reject(Throwable("no activity"))
            return
        }
        SmallcaseGatewaySdk.launchSmallPlug(activity, SmallplugData(targetEndpoint, params), object : SmallPlugResponseListener {
            override fun onFailure(errorCode: Int, errorMessage: String) {
                val err = createErrorJSON(errorCode, errorMessage, null)

                promise.reject("error", err)
            }

            override fun onSuccess(smallPlugResult: SmallPlugResult) {
                val res = resultToWritableMap(smallPlugResult)
                promise.resolve(res)
            }

        }, smallplugPartnerProps = SmallplugPartnerProps(headerColor = "#2F363F", backIconColor = "ffffff"))
    }

    @ReactMethod
    fun launchSmallplugWithBranding(targetEndpoint: String, params: String, headerColor: String?, headerOpacity: Double?, backIconColor: String?, backIconOpacity: Double?, promise: Promise
    ) {
        val readableMap = Arguments.createMap().apply {
            headerColor?.let { putString("headerColor", it) }
            headerOpacity?.let { putDouble("headerOpacity", it) }
            backIconColor?.let { putString("backIconColor", it) }
            backIconOpacity?.let { putDouble("backIconOpacity", it) }
        }

        fun getColorValue(value: Any?, defaultValue: String): String {
            return when (value) {
                is String -> {
                    if (value.length < 6) defaultValue else if (!value.contains("#")) "#$value" else value
                }
                else -> {
                    defaultValue
                }
            }
        }

        var partnerProps: SmallplugPartnerProps? = SmallplugPartnerProps(headerColor = "#2F363F", backIconColor = "ffffff")

        try {
            partnerProps = readableMap.toHashMap().let { map ->
                val hc = getColorValue(map["headerColor"], "#2F363F")
                val ho = map["headerOpacity"]?.let { if (it is Double) it else 1.0 } ?: 1.0
                val bc = getColorValue(map["backIconColor"], "#ffffff")
                val bo = map["backIconOpacity"]?.let { if (it is Double) it else 1.0 } ?: 1.0
                SmallplugPartnerProps(headerColor = hc, headerOpacity = ho, backIconColor = bc, backIconOpacity = bo)
            }
        } catch (e: Throwable) {
        }

        val activity = reactApplicationContext.currentActivity ?: run {
            promise.reject(Throwable("no activity"))
            return
        }
        SmallcaseGatewaySdk.launchSmallPlug(activity, SmallplugData(targetEndpoint, params), object : SmallPlugResponseListener {
            override fun onFailure(errorCode: Int, errorMessage: String) {
                val err = createErrorJSON(errorCode, errorMessage, null)
                promise.reject("error", err)
            }

            override fun onSuccess(smallPlugResult: SmallPlugResult) {
                val res = resultToWritableMap(smallPlugResult)
                promise.resolve(res)
            }
        }, partnerProps)
    }

    @ReactMethod
    fun archiveSmallcase(iscid: String, promise: Promise) {

        SmallcaseGatewaySdk.markSmallcaseArchived(iscid, object : DataListener<SmallcaseGatewayDataResponse> {

            override fun onSuccess(response: SmallcaseGatewayDataResponse) {
                promise.resolve(response)
            }

            override fun onFailure(errorCode: Int, errorMessage: String, data: String?) {
                val err = createErrorJSON(errorCode, errorMessage, null)
                promise.reject("error", err)
            }
        })
    }

    @ReactMethod
    fun logoutUser(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
            SmallcaseGatewaySdk.logoutUser(activity = activity, logoutListener = object : SmallcaseLogoutListener {
                override fun onLogoutSuccessfull() {
                    promise.resolve(true)
                }

                override fun onLogoutFailed(errorCode: Int, error: String) {
                    val err = createErrorJSON(errorCode, error, null)
                    promise.reject("error", err)
                }
            })
        }
    }

    @ReactMethod
    fun triggerLeadGen(userDetails: ReadableMap, utmData: ReadableMap) {
        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
            SmallcaseGatewaySdk.triggerLeadGen(activity = activity, utmParams = readableMapToStrHashMap(utmData), params = readableMapToStrHashMap(userDetails))
        }
    }

    @ReactMethod
    fun triggerLeadGenWithStatus(userDetails: ReadableMap, promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity != null) {

            SmallcaseGatewaySdk.triggerLeadGen(activity, readableMapToStrHashMap(userDetails), object : LeadGenResponseListener {
                override fun onSuccess(leadResponse: String) {
                    promise.resolve(leadResponse)
                }
            })
        }
    }

     @ReactMethod
     fun triggerLeadGenWithLoginCta(userDetails: ReadableMap, utmData: ReadableMap, showLoginCta: Boolean, promise: Promise) {
         val activity = reactApplicationContext.currentActivity
         if(activity != null) {

             SmallcaseGatewaySdk.triggerLeadGen(
                 activity = activity,
                 params = readableMapToStrHashMap(userDetails),
                 utmParams = readableMapToStrHashMap(utmData),
                 retargeting = null,
                 showLoginCta = showLoginCta,
                 leadStatusListener = object : LeadGenResponseListener {
                     override fun onSuccess(leadResponse: String) {
                         promise.resolve(leadResponse)
                     }
                 })
         }
     }

    @ReactMethod
    fun setupLoans(config: ReadableMap, promise: Promise) {
      val appCompatActivity = reactApplicationContext.currentActivity as? AppCompatActivity ?: run {
        promise.reject(Throwable("no activity"))
        return
      }
      val hashMap = readableMapToStrHashMap(config)
      val gateway = hashMap["gatewayName"]
      val environment = hashMap["environment"]
      if(gateway == null) {
        promise.reject(Throwable("gatewayName is null"))
        return
      }
      val scEnvironment = when(environment) {
            "production" -> ScLoanEnvironment.PRODUCTION
            "staging" -> ScLoanEnvironment.STAGING
            "development" -> ScLoanEnvironment.DEVELOPMENT
            else -> ScLoanEnvironment.PRODUCTION
        }
      val scGatewayConfig = ScLoanConfig(gateway, scEnvironment)
      val setupResponse = ScLoan.setup(scGatewayConfig, object : ScLoanResult {
        override fun onFailure(error: ScLoanError) {
            promise.reject("${error.code}", scLoanResponseToWritableMap(error) ?: return)
          }
  
          override fun onSuccess(response: ScLoanSuccess) {
            promise.resolve(scLoanResponseToWritableMap(response) ?: return)
          }
      })
    }

  @ReactMethod
    fun apply(loanConfig: ReadableMap, promise: Promise) {
      val appCompatActivity = reactApplicationContext.currentActivity as? AppCompatActivity ?: run {
        promise.reject(Throwable("no activity"))
        return
      }
      val hashMap = readableMapToStrHashMap(loanConfig)
      val interactionToken = hashMap["interactionToken"]
      if(interactionToken == null) {
        promise.reject(Throwable("Interaction token is null"))
        return
      }
      val loanConfigObj = ScLoanInfo(interactionToken)
      ScLoan.apply(appCompatActivity, loanConfigObj, object : ScLoanResult {
        override fun onFailure(error: ScLoanError) {
          promise.reject("${error.code}", scLoanResponseToWritableMap(error) ?: return)
        }

        override fun onSuccess(response: ScLoanSuccess) {
          promise.resolve(scLoanResponseToWritableMap(response) ?: return)
        }
      })
    }

  @ReactMethod
    fun pay(loanConfig: ReadableMap, promise: Promise) {
      val appCompatActivity = reactApplicationContext.currentActivity as? AppCompatActivity ?: run {
        promise.reject(Throwable("no activity"))
        return
      }
      val hashMap = readableMapToStrHashMap(loanConfig)
      val interactionToken = hashMap["interactionToken"]
      if(interactionToken == null) {
        promise.reject(Throwable("Interaction token is null"))
        return
      }
      val loanConfigObj = ScLoanInfo(interactionToken)
      ScLoan.pay(appCompatActivity, loanConfigObj, object : ScLoanResult {
        override fun onFailure(error: ScLoanError) {
          promise.reject("${error.code}", scLoanResponseToWritableMap(error) ?: return)
        }

        override fun onSuccess(response: ScLoanSuccess) {
          promise.resolve(scLoanResponseToWritableMap(response) ?: return)
        }
      })
    }

  @ReactMethod
    fun withdraw(loanConfig: ReadableMap, promise: Promise) {
      val appCompatActivity = reactApplicationContext.currentActivity as? AppCompatActivity ?: run {
        promise.reject(Throwable("no activity"))
        return
      }
      val hashMap = readableMapToStrHashMap(loanConfig)
      val interactionToken = hashMap["interactionToken"]
      if(interactionToken == null) {
        promise.reject(Throwable("Interaction token is null"))
        return
      }
      val loanConfigObj = ScLoanInfo(interactionToken)
      ScLoan.withdraw(appCompatActivity, loanConfigObj, object : ScLoanResult {
        override fun onFailure(error: ScLoanError) {
          promise.reject("${error.code}", scLoanResponseToWritableMap(error) ?: return)
        }

        override fun onSuccess(response: ScLoanSuccess) {
          promise.resolve(scLoanResponseToWritableMap(response) ?: return)
        }
      })
    }

  @ReactMethod
    fun service(loanConfig: ReadableMap, promise: Promise) {
      val appCompatActivity = reactApplicationContext.currentActivity as? AppCompatActivity ?: run {
        promise.reject(Throwable("no activity"))
        return
      }
      val hashMap = readableMapToStrHashMap(loanConfig)
      val interactionToken = hashMap["interactionToken"]
      if(interactionToken == null) {
        promise.reject(Throwable("Interaction token is null"))
        return
      }
      val loanConfigObj = ScLoanInfo(interactionToken)
      ScLoan.service(appCompatActivity, loanConfigObj, object : ScLoanResult {
        override fun onFailure(error: ScLoanError) {
          promise.reject("${error.code}", scLoanResponseToWritableMap(error) ?: return)
        }

        override fun onSuccess(response: ScLoanSuccess) {
          promise.resolve(scLoanResponseToWritableMap(response) ?: return)
        }
      })
    }

    @ReactMethod
    fun triggerInteraction(loanConfig: ReadableMap, promise: Promise) {
      val appCompatActivity = reactApplicationContext.currentActivity as? AppCompatActivity ?: run {
        promise.reject(Throwable("no activity"))
        return
      }
      val hashMap = readableMapToStrHashMap(loanConfig)
      val interactionToken = hashMap["interactionToken"]
      if(interactionToken == null) {
        promise.reject(Throwable("Interaction token is null"))
        return
      }
      val loanConfigObj = ScLoanInfo(interactionToken)
      ScLoan.triggerInteraction(appCompatActivity, loanConfigObj, object : ScLoanResult {
        override fun onFailure(error: ScLoanError) {
          promise.reject("${error.code}", scLoanResponseToWritableMap(error) ?: return)
        }

        override fun onSuccess(response: ScLoanSuccess) {
          promise.resolve(scLoanResponseToWritableMap(response) ?: return)
        }
      })
    }

    private fun getProtocol(envName: String): Environment.PROTOCOL {
        return when (envName) {
            "production" -> Environment.PROTOCOL.PRODUCTION
            "development" -> Environment.PROTOCOL.DEVELOPMENT
            "staging" -> Environment.PROTOCOL.STAGING
            else -> Environment.PROTOCOL.PRODUCTION
        }
    }

    private fun readableMapToStrHashMap(params: ReadableMap?): HashMap<String, String> {
        val data = HashMap<String, String>()

        if (params != null) {
            val keyIterator = params.keySetIterator()

            while (keyIterator.hasNextKey()) {
                val key = keyIterator.nextKey()
                params.getString(key)?.let {
                    data.put(key, it)
                }
            }
        }

        return data
    }

    private fun resultToWritableMap(result: TransactionResult, success: Boolean): WritableMap {
        val writableMap: WritableMap = Arguments.createMap()

        writableMap.putString("data", result.data)
        writableMap.putBoolean("success", success)
        writableMap.putString("transaction", result.transaction.name)
        return writableMap
    }


    private fun resultToWritableMap(result: SmallPlugResult): WritableMap {
        val writableMap: WritableMap = Arguments.createMap()

        writableMap.putBoolean("success", result.success)
        writableMap.putString("smallcaseAuthToken", result.smallcaseAuthToken)

        val dataMap = Arguments.createMap()
        userInfoToWritableMap(result.userInfo)?.let {
            dataMap.putMap("userInfo", it)
        }

        if (dataMap.keySetIterator().hasNextKey()) {
            writableMap.putMap("data", dataMap)
        }

        return writableMap
    }

    private fun userInfoToWritableMap(userInfo: UserInfo?): WritableMap? {
        if (userInfo == null) return null

        val map = Arguments.createMap()
        map.putString("number", userInfo.number)
        map.putString("countryCode", userInfo.countryCode)
        return map
    }

    private fun createErrorJSON(errorCode: Int?, errorMessage: String?, data: Any?): WritableMap {
        val errObj = Arguments.createMap()

        errorCode?.let { errObj.putInt("errorCode", it) }
        errorMessage?.let { errObj.putString("errorMessage", it) }
        when (data) {
            is String -> errObj.putString("data", data)
            is WritableMap -> errObj.putMap("data", data)
        }

        return errObj
    }

  private fun scLoanResponseToWritableMap(response: ScLoansResponse?): WritableMap? {
    val map = Arguments.createMap()
   response?.also {
     map.putBoolean("isSuccess", it.isSuccess)
     map.putString("data", it.data)
   }
    if(response is ScLoanError) {
      map.apply {
        putInt("code", response.code)
        putString("message", response.message)
      }
    }
    return map
  }

}

