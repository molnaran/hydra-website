const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const expressValidator = require("express-validator");

const users = require("./routes/api/users");
const articlegroup = require("./routes/api/articlegroup");
const section = require("./routes/api/section");
const race = require("./routes/api/race");
const attribute = require("./routes/api/attribute");
const admin = require("./routes/api/admin");
const authMiddleware = require("./utils/authorizationMiddleware");

const app = express();

//Body Parser middleware
app.use("/uploads/", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const db = require("./config/keys").mondoURI;

mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log("MonboDB connected"))
  .catch(err => console.log(err));

//Passport middleware
app.use(passport.initialize());

//Passport Config
require("./config/passport")(passport);

app.use("/api/users", users);
app.use("/api/articlegroup", articlegroup);
app.use("/api/section", section);
app.use("/api/races", race);
app.use("/api/attribute", attribute);
app.use(
  "/api/admin",
  passport.authenticate("jwt", { session: false }),
  authMiddleware.hasPermissionLevel(3),
  admin
);

app.use((err, req, res, next) => {
  return res.json({ error: err.message });
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
