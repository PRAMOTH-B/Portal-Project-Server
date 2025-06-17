const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:54809'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With']
}));


// Routes
app.use('/auth', require('./Customer routes/auth'));
app.use('/sales-orders', require('./Customer routes/salesOrders'));
app.use('/customer-profile', require('./Customer routes/customerProfile'));
app.use('/inquiries', require('./Customer routes/inquiries'));
app.use('/deliveries', require('./Customer routes/deliveries'));
app.use('/payments', require('./Customer routes/payments'));
app.use('/customer-memos', require('./Customer routes/memos'));
app.use('/invoices', require('./Customer routes/invoices'));
app.use('/vendor', require('./Vendor routes/vendor'));
app.use('/vendor-rfq', require('./Vendor routes/rfq'));
app.use('/vendor-po', require('./Vendor routes/po'));
app.use('/vendor-gr', require('./Vendor routes/gr'));
app.use('/vendor-profile', require('./Vendor routes/profile'));
app.use('/vendor-pdf', require('./Vendor routes/vendorpdf'));
app.use('/vendor-invoices', require('./Vendor routes/vendorinvoices'));
app.use('/vendor-cd', require('./Vendor routes/vendorcd'));
app.use('/vendor-pa', require('./Vendor routes/vendorpa'));
app.use('/employee-auth', require('./Employee routes/employeeAuth'));
app.use('/employee-profile', require('./Employee routes/employeeProfile'));
app.use('/employee-leave', require('./Employee routes/employeeLeave'));
app.use('/employee-pay', require('./Employee routes/employeePay'));
app.use('/maint-login', require('./Maintenance Routes/maintLogin'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
