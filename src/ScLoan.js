import { NativeModules } from 'react-native';
import { safeObject } from './util';

const { SmallcaseGateway: SmallcaseGatewayNative } = NativeModules;

/**
 * @typedef {Object} ScLoanConfig
 * @property {String} gatewayName
 * 
 * @typedef {Object} LoanInfo
 * @property {String} interactionToken
 */

/**
 * Triggers the Repayment Journey
 *
 * @param {ScGatewayConfig} config
 * @returns {Promise<String>}
 */
const setup = async (config) => {
    const safeConfig = safeObject(config);
  
    return SmallcaseGatewayNative.setupLoans(safeConfig);
  };

/**
 * Triggers the LOS Journey
 *
 * @param {LoanInfo} loanInfo
 * @returns {Promise<String>}
 */
const apply = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
  
    return SmallcaseGatewayNative.apply(safeLoanInfo);
  };

/**
 * Triggers the Repayment Journey
 *
 * @param {LoanInfo} loanInfo
 * @returns {Promise<String>}
 */
const pay = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
  
    return SmallcaseGatewayNative.pay(safeLoanInfo);
  };

const ScLoan = {
    setup,
    apply,
    pay
}

export default ScLoan;
