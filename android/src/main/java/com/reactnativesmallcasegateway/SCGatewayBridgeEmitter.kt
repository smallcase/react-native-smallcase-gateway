package com.reactnativesmallcasegateway

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.UiThreadUtil
import com.smallcase.gateway.data.listeners.NotificationCenter
import com.smallcase.gateway.data.listeners.Notification
import com.smallcase.gateway.portal.SmallcaseGatewaySdk
import com.smallcase.gateway.portal.ScgNotification

class SCGatewayBridgeEmitter(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "SCGatewayBridgeEmitter"
        const val ANALYTICS_EVENT = ScgNotification.ANALYTICS_EVENT
        const val SUPER_PROPERTIES_UPDATED = ScgNotification.SUPER_PROPS_UPDATED
        const val USER_RESET = ScgNotification.USER_RESET
        const val USER_IDENTIFY = ScgNotification.USER_IDENTIFY
    }

    private var notificationObserver: ((Notification) -> Unit)? = null
    
    private val isListening: Boolean
        get() = notificationObserver != null

    override fun getName(): String = "SCGatewayBridgeEmitter"

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf(
            "ANALYTICS_EVENT" to ScgNotification.ANALYTICS_EVENT,
            "SUPER_PROPERTIES_UPDATED" to ScgNotification.SUPER_PROPS_UPDATED,
            "USER_RESET" to ScgNotification.USER_RESET,
            "USER_IDENTIFY" to ScgNotification.USER_IDENTIFY
        )
    }

    init {
        UiThreadUtil.runOnUiThread {
            startListening()
        }
    }

    @ReactMethod
    fun startListening(promise: Promise? = null) {
        try {
            Log.d(TAG, "startListening called")
            
            if (isListening) {
                Log.d(TAG, "Already listening to events")
                promise?.resolve("Already listening")
                return
            }

            UiThreadUtil.runOnUiThread {
                try {
                    Log.d(TAG, "Starting listener on thread: ${Thread.currentThread().name}")

                    notificationObserver = { notification ->
                        Log.d(TAG, "Received notification: ${notification.name}")
                        
                        try {
                            processScgNotification(notification)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error processing notification: ${notification.name}", e)
                        }
                    }

                    notificationObserver?.let { observer ->
                        NotificationCenter.addObserver(observer)
                        Log.d(TAG, "Successfully started listening for notifications")
                        promise?.resolve("Started listening successfully")
                    } ?: run {
                        promise?.reject("START_LISTENING_ERROR", "Failed to create observer")
                    }

                } catch (e: Exception) {
                    Log.e(TAG, "Error starting listener", e)
                    promise?.reject("START_LISTENING_ERROR", e.message ?: "Unknown error", e)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in startListening", e)
            promise?.reject("START_LISTENING_ERROR", e.message ?: "Unknown error", e)
        }
    }

    private fun processScgNotification(notification: Notification) {
        try {
            val jsonString = notification.userInfo?.get(ScgNotification.STRINGIFIED_PAYLOAD_KEY) as? String
            if (jsonString == null) {
                Log.e(TAG, "SCGatewayBridgeEmitter: Invalid notification object - expected JSON string")
                return
            }
            
            sendEvent(SmallcaseGatewaySdk.SCG_NOTIFICATION_NAME, jsonString)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing SCG notification", e)
        }
    }

    private fun sendEvent(eventName: String, jsonString: String) {
        try {
            if (reactContext.hasActiveCatalystInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, jsonString)
            } else {
                Log.w(TAG, "React context not active, cannot send event: $eventName")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending event to React Native: $eventName", e)
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            if (!isListening) {
                promise.resolve("Not listening")
                return
            }

            UiThreadUtil.runOnUiThread {
                try {
                    notificationObserver?.let { observer ->
                        NotificationCenter.removeObserver(observer)
                        notificationObserver = null
                        promise.resolve("Stopped listening successfully")
                    } ?: run {
                        promise.resolve("No observer to remove")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error stopping listener", e)
                    promise.reject("STOP_LISTENING_ERROR", e.message ?: "Unknown error", e)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in stopListening", e)
            promise.reject("STOP_LISTENING_ERROR", e.message ?: "Unknown error", e)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            if (isListening) {
                notificationObserver?.let { observer ->
                    NotificationCenter.removeObserver(observer)
                }
                notificationObserver = null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error during cleanup", e)
        }
    }
}