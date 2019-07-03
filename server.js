const express = require("express");
const mongoose = require("mongoose");

const users = require("./routes/api/users");
const history = require("./routes/api/history");

const app = express();

const db = require("./config/keys").mondoURI;

mongoose
  .connect(db)
  .then(() => console.log("MonboDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello");
});

app.use("/api/users", users);
app.use("/api/history", history);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
