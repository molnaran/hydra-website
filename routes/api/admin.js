const express = require("express");
const router = express.Router();

const asyncMiddleware = require("../../utils/asyncMiddleware");
const User = require("../../models/User");

//@route    GET api/admin/users
//@desc     GET all users
//@access   Public
router.get(
  "/users",
  asyncMiddleware(async (req, res, next) => {
    const users = await User.find({}).select("name email roles enabled");
    return res.json(users);
  })
);

module.exports = router;
