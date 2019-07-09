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
    text: {
      type: String,
      required: false
    }
  },
  { strict: false }
);

SectionSchema.add({
  sections: { type: mongoose.Schema.Types.ObjectId, ref: "sections" }
});

module.exports = Section = mongoose.model("sections", SectionSchema);
