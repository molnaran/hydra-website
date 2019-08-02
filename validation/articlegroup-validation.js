const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateUpdateProfileInput(data) {
  let errors = {};
  var tempData = {};

  tempData.title = !isEmpty(data.title) ? data.title : "";

  if (!Validator.isLength(tempData.title, { min: 2, max: 30 })) {
    errors.title = "Title must be between 2 and 30 characters!";
  }
  if (Validator.isEmpty(tempData.title)) {
    errors.title = "Title is mandatory!";
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};
