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

const filterUserFieldsByPermission = () => (req, res, next) => {
  var basicViewFields = ["_id", "firstname", "lastname", "avatar"];
  var updateFields = [];
  if (req.user) {
    if (req.user.permissionlevel === 3) {
      basicViewFields.push("date", "enabled", "permissionlevel");
      updateFields.push("enabled", "permissionlevel");
    }
    if (req.user.viewFields === undefined) {
      req.user.viewFields = basicViewFields;
    } else {
      req.user.viewFields = [...req.user.viewFields, ...basicViewFields];
    }
    if (req.user.updatableFields === undefined) {
      req.user.updatableFields = updateFields;
    } else {
      req.user.updatableFields = [...req.user.updatableFields, ...updateFields];
    }
  }

  next();
};

const filterUserFieldsById = (queryuserid = null) => (req, res, next) => {
  if (req.user) {
    var ownViewFields = [];
    var ownUpdateFields = [];
    if (req.params.queryuserid === req.user.id) {
      ownViewFields = ["_id", "firstname", "lastname", "email", "avatar"];
      ownUpdateFields = [
        "firstname",
        "lastname",
        "email",
        "password",
        "password2"
      ];
    }
    if (req.user.viewFields === undefined) {
      req.user.viewFields = ownViewFields;
    } else {
      req.user.viewFields = [...req.user.viewFields, ...ownViewFields];
    }
    if (req.user.updatableFields === undefined) {
      req.user.updatableFields = ownViewFields;
    } else {
      req.user.updatableFields = [
        ...req.user.updatableFields,
        ...ownUpdateFields
      ];
    }
  }
  next();
};

const filterUserFieldsForOwner = () => (req, res, next) => {
  if (req.user) {
    req.user.viewFields = [
      ...req.user.viewFields,
      ...["_id", "firstname", "lastname", "email", "avatar"]
    ];
    req.user.updatableFields = [
      ...req.user.updatableFields,
      ...["firstname", "lastname", "email", "password", "password2"]
    ];
  }

  next();
};

module.exports = {
  restrictToSelf,
  hasPermissionLevel,
  filterUserFieldsByPermission,
  filterUserFieldsForOwner,
  filterUserFieldsById
};
