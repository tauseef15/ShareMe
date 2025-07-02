const multer = require('multer');
const { v4: uuid4 } = require('uuid');
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

exports.uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).send({ error: err.message });

    const file = new File({
      filename: req.file.filename,
      uuid: uuid4(),
      path: req.file.path,
      size: req.file.size
    });

    const response = await file.save();
    res.json({ file: `${process.env.BASE_URL}/api/files/${response.uuid}` });
  });
};

exports.getFile = async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });
    if (!file) {
      // Render the page with an error message
      return res.render('download', { locals: { error: 'File not found' } });
    }

    res.render('download', {
      fileName: file.filename,
      fileSize: file.size,
      downloadLink: `${process.env.BASE_URL}/api/files/download/${file.uuid}`
    });
  } catch (err) {
    res.status(500).send('Something went wrong');
  }
};


exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const filePath = `${__dirname}/../${file.path}`;
    res.download(filePath);
  } catch (err) {
    res.status(500).send({ error: 'Something went wrong' });
  }
};

exports.sendFile = async (req, res) => {
  const { uuid, emailTo, emailFrom } = req.body;

  // Validate
  if (!uuid || !emailTo || !emailFrom) {
    return res.status(422).send({ error: 'All fields are required' });
  }

  try {
    // Fetch file from DB
    const file = await File.findOne({ uuid: uuid });
    if (!file) {
      return res.status(404).send({ error: 'File not found' });
    }

    // Check if mail already sent
    if (file.sender) {
      return res.status(422).send({ error: 'Email already sent once' });
    }

    file.sender = emailFrom;
    file.receiver = emailTo;

    await file.save();

    // Send the email
    await sendMail({
      from: emailFrom,
      to: emailTo,
      subject: 'Share-Me File Sharing',
      text: `${emailFrom} shared a file with you.`,
      html: `
        <p><strong>${emailFrom}</strong> has shared a file with you.</p>
        <p>Click the link below to download:</p>
        <a href="${process.env.BASE_URL}/api/files/${file.uuid}">Download File</a>
        <p>File size: ${(file.size / 1024).toFixed(2)} KB</p>
        <p>Link expires in 24 hours.</p>
      `
    });

    return res.status(200).send({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'Something went wrong during email sending' });
  }
};

