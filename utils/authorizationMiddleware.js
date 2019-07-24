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

const hasAnyRole = (...roles) => (req, res, next) => {
  var allowed = false;
  try {
    if (req.user !== null) {
      roles.forEach(role => {
        if (req.user.roles.indexOf(role) > -1) {
          allowed = true;
          return;
        }
      });
    }
    if (allowed) {
      return next();
    } else {
      return res.status(400).json({ msg: "Unauthorized" });
    }
  } catch (err) {
    return next(err);
  }
};

module.exports = { restrictToSelf, hasAnyRole };
