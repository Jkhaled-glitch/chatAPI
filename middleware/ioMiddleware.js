// middleware/ioMiddleware.js

const addIoToRequest = (io) => (req, res, next) => {
    req.io = io;
    next();
  };
  
  module.exports = addIoToRequest;
  