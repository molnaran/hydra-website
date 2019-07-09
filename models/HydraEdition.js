const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HydraEditionSchema = new Schema(
  {
    version: {
      type: String,
      required: true
    },
    sections: { type: mongoose.Schema.Types.ObjectId, ref: "sections" }
  },
  { strict: false }
);

module.exports = HydraEdition = mongoose.model(
  "hydraeditions",
  HydraEditionSchema
);
