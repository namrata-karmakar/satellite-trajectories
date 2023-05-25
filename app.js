const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const mongoose = require('mongoose');

const app = express();
dotenv.config();
app.listen(process.env.SERVER_PORT, ()=>console.log(`listening at port ${process.env.SERVER_PORT}`));

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    
}));

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection error:'));
  db.once('open', () => {
    console.log('Connected to MongoDB');
  });

module.exports = app;