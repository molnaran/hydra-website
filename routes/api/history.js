const express = require("express");
const router = express.Router();

//@route    GET api/history/test
//@desc     Tests history route
//@access   Public
router.get("/test", (req, res) => res.json({ msg: "History router works!" }));

module.exports = router;
