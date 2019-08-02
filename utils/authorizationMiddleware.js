const restrictToSelf = (requestid = null) => (req, res, next) => {
  if (!req.user) return res.status(400).json({ msg: "user not found" });
  if (req.params[requestid] === undefined)
    return res.status(400).json({ msg: "requestid queryparam not found" });
  if (req.user.id === req.params[requestid]) {
    next();
  } else {
    return res.status(400).json({ msg: "unauthorized" });
  }
};

const hasPermissionLevel = permissionlevel => (req, res, next) => {
  try {
    if (req.user !== null && req.user.permissionlevel >= permissionlevel) {
      return next();
    } else {
      return res.status(401).json({ err: "Unauthorized" });
    }
  } catch (err) {
    return next(err);
  }
};

const filterUserFields = (queryuserid = null) => (req, res, next) => {
  var basicViewFields = ["_id", "firstname", "lastname", "email", "avatar"];
  var ownFields = [];
  switch (req.user.permissionlevel) {
    case 2:
      basicViewFields.push("date", "enabled");
      break;
    case 3:
      basicViewFields.push("permissionlevel", "date");
      break;
  }
  if (
    queryuserid !== null &&
    queryuserid === undefined &&
    queryuserid === req.user.id
  ) {
    ownFields = ["_id", "firstname", "lastname", "email", "avatar"];
  }
  req.user.viewFields = [...basicViewFields, ...ownFields];
  req.user.updatableFields = [
    "_id",
    "password",
    "date",
    ...req.user.viewFields
  ];
  next();
};

module.exports = { restrictToSelf, hasPermissionLevel, filterUserFields };
