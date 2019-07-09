const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SectionSchema = new Schema(
  {
    version: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: [Schema.Types.Mixed]
  },
  { strict: false }
);

module.exports = Section = mongoose.model("sections", SectionSchema);
