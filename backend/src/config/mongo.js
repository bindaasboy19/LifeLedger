import mongoose from 'mongoose';
import { env } from './env.js';

export const connectMongo = async () => {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is missing');
  }

  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);

  await mongoose.connect(env.mongoUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 7000,
    connectTimeoutMS: 7000,
    socketTimeoutMS: 45000
  });

  return mongoose.connection;
};

export const disconnectMongo = async () => {
  await mongoose.connection.close();
};
