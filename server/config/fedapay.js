import { FedaPay } from "fedapay";
import dotenv from "dotenv";

dotenv.config();

FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_ENVIRONMENT || "sandbox");

export default FedaPay;