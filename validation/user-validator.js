const validator = require("express-validator");
exports.validate = method => {
  switch (method) {
    case "createUser": {
      return [
        validator
          .body("email", "Invalid email")
          .exists()
          .isEmail(),
        validator.body().custom((value, { req }) => {
          console.log(req.user);

          // Indicates the success of this synchronous custom validator
          return true;
        })
      ];
    }
    case "patchUser": {
      return [
        validator.body().custom(({ req }) => {
          console.log(req);

          // Indicates the success of this synchronous custom validator
          return true;
        })
      ];
    }
  }
};
