// routes/memos.js
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
      <urn:ZPB_GET_CREDIT_DEBIT_MEMOS>
        <I_KUNNR>${I_KUNNR}</I_KUNNR>
        <ET_MEMOS></ET_MEMOS>
      </urn:ZPB_GET_CREDIT_DEBIT_MEMOS>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post('http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_credit_debit_memo?sap-client=100', xmlBody, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZWS_CREDIT_DEBIT_MEMO'
      }
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      try {
        const items = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZPB_GET_CREDIT_DEBIT_MEMOSResponse'][0].ET_MEMOS[0].item;
        const formatted = items.map(m => ({
          documentNumber: m.VBELN?.[0], billingDate: m.FKDAT?.[0], netValue: m.NETWR?.[0],
          currency: m.WAERK?.[0], billingType: m.FKART?.[0], memoType: m.MEMO_TYPE?.[0]
        }));
        res.json({ success: true, message: 'Credit/Debit memos retrieved', data: formatted });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing data' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SOAP request failed', message: err.message });
  }
});

module.exports = router;
