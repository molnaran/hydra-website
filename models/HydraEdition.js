const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HydraEditionSchema = new Schema(
  {
    version: {
      type: String,
      required: true
    },
    sections: [Schema.Types.Mixed]
  },
  { strict: false }
);

module.exports = HydraEdition = mongoose.model(
  "hydraeditions",
  HydraEditionSchema
);
