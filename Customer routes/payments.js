// routes/payments.js
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
      <urn:ZPB_GET_PAYMENTS_AGING>
        <I_KUNNR>${I_KUNNR}</I_KUNNR>
        <ET_PAYMENTS_AGING></ET_PAYMENTS_AGING>
      </urn:ZPB_GET_PAYMENTS_AGING>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post('http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_payments_pb?sap-client=100', xmlBody, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZWS_PAYMENTS_PB'
      }
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      try {
        const items = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZPB_GET_PAYMENTS_AGINGResponse'][0].ET_PAYMENTS_AGING[0].item;
        const formatted = items.map(p => ({
          documentNumber: p.VBELN?.[0], billingBlock: p.FAKSK?.[0], paymentBlock: p.FAKSP?.[0],
          billingDate: p.FKDAT?.[0], dueDate: p.DUE_DATE?.[0], netValue: p.NETWR?.[0],
          currency: p.WAERK?.[0], agingDays: p.AGING_DAYS?.[0], agingBucket: p.AGING_BUCKET?.[0],
          status: p.STATUS?.[0]
        }));
        res.json({ success: true, message: 'Payments aging retrieved', data: formatted });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing data' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SOAP request failed', message: err.message });
  }
});

module.exports = router;
