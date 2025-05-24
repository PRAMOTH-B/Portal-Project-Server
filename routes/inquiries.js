// routes/inquiries.js
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
      <urn:ZPB_GET_INQUIRIES>
        <I_KUNNR>${I_KUNNR}</I_KUNNR>
        <ET_INQUIRIES></ET_INQUIRIES>
      </urn:ZPB_GET_INQUIRIES>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post('http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_inquiries_pb?sap-client=100', xmlBody, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZWS_INQUIRIES_PB'
      }
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      try {
        const items = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZPB_GET_INQUIRIESResponse'][0].ET_INQUIRIES[0].item;
        const formatted = items.map(inq => ({
          inquiryNumber: inq.VBELN?.[0], orderType: inq.AUART?.[0], salesOrg: inq.VKORG?.[0],
          distributionChannel: inq.VTWEG?.[0], division: inq.SPART?.[0], customerNumber: inq.KUNNR?.[0],
          createdOn: inq.ERDAT?.[0], documentDate: inq.AUDAT?.[0], netValue: inq.NETWR?.[0],
          currency: inq.WAERK?.[0], itemNumber: inq.POSNR?.[0], materialNumber: inq.MATNR?.[0],
          materialDescription: inq.ARKTX?.[0], targetQuantity: inq.KWMENG?.[0], salesUnit: inq.VRKME?.[0],
          confirmedQuantity: inq.KBMENG?.[0], itemCount: inq.ITEM_COUNT?.[0], status: inq.STATUS?.[0]
        }));
        res.json({ success: true, message: 'Inquiries retrieved', data: formatted });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing data' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SOAP request failed', message: err.message });
  }
});

module.exports = router;