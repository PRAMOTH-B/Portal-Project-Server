const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const { auth } = require('../utils/sapConfig');

// routes/invoices.js
router.post('/', async (req, res) => {
  const { customerNumber } = req.body;
  if (!customerNumber) return res.status(400).json({ error: 'Missing customer number' });

  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">
    <soapenv:Header/>
    <soapenv:Body>
      <urn:ZFM_GET_INVOICE_DATA>
        <IV_KUNNR>${customerNumber}</IV_KUNNR>
        <ET_INVOICE></ET_INVOICE>
      </urn:ZFM_GET_INVOICE_DATA>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post('http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_get_invoice_data_pb?sap-client=100', xmlBody, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZFM_GET_INVOICE_DATA'
      }
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      try {
        const items = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZFM_GET_INVOICE_DATAResponse'][0].ET_INVOICE[0].item;
        const formatted = items.map(invoice => ({
          invoiceNumber: invoice.VBELN[0],
          billingStatus: invoice.FAKSK[0],
          billingDate: invoice.FKDAT[0],
          customerNumber: invoice.KUNAG[0],
          netValue: invoice.NETWR[0],
          currency: invoice.WAERK[0],
          materialNumber: invoice.MATNR[0],
          materialDescription: invoice.ARKTX[0],
          quantity: invoice.FKIMG[0],
          unit: invoice.VRKME[0]
        }));
        res.json({ success: true, message: 'Invoices retrieved', data: formatted });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing data' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SOAP request failed', message: err.message });
  }
});

// New route for generating invoice PDF
router.post('/pdf', async (req, res) => {
  const { customerNumber, invoiceNumber } = req.body;
  
  if (!customerNumber || !invoiceNumber) {
    return res.status(400).json({ error: 'Missing customer number or invoice number' });
  }

  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">
    <soapenv:Header/>
    <soapenv:Body>
      <urn:ZFM_GET_INVOICE_PDF_PB>
        <P_KUNAG>${customerNumber}</P_KUNAG>
        <P_VBELN>${invoiceNumber}</P_VBELN>
      </urn:ZFM_GET_INVOICE_PDF_PB>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_invoice_pdf_generate_pb?sap-client=100',
      xmlBody,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZFM_GET_INVOICE_PDF_PB'
        }
      }
    );

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      
      try {
        const pdfBase64 = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZFM_GET_INVOICE_PDF_PBResponse'][0].EV_PDF[0];
        
        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        
        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=invoice_${invoiceNumber}.pdf`);
        
        // Send the PDF
        res.send(pdfBuffer);
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing PDF data' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SOAP request failed', message: err.message });
  }
});

module.exports = router; 