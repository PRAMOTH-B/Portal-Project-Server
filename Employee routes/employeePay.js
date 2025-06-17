const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const { auth } = require('../utils/sapConfig');

// Route for employee pay slip data
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
            <urn:ZFM_EMPLOYEE_PAY_SLIP_PB>
                <IV_PERNR>${employeeNumber}</IV_PERNR>
            </urn:ZFM_EMPLOYEE_PAY_SLIP_PB>
        </soapenv:Body>
    </soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zws_emp_pay_pb?sap-client=100',
      soapBody,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZFM_EMPLOYEE_PAY_SLIP_PB'
        }
      }
    );

    xml2js.parseString(response.data, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error parsing XML' });
      
      try {
        const items = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZFM_EMPLOYEE_PAY_SLIP_PBResponse'][0].ET_DETAILS[0].item;
        const pdfBase64 = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZFM_EMPLOYEE_PAY_SLIP_PBResponse'][0].EV_PDF_BASE64[0];
        const pdfOutput = result['soap-env:Envelope']['soap-env:Body'][0]['n0:ZFM_EMPLOYEE_PAY_SLIP_PBResponse'][0].EV_PDF_OUTPUT[0];

        const formatted = items.map(pay => ({
          employeeId: pay.EMPLOYEE_ID?.[0],
          name: pay.NAME?.[0],
          designation: pay.DESIGNATION?.[0],
          orgUnit: pay.ORG_UNIT?.[0],
          personnelArea: pay.PERSONNEL_AREA?.[0],
          personnelSubArea: pay.PERSONNEL_SUB_AREA?.[0],
          employeeGroup: pay.EMPLOYEE_GROUP?.[0],
          companyCode: pay.COMPANY_CODE?.[0],
          payrollYear: pay.PAYROLL_YEAR?.[0],
          payrollMonth: pay.PAYROLL_MONTH?.[0],
          wageTypeCode: pay.WAGE_TYPE_CODE?.[0],
          wageTypeAmount: pay.WAGE_TYPE_AMT?.[0],
          wageTypeCurrency: pay.WAGE_TYPE_CURR?.[0],
          wageTypeText: pay.WAGE_TYPE_TEXT?.[0],
          costCenter: pay.COST_CENTER?.[0],
          bankKey: pay.BANK_KEY?.[0],
          bankAccountNumber: pay.BANK_ACC_NO?.[0],
          wageTypeCoded: pay.WAGE_TYPE_CODED?.[0],
          wageTypeAmountD: pay.WAGE_TYPE_AMTD?.[0],
          wageTypeTextId: pay.WAGE_TYPE_TEXTID?.[0]
        }));

        res.json({ 
          success: true, 
          message: 'Pay slip data retrieved', 
          data: {
            details: formatted,
            pdfBase64: pdfBase64,
            pdfOutput: pdfOutput
          }
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          message: 'Error processing pay slip data' 
        });
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving employee pay slip data',
      error: err.message 
    });
  }
});

module.exports = router; 