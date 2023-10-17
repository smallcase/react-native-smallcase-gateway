import { NativeModules } from 'react-native';
import { safeObject } from './util';
import { ENV } from './constants';

const { SmallcaseGateway: SmallcaseGatewayNative } = NativeModules;

/**
 * @typedef {Object} ScLoanConfig
 * @property {String} gatewayName
 * @property {'production' | 'staging' | 'development'}  environment - environment
 *
 * @typedef {Object} ScLoanInfo
 * @property {String} interactionToken
 */

/**
 * Setup ScLoans
 *
 * @param {ScLoanConfig} config
 * @returns {Promise<String>}
 */
const setup = async (config) => {
    const safeConfig = safeObject(config);
    if(safeConfig.environment === undefined || safeConfig.environment === null) safeConfig.environment = ENV.PROD

    return SmallcaseGatewayNative.setupLoans(safeConfig);
  };

/**
 * Triggers the LOS Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<String>}
 */
const apply = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);

    return SmallcaseGatewayNative.apply(safeLoanInfo);
  };

/**
 * Triggers the Repayment Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<String>}
 */
const pay = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);

    return SmallcaseGatewayNative.pay(safeLoanInfo);
  };

/**
 * Triggers the Withdraw Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<String>}
 */
const withdraw = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);

    return SmallcaseGatewayNative.withdraw(safeLoanInfo);
  };

/**
 * Triggers the Servicing Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<String>}
 */
const service = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);

    return SmallcaseGatewayNative.service(safeLoanInfo);
  };

const ScLoan = {
    setup,
    apply,
    pay,
    withdraw,
    service
}

export default ScLoan;
