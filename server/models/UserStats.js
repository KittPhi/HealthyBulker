const mongoose = require("mongoose");

const userStatsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  weight: { type: Number },
  age: { type: Number },
  height: { type: Number },
  bodyFat: { type: Number },
  muscleFat: { type: Number },
  created: { type: String, require: true },
  createdDate: { type: Date, required: true },
});

const UserStats = mongoose.model("UserStats", userStatsSchema);

module.exports = UserStats;
