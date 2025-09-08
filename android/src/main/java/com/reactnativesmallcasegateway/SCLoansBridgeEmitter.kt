// SCLoansBridgeEmitter.kt
package com.reactnativesmallcasegateway

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.smallcase.loans.core.external.ScLoan
import com.smallcase.loans.core.external.ScLoanNotification
import com.smallcase.loans.data.listeners.Notification
import com.smallcase.loans.data.listeners.NotificationCenter

class SCLoansBridgeEmitter(private val reactContext: ReactApplicationContext):
    ReactContextBaseJavaModule(reactContext) {

        companion object {
            const val TAG = "SCLoansBridgeEmitter"
        }

        private var notificationObserver: ((Notification) -> Unit)? = null

        private val isListening: Boolean
        get() = notificationObserver != null

        init {
            UiThreadUtil.runOnUiThread {
                startListening()
            }
        }

        override fun getName(): String = "SCLoansBridgeEmitter"

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
        fun startListening(promise: Promise ? = null) {
            Log.d(TAG, "startListening called")

            if (isListening) {
                Log.d(TAG, "Already listening to events")
                promise?.resolve("Already listening")
                return
            }

            UiThreadUtil.runOnUiThread {
                Log.d(TAG, "Starting listener on thread: ${Thread.currentThread().name}")

                notificationObserver = { notification ->
                    Log.d(TAG, "Received notification: ${notification.name}")
                    processScLoansNotification(notification)
                }

                notificationObserver?.let { observer ->
                    NotificationCenter.addObserver(observer)
                    Log.d(TAG, "Successfully started listening for notifications")
                    promise?.resolve("Started listening successfully")
                } ?: run {
                    promise?.reject("START_LISTENING_ERROR", "Failed to create observer")
                }
            }
        }

        @ReactMethod
        fun stopListening(promise: Promise) {
            if (!isListening) {
                promise.resolve("Not listening")
                return
            }

            UiThreadUtil.runOnUiThread {
                notificationObserver?.let { observer ->
                    NotificationCenter.removeObserver(observer)
                    notificationObserver = null
                    promise.resolve("Stopped listening successfully")
                } ?: run {
                    promise.resolve("No observer to remove")
                }
            }
        }

        private fun processScLoansNotification(notification: Notification) {
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
        }

        private fun sendEvent(eventName: String, jsonString: String) {
            if (reactContext.hasActiveCatalystInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, jsonString)
            } else {
                Log.w(TAG, "React context not active, cannot send event: $eventName")
            }
        }
    }