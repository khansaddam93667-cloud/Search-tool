const express = require('express');
const cors = require('cors');
require('dotenv').config();

const movieRoutes = require('./routes/movies');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/movies', movieRoutes);

app.get('/', (req, res) => {
  res.send('Movie Rating API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});