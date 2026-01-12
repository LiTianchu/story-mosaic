import mongoose from 'mongoose';

const redactMongoUri = (uri: string) =>
  uri.replace(/(mongodb(?:\+srv)?:\/\/[^:/@]+):([^@]+)@/i, '$1:***@');

export const connectDatabase = async (uri: string) => {
  if (!uri) {
    throw new Error('MONGO_URI must be provided');
  }

  await mongoose.connect(uri);
  const connection = mongoose.connection;

  connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB connection lost');
  });

  console.log('✅ Connected to MongoDB');
  console.log(`📊 Database: ${redactMongoUri(uri)}`);
};
