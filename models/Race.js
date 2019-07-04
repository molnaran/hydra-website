const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RaceSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users"
  }
});

module.exports = Race = mongoose.model("races", RaceSchema);
