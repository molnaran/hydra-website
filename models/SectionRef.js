const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SectionRefSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    contenttype: {
      type: String,
      default: "sectonref"
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sections",
      required: true
    }
  },
  { strict: false }
);

module.exports = SectionRef = mongoose.model("sectionrefs", SectionRefSchema);
