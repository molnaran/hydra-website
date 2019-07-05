const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");

const users = require("./routes/api/users");
const history = require("./routes/api/history");
const hydra = require("./routes/api/hydra-edition");

const app = express();

//Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const db = require("./config/keys").mondoURI;

mongoose
  .connect(db)
  .then(() => console.log("MonboDB connected"))
  .catch(err => console.log(err));

//Passport middleware
app.use(passport.initialize());

//Passport Config
require("./config/passport")(passport);

app.use("/api/users", users);
app.use("/api/history", history);
app.use("/api/hydra", hydra);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
