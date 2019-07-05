const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HydraEdition2Schema = new Schema(
  {
    version: {
      type: String,
      required: true
    },
    sections: [Schema.Types.Mixed]
  },
  { strict: false }
);

module.exports = HydraEdition2 = mongoose.model(
  "hydraeditions2",
  HydraEdition2Schema
);
