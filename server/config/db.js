const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    let URL = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}${process.env.MONGO_APPNAME}`;
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(URL);
    console.log(`Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("ERRROR:", error);
  }
};

const DB = mongoose.connection;
DB.on("error", console.error.bind(console, "MongoDB connection error:"));
DB.once("open", () => {
  console.log("Connected to MongoDB");
});

module.exports = connectDB;
