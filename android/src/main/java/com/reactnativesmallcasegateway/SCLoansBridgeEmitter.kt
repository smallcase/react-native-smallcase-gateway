package com.reactnativesmallcasegateway

import android.util.Log
import android.os.Looper
import androidx.lifecycle.Observer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.UiThreadUtil
import com.smallcase.loans.data.listeners.EventBroadcaster
import com.smallcase.loans.data.listeners.SCGatewayConsumer

class SCLoansBridgeEmitter(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "SCLoansBridgeEmitter"
        
        // Event types matching the ScLoanNotification constants
        const val ANALYTICS_EVENT = "scloans_analytics_event"
        const val SUPER_PROPERTIES_UPDATED = "scloans_super_properties_updated"
        const val USER_RESET = "scloans_user_reset"
        const val USER_IDENTIFY = "scloans_user_identify"
    }

    private var isListening = false
    private var jsonObserver: Observer<String>? = null

    override fun getName(): String = "SCLoansBridgeEmitter"

    @ReactMethod
    fun getDebugInfo(promise: Promise) {
        try {
            val info = Arguments.createMap().apply {
                putBoolean("hasActiveCatalystInstance", reactContext.hasActiveCatalystInstance())
                putBoolean("isListening", isListening)
                putBoolean("isAnalyticsActive", SCGatewayConsumer.isAnalyticsActive)
            }
            promise.resolve(info)
        } catch (e: Exception) {
            promise.reject("DEBUG_INFO_ERROR", e.message, e)
        }
    }

    /**
     * 🚀 Start listening to EventBroadcaster events
     */
    @ReactMethod
    fun startListening(promise: Promise) {
        try {
            Log.d(TAG, "📡 Starting to listen for SCLoans events (on main thread? ${Looper.myLooper() == Looper.getMainLooper()})")

            if (isListening) {
                Log.d(TAG, "Already listening to events")
                promise.resolve("Already listening")
                return
            }

            UiThreadUtil.runOnUiThread {
                try {
                    Log.d(TAG, "📡 Executing startListening on main thread: ${Looper.myLooper() == Looper.getMainLooper()}")

                    jsonObserver = Observer { jsonString ->
                        try {
                            Log.d(TAG, "📊 Received JSON notification: $jsonString")

                            val parsedData = SCGatewayConsumer.parseJSONData(jsonString)
                            parsedData?.let { data ->
                                val eventType = data["type"] as? String
                                val eventData = data["data"] as? Map<String, Any?>
                                val timestamp = data["timestamp"] as? Double

                                eventType?.let { type ->
                                    val eventPayload = Arguments.createMap().apply {
                                        putString("type", type)
                                        timestamp?.let { putDouble("timestamp", it) }
                                        eventData?.let { dataMap ->
                                            val writableData = convertMapToWritableMap(dataMap)
                                            putMap("data", writableData)
                                        }
                                    }

                                    sendEvent(type, eventPayload)
                                    Log.d(TAG, "✅ Emitted event: $type")
                                }
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "❌ Error processing JSON notification", e)
                        }
                    }

                    jsonObserver?.let { observer ->
                        SCGatewayConsumer.addAnalyticsObserver(observer)
                        isListening = true
                        Log.d(TAG, "✅ Successfully started listening for events")
                        promise.resolve("Started listening successfully")
                    } ?: run {
                        promise.reject("OBSERVER_ERROR", "Failed to create observer")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Error starting listener on UI thread", e)
                    promise.reject("START_LISTENING_ERROR", e.message, e)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error scheduling startListening on UI thread", e)
            promise.reject("START_LISTENING_ERROR", e.message, e)
        }
    }

    /**
     * 🛑 Stop listening to EventBroadcaster events
     */
    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            Log.d(TAG, "🛑 Stopping SCLoans event listening (on main thread? ${Looper.myLooper() == Looper.getMainLooper()})")

            if (!isListening) {
                Log.d(TAG, "Not currently listening")
                promise.resolve("Not listening")
                return
            }

            UiThreadUtil.runOnUiThread {
                try {
                    jsonObserver?.let { observer ->
                        SCGatewayConsumer.removeAnalyticsObserver(observer)
                        jsonObserver = null
                        isListening = false
                        Log.d(TAG, "✅ Successfully stopped listening for events")
                        promise.resolve("Stopped listening successfully")
                    } ?: run {
                        promise.resolve("No observer to remove")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Error stopping listener on UI thread", e)
                    promise.reject("STOP_LISTENING_ERROR", e.message, e)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error scheduling stopListening on UI thread", e)
            promise.reject("STOP_LISTENING_ERROR", e.message, e)
        }
    }

    /**
     * 📊 Get current listening status
     */
    @ReactMethod
    fun getListeningStatus(promise: Promise) {
        try {
            val status = Arguments.createMap().apply {
                putBoolean("isListening", isListening)
                putBoolean("isAnalyticsActive", SCGatewayConsumer.isAnalyticsActive)
            }
            promise.resolve(status)
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", e.message, e)
        }
    }

    /**
     * 🧪 Test event emission (for debugging)
     */
    @ReactMethod
    fun emitTestEvent(eventType: String, testData: ReadableMap?, promise: Promise) {
        try {
            Log.d(TAG, "🧪 Emitting test event: $eventType")

            val payload = Arguments.createMap().apply {
                putString("type", eventType)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
                putBoolean("isTest", true)

                testData?.let { putMap("data", it) }
            }

            sendEvent(eventType, payload)
            promise.resolve("Test event emitted successfully")

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error emitting test event", e)
            promise.reject("TEST_EVENT_ERROR", e.message, e)
        }
    }

    /**
     * 📊 Trigger analytics event (for manual testing)
     */
    @ReactMethod
    fun triggerAnalyticsEvent(eventName: String, properties: ReadableMap?, promise: Promise) {
        try {
            Log.d(TAG, "📊 Triggering analytics event: $eventName")

            val propertiesMap = properties?.let { convertReadableMapToMap(it) } ?: emptyMap()
            EventBroadcaster.registerAnalyticsEvent(eventName, propertiesMap)
            
            promise.resolve("Analytics event triggered successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error triggering analytics event", e)
            promise.reject("ANALYTICS_EVENT_ERROR", e.message, e)
        }
    }

    /**
     * 📊 Trigger super properties update (for manual testing)
     */
    @ReactMethod
    fun triggerSuperPropertiesUpdate(properties: ReadableMap?, promise: Promise) {
        try {
            Log.d(TAG, "📊 Triggering super properties update")

            val propertiesMap = properties?.let { convertReadableMapToMap(it) } ?: emptyMap()
            EventBroadcaster.registerSuperPropertiesUpdated(propertiesMap)
            
            promise.resolve("Super properties update triggered successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error triggering super properties update", e)
            promise.reject("SUPER_PROPERTIES_ERROR", e.message, e)
        }
    }

    /**
     * 📤 Send event to React Native
     */
    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            if (reactContext.hasActiveCatalystInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, params)
                Log.d(TAG, "📤 Event sent to React Native: $eventName")
            } else {
                Log.w(TAG, "⚠️ React context not active, cannot send event: $eventName")
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error sending event to React Native: $eventName", e)
        }
    }

    /**
     * 🔄 Convert ReadableMap to Map<String, Any?>
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
     * 🔄 Convert ReadableArray to List<Any?>
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
     * 🔄 Convert Map to WritableMap recursively
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
                jsonObserver?.let { observer ->
                    SCGatewayConsumer.removeAnalyticsObserver(observer)
                }
                jsonObserver = null
                isListening = false
                Log.d(TAG, "🧹 Cleaned up SCLoans event listeners on destroy")
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error during cleanup", e)
        }
    }

    /**
     * 📋 Get supported events (for documentation)
     */
    @ReactMethod
    fun getSupportedEvents(promise: Promise) {
        try {
            val events = Arguments.createArray().apply {
                pushString(ANALYTICS_EVENT)
                pushString(SUPER_PROPERTIES_UPDATED)
                pushString(USER_RESET)
                pushString(USER_IDENTIFY)
            }
            promise.resolve(events)
        } catch (e: Exception) {
            promise.reject("GET_EVENTS_ERROR", e.message, e)
        }
    }
}