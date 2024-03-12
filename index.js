const path = require('path');
const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const cors = require('cors');
const bodyParser = require('body-parser');
const { protect } = require('./middleware/authMiddleware');
const http = require('http');
const socketIo = require('socket.io');
const {handleConnection} = require('./config/handleRealTimeChat')
const addIoToRequest = require('./middleware/ioMiddleware')

const port = process.env.PORT;

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*'
  }
});  

io.on('connection', (socket)=>handleConnection(socket,io));




connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


app.use('/users', require('./routes/userRoutes'));
app.use('/conversations', protect,addIoToRequest(io), require('./routes/conversationRoutes'));

app.use(errorHandler);


server.listen(port, () => console.log(`HTTP Server started on port ${port}`));


