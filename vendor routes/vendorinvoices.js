const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');

// Route for vendor invoice details
router.post('/', async (req, res) => {
  const { vendorNumber } = req.body;
  
  if (!vendorNumber) {
    return res.status(400).json({ error: 'Missing vendor number' });
  }

  try {
    const response = await axios.get(
      `http://azktlds5cp.kcloud.com:8000/sap/opu/odata/sap/ZPB_VENDOR_INVOICE_SRV/VendorInvoiceDetailsSet?$filter=Lifnr eq '${vendorNumber}'`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Check if we have results
    if (response.data.d && response.data.d.results && response.data.d.results.length > 0) {
      const invoices = response.data.d.results.map(invoice => ({
        documentNumber: invoice.Belnr,
        fiscalYear: invoice.Gjahr,
        companyCode: invoice.Bukrs,
        documentDate: new Date(parseInt(invoice.Bldat.replace('/Date(', '').replace(')/', ''))).toISOString(),
        postingDate: new Date(parseInt(invoice.Budat.replace('/Date(', '').replace(')/', ''))).toISOString(),
        referenceNumber: invoice.Xblnr,
        currency: invoice.Waers,
        vendorNumber: invoice.Lifnr,
        headerText: invoice.Sgtxt,
        createdBy: invoice.Ernam,
        purchaseOrder: invoice.Ebeln,
        purchaseOrderItem: invoice.Ebelp,
        materialNumber: invoice.Matnr,
        unit: invoice.Meins,
        plant: invoice.Werks,
        storageLocation: invoice.Lgort
      }));

      res.json({ 
        success: true, 
        message: 'Vendor invoices retrieved successfully',
        data: invoices 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'No invoices found for the given vendor number' 
      });
    }
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving vendor invoices',
      error: err.message 
    });
  }
});

module.exports = router; 