const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const util = require("util");
const unlink = util.promisify(fs.unlink);
const passport = require("passport");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: fileFilter
});

const asyncMiddleware = require("../../utils/asyncMiddleware");
const authMiddleware = require("../../utils/authorizationMiddleware");
const Section = require("../../models/Section");
const ArticleGroup = require("../../models/ArticleGroup");
const SectionRef = require("../../models/SectionRef");
const Paragraph = require("../../models/Paragraph");
const Image = require("../../models/Image");
var ObjectId = require("mongoose").Types.ObjectId;

//@route    GET api/section/:id
//@desc     Finding and returning section with specified id
//@access   Public
router.get(
  "/:id",
  asyncMiddleware(async (req, res, next) => {
    let response = await Section.findOne({ _id: req.params.id }).lean();
    if (!response)
      return res
        .status(404)
        .json({ result: "Failure", msg: "Section not found!" });
    return res.json(response);
  })
);

//@route    POST api/section/
//@desc     Add new section to root
//@access   Private, admin role needed
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  authMiddleware.hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    const newSection = new Section({
      version: req.body.version,
      title: req.body.title,
      text: req.body.text === undefined ? "" : req.body.text
    });
    var response = await newSection.save();
    return res.json(response);
  })
);

//@route    DELETE api/section/:id
//@desc     Delete section with specified id
//@access   Private, admin role needed
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  authMiddleware.hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    if (!req.params.id) throw new Error("content id not found");
    var deleteresult;
    await Promise.all([
      await Section.updateMany(
        {},
        { $pull: { content: { section: new ObjectId(req.params.id) } } },
        { useFindAndModify: false, new: true }
      ),
      await ArticleGroup.updateMany(
        {},
        { $pull: { articles: { section: new ObjectId(req.params.id) } } },
        { useFindAndModify: false, new: true }
      ),
      (deleteresult = await Section.deleteOne({ _id: req.params.id }))
    ]);
    if (deleteresult.deletedCount === 0) {
      return res.json({
        id: req.params.id,
        result: "Failure",
        msg: "Resource not found"
      });
    } else {
      return res.json({
        id: req.params.id,
        result: "Success",
        msg: "Resource deleted"
      });
    }
  })
);

//@route    PUT api/section/:id
//@desc     Move a content element from oldparent (non-root) section to newparent (non-root) section
//@access   Private, admin role needed
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  authMiddleware.hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    if (
      req.body.newparentid === undefined ||
      req.body.oldparentid === undefined
    )
      throw new Error("newparentid and oldparentid must be supplied!");

    var oldparent = await Section.findOne({ _id: req.body.oldparentid });

    if (oldparent === null) throw new Error("Oldparent not found");

    var position = getPosition(req.body.position, oldparent.content);

    var removeItems = [];
    var remainingItems = [];
    oldparent.content.forEach(element => {
      if (element._id == req.params.id) {
        removeItems.push(element);
      } else {
        remainingItems.push(element);
      }
    });

    const content = removeItems.length > 0 ? removeItems[0] : null;
    if (content === null) throw new Error("Object to be moved not found");

    if (req.body.newparentid === req.body.oldparentid) {
      oldparent.content = [
        ...remainingItems.slice(0, position),
        content,
        ...remainingItems.slice(position)
      ];
      await oldparent.save();
      var responseJson = {
        oldparentid: req.body.oldparentid,
        newparent: {
          id: req.body.newparentid,
          content: oldparent.content
        }
      };
      return res.json(responseJson);
    } else {
      oldparent.content = remainingItems;

      const [newParentResult, oldParentResult] = await Promise.all([
        await addContentToSection(
          content,
          req.body.newparentid,
          req.body.position
        ),
        await oldparent.save()
      ]);
      var responseJson = {
        oldparentid: oldParentResult._id,
        newparent: {
          id: newParentResult._id,
          content: newParentResult.content
        }
      };
      return res.json(responseJson);
    }
  })
);

//@route    POST api/section/:id/content
//@desc     Add new content to section with specified id
//@access   Private, admin role needed
router.post(
  "/:id/content",
  upload.single("image"),
  passport.authenticate("jwt", { session: false }),
  authMiddleware.hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    if (req.params.id === undefined) throw new Error("parentid is mandatory");
    switch (req.body.type) {
      case "section":
        const newSection = new Section({
          version: req.body.version,
          title: req.body.title,
          text: req.body.text === undefined ? "" : req.body.text
        });
        var section = await newSection.save();
        content = new SectionRef({
          section: section._id,
          title: section.title
        });
        break;
      case "sectionref":
        if (req.body.sectionref === undefined)
          throw new Error("sectionref is mandatory");
        if (req.body.sectionref == req.params.id)
          throw new Error("sectionref cannot be added to itself");

        var sectionToAdd = await Section.findOne({
          _id: req.body.sectionref
        });
        if (!sectionToAdd) throw new Error("section to be added not found");

        content = new SectionRef({
          section: sectionToAdd._id,
          title: sectionToAdd.title
        });
        break;
      case "image":
        if (!req.body.title) throw new Error("image title not found");
        if (!req.file) throw new Error("image not found");
        content = new Image({
          title: req.body.title,
          path: (req.file.destination + "/" + req.file.filename).substring(2)
        });
        break;
      case "paragraph":
        if (!req.body.title) throw new Error("paragraph title not found");
        if (!req.body.text) throw new Error("paragraph text not found");
        content = new Paragraph({
          title: req.body.title,
          text: req.body.text
        });
        break;
    }
    const parentSection = await Section.findOne({ _id: req.params.id });
    if (!parentSection) throw new Error("parent not found");
    const position = getPosition(req.body.position, parentSection.content);
    var result = await addContentToSection(content, req.params.id, position);
    return res.json(result);
  })
);

//@route    DELETE api/section/:id/content/:contentid
//@desc     Login user / Returning the JWT
//@access   Private, admin role needed
router.delete(
  "/:id/content/:contentid",
  passport.authenticate("jwt", { session: false }),
  authMiddleware.hasPermissionLevel(2),
  asyncMiddleware(async (req, res) => {
    if (
      req.params.id === null ||
      req.params.id === undefined ||
      req.params.id === ""
    )
      throw new Error("parentid not found");
    if (
      req.params.contentid === null ||
      req.params.contentid === undefined ||
      req.params.contentid === ""
    )
      throw new Error("content not found");
    var parentSection = await Section.findOne({ _id: req.params.id });
    if (!parentSection) throw new Error("parent section not found");
    var removeItems = [];
    var remainingItems = [];
    parentSection.content.forEach(element => {
      if (element._id == req.params.contentid) {
        removeItems.push(element);
      } else {
        remainingItems.push(element);
      }
    });

    const removeContent = removeItems.length > 0 ? removeItems[0] : null;

    if (removeContent === null) throw new Error("Object to be moved not found");

    const unLinkAvatar = async removeContent => {
      if (removeContent.contenttype === "image") {
        const normalizedPath = path.normalize(removeContent.path);
        if (!normalizedPath.startsWith("uploads"))
          throw Error("resource cannot be deleted");
        await unlink(normalizedPath);
      }
    };

    parentSection.content = remainingItems;
    await Promise.all([await parentSection.save(), await unLinkAvatar]);
    return res.json(parentSection);
  })
);

const getPosition = (positionParam, contentArray) => {
  var position;
  if (positionParam === null || positionParam === undefined) {
    position = contentArray.length;
  } else if (
    !Number.isInteger(positionParam) ||
    positionParam > contentArray.length
  ) {
    throw new Error("invalid position param");
  } else {
    position = positionParam;
  }
  return position;
};

const addContentToSection = async (content, parentid, position) => {
  if (content === null) throw new Error("Content not found!");
  var modifiers = {
    content: { $each: [content] }
  };
  if (Number.isInteger(position)) {
    modifiers.content.$position = position;
  }
  var section = await Section.findOneAndUpdate(
    { _id: parentid },
    { $push: modifiers },
    { upsert: false, useFindAndModify: false, new: true }
  ).exec();
  if (!section) throw new Error("parent section not found");
  return section;
};

module.exports = router;
