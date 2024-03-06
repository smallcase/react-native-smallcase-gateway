export default ScLoan;
export type ScLoanConfig = {
    gatewayName: string;
    /**
     * - environment
     */
    environment: 'production' | 'staging' | 'development';
};
export type ScLoanInfo = {
    interactionToken: string;
};
export type ScLoanSuccess = {
    isSuccess: boolean;
    data: string;
};
export type ScLoanError = {
    isSuccess: boolean;
    code: number;
    message: string;
    data: string;
};
declare namespace ScLoan {
    export { setup };
    export { apply };
    export { pay };
    export { withdraw };
    export { service };
}
/**
 * @typedef {Object} ScLoanConfig
 * @property {String} gatewayName
 * @property {'production' | 'staging' | 'development'}  environment - environment
 *
 * @typedef {Object} ScLoanInfo
 * @property {String} interactionToken
 *
 * @typedef {Object} ScLoanSuccess
 * @property {boolean} isSuccess
 * @property {string} data
 *
 * @typedef {Object} ScLoanError
 * @property {boolean} isSuccess
 * @property {number} code
 * @property {string} message
 * @property {string} data
 */
/**
 * Setup ScLoans
 *
 * @param {ScLoanConfig} config
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 */
declare function setup(config: ScLoanConfig): Promise<ScLoanSuccess>;
/**
 * Triggers the LOS Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 */
declare function apply(loanInfo: ScLoanInfo): Promise<ScLoanSuccess>;
/**
 * Triggers the Repayment Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 */
declare function pay(loanInfo: ScLoanInfo): Promise<ScLoanSuccess>;
/**
 * Triggers the Withdraw Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 */
declare function withdraw(loanInfo: ScLoanInfo): Promise<ScLoanSuccess>;
/**
 * Triggers the Servicing Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 */
declare function service(loanInfo: ScLoanInfo): Promise<ScLoanSuccess>;
