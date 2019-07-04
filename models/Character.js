const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CharacterSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users"
  }
});

module.exports = Character = mongoose.model("characters", CharacterSchema);
