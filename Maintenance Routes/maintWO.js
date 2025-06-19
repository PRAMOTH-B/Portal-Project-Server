const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');

// Route for maintenance work orders
router.post('/', async (req, res) => {
  const { pernr } = req.body;
  
  if (!pernr) {
    return res.status(400).json({
      success: false,
      message: 'Missing personnel number'
    });
  }

  try {
    const response = await axios.get(
      `http://azktlds5cp.kcloud.com:8000/sap/opu/odata/sap/ZPB_MAINT_PORTAL_SRV/MaintWOSet?$filter=Pernr eq '${pernr}'`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'X'
        }
      }
    );

    if (response.data && response.data.d && response.data.d.results) {
      const workOrders = response.data.d.results.map(item => ({
        personnelNumber: item.Pernr,
        orderNumber: item.Aufnr,
        orderType: item.Auart,
        orderCategory: item.Autyp,
        referenceOrderNumber: item.Refnr,
        enteredBy: item.Ernam,
        createdOn: item.Erdat,
        changedBy: item.Aenam,
        changeDate: item.Aedat,
        description: item.Ktext,
        companyCode: item.Bukrs,
        plant: item.Werks,
        controllingArea: item.Kokrs,
        phaseOrderCreated: item.Phas0,
        phaseOrderReleased: item.Phas1,
        phaseOrderCompleted: item.Phas2,
        phaseOrderClosed: item.Phas3,
        releaseDate: item.Idat1,
        technicalCompletionDate: item.Idat2,
        closeDate: item.Idat3, 
        costCenter: item.Kostl,
        objectNumber: item.Objnr,
        workCenter: item.Vaplz,
        changeTime: item.Aezeit,
        entryTime: item.Erfzeit,
        activityNumberObjectId: item.Arbid,
        confirmationCounter: item.Rmzhl,
        confirmationNumber: item.Rueck,
        actualWorkQuantity: item.Ismnw,
        actualWorkUnit: item.Ismne,
        confirmedStartDateofExecution: item.Isdd,
        confirmedEndDateofExecution: item.Iedd,
        confirmedEndTimeofExecution: item.Iedz,
        confirmedStartTimeofExecution: item.Isdz,
        routingNumberObjectId: item.Aufpl,
        longText: item.Ltxa1
      }));

      res.json({
        success: true,
        data: workOrders
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No maintenance work orders found for the given personnel number'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving maintenance work orders',
      error: err.message
    });
  }
});

module.exports = router; 