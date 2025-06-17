// routes/deliveries.js
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
      <urn:ZPB_GET_DELIVERIES>
        <I_KUNNR>${I_KUNNR}</I_KUNNR>
        <ET_DELIVERIES></ET_DELIVERIES>
      </urn:ZPB_GET_DELIVERIES>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post('http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_deliveries_pb?sap-client=100', xmlBody, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZWS_DELIVERIES_PB'
      }
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      try {
        const items = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZPB_GET_DELIVERIESResponse'][0].ET_DELIVERIES[0].item;
        const formatted = items.map(d => ({
          deliveryNumber: d.VBELN?.[0], createdOn: d.ERDAT?.[0], customerNumber: d.KUNNR?.[0],
          deliveryType: d.LFART?.[0], actualDeliveryDate: d.WADAT_IST?.[0], itemNumber: d.POSNR?.[0],
          materialNumber: d.MATNR?.[0], materialDescription: d.ARKTX?.[0], deliveredQuantity: d.LFIMG?.[0],
          salesUnit: d.VRKME?.[0], status: d.STATUS?.[0]
        }));
        res.json({ success: true, message: 'Deliveries retrieved', data: formatted });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing data' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SOAP request failed', message: err.message });
  }
});

module.exports = router;
