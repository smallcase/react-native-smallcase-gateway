package com.smallcase.gateway.reactnative

import android.util.Log
import com.facebook.react.bridge.*
import com.smallcase.gateway.data.SmallcaseGatewayListeners
import com.smallcase.gateway.data.SmallcaseLogoutListener
import com.smallcase.gateway.data.listeners.DataListener
import com.smallcase.gateway.data.listeners.TransactionResponseListener
import com.smallcase.gateway.data.models.Environment
import com.smallcase.gateway.data.models.InitialisationResponse
import com.smallcase.gateway.data.models.TransactionResult
import com.smallcase.gateway.data.requests.InitRequest
import com.smallcase.gateway.portal.SmallcaseGatewaySdk


class SmallcaseGatewayModule(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext!!) {
    companion object {
        const val TAG = "SmallcaseGatewayModule"
    }

    override fun getName(): String {
        return "SmallcaseGateway"
    }

    @ReactMethod
    fun setConfigEnvironment(
            envName: String,
            gateway: String,
            isLeprechaunActive: Boolean,
            isAmoEnabled: Boolean,
            preProvidedBrokers: ReadableArray,
            promise: Promise) {
        Log.d(TAG, "setConfigEnvironment: start")
        try {
            val brokerList = ArrayList<String>()
            for (index in 0 until preProvidedBrokers.size()) {
                val broker = preProvidedBrokers.getString(index)
                if (broker != null) {
                    brokerList.add(broker)
                }
            }

            val protocol = getProtocol(envName)

            val env = Environment(
                    gateway = gateway,
                    buildType = protocol,
                    isAmoEnabled = isAmoEnabled,
                    preProvidedBrokers = brokerList,
                    isLeprachaunActive = isLeprechaunActive
            )

            SmallcaseGatewaySdk.setConfigEnvironment(
                    environment = env,
                    smallcaseGatewayListeners = object : SmallcaseGatewayListeners {
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
    fun init(sdkToken: String, promise: Promise) {
        Log.d(TAG, "init: start")

        val initReq = InitRequest(sdkToken)
        SmallcaseGatewaySdk.init(
                authRequest = initReq,
                gatewayInitialisationListener = object : DataListener<InitialisationResponse> {
                    override fun onFailure(errorCode: Int, errorMessage: String) {
                        val err = createErrorJSON(errorCode, errorMessage)
                        promise.reject("error", err)
                    }

                    override fun onSuccess(response: InitialisationResponse) {
                        promise.resolve(true)
                    }

                })
    }

    @ReactMethod
    fun triggerTransaction(transactionId: String, utmParams: ReadableMap, promise: Promise) {
        Log.d(TAG, "triggerTransaction: start")
        val activity = currentActivity;
        if (activity != null) {
            val utm = readableMapToStrHashMap(utmParams)
            SmallcaseGatewaySdk.triggerTransaction(
                    utmParams = utm,
                    activity = activity,
                    transactionId = transactionId,
                    transactionResponseListener = object : TransactionResponseListener {
                        override fun onSuccess(transactionResult: TransactionResult) {
                            if (transactionResult.success) {
                                val res = resultToWritableMap(transactionResult)
                                promise.resolve(res)
                            } else {
                                val err = createErrorJSON(
                                        transactionResult.errorCode,
                                        transactionResult.error
                                )
                                promise.reject("error", err)
                            }

                        }

                        override fun onError(errorCode: Int, errorMessage: String) {
                            val err = createErrorJSON(errorCode, errorMessage)
                            promise.reject("error", err)
                        }
                    })
        } else {
            promise.reject(Throwable("no activity"))
        }
    }

    @ReactMethod
    fun logoutUser(promise: Promise) {
        val activity = currentActivity;
        if (activity != null) {
            SmallcaseGatewaySdk.logoutUser(
                    activity = activity,
                    logoutListener = object : SmallcaseLogoutListener {
                        override fun onLogoutSuccessfull() {
                            promise.resolve(true)
                        }

                        override fun onLogoutFailed(errorCode: Int, error: String) {
                            val err = createErrorJSON(errorCode, error)
                            promise.reject("error", err)
                        }
                    })
        }
    }

    @ReactMethod
    fun triggerLeadGen(params: ReadableMap) {
        val activity = currentActivity;
        if (activity != null) {
            val data = readableMapToStrHashMap(params)
            SmallcaseGatewaySdk.triggerLeadGen(activity, data)
        }
    }

    private fun getProtocol(envName: String): Environment.PROTOCOL {
        return when (envName) {
            "production" -> Environment.PROTOCOL.PRODUCTION
            "development" -> Environment.PROTOCOL.DEVELOPMENT
            "staging" -> Environment.PROTOCOL.STAGING
            else -> Environment.PROTOCOL.PRODUCTION
        }
    }

    private fun readableMapToStrHashMap(params: ReadableMap): HashMap<String, String> {
        val data = HashMap<String, String>()
        val keyIterator = params.keySetIterator()

        while (keyIterator.hasNextKey()) {
            val key = keyIterator.nextKey()
            params.getString(key)?.let {
                data.put(key, it)
            }
        }
        return data
    }

    private fun resultToWritableMap(result: TransactionResult): WritableMap {
        val writableMap: WritableMap = Arguments.createMap()

        writableMap.putString("data", result.data)
        writableMap.putBoolean("success", result.success)
        writableMap.putString("error", result.error)
        result.errorCode?.let {
            writableMap.putInt("errorCode", it)
        }
        writableMap.putString("transaction", result.transaction.name)
        return writableMap
    }

    private fun createErrorJSON(errorCode: Int?, errorMessage: String?): WritableMap {
        val errObj = Arguments.createMap()

        errorCode?.let { errObj.putInt("errorCode", it) }
        errorMessage?.let { errObj.putString("errorMessage", it) }

        return errObj
    }
}