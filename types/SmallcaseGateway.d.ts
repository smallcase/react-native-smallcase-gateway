export default SmallcaseGateway;
export type envConfig = {
    /**
     * - unique name on consumer
     */
    gatewayName: string;
    /**
     * - leprechaun mode toggle
     */
    isLeprechaun: boolean;
    /**
     * - support AMO (subject to broker support)
     */
    isAmoEnabled: boolean;
    /**
     * - list of broker names
     */
    brokerList: Array<string>;
    /**
     * - environment name
     */
    environmentName: 'production' | 'staging' | 'development';
};
export type transactionRes = {
    /**
     * - response data
     */
    data: string;
    /**
     * - success flag
     */
    success: boolean;
    /**
     * - error code
     */
    errorCode?: number;
    /**
     * - transaction name
     */
    transaction: string;
};
export type userDetails = {
    /**
     * - name of user
     */
    name: string;
    /**
     * - email of user
     */
    email: string;
    /**
     * - contact of user
     */
    contact: string;
    /**
     * - pin-code of user
     */
    pinCode: string;
};
export type SmallplugUiConfig = {
    /**
     * - color of the header background
     */
    headerColor: string;
    /**
     * - opacity of the header background
     */
    headerOpacity: number;
    /**
     * - color of the back icon
     */
    backIconColor: string;
    /**
     * - opacity of the back icon
     */
    backIconOpacity: number;
};
declare namespace SmallcaseGateway {
    export { init };
    export { logoutUser };
    export { triggerLeadGen };
    export { triggerLeadGenWithStatus };
    export { triggerLeadGenWithLoginCta };
    export { archiveSmallcase };
    export { triggerTransaction };
    export { triggerMfTransaction };
    export { setConfigEnvironment };
    export { launchSmallplug };
    export { launchSmallplugWithBranding };
    export { getSdkVersion };
    export { showOrders };
}
/**
 * initialize sdk with a session
 *
 * note: this must be called after `setConfigEnvironment()`
 * @param {string} sdkToken
 */
declare function init(sdkToken: string): unknown;
/**
 * Logs the user out and removes the web session.
 *
 * This promise will be rejected if logout was unsuccessful
 *
 * @returns {Promise}
 */
declare function logoutUser(): Promise;
/**
 * triggers the lead gen flow
 *
 * @param {userDetails} [userDetails]
 * @param {Object} [utmParams]
 */
declare function triggerLeadGen(userDetails?: userDetails, utmParams?: any): any;
/**
 * triggers the lead gen flow
 *
 * @param {userDetails} [userDetails]
 * * @returns {Promise}
 */
declare function triggerLeadGenWithStatus(userDetails?: userDetails): Promise;
/**
 * triggers the lead gen flow with an option of "login here" cta
 *
 * @param {userDetails} [userDetails]
 * @param {Object} [utmParams]
 * @param {boolean} [showLoginCta]
 * @returns {Promise}
 */
declare function triggerLeadGenWithLoginCta(userDetails?: userDetails, utmParams?: any, showLoginCta?: boolean): Promise;
/**
 * Marks a smallcase as archived
 *
 * @param {String} iscid
 */
declare function archiveSmallcase(iscid: string): unknown;
/**
 * triggers a transaction with a transaction id
 *
 * @param {string} transactionId
 * @param {Object} [utmParams]
 * @param {Array<string>} [brokerList]
 * @returns {Promise<transactionRes>}
 */
declare function triggerTransaction(transactionId: string, utmParams?: any, brokerList?: Array<string>): Promise<transactionRes>;
/**
 * triggers a transaction with a transaction id
 *
 * @param {string} transactionId
 * @returns {Promise<transactionRes>}
 */
declare function triggerMfTransaction(transactionId: string): Promise<transactionRes>;
/**
 * configure the sdk with
 * @param {envConfig} envConfig
 */
declare function setConfigEnvironment(envConfig: envConfig): any;
/**
 * launches smallcases module
 *
 * @param {string} targetEndpoint
 * @param {string} params
 */
declare function launchSmallplug(targetEndpoint: string, params: string): unknown;
/**
 * launches smallcases module
 *
 * @param {string} targetEndpoint
 * @param {string} params
 * @param {string} headerColor
 * @param {number} headerOpacity
 * @param {string} backIconColor
 * @param {number} backIconOpacity
 */
declare function launchSmallplugWithBranding(targetEndpoint: string, params: string, headerColor: string, headerOpacity: number, backIconColor: string, backIconOpacity: number): unknown;
/**
 * Returns the native android/ios and react-native sdk version
 * (internal-tracking)
 * @returns {Promise}
 */
declare function getSdkVersion(): Promise;
/**
 * This will display a list of all the orders that a user recently placed.
 * This includes pending, successful, and failed orders.
 * @returns
 */
declare function showOrders(): unknown;
