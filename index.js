const path = require('path');
const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const cors = require('cors');
const bodyParser = require('body-parser');
const { protect } = require('./middleware/authMiddleware')
const port = process.env.PORT
const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.use('/users', require('./routes/userRoutes'));
app.use('/conversations',protect, require('./routes/conversationRoutes'))
app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));
