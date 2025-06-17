const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');

// Route for maintenance login
router.post('/', async (req, res) => {
  const { Pernr, Password } = req.body;
  const requestBody = {
    "Pernr": Pernr,
    "Password": Password
  };
  
  if (!Pernr || !Password) {
    return res.status(400).json({
      success: false,
      message: 'Missing personnel number or password'
    });
  }

  try {
    const response = await axios.post(
      `http://azktlds5cp.kcloud.com:8000/sap/opu/odata/sap/ZPB_MAINT_PORTAL_SRV/MaintLoginSet`,
      requestBody,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'X'
        }
      }
    );

    if (response.data && response.data.d) {
      res.json({
        success: true,
        data: response.data.d
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Authentication failed or no data found'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error during maintenance login',
      error: err.message
    });
  }
});

module.exports = router; 