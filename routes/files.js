const express = require('express');
const router = express.Router();
const {
  uploadFile,
  getFile,
  downloadFile,
  sendFile
} = require('../controllers/fileController');

router.post('/upload', uploadFile);
router.get('/:uuid', getFile);
router.get('/download/:uuid', downloadFile);
router.post('/send', sendFile);

module.exports = router;
