package com.reactnativesmallcasegateway

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.smallcase.loans.core.external.ScLoan
import com.smallcase.loans.core.external.ScLoanNotification
import com.smallcase.loans.data.listeners.Notification
import com.smallcase.loans.data.listeners.NotificationCenter

class SCLoansBridgeEmitter(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "SCLoansBridgeEmitter"

        const val ANALYTICS_EVENT = ScLoanNotification.ANALYTICS_EVENT
        const val SUPER_PROPERTIES_UPDATED = ScLoanNotification.SUPER_PROPS_UPDATED
    }

    private var notificationObserver: ((Notification) -> Unit)? = null

    private val isListening: Boolean
        get() = notificationObserver != null

    init {
        UiThreadUtil.runOnUiThread { startListening() }
    }

    override fun getName(): String = "SCLoansBridgeEmitter"

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf(
            "SCLOANS_NOTIFICATION" to ScLoan.SCLOANS_NOTIFICATION_NAME,
            "ANALYTICS_EVENT" to ScLoanNotification.ANALYTICS_EVENT,
            "SUPER_PROPERTIES_UPDATED" to ScLoanNotification.SUPER_PROPS_UPDATED,
        )
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
                            processScLoansNotification(notification)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error processing notification: ${notification.name}", e)
                        }
                    }

                    notificationObserver?.let { observer ->
                        NotificationCenter.addObserver(observer)
                        Log.d(TAG, "Successfully started listening for notifications")
                        promise?.resolve("Started listening successfully")
                    }
                        ?: run {
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
                    } ?: run { promise.resolve("No observer to remove") }
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

    private fun processScLoansNotification(notification: Notification) {
        try {
            val jsonString =
                notification.userInfo?.get(ScLoanNotification.STRINGIFIED_PAYLOAD_KEY) as? String
            if (jsonString == null) {
                Log.e(
                    TAG,
                    "SCLoansBridgeEmitter: Invalid notification object - expected JSON string"
                )
                return
            }

            sendEvent(ScLoan.SCLOANS_NOTIFICATION_NAME, jsonString)
        } catch (e: Exception) {
            Log.e(TAG, "Error processing SCLoans notification", e)
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
}
