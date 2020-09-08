package com.smallcase.gateway.reactnative

import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SmallcaseGatewayModule(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext!!) {
    override fun getName(): String {
        return "SmallcaseGateway"
    }

    @ReactMethod
    fun sampleMethod(stringArgument: String, numberArgument: Int, callback: Callback) {
        callback.invoke("Received numberArgument: $numberArgument stringArgument: $stringArgument")
    }
}