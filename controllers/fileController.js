const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/file');
const sendMail = require('../services/mailService');
const path = require('path');

// Multer config
let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

let upload = multer({ storage, limits: { fileSize: 100000000 } }).single('myfile');

// Upload Controller
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const file = new File({
      filename: req.file.filename,
      uuid: uuidv4(),
      path: req.file.path,
      size: req.file.size,
    });

    const response = await file.save();

    res.json({ file: `${process.env.BASE_URL}/files/${response.uuid}` });

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

// Render download page
exports.getFile = async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });
    if (!file) {
      return res.render('download', { error: 'File not found' });
    }

    res.render('download', {
      fileName: file.filename,
      fileSize: file.size,
      downloadLink: `${process.env.BASE_URL}/files/download/${file.uuid}` // ✅ CORRECT
    });
  } catch (err) {
    res.status(500).send('Something went wrong');
  }
};

// Handle download
exports.renderDownloadPage = async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });
    if (!file) {
      return res.render('download', {
        error: 'File not found',
        fileName: null,
        fileSize: null,
        downloadLink: null,
      });
    }

    res.render('download', {
      error: null, // 👈 Ensure this is always defined
      fileName: file.filename,
      fileSize: file.size,
      downloadLink: `/files/download/${file.uuid}`,
    });
  } catch (err) {
    console.error('Render Error:', err);
    res.render('download', {
      error: 'Something went wrong',
      fileName: null,
      fileSize: null,
      downloadLink: null,
    });
  }
};

// Handle File Download
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const filePath = path.resolve(__dirname, '..', file.path);
    res.download(filePath);
  } catch (err) {
    console.error('Download Error:', err);
    res.status(500).send({ error: 'Something went wrong' });
  }
};

// Send via email
exports.sendFile = async (req, res) => {
  const { uuid, emailTo, emailFrom } = req.body;
  if (!uuid || !emailTo || !emailFrom) {
    return res.status(422).send({ error: 'All fields are required' });
  }

  const file = await File.findOne({ uuid });
  if (file.sender) {
    return res.status(422).send({ error: 'Email already sent' });
  }

  file.sender = emailFrom;
  file.receiver = emailTo;
  await file.save();

  sendMail({
    from: emailFrom,
    to: emailTo,
    subject: 'File Shared with You',
    text: `${emailFrom} shared a file with you.`,
    html: `
      <p>${emailFrom} shared a file with you.</p>
      <p>Click <a href="${process.env.BASE_URL}/files/${file.uuid}">here</a> to download.</p>
      <p>Link expires in 24 hours.</p>
    `
  });

  res.send({ success: true });
};
