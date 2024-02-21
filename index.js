const path = require('path');
const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const axios = require('axios');
const cors = require('cors');
const port = process.env.PORT


const { protect } = require('./middleware/authMiddleware')
const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//static folders
app.use('/uploads', express.static('./uploads'))

app.use('/users', require('./routes/userRoutes'));
app.use('/conversations',protect, require('./routes/conversationRoutes'))
app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));
