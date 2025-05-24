// routes/salesOrders.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const { auth } = require('../utils/sapConfig');

router.post('/', async (req, res) => {
  const { IV_KUNNR } = req.body;
  if (!IV_KUNNR) return res.status(400).json({ error: 'Missing IV_KUNNR' });

  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">
    <soapenv:Header/>
    <soapenv:Body>
      <urn:ZPB_GET_SALES_ORDER>
        <IV_KUNNR>${IV_KUNNR}</IV_KUNNR>
        <ET_SALES_ORDERS></ET_SALES_ORDERS>
      </urn:ZPB_GET_SALES_ORDER>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post('http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_sales_order_pb?sap-client=100', xmlBody, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZPB_GET_SALES_ORDER'
      }
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      try {
        const items = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZPB_GET_SALES_ORDERResponse'][0].ET_SALES_ORDERS[0].item;
        const formatted = items.map(order => ({
          orderNumber: order.VBELN[0], orderDate: order.ERDAT[0], netValue: order.NETWR[0],
          currency: order.WAERK[0], orderType: order.AUART[0], salesOrg: order.VKORG[0],
          distributionChannel: order.VTWEG[0], division: order.SPART[0], customerNumber: order.KUNNR[0],
          itemNumber: order.POSNR[0], materialNumber: order.MATNR[0], materialDescription: order.ARKTX[0],
          targetQuantity: order.KWMENG[0], deliveryDate: order.EDATU[0], confirmedQuantity: order.KBMENG[0],
          salesUnit: order.VRKME[0], baseUnit: order.ZMEINS[0]
        }));
        res.json({ success: true, message: 'Sales orders retrieved', data: formatted });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing data' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SOAP request failed', message: err.message });
  }
});

module.exports = router;