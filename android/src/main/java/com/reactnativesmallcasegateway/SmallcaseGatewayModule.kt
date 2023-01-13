package com.reactnativesmallcasegateway

import android.util.Log
import com.facebook.react.bridge.*
import com.smallcase.gateway.data.SmallcaseGatewayListeners
import com.smallcase.gateway.data.SmallcaseLogoutListener
import com.smallcase.gateway.data.listeners.*
import com.smallcase.gateway.data.models.*
import com.smallcase.gateway.data.models.accountOpening.SignUpConfig
import com.smallcase.gateway.data.models.accountOpening.UtmParams
import com.smallcase.gateway.data.models.accountOpening.UserInfo
import com.smallcase.gateway.data.requests.InitRequest
import com.smallcase.gateway.portal.SmallcaseGatewaySdk
import com.smallcase.gateway.portal.SmallplugPartnerProps
import kotlin.Error

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
    fun init(sdkToken: String, promise: Promise) {
        Log.d(TAG, "init: start")

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
        Log.d(TAG, "triggerTransaction: start")

        var safeBrokerList = listOf<String>()

        if (brokerList != null) {
            safeBrokerList = brokerList.toArrayList().map { it as String }
        }


        val activity = currentActivity;
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

        if(currentActivity !=  null) {

            SmallcaseGatewaySdk.triggerMfTransaction(
                activity = currentActivity!!,
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
        val activity = currentActivity;
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
        Log.d(TAG, "launchSmallplug: start")

        SmallcaseGatewaySdk.launchSmallPlug(currentActivity!!, SmallplugData(targetEndpoint, params), object : SmallPlugResponseListener {
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
    fun launchSmallplugWithBranding(targetEndpoint: String, params: String, readableMap: ReadableMap?, promise: Promise) {

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
        Log.d(TAG, "launchSmallplugWithBranding: start")

        var partnerProps: SmallplugPartnerProps? = SmallplugPartnerProps(headerColor = "#2F363F", backIconColor = "ffffff")

        try {
            partnerProps = readableMap?.toHashMap()?.let { map ->
                val hc = getColorValue(map["headerColor"], "#2F363F")
                val ho = map["headerOpacity"]?.let { if (it is Double) it else 1.0 } ?: 1.0
                val bc = getColorValue(map["backIconColor"], "#ffffff")
                val bo = map["backIconOpacity"]?.let { if (it is Double) it else 1.0 } ?: 1.0
                SmallplugPartnerProps(headerColor = hc, headerOpacity = ho, backIconColor = bc, backIconOpacity = bo)
            }
        } catch (e: Throwable) {
        }


        SmallcaseGatewaySdk.launchSmallPlug(currentActivity!!, SmallplugData(targetEndpoint, params), object : SmallPlugResponseListener {
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
        Log.d(TAG, "markSmallcaseArchive: start")

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
        val activity = currentActivity;
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
        val activity = currentActivity;
        if (activity != null) {
            SmallcaseGatewaySdk.triggerLeadGen(activity = activity, utmParams = readableMapToStrHashMap(utmData), params = readableMapToStrHashMap(userDetails))
        }
    }

    @ReactMethod
    fun triggerLeadGenWithStatus(userDetails: ReadableMap, promise: Promise) {
        val activity = currentActivity
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
         if(currentActivity != null) {

             SmallcaseGatewaySdk.triggerLeadGen(
                 activity = currentActivity!!,
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
  fun openUsEquitiesAccount(signUpConfig: ReadableMap?, additionalConfig: ReadableMap?, promise: Promise) {

        var signUpConfigNative: SignUpConfig = SignUpConfig("", UserInfo("",""))

        if (signUpConfig != null) {

                val opaqueId = if (signUpConfig.hasKey("opaqueId")) signUpConfig.getString("opaqueId") else null

                val userInfoMap = if (signUpConfig.hasKey("userInfo")) signUpConfig.getMap("userInfo") else null

                if (opaqueId != null && userInfoMap != null) {

                    val userId = if (userInfoMap.hasKey("userId")) userInfoMap.getString("userId") else ""
                    val idType = if (userInfoMap.hasKey("idType")) userInfoMap.getString("idType") else ""

                    val userInfo = UserInfo(userId = userId!!, idType = idType!!)

                    var utmParamsNative: UtmParams? = null

                    val utmParams = if (signUpConfig.hasKey("utmParams")) signUpConfig.getMap("utmParams") else null

                    utmParams?.let { utms ->

                        if (utms is ReadableMap) {

                        val utmSource = if(utms.hasKey("utmSource")) utms.getString("utmSource") else null
                        val utmMedium = if(utms.hasKey("utmMedium")) utms.getString("utmMedium") else null
                        val utmCampaign = if(utms.hasKey("utmCampaign")) utms.getString("utmCampaign") else null
                        val utmContent = if(utms.hasKey("utmContent")) utms.getString("utmContent") else null
                        val utmTerm = if(utms.hasKey("utmTerm")) utms.getString("utmTerm") else null

                        utmParamsNative = UtmParams(
                            utmSource = utmSource.toString(),
                            utmMedium = utmMedium.toString(),
                            utmCampaign = utmCampaign.toString(),
                            utmContent = utmContent.toString(),
                            utmTerm = utmTerm.toString()
                        )
                        }
                    }

                    val retargeting = if(signUpConfig.hasKey("retargeting")) signUpConfig.getBoolean("retargeting") else null

                    signUpConfigNative = SignUpConfig(
                        opaqueId = opaqueId.toString(),
                        // notes = notes.toString(),
                        userInfo = userInfo,
                        utmParams = utmParamsNative,
                        retargeting = retargeting
                    )  
                }
        }

        val additionalConfigNative = readableMapToAnyHashMap(additionalConfig)

        currentActivity?.let { activity ->
            SmallcaseGatewaySdk.openUsEquitiesAccount(
                activity = activity,
                signUpConfig = signUpConfigNative,
                additionalConfig = additionalConfigNative,
                useAccountOpeningListener = object : USEAccountOpeningListener {

                override fun onSuccess(response: Any) {
                    promise.resolve(response.toString())
                }

                override fun onError(errorCode: Int, errorMessage: String, data: String?) {
                    val err = createErrorJSON(errorCode, errorMessage, data)
                    promise.reject("error", err)
                }
            }
        )}
    }

    private fun getProtocol(envName: String): Environment.PROTOCOL {
        return when (envName) {
            "production" -> Environment.PROTOCOL.PRODUCTION
            "development" -> Environment.PROTOCOL.DEVELOPMENT
            "staging" -> Environment.PROTOCOL.STAGING
            else -> Environment.PROTOCOL.PRODUCTION
        }
    }

    private fun readableMapToAnyHashMap(params: ReadableMap?): HashMap<String, Any> {
        val data = HashMap<String, Any>()

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

        return writableMap
    }

    private fun createErrorJSON(errorCode: Int?, errorMessage: String?, data: String?): WritableMap {
        val errObj = Arguments.createMap()

        errorCode?.let { errObj.putInt("errorCode", it) }
        errorMessage?.let { errObj.putString("errorMessage", it) }
        data?.let { errObj.putString("data", it) }

        return errObj
    }

}
