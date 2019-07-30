const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SectionRefSchema = require("./SectionRef").schema;

const ArticleGroupSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  articles: [{ type: mongoose.Schema.Types.ObjectId, ref: "sections" }]
});

module.exports = ArticleGroup = mongoose.model(
  "articlegroups",
  ArticleGroupSchema
);
