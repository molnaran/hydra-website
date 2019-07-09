const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ParagraphSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  }
});

module.exports = Paragraph = mongoose.model("paragraphs", ParagraphSchema);
