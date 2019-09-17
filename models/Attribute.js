const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AttributeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String
});

module.exports = Attribute = mongoose.model("attributes", AttributeSchema);
