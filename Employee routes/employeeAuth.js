const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');

// Route for employee authentication
router.post('/', async (req, res) => {
  const { employeeNumber, password } = req.body;
  
  if (!employeeNumber || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing employee number or password' 
    });
  }

  // SOAP request body
  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
        <soapenv:Header/>
        <soapenv:Body>
            <urn:ZFM_EMPLOYEE_AUTH_PB>
                <I_PERNR>${employeeNumber}</I_PERNR>
                <I_PASSWORD>${password}</I_PASSWORD>
            </urn:ZFM_EMPLOYEE_AUTH_PB>
        </soapenv:Body>
    </soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_emp_auth_pb?sap-client=100',
      soapBody,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZFM_EMP_AUTH_PB'
        }
      }
    );

    // Parse the XML response
    const responseData = response.data;
    
    // Check if authentication was successful
    if (responseData.includes('<STATUS>YES</STATUS>')) {
      res.json({
        success: true,
        message: 'Authentication successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error during employee authentication',
      error: err.message
    });
  }
});

module.exports = router; 