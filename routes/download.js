const router = require('express').Router();
const File = require('../models/file');
const path = require('path');

router.get('/:uuid', async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });

    if (!file) {
      return res.render('download', { error: 'Link has expired or file does not exist.' });
    }

    const filePath = path.resolve(__dirname, '..', file.path);
    res.download(filePath);
  } catch (err) {
    console.error('Download Error:', err);
    res.status(500).render('download', { error: 'Something went wrong while downloading the file.' });
  }
});

module.exports = router;
