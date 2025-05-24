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

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
