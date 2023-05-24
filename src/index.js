import SmallcaseGateway from "./SmallcaseGateway";
import ScLoan from "./ScLoan";
import { ENV, TRANSACTION_TYPE, ERROR_MSG } from "./constants";

export { ScLoan }
export default { ...SmallcaseGateway, ENV, ERROR_MSG, TRANSACTION_TYPE };
