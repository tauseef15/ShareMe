const mongoose = require('mongoose');

function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1); // Exit the app if no DB URI is found
  }

  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const connection = mongoose.connection;
  connection.once('open', () => {
    console.log('✅ Database connected');
  });
}

module.exports = connectDB;
