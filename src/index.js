import SmallcaseGateway from "./SmallcaseGateway";
import ScLoan from "./ScLoan";
import scGatewayEventManager, { SCGatewayEventTypes } from './SCGatewayEventEmitter';
import scLoansEventManager, { SCLoansEventTypes } from './SCLoansEventEmitter';
import { ENV, TRANSACTION_TYPE, ERROR_MSG } from "./constants";

export { ScLoan, scGatewayEventManager as SCGatewayEventManager, scLoansEventManager as SCLoansEventManager, SCGatewayEventTypes, SCLoansEventTypes }
export default { ...SmallcaseGateway, ENV, ERROR_MSG, TRANSACTION_TYPE };
