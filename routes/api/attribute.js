const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const multer = require("multer");
const connect = require("connect");

const authMiddleware = require("../../utils/authorizationMiddleware");
const asyncMiddleware = require("../../utils/asyncMiddleware");
const Attribute = require("../../models/Attribute");

//@route    GET api/races/
//@desc     Finding and returning section with specified id
//@access   Public
router.get(
  "/",
  asyncMiddleware(async (req, res, next) => {
    const attributes = await Attribute.find({}).lean();
    return res.json(attributes);
  })
);

//@route    GET api/races/
//@desc     Finding and returning section with specified id
//@access   Public
router.post(
  "/",
  asyncMiddleware(async (req, res, next) => {
    const newAttribute = new Attribute({
      name: req.body.name,
      description: req.body.description
    });
    await newAttribute.save();
    return res.json(newAttribute);
  })
);

module.exports = router;
