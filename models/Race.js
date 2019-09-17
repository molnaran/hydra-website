const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SectionRefSchema = require("./SectionRef").schema;

const RaceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: String,
    required: true
  },
  description: SectionRefSchema,
  attributes: [
    {
      min: Number,
      max: Number,
      attribute: { type: Schema.Types.ObjectId, ref: "attributes" }
    }
  ],
  racialabilities: [{ cost: Number, description: String }]
});

module.exports = Race = mongoose.model("races", RaceSchema);
