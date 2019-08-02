const express = require("express");
const router = express.Router();
const passport = require("passport");

const ArticleGroup = require("../../models/ArticleGroup");
const Section = require("../../models/Section");
const asyncMiddleware = require("../../utils/asyncMiddleware");
const { hasPermissionLevel } = require("../../utils/authorizationMiddleware");
const validateArticleGroup = require("../../validation/articlegroup-validation");

//@route    GET api/articlegroup/
//@desc     Get all articlegroups
//@access   Public
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  asyncMiddleware(async (req, res, next) => {
    let articleGroupResult = await ArticleGroup.find({}).lean();
    res.json(articleGroupResult);
  })
);

//@route    GET api/articlegroup/
//@desc     Get articlegroup with specified id
//@access   Public
router.get(
  "/:articleid",
  passport.authenticate("jwt", { session: false }),
  asyncMiddleware(async (req, res, next) => {
    let articleGroupResult = await ArticleGroup.findById({ articleid }).lean();
    res.json(articleGroupResult);
  })
);

//@route    POST api/articlegroup/
//@desc     Create new articlegroup
//@access   Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    const { errors, isValid } = validateArticleGroup(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const articleGroup = new ArticleGroup({
      title: req.body.title,
      desciption: req.body.desciption,
      keywords: req.body.keywords
    });

    let createdArticleGroup = await articleGroup.save();
    res.json(createdArticleGroup);
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
    const sectionref = new SectionRef({
      section: section._id,
      title: section.title
    });
    var modifiers = {
      articles: { $each: [sectionref] }
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

//@route    DELETE api/articlegroup/:articleid
//@desc     Remove sectionref to article
//@access   Private
router.delete(
  "/:articleid/article/:sectionid",
  passport.authenticate("jwt", { session: false }),
  hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    let updatedArticleGroup = await ArticleGroup.findOneAndUpdate(
      { _id: req.params.articleid },
      { $pull: { articles: { _id: req.params.sectionid } } },
      { useFindAndModify: false, new: true }
    );
    if (!updatedArticleGroup)
      return res.status(404).json({ msg: "ArticleGroup not found" });

    return res.json(updatedArticleGroup);
  })
);

module.exports = router;
