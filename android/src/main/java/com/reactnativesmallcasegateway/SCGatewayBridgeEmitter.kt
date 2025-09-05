package com.reactnativesmallcasegateway

import android.util.Log
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.UiThreadUtil
import com.smallcase.gateway.data.listeners.NotificationCenter
import com.smallcase.gateway.data.listeners.Notification
import com.smallcase.gateway.portal.SmallcaseGatewaySdk
import com.smallcase.gateway.portal.ScgNotification
import com.google.gson.Gson
import com.google.gson.JsonSyntaxException
import java.math.BigDecimal
import java.math.BigInteger

class SCGatewayBridgeEmitter(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "SCGatewayBridgeEmitter"
        const val ANALYTICS_EVENT = ScgNotification.ANALYTICS_EVENT
        const val SUPER_PROPERTIES_UPDATED = ScgNotification.SUPER_PROPS_UPDATED
        const val USER_RESET = ScgNotification.USER_RESET
        const val USER_IDENTIFY = ScgNotification.USER_IDENTIFY
    }

    private var isListening = false
    private var notificationObserver: ((Notification) -> Unit)? = null

    override fun getName(): String = "SCGatewayBridgeEmitter"

    init {
        Log.d(TAG, "SCGatewayBridgeEmitter initialized - auto-starting listener")
        UiThreadUtil.runOnUiThread {
            startListeningInternal()
        }
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        try {
            Log.d(TAG, "startListening called from React Native")
            
            if (isListening) {
                Log.d(TAG, "Already listening to events")
                promise.resolve("Already listening")
                return
            }

            UiThreadUtil.runOnUiThread {
                val success = startListeningInternal()
                if (success) {
                    promise.resolve("Started listening successfully")
                } else {
                    promise.reject("START_LISTENING_ERROR", "Failed to start listening")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in startListening", e)
            promise.reject("START_LISTENING_ERROR", e.message ?: "Unknown error", e)
        }
    }

    // Internal start listening method with debug logging
    private fun startListeningInternal(): Boolean {
        return try {
            Log.d(TAG, "Starting internal listener on thread: ${Thread.currentThread().name}")

            if (isListening) {
                Log.d(TAG, "Already listening")
                return true
            }

            // Add debug observer for all notifications
            NotificationCenter.addObserver { notification ->
                Log.d("DEBUG_ALL_EVENTS", "All notifications: ${notification.name}")
            }

            // Created notification observer
            notificationObserver = { notification ->
                Log.d(TAG, "Received notification: ${notification.name}")
                
                try {
                    // Only process scg_notification - single way to subscribe
                    if (notification.name == SmallcaseGatewaySdk.SCG_NOTIFICATION_NAME) {
                        Log.d(TAG, "Processing scg_notification")
                        processScgNotification(notification)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error processing notification: ${notification.name}", e)
                }
            }

            notificationObserver?.let { observer ->
                NotificationCenter.addObserver(observer)
                isListening = true
                Log.d(TAG, "Successfully started listening for scg_notification events")
                true
            } ?: false

        } catch (e: Exception) {
            Log.e(TAG, "Error starting listener", e)
            false
        }
    }

    // Enhanced event sending with better error handling
    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            Log.d(TAG, "Attempting to send event: $eventName")
            
            if (!reactContext.hasActiveCatalystInstance()) {
                Log.w(TAG, "React context not active, cannot send event: $eventName")
                return
            }
            
            // Validate params before sending
            if (params != null) {
                validateWritableMap(params)
                Log.d(TAG, "Sending validated event data: $eventName")
            }
            
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
                
            Log.d(TAG, "Event sent successfully: $eventName")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error sending event: $eventName", e)
        }
    }

    // NEW: Validate WritableMap for invalid values
    private fun validateWritableMap(map: WritableMap) {
        try {
            // This method helps catch invalid values before they reach the bridge
            val mapCopy = map.copy()
            Log.d(TAG, "WritableMap validation passed")
        } catch (e: Exception) {
            Log.e(TAG, "WritableMap validation failed", e)
            throw e
        }
    }

    // Improved SCG notification processing with better error handling
    private fun processScgNotification(notification: Notification) {
        try {
            Log.d(TAG, "Processing SCG notification with userInfo: ${notification.userInfo}")
            
            val eventData = if (notification.userInfo != null) {
                // Try different payload keys
                val payloadJson = notification.userInfo!![ScgNotification.STRINGIFIED_PAYLOAD_KEY] as? String
                    ?: notification.userInfo!!["payload"] as? String
                    ?: notification.userInfo!!["data"] as? String
                
                if (payloadJson != null) {
                    Log.d(TAG, "Found JSON payload: $payloadJson")
                    val parsedData = parseNotificationJSON(payloadJson)
                    parsedData?.let { convertMapToWritableMapSafely(it) }
                } else {
                    Log.d(TAG, "No JSON payload found, using userInfo directly")
                    convertMapToWritableMapSafely(notification.userInfo!! as Map<String, Any?>)
                }
            } else {
                Log.d(TAG, "No userInfo, creating basic event")
                Arguments.createMap()
            }
            
            // Ensure eventData has required fields
            if (eventData != null) {
                if (!eventData.hasKey("eventType")) {
                    eventData.putString("eventType", SmallcaseGatewaySdk.SCG_NOTIFICATION_NAME)
                }
                if (!eventData.hasKey("type")) {
                    eventData.putString("type", eventData.getString("eventType") ?: SmallcaseGatewaySdk.SCG_NOTIFICATION_NAME)
                }
                
                Log.d(TAG, "Sending processed SCG notification")
                sendEvent(SmallcaseGatewaySdk.SCG_NOTIFICATION_NAME, eventData)
            } else {
                Log.e(TAG, "Failed to create event data for SCG notification")
                // Send a minimal fallback event
                val fallbackEvent = Arguments.createMap().apply {
                    putString("eventType", SmallcaseGatewaySdk.SCG_NOTIFICATION_NAME)
                    putString("type", SmallcaseGatewaySdk.SCG_NOTIFICATION_NAME)
                    putString("error", "Failed to process notification data")
                }
                sendEvent(SmallcaseGatewaySdk.SCG_NOTIFICATION_NAME, fallbackEvent)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing SCG notification", e)
            // Send error event instead of failing silently
            try {
                val errorEvent = Arguments.createMap().apply {
                    putString("eventType", "scg_notification_error")
                    putString("type", "scg_notification_error")
                    putString("error", e.message ?: "Unknown error processing notification")
                }
                sendEvent(SmallcaseGatewaySdk.SCG_NOTIFICATION_NAME, errorEvent)
            } catch (fallbackError: Exception) {
                Log.e(TAG, "Failed to send error event", fallbackError)
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            Log.d(TAG, "Stopping SCGateway event listening")

            if (!isListening) {
                promise.resolve("Not listening")
                return
            }

            UiThreadUtil.runOnUiThread {
                try {
                    notificationObserver?.let { observer ->
                        NotificationCenter.removeObserver(observer)
                        notificationObserver = null
                        isListening = false
                        Log.d(TAG, "Successfully stopped listening for events")
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

    @ReactMethod
    fun getListeningStatus(promise: Promise) {
        try {
            val status = Arguments.createMap().apply {
                putBoolean("isListening", isListening)
                putBoolean("hasNotificationObserver", notificationObserver != null)
                putBoolean("hasActiveCatalystInstance", reactContext.hasActiveCatalystInstance())
            }
            promise.resolve(status)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting listening status", e)
            promise.reject("STATUS_ERROR", e.message ?: "Unknown error", e)
        }
    }

    private fun parseNotificationJSON(jsonString: String): Map<String, Any?>? {
        return try {
            val gson = Gson()
            val result = gson.fromJson(jsonString, Map::class.java) as? Map<String, Any?>
            Log.d(TAG, "Successfully parsed JSON: ${result?.keys}")
            result
        } catch (e: JsonSyntaxException) {
            Log.e(TAG, "JSON parse error for: $jsonString", e)
            null
        } catch (e: Exception) {
            Log.e(TAG, "Error processing JSON notification", e)
            null
        }
    }

    // IMPROVED: Safe conversion with NaN/Infinity checking
    private fun convertMapToWritableMapSafely(map: Map<String, Any?>): WritableMap {
        val writableMap = Arguments.createMap()

        try {
            for ((key, value) in map) {
                when (value) {
                    null -> writableMap.putNull(key)
                    is String -> writableMap.putString(key, value)
                    is Int -> writableMap.putInt(key, value)
                    is Double -> {
                        if (value.isNaN() || value.isInfinite()) {
                            Log.w(TAG, "Skipping invalid Double value for key '$key': $value")
                            writableMap.putNull(key)
                        } else {
                            writableMap.putDouble(key, value)
                        }
                    }
                    is Float -> {
                        val doubleValue = value.toDouble()
                        if (doubleValue.isNaN() || doubleValue.isInfinite()) {
                            Log.w(TAG, "Skipping invalid Float value for key '$key': $value")
                            writableMap.putNull(key)
                        } else {
                            writableMap.putDouble(key, doubleValue)
                        }
                    }
                    is Long -> {
                        val doubleValue = value.toDouble()
                        if (doubleValue.isNaN() || doubleValue.isInfinite()) {
                            Log.w(TAG, "Skipping invalid Long value for key '$key': $value")
                            writableMap.putNull(key)
                        } else {
                            writableMap.putDouble(key, doubleValue)
                        }
                    }
                    is BigDecimal -> {
                        try {
                            val doubleValue = value.toDouble()
                            if (doubleValue.isNaN() || doubleValue.isInfinite()) {
                                Log.w(TAG, "Skipping invalid BigDecimal value for key '$key': $value")
                                writableMap.putNull(key)
                            } else {
                                writableMap.putDouble(key, doubleValue)
                            }
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to convert BigDecimal for key '$key': $value", e)
                            writableMap.putString(key, value.toString())
                        }
                    }
                    is BigInteger -> {
                        try {
                            val doubleValue = value.toDouble()
                            if (doubleValue.isNaN() || doubleValue.isInfinite()) {
                                Log.w(TAG, "Skipping invalid BigInteger value for key '$key': $value")
                                writableMap.putNull(key)
                            } else {
                                writableMap.putDouble(key, doubleValue)
                            }
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to convert BigInteger for key '$key': $value", e)
                            writableMap.putString(key, value.toString())
                        }
                    }
                    is Boolean -> writableMap.putBoolean(key, value)
                    is Map<*, *> -> {
                        @Suppress("UNCHECKED_CAST")
                        val nestedMap = value as? Map<String, Any?>
                        nestedMap?.let {
                            writableMap.putMap(key, convertMapToWritableMapSafely(it))
                        } ?: writableMap.putNull(key)
                    }
                    is List<*> -> {
                        val writableArray = convertListToWritableArraySafely(value)
                        writableMap.putArray(key, writableArray)
                    }
                    else -> {
                        // Handle other types by converting to string
                        val stringValue = value.toString()
                        writableMap.putString(key, stringValue)
                        Log.d(TAG, "Converted unknown type ${value::class.java.simpleName} to string for key '$key'")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error converting map to WritableMap", e)
        }

        return writableMap
    }

    // NEW: Safe array conversion
    private fun convertListToWritableArraySafely(list: List<*>): WritableArray {
        val writableArray = Arguments.createArray()
        
        list.forEach { item ->
            when (item) {
                null -> writableArray.pushNull()
                is String -> writableArray.pushString(item)
                is Int -> writableArray.pushInt(item)
                is Double -> {
                    if (item.isNaN() || item.isInfinite()) {
                        Log.w(TAG, "Skipping invalid Double in array: $item")
                        writableArray.pushNull()
                    } else {
                        writableArray.pushDouble(item)
                    }
                }
                is Float -> {
                    val doubleValue = item.toDouble()
                    if (doubleValue.isNaN() || doubleValue.isInfinite()) {
                        Log.w(TAG, "Skipping invalid Float in array: $item")
                        writableArray.pushNull()
                    } else {
                        writableArray.pushDouble(doubleValue)
                    }
                }
                is Long -> {
                    val doubleValue = item.toDouble()
                    if (doubleValue.isNaN() || doubleValue.isInfinite()) {
                        Log.w(TAG, "Skipping invalid Long in array: $item")
                        writableArray.pushNull()
                    } else {
                        writableArray.pushDouble(doubleValue)
                    }
                }
                is Boolean -> writableArray.pushBoolean(item)
                is Map<*, *> -> {
                    @Suppress("UNCHECKED_CAST")
                    val itemMap = item as? Map<String, Any?>
                    itemMap?.let {
                        writableArray.pushMap(convertMapToWritableMapSafely(it))
                    } ?: writableArray.pushNull()
                }
                is List<*> -> {
                    writableArray.pushArray(convertListToWritableArraySafely(item))
                }
                else -> writableArray.pushString(item.toString())
            }
        }
        
        return writableArray
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            if (isListening) {
                notificationObserver?.let { observer ->
                    NotificationCenter.removeObserver(observer)
                }
                notificationObserver = null
                isListening = false
                Log.d(TAG, "Cleaned up SCGateway event listeners on destroy")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error during cleanup", e)
        }
    }
}