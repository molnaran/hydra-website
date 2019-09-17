const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const multer = require("multer");
const connect = require("connect");

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
const uploadAvatar = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 3 },
  fileFilter: fileFilter
});

const authMiddleware = require("../../utils/authorizationMiddleware");
const asyncMiddleware = require("../../utils/asyncMiddleware");
const Race = require("../../models/Race");
const Attribute = require("../../models/Attribute");

//@route    GET api/races/
//@desc     Finding and returning section with specified id
//@access   Public
router.get(
  "/",
  asyncMiddleware(async (req, res, next) => {
    const races = await Race.find({}).lean();
    return res.json(races);
  })
);

//@route    GET api/races/
//@desc     Finding and returning section with specified id
//@access   Public
router.post(
  "/",
  asyncMiddleware(async (req, res, next) => {
    /*  
    let attributes=[];
      req.body.attributes.map(attribute =>{
        Attribute.find({})
      })*/
    const newRace = new Race({
      name: req.body.name,
      age: req.body.age,
      attributes: req.body.attributes,
      racialabilities: req.body.racialabilities
    });
    await newRace.save();
    return res.json(newRace);
  })
);

module.exports = router;
