const restrictToSelf = requestid => (req, res, next) => {
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

module.exports = { restrictToSelf, hasPermissionLevel };
