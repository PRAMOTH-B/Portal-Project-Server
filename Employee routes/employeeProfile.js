const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');
const xml2js = require('xml2js');

// Route for getting employee profile
router.post('/', async (req, res) => {
  const { employeeNumber } = req.body;
  
  if (!employeeNumber) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing employee number' 
    });
  }

  // SOAP request body
  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
        <soapenv:Header/>
        <soapenv:Body>
            <urn:ZFM_EMPLOYEE_PROFILE_PB>
                <IV_PERNR>${employeeNumber}</IV_PERNR>
                <ET_PROFILE></ET_PROFILE>
            </urn:ZFM_EMPLOYEE_PROFILE_PB>
        </soapenv:Body>
    </soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_emp_profile_pb?sap-client=100',
      soapBody,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZFM_EMPLOYEE_PROFILE_PB'
        }
      }
    );

    // Parse the XML response
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);
    
    // Extract profile data
    const profileData = result['soap-env:Envelope']['soap-env:Body']['n0:ZFM_EMPLOYEE_PROFILE_PBResponse'].ET_PROFILE.item;
    
    // Process gender value
    if (profileData.GENDER) {
      profileData.GENDER = profileData.GENDER === '1' ? 'Male' : 'Female';
    }

    res.json({
      success: true,
      data: profileData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee profile',
      error: err.message
    });
  }
});

module.exports = router; 