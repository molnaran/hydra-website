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

const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
const validateUpdateProfileInput = require("../../validation/update-profile-validation");
const validateUpdateUser = require("../../validation/update-user-validation");
const authMiddleware = require("../../utils/authorizationMiddleware");

var restrictToSelfAndFilter = userid => {
  var chain = connect();
  chain.use(authMiddleware.restrictToSelf(userid));
  chain.use(authMiddleware.filterUserFields(userid));
  return chain;
};
const hasPermissionLevelAndFilter = (permissionlevel, userid) => {
  var chain = connect();
  chain.use(authMiddleware.hasPermissionLevel(permissionlevel));
  chain.use(authMiddleware.filterUserFields(userid));
  return chain;
};

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
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: req.body.password
      });
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newUser.password, salt);
      newUser.password = hash;
      await newUser.save();
      return res.json({
        result: "Success",
        data: filterObject(newUser, getReturnableFieldsForOwnProfile())
      });
    }
  })
);

//@route    POST api/users/login
//@desc     Login user / Returning the JWT
//@access   Public
router.post(
  "/login",
  asyncMiddleware(async (req, res, next) => {
    console.log(req);
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
  "/profile",
  passport.authenticate("jwt", { session: false }),
  asyncMiddleware(async (req, res, next) => {
    var currentUser = await User.findById(req.user.id)
      .select(getReturnableFieldsForOwnProfile(req.user.id))
      .lean();
    return res.json({
      result: "Success",
      data: currentUser
    });
  })
);

//@route    POST api/users/profile/avatar
//@desc     Create avatar for profile
//@access   Private
router.post(
  "/profile/avatar",
  uploadAvatar.single("avatar"),
  passport.authenticate("jwt", { session: false }),
  asyncMiddleware(async (req, res, next) => {
    if (!req.file) throw new Error("image not found");
    const avatarPath = (
      req.file.destination +
      "/" +
      req.file.filename
    ).substring(2);
    var currentUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: { avatar: avatarPath } },
      { upsert: false, useFindAndModify: false, new: true }
    );
    return res.json({
      result: "Success!",
      msg: "Avatar successfully uploaded!",
      data: filterObject(currentUser, getReturnableFieldsForOwnProfile())
    });
  })
);

//@route    PATCH api/users/profile
//@desc     Return current user
//@access   Private
router.patch(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  asyncMiddleware(async (req, res, next) => {
    const { errors, isValid } = validateUpdateProfileInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    var patchFields = filterObject(req.body, getUpdatableFieldsForOwnProfile());
    var currentUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: patchFields },
      { upsert: false, useFindAndModify: false, new: true }
    ).exec();
    return res.json({
      result: "Success!",
      msg: "Profile successfully updated!",
      data: filterObject(currentUser, getReturnableFieldsForOwnProfile())
    });
  })
);

//@route    DELETE api/users/profile
//@desc     Return current user
//@access   Private
router.delete(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  asyncMiddleware(async (req, res, next) => {
    var user = await User.findOneAndDelete({ _id: req.user.id });
    if (!user) {
      return res
        .status(404)
        .json({ result: "Failure", msg: "User not found!" });
    } else {
      res.status(200).json({
        result: "Success",
        msg: "User successfully deleted!",
        data: filterObject(user, getReturnableFieldsForOwnProfile())
      });
    }
  })
);

//@route    GET api/users/:id
//@desc     Return current user
//@access   Private permissionlevel 2
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  restrictToSelfAndFilter("id"),
  asyncMiddleware(async (req, res, next) => {
    var user = await User.findById(req.user.id).select(req.user.viewFields);
    return res.json(user);
  })
);

//@route    GET api/users/
//@desc     GET all users
//@access   Private, permissionlevel 2
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  hasPermissionLevelAndFilter(2, "5d39be49c6c522493c4151fa"),
  asyncMiddleware(async (req, res, next) => {
    console.log(req.user.permissionlevel);
    const users = await User.find({})
      .select(req.user.readfields)
      .lean();
    return res.json(users);
  })
);

router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  authMiddleware.hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    const { errors, isValid } = validateUpdateUser(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    var patchFields = filterObject(
      req.body,
      getUpdatableFieldsWithPermissionlevel(req.user.permissionlevel)
    );

    var currentUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: patchFields },
      { upsert: false, useFindAndModify: false, new: true }
    ).exec();
    return res.json({
      result: "Success!",
      data: filterObject(
        currentUser,
        getReturnableFieldsWithPermissionlevel(req.user.permissionlevel)
      )
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

const getUpdatableFieldsWithPermissionlevel = permissionlevel => {
  if (permissionlevel === 3) {
    return ["enabled", "permissionlevel"];
  } else if (permissionlevel === 2) {
    return ["enabled"];
  }
  return [];
};

const getReturnableFieldsWithPermissionlevel = permissionlevel => {
  var basicFields = ["_id", "firstname", "lastname", "email", "avatar"];
  if (permissionlevel === 2) {
    basicFields.push("date", "enabled");
  }
  if (permissionlevel === 3) {
    basicFields.push("enabled", "permissionlevel", "date");
  }
  return basicFields;
};

const getUpdatableFieldsForOwnProfile = () => {
  return ["firstname", "lastname", "email", "password"];
};

const getReturnableFieldsForOwnProfile = () => {
  return ["_id", "firstname", "lastname", "email", "avatar"];
};

const filterObject = (objectToFilter, allowedFields) => {
  var result = {};
  allowedFields.forEach(function(key) {
    if (key in objectToFilter) {
      result[key] = objectToFilter[key];
    }
  });
  return result;
};
module.exports = router;
