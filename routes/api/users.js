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

const validator = require("../../validation/user-validator");

const hasPermissionLevelAndFilter = (permissionlevel, userid) => {
  var chain = connect();
  chain.use(authMiddleware.hasPermissionLevel(permissionlevel));
  chain.use(authMiddleware.filterUserFields(userid));
  return chain;
};

const authAndFilterByPermission = userid => {
  var chain = connect();
  chain.use(passport.authenticate("jwt", { session: false }));
  chain.use(authMiddleware.filterUserFieldsByPermission());
  return chain;
};
const authAndFilterByIdAndPermission = userid => {
  var chain = connect();
  chain.use(passport.authenticate("jwt", { session: false }));

  chain.use(authMiddleware.filterUserFieldsByPermission());
  chain.use(authMiddleware.filterUserFieldsById(userid));
  return chain;
};

const authAndFilterForOwnerAndPermission = () => {
  var chain = connect();
  chain.use(passport.authenticate("jwt", { session: false }));
  chain.use(authMiddleware.filterUserFieldsByPermission());
  chain.use(authMiddleware.filterUserFieldsForOwner());
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
    var user = await User.findOne({ email: req.body.email });
    const { errors, isValid } = validator.createUserValidator(req.body);
    if (!isValid) {
      return res.json({
        result: "Failure",
        msg: "Registration failed!",
        data: errors
      });
    }
    if (user) {
      errors.email = "Email already exists";
      return res.status(400).json({
        result: "Failure",
        msg: "Registration failed!",
        data: errors
      });
    } else {
      const newUser = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: req.body.password
      });
      newUser.password = await hashPassword(newUser.password);
      await newUser.save();
      return res.json({
        result: "Success",
        msg: "Registration successful!",
        data: {
          id: newUser.id,
          email: newUser.email,
          firstname: newUser.firstname,
          lastname: newUser.lastname
        }
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
    const { errors, isValid } = validator.loginUserValidator(req.body);
    if (!isValid) {
      return res.status(400).json({
        result: "Failure",
        msg: "Login failed!",
        data: errors
      });
    }
    const email = req.body.email;
    const password = req.body.password;

    var user = await User.findOne({ email });
    if (!user) {
      errors.email = "User not found!";
      return res.status(404).json({
        result: "Failure",
        msg: "Login failed!",
        data: errors
      });
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
  authAndFilterForOwnerAndPermission(),
  asyncMiddleware(async (req, res, next) => {
    var currentUser = await User.findById(req.user.id)
      .select(req.user.viewFields)
      .lean();
    return res.json({
      result: "Success",
      msg: "Profile returned",
      data: currentUser
    });
  })
);

//@route    POST api/users/profile/avatar
//@desc     Create avatar for profile
//@access   Private
router.put(
  "/profile/avatar",
  uploadAvatar.single("avatar"),
  authAndFilterForOwnerAndPermission(),
  asyncMiddleware(async (req, res, next) => {
    const { errors, isValid } = validator.uploadAvatarValidatior(req.file);
    if (!isValid) {
      return res.status(400).json({
        result: "Failure",
        msg: "Login failed!",
        data: errors
      });
    }

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
      data: filterObject(currentUser, req.user.viewFields)
    });
  })
);

//@route    PATCH api/users/profile
//@desc     Return current user
//@access   Private
router.patch(
  "/profile",
  authAndFilterForOwnerAndPermission(),
  asyncMiddleware(async (req, res, next) => {
    const { errors, isValid } = validator.updateUserValidator(
      req.body,
      req.user
    );
    if (!isValid) {
      return res.status(400).json({
        result: "Failure",
        msg: "Update failed!",
        data: errors
      });
    }
    var patchFields = filterObject(req.body, req.user.updatableFields);
    if (patchFields.password !== undefined) {
      patchFields.password = await hashPassword(patchFields.password);
    }
    if (
      patchFields.email &&
      (await doesEmailExists(patchFields.email, req.user._id))
    ) {
      errors.email = "Email already exists";
      return res.status(400).json({
        result: "Failure",
        msg: "Update failed!",
        data: errors
      });
    }
    var currentUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: patchFields },
      { upsert: false, useFindAndModify: false, new: true }
    ).exec();
    return res.json({
      result: "Success!",
      msg: "Profile successfully updated!",
      data: filterObject(currentUser, req.user.viewFields)
    });
  })
);

//@route    DELETE api/users/profile
//@desc     Return current user
//@access   Private
router.delete(
  "/profile",
  authAndFilterForOwnerAndPermission(),
  authMiddleware.hasPermissionLevel(3),
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
        data: filterObject(user, req.user.viewFields)
      });
    }
  })
);

//@route    GET api/users/:id
//@desc     Return current user
//@access   Private permissionlevel 2
router.get(
  "/:id",
  authAndFilterByIdAndPermission("id"),
  authMiddleware.hasPermissionLevel(3),
  asyncMiddleware(async (req, res, next) => {
    var user = await User.findById(req.user.id)
      .select(req.user.viewFields)
      .lean();
    if (!user)
      return res.status(404).json({
        result: "Failure",
        msg: "User not found!"
      });
    return res.json(user);
  })
);

//@route    GET api/users/
//@desc     GET all users
//@access   Private, permissionlevel 2
router.get(
  "/",
  authAndFilterByPermission,
  authMiddleware.hasPermissionLevel(3),
  asyncMiddleware(async (req, res, next) => {
    const users = await User.find({})
      .select(req.user.readfields)
      .lean();
    return res.json(users);
  })
);

router.patch(
  "/:id",
  authAndFilterByIdAndPermission("id"),
  authMiddleware.hasPermissionLevel(2),
  asyncMiddleware(async (req, res, next) => {
    const { errors, isValid } = validator.updateUserValidator(
      req.body,
      req.user
    );
    if (!isValid) {
      return res.status(400).json({
        result: "Failure",
        msg: "Update failed!",
        data: errors
      });
    }
    var patchFields = filterObject(req.body, req.user.viewFields);
    if (
      patchFields.email &&
      (await doesEmailExists(patchFields.email, req.params.id))
    ) {
      errors.email = "Email already exists";
      return res.status(400).json({
        result: "Failure",
        msg: "Update failed!",
        data: errors
      });
    }
    var currentUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: patchFields },
      { upsert: false, useFindAndModify: false, new: true }
    ).exec();
    return res.json({
      result: "Success!",
      data: filterObject(currentUser, req.user.updatableFields)
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

const hashPassword = async password => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

const doesEmailExists = async (email, currentuserid) => {
  var userByEmail = await User.findOne({ email: email });
  if (userByEmail === null) {
    console.log("false");
    return false;
  }
  if (userByEmail) {
    return !userByEmail._id.equals(currentuserid);
  } else {
    return false;
  }
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
