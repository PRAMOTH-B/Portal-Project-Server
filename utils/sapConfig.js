const dotenv = require('dotenv');
dotenv.config();

const SERVICE_URL = process.env.SAP_SERVICE_URL;
const SAP_USER = process.env.SAP_USER;
const SAP_PASS = process.env.SAP_PASS;

const auth = Buffer.from(`${SAP_USER}:${SAP_PASS}`).toString('base64');

module.exports = { SERVICE_URL, auth };
