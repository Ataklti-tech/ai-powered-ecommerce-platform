const app = require("./app");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const mongoose = require("mongoose");

// console.log(process.env);
// console.log(process.env.NODE_ENV); // "development" or "production"
console.log(process.env.PORT);
console.log(process.env.USERNAME);

// database connection
const db = process.env.DATABASE.replace(
  "<db_password>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(db).then((conn) => {
  console.log(conn.connections);
  console.log("DB Connection Successful");
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
