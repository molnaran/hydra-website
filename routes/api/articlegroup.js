const express = require("express");
const router = express.Router();
const passport = require("passport");

const ArticleGroup = require("../../models/ArticleGroup");
const Section = require("../../models/Section");
const asyncMiddleware = require("../../utils/asyncMiddleware");
const { hasPermissionLevel } = require("../../utils/authorizationMiddleware");

//@route    GET api/articlegroup/
//@desc     Get all articlegroups
//@access   Public
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  asyncMiddleware(async (req, res, next) => {
    let articleGroupResult = await ArticleGroup.find({}).populate("sections");
    res.json(articleGroupResult);
  })
);

//@route    POST api/articlegroup/
//@desc     Create new articlegroup
//@access   Public
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    const articleGroup = new ArticleGroup({
      title: req.body.title,
      desciption: req.body.desciption
    });

    let createdArticleGroup = await articleGroup.save();
    res.json(createdArticleGroup);
  })
);

//@route    POST api/articlegroup/:articleid
//@desc     Add sectionref to article
//@access   Private
router.post(
  "/:articleid/article/:sectionid",
  passport.authenticate("jwt", { session: false }),
  hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    const section = await Section.findOne({
      _id: req.params.sectionid
    });
    if (!section) throw new Error("section to be added not found");

    var modifiers = {
      articles: { $each: [section._id] }
    };
    if (Number.isInteger(req.body.position)) {
      modifiers.content.$position = position;
    }
    var articlegroup = await ArticleGroup.findOneAndUpdate(
      { _id: req.params.articleid },
      { $push: modifiers },
      { upsert: false, useFindAndModify: false, new: true }
    ).exec();
    if (!articlegroup) throw new Error("parent articlegroup not found");
    res.json(articlegroup);
  })
);

//@route    POST api/articlegroup/:articleid
//@desc     Delete sectionref from article
//@access   Private
router.delete(
  "/:articleid/",
  passport.authenticate("jwt", { session: false }),
  hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    await ArticleGroup.deleteOne({ _id: req.params.articleid });

    return res.json({
      id: req.params.id,
      result: "Success",
      msg: "Resource deleted"
    });
  })
);

module.exports = router;
