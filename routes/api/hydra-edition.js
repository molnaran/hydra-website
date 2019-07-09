const express = require("express");
const router = express.Router();
const HydraEdition = require("../../models/HydraEdition");
const Section = require("../../models/Section");

//@route    POST api/hydra/add
//@desc     Login user / Returning the JWT
//@access   Public
router.post("/add", (req, res) => {
  const newHydra = new HydraEdition({
    version: "1.1.0.ALPHA"
  });
  newHydra
    .save()
    .then(user => res.json(user))
    .catch(err => console.log(err));
});

//@route    POST api/hydra/add
//@desc     Login user / Returning the JWT
//@access   Public
router.post("/addsection", (req, res) => {
  HydraEdition.updateOne(
    { version: req.body.version },
    { $push: { sections: "alma" } },
    { upsert: true },
    function(err, doc) {
      if (err) return res.send(500, { error: err });
      return res.send("succesfully saved");
    }
  );
});

module.exports = router;
