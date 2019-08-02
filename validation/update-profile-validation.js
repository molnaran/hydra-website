const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateUpdateProfileInput(data) {
  let errors = {};
  var tempData = {};
  tempData.firstname = !isEmpty(data.firstname) ? data.firstname : "";
  tempData.lastname = !isEmpty(data.lastname) ? data.lastname : "";
  tempData.email = !isEmpty(data.email) ? data.email : "";
  tempData.password = !isEmpty(data.password) ? data.password : "";
  tempData.password2 = !isEmpty(data.password2) ? data.password2 : "";

  if (data.firstname !== null || data.firstname !== undefined) {
    data.firstname = !isEmpty(data.firstname) ? data.firstname : "";
  }

  if (
    !Validator.isEmpty(tempData.firstname) &&
    !Validator.isLength(tempData.firstname, { min: 2, max: 30 })
  ) {
    errors.firstname = "Firstname must be between 2 and 30 characters!";
  }

  if (
    !Validator.isEmpty(tempData.lastname) &&
    !Validator.isLength(tempData.lastname, { min: 2, max: 30 })
  ) {
    errors.lastname = "Lastname must be between 2 and 30 characters!";
  }

  if (
    !Validator.isEmpty(tempData.email) &&
    !Validator.isEmail(tempData.email)
  ) {
    errors.email = "Email is invalid!";
  }

  if (!Validator.isEmpty(tempData.password)) {
    if (!Validator.isLength(tempData.password, { min: 6, max: 30 })) {
      errors.password = "Password must be between 6 and 30 characters!";
    }
    if (Validator.isEmpty(tempData.password2)) {
      errors.password2 = "Confirm password is required!";
    }
    if (!Validator.equals(tempData.password, tempData.password2)) {
      errors.password2 = "Passwords must match!";
    }
  }

  if (!Validator.isEmpty(tempData.password2)) {
    if (Validator.isEmpty(tempData.password)) {
      errors.password2 = "Password is required!";
    }
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
