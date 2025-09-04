package com.reactnativesmallcasegateway

import android.util.Log
import android.os.Looper
import androidx.lifecycle.Observer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.UiThreadUtil
import com.smallcase.loans.data.listeners.NotificationCenter
import com.smallcase.loans.data.listeners.Notification
import com.smallcase.loans.core.external.ScLoanNotification
import com.smallcase.loans.core.external.ScLoan
import com.google.gson.Gson
import com.google.gson.JsonSyntaxException


class SCLoansBridgeEmitter(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "SCLoansBridgeEmitter"
        
        // Event types matching the ScLoanNotification constants
        const val ANALYTICS_EVENT = ScLoanNotification.ANALYTICS_EVENT
        const val SUPER_PROPERTIES_UPDATED = ScLoanNotification.SUPER_PROPS_UPDATED
    }

    private var isListening = false
    private var notificationObserver: ((Notification) -> Unit)? = null

    override fun getName(): String = "SCLoansBridgeEmitter"

    init {
        Log.d(TAG, "SCLoansBridgeEmitter initialized - auto-starting listener")
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

            // Create notification observer for scloans_notification only
            notificationObserver = { notification ->
                Log.d(TAG, "Received notification: ${notification.name}")
                
                try {
                    // Only process scloans_notification - single way to subscribe
                    if (notification.name == ScLoan.SCLOANS_NOTIFICATION_NAME) {
                        Log.d(TAG, "Processing scloans_notification")
                        processScLoansNotification(notification)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error processing notification: ${notification.name}", e)
                }
            }

            notificationObserver?.let { observer ->
                NotificationCenter.addObserver(observer)
                isListening = true
                Log.d(TAG, "Successfully started listening for scloans_notification events")
                true
            } ?: false

        } catch (e: Exception) {
            Log.e(TAG, "Error starting listener", e)
            false
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            Log.d(TAG, "Stopping SCLoans event listening (on main thread? ${Looper.myLooper() == Looper.getMainLooper()})")

            if (!isListening) {
                Log.d(TAG, "Not currently listening")
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
                    Log.e(TAG, "Error stopping listener on UI thread", e)
                    promise.reject("STOP_LISTENING_ERROR", e.message, e)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scheduling stopListening on UI thread", e)
            promise.reject("STOP_LISTENING_ERROR", e.message, e)
        }
    }


    @ReactMethod
    fun getListeningStatus(promise: Promise) {
        try {
            val status = Arguments.createMap().apply {
                putBoolean("isListening", isListening)
                putBoolean("hasNotificationObserver", notificationObserver != null)
            }
            promise.resolve(status)
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun emitTestEvent(eventType: String, testData: ReadableMap?, promise: Promise) {
        try {
            Log.d(TAG, "Emitting test event: $eventType")

            val payload = Arguments.createMap().apply {
                putString("type", eventType)
                putBoolean("isTest", true)
                testData?.let { putMap("data", it) }
            }

            sendEvent(ScLoan.SCLOANS_NOTIFICATION_NAME, payload)
            promise.resolve("Test event emitted successfully")

        } catch (e: Exception) {
            Log.e(TAG, "Error emitting test event", e)
            promise.reject("TEST_EVENT_ERROR", e.message, e)
        }
    }



    /**
     * Process SCLoans notification from NotificationCenter
     */
    private fun processScLoansNotification(notification: Notification) {
        try {
            Log.d(TAG, "SCLoansBridgeEmitter: Handling SCLoans notification")
            
            // Try to get the JSON string using SCLOANS_NOTIFICATION_NAME key
            val jsonString = notification.userInfo?.get(ScLoan.SCLOANS_NOTIFICATION_NAME) as? String
            if (jsonString == null) {
                Log.e(TAG, "SCLoansBridgeEmitter: Invalid notification object - expected JSON string")
                return
            }
            
            Log.d(TAG, "SCLoansBridgeEmitter: Received JSON string: $jsonString")
            
            // Parse the JSON string to extract notification details
            val notificationData = parseNotificationJSON(jsonString)
            if (notificationData == null) {
                Log.e(TAG, "SCLoansBridgeEmitter: Failed to parse notification JSON: $jsonString")
                return
            }
            
            Log.d(TAG, "SCLoansBridgeEmitter: Successfully parsed notification data")
            
            // Map notification type to React Native event name
            val notificationType = notificationData["type"] as? String
            val eventName = mapNotificationTypeToEventName(notificationType)
            Log.d(TAG, "SCLoansBridgeEmitter: Mapped notification type to event name: $eventName")
            
            // Emit the event to React Native
            val eventPayload = convertMapToWritableMap(notificationData)
            sendEvent(ScLoan.SCLOANS_NOTIFICATION_NAME, eventPayload)
            
            Log.d(TAG, "SCLoansBridgeEmitter: Emitted event '$eventName' with data")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing SCLoans notification", e)
        }
    }

    /**
     * Parse JSON string to extract notification data
     */
    private fun parseNotificationJSON(jsonString: String): Map<String, Any?>? {
        return try {
            val gson = Gson()
            gson.fromJson(jsonString, Map::class.java) as? Map<String, Any?>
        } catch (e: JsonSyntaxException) {
            Log.e(TAG, "Error parsing JSON notification: $jsonString", e)
            null
        } catch (e: Exception) {
            Log.e(TAG, "Error processing JSON notification", e)
            null
        }
    }

    /**
     * Map notification type to React Native event name
     */
    private fun mapNotificationTypeToEventName(notificationType: String?): String {
        return when (notificationType) {
            "scloans_analytics_event" -> ANALYTICS_EVENT
            "scloans_super_properties_updated" -> SUPER_PROPERTIES_UPDATED
            else -> notificationType ?: "unknown_event"
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            if (reactContext.hasActiveCatalystInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(ScLoan.SCLOANS_NOTIFICATION_NAME, params)
                Log.d(TAG, "Event sent to React Native: $eventName")
            } else {
                Log.w(TAG, "React context not active, cannot send event: $eventName")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending event to React Native: $eventName", e)
        }
    }

    /**
     * Convert ReadableMap to Map<String, Any?>
     */
    private fun convertReadableMapToMap(readableMap: ReadableMap): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        val iterator = readableMap.keySetIterator()
        
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            val type = readableMap.getType(key)
            
            when (type) {
                ReadableType.Null -> map[key] = null
                ReadableType.Boolean -> map[key] = readableMap.getBoolean(key)
                ReadableType.Number -> map[key] = readableMap.getDouble(key)
                ReadableType.String -> map[key] = readableMap.getString(key)
                ReadableType.Map -> {
                    val nestedMap = readableMap.getMap(key)
                    map[key] = if (nestedMap != null) convertReadableMapToMap(nestedMap) else null
                }
                ReadableType.Array -> {
                    val nestedArray = readableMap.getArray(key)
                    map[key] = if (nestedArray != null) convertReadableArrayToList(nestedArray) else null
                }
            }
        }
        
        return map
    }

    /**
     * Convert ReadableArray to List<Any?>
     */
    private fun convertReadableArrayToList(readableArray: ReadableArray): List<Any?> {
        val list = mutableListOf<Any?>()
        
        for (i in 0 until readableArray.size()) {
            val type = readableArray.getType(i)
            
            when (type) {
                ReadableType.Null -> list.add(null)
                ReadableType.Boolean -> list.add(readableArray.getBoolean(i))
                ReadableType.Number -> list.add(readableArray.getDouble(i))
                ReadableType.String -> list.add(readableArray.getString(i))
                ReadableType.Map -> {
                    val nestedMap = readableArray.getMap(i)
                    list.add(if (nestedMap != null) convertReadableMapToMap(nestedMap) else null)
                }
                ReadableType.Array -> {
                    val nestedArray = readableArray.getArray(i)
                    list.add(if (nestedArray != null) convertReadableArrayToList(nestedArray) else null)
                }
            }
        }
        
        return list
    }

    /**
     * Convert Map to WritableMap recursively
     */
    private fun convertMapToWritableMap(map: Map<String, Any?>): WritableMap {
        val writableMap = Arguments.createMap()

        for ((key, value) in map) {
            when (value) {
                null -> writableMap.putNull(key)
                is String -> writableMap.putString(key, value)
                is Int -> writableMap.putInt(key, value)
                is Double -> writableMap.putDouble(key, value)
                is Float -> writableMap.putDouble(key, value.toDouble())
                is Long -> writableMap.putDouble(key, value.toDouble())
                is Boolean -> writableMap.putBoolean(key, value)
                is Map<*, *> -> {
                    @Suppress("UNCHECKED_CAST")
                    val nestedMap = value as? Map<String, Any?>
                    nestedMap?.let {
                        writableMap.putMap(key, convertMapToWritableMap(it))
                    } ?: writableMap.putNull(key)
                }
                is List<*> -> {
                    val writableArray = Arguments.createArray()
                    value.forEach { item ->
                        when (item) {
                            null -> writableArray.pushNull()
                            is String -> writableArray.pushString(item)
                            is Int -> writableArray.pushInt(item)
                            is Double -> writableArray.pushDouble(item)
                            is Float -> writableArray.pushDouble(item.toDouble())
                            is Long -> writableArray.pushDouble(item.toDouble())
                            is Boolean -> writableArray.pushBoolean(item)
                            is Map<*, *> -> {
                                @Suppress("UNCHECKED_CAST")
                                val itemMap = item as? Map<String, Any?>
                                itemMap?.let {
                                    writableArray.pushMap(convertMapToWritableMap(it))
                                } ?: writableArray.pushNull()
                            }
                            else -> writableArray.pushString(item.toString())
                        }
                    }
                    writableMap.putArray(key, writableArray)
                }
                else -> writableMap.putString(key, value.toString())
            }
        }

        return writableMap
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
                Log.d(TAG, "Cleaned up SCLoans event listeners on destroy")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error during cleanup", e)
        }
    }
}