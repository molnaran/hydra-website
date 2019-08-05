const Validator = require("validator");
const isEmpty = require("./is-empty");

const validate = (method, data, user) => {
  switch (method) {
    case "createUser": {
      return createUserValidator(data);
    }
    case "updateUser": {
      return updateUserValidator(data, user);
    }
  }
};
const updateUserValidator = (data, user) => {
  let errors = {};
  if (isEmpty(data)) {
    errors.data = "At least one update field is required!";
  }
  if (user) {
    const validInputFields = user.updatableFields;
    for (var key in data) {
      if (
        !validInputFields.filter(value => value === key || key === "password2")
          .length > 0
      ) {
        errors[key] = "Wrong property";
      } else {
        switch (key) {
          case "permissionlevel":
            data["permissionlevel"] = !isEmpty(data["permissionlevel"])
              ? data["permissionlevel"]
              : "";
            if (!Validator.isInt(data["permissionlevel"], { min: 0, max: 3 })) {
              errors["permissionlevel"] =
                "Permissionlevel must be between 0 and 3";
            }
            break;
          case "enabled":
            data["enabled"] = !isEmpty(data["enabled"]) ? data["enabled"] : "";
            if (!Validator.isInt(data["enabled"], { min: 0, max: 3 })) {
              errors["enabled"] = "Enabled must be either true or false";
            }
            break;
          case "firstname":
            data["firstname"] = !isEmpty(data["firstname"])
              ? data["firstname"]
              : "";

            if (!Validator.isLength(data.firstname, { min: 2, max: 30 })) {
              errors.firstname =
                "Firstname must be between 2 and 30 characters!";
            }

            if (Validator.isEmpty(data.firstname)) {
              errors.firstname = "Firstname is required!";
            }

            break;
          case "lastname":
            data["lastname"] = !isEmpty(data["lastname"])
              ? data["lastname"]
              : "";

            if (!Validator.isLength(data.lastname, { min: 2, max: 30 })) {
              errors.lastname = "Lastname must be between 2 and 30 characters!";
            }

            if (Validator.isEmpty(data.lastname)) {
              errors.lastname = "Lastname is required!";
            }
            break;
          case "email":
            data["email"] = !isEmpty(data["email"]) ? data["email"] : "";
            if (!Validator.isEmail(data.email)) {
              errors.email = "Email is invalid!";
            }
            break;
          case "password":
            data["password"] = !isEmpty(data["password"])
              ? data["password"]
              : "";
            if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
              errors.password = "Password must be between 6 and 30 characters!";
            }
            if (Validator.isEmpty(data.password2)) {
              errors.password2 = "Confirm password is required!";
            }
            if (!Validator.equals(data.password, data.password2)) {
              errors.password2 = "Passwords must match!";
            }
            break;
        }
      }
    }
  } else {
    throw new Error("No logged in user found!");
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};

const createUserValidator = data => {
  let errors = {};
  data.firstname = !isEmpty(data.firstname) ? data.firstname : "";
  data.lastname = !isEmpty(data.lastname) ? data.lastname : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.password2 = !isEmpty(data.password2) ? data.password2 : "";

  if (!Validator.isLength(data.firstname, { min: 2, max: 30 })) {
    errors.firstname = "Firstname must be between 2 and 30 characters!";
  }

  if (Validator.isEmpty(data.firstname)) {
    errors.firstname = "Firstname is required!";
  }

  if (!Validator.isLength(data.lastname, { min: 2, max: 30 })) {
    errors.lastname = "Lastname must be between 2 and 30 characters!";
  }

  if (Validator.isEmpty(data.lastname)) {
    errors.lastname = "Lastname is required!";
  }

  if (Validator.isEmpty(data.email)) {
    errors.email = "Email is required!";
  }

  if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid!";
  }
  if (Validator.isEmpty(data.password)) {
    errors.password = "Password is required!";
  }

  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = "Password must be between 6 and 30 characters!";
  }
  if (Validator.isEmpty(data.password2)) {
    errors.password2 = "Confirm password is required!";
  }
  if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = "Passwords must match!";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

module.exports = { validate };
