const multer = require('multer');

const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'text/plain' ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('File type not Supported'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

const uploadfileMiddleware = upload.single('file');

module.exports = uploadfileMiddleware ;
