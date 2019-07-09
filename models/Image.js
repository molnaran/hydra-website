const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FigureSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  }
});

module.exports = Figure = mongoose.model("figures", FigureSchema);
