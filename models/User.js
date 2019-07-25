const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: false
  },
  permissionlevel: {
    type: Number,
    default: 1
  },
  date: {
    type: Date,
    default: Date.now
  },
  enabled: {
    type: Boolean,
    default: true
  }
});

/*
DB szinten vizsgálja mit adhat vissza az adott jogosultsági szintnél
const ACLPlugin = schema => {
  schema.query.checkPermissions = function(user) {
    if (user.permissionlevel == 2) {
      return this.select("-password");
    }
    return this.select("-date -password -enabled -permissionlevel");
  };
};
UserSchema.plugin(ACLPlugin);
*/
module.exports = User = mongoose.model("users", UserSchema);
