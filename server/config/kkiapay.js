import kkiapayPkg from "@kkiapay-org/nodejs-sdk";
import dotenv from "dotenv";

dotenv.config();

const kkiapay = kkiapayPkg.default || kkiapayPkg;

const k = kkiapay({
  privatekey: process.env.KKIAPAY_PRIVATE_KEY,
  publickey: process.env.KKIAPAY_PUBLIC_KEY,
  secretkey: process.env.KKIAPAY_SECRET_KEY,
  sandbox: true,
});

export default k;