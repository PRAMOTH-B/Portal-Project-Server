const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');

// Route for vendor payment advice data
router.post('/', async (req, res) => {
  const { vendorNumber } = req.body;
  
  if (!vendorNumber) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing vendor number' 
    });
  }

  try {
    const response = await axios.get(
      `http://azktlds5cp.kcloud.com:8000/sap/opu/odata/sap/ZPB_VENDOR_PA_SRV/VendorPASet?$filter=Lifnr eq '${vendorNumber}'`,
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
    if (response.data.d && response.data.d.results) {
      res.json({
        success: true,
        data: response.data
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'No payment advice data found for the given vendor number' 
      });
    }
  } catch (err) {
    // Handle XML error response
    if (err.response && err.response.data && typeof err.response.data === 'string' && err.response.data.includes('<?xml')) {
      res.status(404).json({ 
        success: false, 
        message: 'No payment advice data found for this vendor number'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving vendor payment advice data',
        error: err.message 
      });
    }
  }
});

module.exports = router; 