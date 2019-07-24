const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
const authMiddleware = require("../../utils/authorizationMiddleware");

const asyncMiddleware = require("../../utils/asyncMiddleware");

const User = require("../../models/User");
const keys = require("../../config/keys");

//@route    POST api/users/register
//@desc     Register user
//@access   Public
router.post(
  "/register",
  asyncMiddleware(async (req, res, next) => {
    const { errors, isValid } = validateRegisterInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    var user = await User.findOne({ email: req.body.email });
    if (user) {
      errors.email = "Email already exists";
      return res.status(400).json(errors);
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newUser.password, salt);
      newUser.password = hash;
      var savedUser = await newUser.save();
      return res.json(savedUser);
    }
  })
);

//@route    POST api/users/login
//@desc     Login user / Returning the JWT
//@access   Public
router.post(
  "/login",
  asyncMiddleware(async (req, res, next) => {
    const { errors, isValid } = validateLoginInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const email = req.body.email;
    const password = req.body.password;

    var user = await User.findOne({ email });
    if (!user) {
      errors.email = "User not found!";
      return res.status(404).json(errors);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // User matched
      const payload = {
        id: user.id,
        name: user.name
      };

      //Sign Token
      const token = await jwt.sign(payload, keys.secretOrKey, {
        expiresIn: 3600 * 8
      });

      return res.json({ success: true, token: "Bearer " + token });
    } else {
      errors.password = "Password incorrect!";
      return res.status(400).json(errors);
    }
  })
);

//@route    GET api/users/current
//@desc     Return current user
//@access   Private
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  asyncMiddleware(async (req, res, next) => {
    var currentUser = await User.findById(req.user.id);
    return res.json(currentUser);
  })
);

//@route    GET api/users/current
//@desc     Return current user
//@access   Private
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  authMiddleware.restrictToSelf("id"),
  asyncMiddleware(async (req, res, next) => {
    return res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  })
);

//authentication method for more control
function authenticateJwtAdvanced(req, res, next) {
  passport.authenticate("jwt", { session: false }, function(err, user, info) {
    if (err) return next(err);
    if (!user) return res.status(400).json({ msg: info });
    req.user = user;
    next();
  })(req, res, next);
}

module.exports = router;
