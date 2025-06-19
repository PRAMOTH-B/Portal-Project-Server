const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../utils/sapConfig');

// Route for maintenance notifications
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
      `http://azktlds5cp.kcloud.com:8000/sap/opu/odata/sap/ZPB_MAINT_PORTAL_SRV/MaintNotificationSet?$filter=Pernr eq '${pernr}'`,
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
      const notifications = response.data.d.results.map(item => ({
        personnelNumber: item.Pernr,
        notificationNumber: item.Qmnum,
        notificationType: item.Qmart,
        notificationText: item.Qmtxt,
        priorityType: item.Artpr,
        priority: item.Priok,
        enteredBy: item.Ernam,
        changedOn: item.Aedat,
        notifiactionTime: item.Mzeit,
        creationDate: item.Qmdat,
        startDate: item.Strmn,
        startTime: item.Strur,
        endDate: item.Ltrmn,
        endTime: item.Ltrur,
        orderNumber: item.Aufnr,
        objectNumber: item.Objnr,
        malfunctionDate: item.Qmdab,
        malfunctionTime: item.Qmzab,
        breakdownDate: item.Bezdt,
        workCenter: item.Arbpl,
        workCenterPlant: item.Arbplwerk
      }));

      res.json({
        success: true,
        data: notifications
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No maintenance notifications found for the given personnel number'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving maintenance notifications',
      error: err.message
    });
  }
});

module.exports = router; 