package com.reactnativesmallcasegateway

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import com.smallcase.gateway.portal.EventPublisher
import android.util.Log


class EventBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    companion object {
        const val TAG = "EventBridgeModule"
    }

    override fun getName(): String {
        return "EventBridge"
    }

    init {
        observeEvents()
    }

    private fun observeEvents() {
        scope.launch {
            EventPublisher.eventFlow.collect { event ->
                sendEventToReactNative(event)
            }
        }
    }

    private fun sendEventToReactNative(event: Map<String, Any>) {
        val eventName = event["eventName"] as? String  // Safe cast to String?
        
        if (eventName != null) {  // Check if the eventName is not null
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, event)
        } else {
            // Handle the case where the eventName is null, if necessary
            Log.e("EventBridgeModule", "Event name is null!")
        }
    }
    

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        scope.cancel() // Clean up coroutine scope
    }
}
