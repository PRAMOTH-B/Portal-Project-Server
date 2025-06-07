const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');

// Route for vendor invoice PDF
router.post('/', async (req, res) => {
  const { vendorNumber, documentNumber } = req.body;
  
  if (!vendorNumber || !documentNumber) {
    return res.status(400).json({ error: 'Missing vendor number or document number' });
  }

  try {
    const response = await axios.get(
      `http://azktlds5cp.kcloud.com:8000/sap/opu/odata/sap/ZPB_VENDOR_INVOICE_SRV/VendorInvoicePDFSet?$filter=Lifnr eq '${vendorNumber}' and Belnr eq '${documentNumber}'`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'X'
        }
      }
    );

    // Check if we have results
    if (response.data.d && response.data.d.results && response.data.d.results.length > 0) {
      const pdfBase64 = response.data.d.results[0].Pdfbase64;
      
      // Convert base64 to buffer
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      
      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=vendor_invoice_${documentNumber}.pdf`);
      
      // Send the PDF
      res.send(pdfBuffer);
    } else {
      res.status(404).json({ success: false, message: 'No invoice found for the given vendor and document number' });
    }
  } catch (err) {
    // Handle XML error response
    if (err.response && err.response.data && typeof err.response.data === 'string' && err.response.data.includes('<?xml')) {
      res.status(404).json({ 
        success: false, 
        message: 'No invoice header found for this Vendor and Invoice number'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving vendor invoice PDF',
        error: err.message 
      });
    }
  }
});

module.exports = router; 