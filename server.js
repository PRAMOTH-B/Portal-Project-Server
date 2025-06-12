const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/sales-orders', require('./routes/salesOrders'));
app.use('/customer-profile', require('./routes/customerProfile'));
app.use('/inquiries', require('./routes/inquiries'));
app.use('/deliveries', require('./routes/deliveries'));
app.use('/payments', require('./routes/payments'));
app.use('/customer-memos', require('./routes/memos'));
app.use('/invoices', require('./routes/invoices'));
app.use('/vendor', require('./vendor routes/vendor'));
app.use('/vendor-rfq', require('./vendor routes/rfq'));
app.use('/vendor-po', require('./vendor routes/po'));
app.use('/vendor-gr', require('./vendor routes/gr'));
app.use('/vendor-profile', require('./vendor routes/profile'));
app.use('/vendor-pdf', require('./vendor routes/vendorpdf'));
app.use('/vendor-invoices', require('./vendor routes/vendorinvoices'));
app.use('/vendor-cd', require('./vendor routes/vendorcd'));
app.use('/vendor-pa', require('./vendor routes/vendorpa'));
app.use('/employee-auth', require('./Employee routes/employeeAuth'));
app.use('/employee-profile', require('./Employee routes/employeeProfile'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
