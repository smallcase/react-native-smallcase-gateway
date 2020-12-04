import SmallcaseGateway from "./src/SmallcaseGateway";
import { ENV, TRANSACTION_TYPE, ERROR_MSG } from "./src/constants";

export default { ...SmallcaseGateway, ENV, ERROR_MSG, TRANSACTION_TYPE };
