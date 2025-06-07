const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');

// Route for getting vendor Purchase Orders
router.post('/', async (req, res) => {
  const { vendorId } = req.body;

  if (!vendorId) {
    return res.status(400).json({ error: 'Missing vendor ID' });
  }

  try {
    const response = await axios.get(
      `http://azktlds5cp.kcloud.com:8000/sap/opu/odata/sap/ZPB_VENDOR_PO_SRV/VendorPOSet?$filter=Lifnr eq '${vendorId}'`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'X',
          'Authorization': `Basic ${auth}`
        }
      }
    );

    // Send the SAP response data back to the client
    res.json({ 
      success: true, 
      message: 'Purchase Orders retrieved successfully', 
      data: response.data.d.results 
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch Purchase Orders', 
      message: err.message 
    });
  }
});

module.exports = router; 