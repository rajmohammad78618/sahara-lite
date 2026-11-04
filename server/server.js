require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const helpRequestRoutes = require('./routes/helpRequests');
app.use('/api/requests', helpRequestRoutes);

app.get('/', (req, res) => {
  res.send('Sahara Lite API chal rahi hai');
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server port ${PORT} par chal raha hai`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });