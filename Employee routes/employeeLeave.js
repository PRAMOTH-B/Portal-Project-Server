const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const { auth } = require('../utils/sapConfig');

// Route for employee leave data
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
            <urn:ZFM_EMPLOYEE_LEAVE_PB>
                <IV_PERNR>${employeeNumber}</IV_PERNR>
                <ET_LEAVE></ET_LEAVE>
            </urn:ZFM_EMPLOYEE_LEAVE_PB>
        </soapenv:Body>
    </soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_emp_leave_pb?sap-client=100',
      soapBody,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZFM_EMPLOYEE_LEAVE_PB'
        }
      }
    );

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      
      try {
        const items = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZFM_EMPLOYEE_LEAVE_PBResponse'][0].ET_LEAVE[0].item;
        const formatted = items.map(leave => ({
          employeeNumber: leave.PERNR?.[0],
          leaveType: leave.SUBTY?.[0],
          endDate: leave.ENDDA?.[0],
          startDate: leave.BEGDA?.[0],
          sequenceNumber: leave.SEQNR?.[0],
          changedOn: leave.AEDTM?.[0],
          changedBy: leave.UNAME?.[0],
          startTime: leave.BEGUZ?.[0],
          endTime: leave.ENDUZ?.[0],
          leaveCode: leave.AWART?.[0],
          leaveDays: leave.ABWTG?.[0],
          standardDays: leave.STDAZ?.[0],
          allDay: leave.ALLDF?.[0],
          calendarDays: leave.KALTG?.[0]
        }));

        res.json({ 
          success: true, 
          message: 'Leave data retrieved', 
          data: formatted 
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          message: 'Error processing leave data' 
        });
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving employee leave data',
      error: err.message 
    });
  }
});

module.exports = router; 