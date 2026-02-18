const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/saf';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Drop collections
  await mongoose.connection.db.collection('safs').deleteMany({});
  await mongoose.connection.db.collection('bids').deleteMany({});
  
  console.log('✅ Database cleared: SAFS and BIDS collections emptied');
  process.exit(0);
})
.catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});
