import mongoose from 'mongoose';

interface GlobalMongo {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

interface GlobalWithMongo extends Global {
  mongoose: GlobalMongo;
}

declare global {
  var mongoose: GlobalMongo | undefined;
}

// Note: The username might need URL encoding for special characters
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sathvik:Z4WWQysCevwII1if@cluster0.b9xl9t5.mongodb.net/finance-portfolio?retryWrites=true&w=majority';

let cached = global.mongoose as GlobalMongo;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: true,
      maxPoolSize: 10,
    };

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('Failed to establish MongoDB connection:', error);
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
