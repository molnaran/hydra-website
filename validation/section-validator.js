const Validator = require("validator");
const isEmpty = require("./is-empty");

const validate = (method, req) => {
  switch (method) {
    case "createSection": {
      return createSectionValidator(req.body);
    }
    case "moveContent": {
      return moveContentValidator(req.body);
    }
    default:
      throw new Error("No validator found!");
  }
};

const createSectionValidator = data => {
  let errors = {};
  data.version = !isEmpty(data.version) ? data.version : "";
  data.title = !isEmpty(data.title) ? data.title : "";

  if (Validator.isEmpty(data.version)) {
    errors.version = "Version is required!";
  }
  if (Validator.isEmpty(data.title)) {
    errors.title = "Title is required!";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

const moveContentValidator = (data, contentid) => {
  let errors = {};
  data.oldparentid = !isEmpty(data.oldparentid) ? data.oldparentid : "";
  data.newparentid = !isEmpty(data.newparentid) ? data.newparentid : "";

  if (!Validator.isMongoId(data.oldparentid)) {
    errors.oldparentid = "oldparentid must be a MongoId!";
  }
  if (Validator.isEmpty(data.oldparentid)) {
    errors.oldparentid = "oldparentid is required!";
  }
  if (!Validator.isMongoId(data.oldparentid)) {
    errors.newparentid = "newparentid must be a MongoId!";
  }

  if (Validator.isEmpty(data.newparentid)) {
    errors.newparentid = "newparentid is required!";
  }

  if (
    Validator.equals(data.newparentid, contentid) ||
    Validator.equals(data.oldparentid, contentid)
  ) {
    errors.contentid =
      "contentid must not be equal to newparentid or oldparentid";
  }
  if (data.position !== undefined) {
    data.position = !isEmpty(data.position) ? data.position : "";

    if (!Validator.isInt(data.position + "", { min: 0 })) {
      errors.position = "position must be an integer greater or equal to zero!";
    }
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

const addContentValidator = (data, parentid, file) => {
  let errors = {};
  data.type = !isEmpty(data.type) ? data.type : "";
  parentid = !isEmpty(parentid) ? parentid : "";
  if (Validator.isEmpty(parentid)) {
    errors.parentid = "parentid query parameter is required!";
  }
  if (data.position !== undefined) {
    data.position = !isEmpty(data.position) ? data.position : "";

    if (!Validator.isInt(data.position + "", { min: 0 })) {
      errors.position = "position must be an integer greater or equal to zero!";
    }
  }

  switch (data.type) {
    case "section":
      data.version = !isEmpty(data.version) ? data.version : "";
      data.title = !isEmpty(data.title) ? data.title : "";
      data.text = !isEmpty(data.text) ? data.text : "";
      if (Validator.isEmpty(data.version)) {
        errors.version = "version is required!";
      }
      if (Validator.isEmpty(data.title)) {
        errors.title = "title is required!";
      }
      break;
    case "sectionref":
      data.sectionref = !isEmpty(data.sectionref) ? data.sectionref : "";
      if (!Validator.isMongoId(data.sectionref)) {
        errors.sectionref = "sectionref must be a MongoId!";
      }
      if (Validator.isEmpty(data.sectionref)) {
        errors.sectionref = "sectionref is required!";
      }
      if (Validator.equals(data.sectionref, parentid)) {
        errors.sectionref = "sectionref must not be equal to parentid";
      }
      break;
    case "image":
      data.title = !isEmpty(data.title) ? data.title : "";
      if (Validator.isEmpty(data.title)) {
        errors.title = "title is required!";
      }
      if (!file) {
        errors.image = "image not found!";
      }
      break;
    case "paragraph":
      data.title = !isEmpty(data.title) ? data.title : "";
      data.text = !isEmpty(data.text) ? data.text : "";
      if (Validator.isEmpty(data.text)) {
        errors.text = "text is required!";
      }
      if (Validator.isEmpty(data.title)) {
        errors.title = "title is required!";
      }
      break;
    default:
      errors.type = "invalid content type";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

module.exports = {
  createSectionValidator,
  moveContentValidator,
  addContentValidator
};
