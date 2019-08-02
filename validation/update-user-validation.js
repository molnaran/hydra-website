const Validator = require("validator");
const isEmpty = require("./is-empty");

function validateUpdateUserInput(data) {
  let errors = {};
  var tempData = {};
  tempData.permissionlevel = !isEmpty(data.permissionlevel)
    ? data.permissionlevel
    : "";
  tempData.enabled = !isEmpty(data.enabled) ? data.enabled : "";

  if (!Validator.isEmpty(tempData.permissionlevel)) {
    if (!Validator.isInt(tempData.permissionlevel, { min: 1, max: 3 })) {
      errors.permissionlevel =
        "Permissionlevel must be an integer between 1 and 3!";
    }
  }

  if (!Validator.isEmpty(tempData.enabled)) {
    if (!Validator.isBoolean(tempData.enabled)) {
      errors.enabled = "Enabled must be a boolean value!";
    }
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
}

module.exports = { validateUpdateUserInput };
