const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');

const { SERVICE_URL, auth } = require('../utils/sapConfig');

router.post('/', async (req, res) => {
  const { I_KUNNR, I_PASSWORD } = req.body;

  if (!I_KUNNR || !I_PASSWORD) {
    return res.status(400).json({ error: 'Missing required fields: I_KUNNR and I_PASSWORD' });
  }

  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:ZFM_AUTH_CP_PB>
          <I_KUNNR>${I_KUNNR}</I_KUNNR>
          <I_PASSWORD>${I_PASSWORD}</I_PASSWORD>
        </urn:ZFM_AUTH_CP_PB>
      </soapenv:Body>
    </soapenv:Envelope>`;

  try {
    const response = await axios.post(SERVICE_URL, xmlBody, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZWS_USER_AUTH4'
      }
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing response' });

      try {
        const eStatus = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZFM_AUTH_CP_PBResponse'][0].E_STATUS[0];
        if (eStatus === 'Yes') {
          res.json({ success: true, message: 'Authentication successful' });
        } else {
          res.json({ success: false, message: 'Authentication failed' });
        }
      } catch (e) {
        res.status(500).json({ success: false, message: 'Error processing response' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SOAP request failed', message: err.message });
  }
});

module.exports = router;
