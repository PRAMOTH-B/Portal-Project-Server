const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');


router.post('/', async (req, res) => {
  const { VendorId, Password } = req.body;

  if (!VendorId || !Password) {
    return res.status(400).json({ error: 'Missing VendorId or Password' });
  }

  const requestBody = {
    "VendorId": VendorId,
    "Password": Password
  };

  try {
    const response = await axios.post(
      'http://azktlds5cp.kcloud.com:8000/sap/opu/odata/sap/ZPB_VENDOR_SRV/LoginAuthSet',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'X',
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const sapResponse = response.data.d;

    if (sapResponse && sapResponse.Status === 'valid') {
      res.json({ 
        success: true, 
        message: 'Vendor authenticated successfully', 
        data: sapResponse 
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication failed', 
        data: sapResponse 
      });
    }

  } catch (err) {
    res.status(500).json({ 
      error: 'SAP OData request failed', 
      message: err.message 
    });
  }
});

module.exports = router; 