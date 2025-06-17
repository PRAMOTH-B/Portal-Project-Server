// routes/customerProfile.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const { auth } = require('../utils/sapConfig');

router.post('/', async (req, res) => {
  const { I_KUNNR } = req.body;
  if (!I_KUNNR) return res.status(400).json({ error: 'Missing I_KUNNR' });

  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">
    <soapenv:Header/>
    <soapenv:Body>
      <urn:Z_GET_CUSTOMER_PROFILE>
        <I_KUNNR>${I_KUNNR}</I_KUNNR>
        <ES_CUSTOMER_PROFILE></ES_CUSTOMER_PROFILE>
      </urn:Z_GET_CUSTOMER_PROFILE>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post('http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_customer_profile?sap-client=100', xmlBody, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZWS_CUSTOMER_PROFILE'
      }
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      try {
        const item = result['soap-env:Envelope']['soap-env:Body'][0]['n0:Z_GET_CUSTOMER_PROFILEResponse'][0].ES_CUSTOMER_PROFILE[0].item[0];
        const formatted = {
          customerNumber: item.KUNNR?.[0], name1: item.NAME1?.[0], name2: item.NAME2?.[0],
          city: item.ORT01?.[0], region: item.REGIO?.[0], country: item.LAND1?.[0],
          postalCode: item.PSTLZ?.[0], street: item.STRAS?.[0], telephone1: item.TELF1?.[0],
          fax: item.TELFX?.[0], accountGroup: item.KTOKD?.[0], languageKey: item.SPRAS?.[0],
          email: item.AD_SMTPADR?.[0]
        };
        res.json({ success: true, message: 'Customer profile retrieved', data: formatted });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing data' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SOAP request failed', message: err.message });
  }
});

module.exports = router;