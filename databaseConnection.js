const mongoose = require("mongoose");

mongoose.connect(
  process.env.DATABASE_URL ||
    "mongodb://root:wonderit@mongo-universal.server.wonderit.io:27017?authSource=admin",
  {
    useNewUrlParser: true,
    userMongoClient: true,
  }
);
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("connected to database"));

module.exports = db;
