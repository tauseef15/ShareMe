const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: String,
  path: String,
  size: Number,
  uuid: { type: String, required: true },
  sender: String,
  receiver: String,
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
