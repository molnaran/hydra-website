const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SectionSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: false
  }
});

SectionSchema.add({ subsections: [SectionSchema] });

module.exports = Section = mongoose.model("sections", SectionSchema);
