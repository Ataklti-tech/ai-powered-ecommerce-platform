const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');
const mongoose = require('mongoose');

const DB = process.env.DATABASE.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD
);

mongoose.set('bufferCommands', false);

const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
};

mongoose
  .connect(DB, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`App running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.error(
      'Check: (1) Atlas cluster is not paused, (2) your IP is whitelisted in Atlas Network Access'
    );
    process.exit(1);
  });

// const app = require('./app');
// const dotenv = require('dotenv');
// dotenv.config({ path: './config.env' });
// const mongoose = require('mongoose');

// // console.log(process.env);
// // console.log(process.env.NODE_ENV); // "development" or "production"
// console.log(process.env.PORT);
// console.log(process.env.USERNAME);

// // database connection
// const db = process.env.DATABASE.replace(
//   '<db_password>',
//   process.env.DATABASE_PASSWORD
// );

// // MongoDB connection options to handle SSL/TLS issues
// const mongooseOptions = {
//   serverSelectionTimeoutMS: 30000,
//   socketTimeoutMS: 45000,
//   maxPoolSize: 10,
//   minPoolSize: 1,
// };

// mongoose
//   .connect(db, mongooseOptions)
//   .then((conn) => {
//     console.log(conn.connections);
//     console.log('DB Connection Successful');
//   })
//   .catch((err) => {
//     console.error('DB Connection Error:', err.message);
//   });

// const port = process.env.PORT;

// app.listen(port, () => {
//   console.log(`App running on port ${port}`);
// });
