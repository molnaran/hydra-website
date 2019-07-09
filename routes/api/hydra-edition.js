const express = require("express");
const router = express.Router();
const HydraEdition = require("../../models/HydraEdition");
const Section = require("../../models/Section");
const Paragraph = require("../../models/Paragraph");
const Image = require("../../models/Image");

//@route    GET api/hydra/:id
//@desc     Login user / Returning the JWT
//@access   Public
router.get("/:id", (req, res) => {
  HydraEdition.findOne({ _id: req.params.id }).then(hydra => {
    res.json(hydra);
  });
});

//@route    POST api/hydra/create
//@desc     Login user / Returning the JWT
//@access   Public
router.post("/section", (req, res) => {
  const newSection = new Section({
    version: req.body.version,
    title: req.body.title
  });
  newSection
    .save()
    .then(section => {
      if (req.body.parentId) {
        const sectionRef = { title: section.title, ref: section._id };
        console.log(sectionRef);
        Section.findByIdAndUpdate(
          req.body.parentId,
          { $push: { content: sectionRef } },
          { upsert: true, useFindAndModify: false },
          function(err, doc) {
            if (err) return res.send(500, { error: err });
            return res.json(doc);
          }
        );
      } else {
        return res.send("succesfully saved");
      }
    })
    .catch(err => console.log(err));
});

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
router.post("/addparagraph", (req, res) => {
  const newParagraph = new Paragraph({
    title: "First Paragraph",
    text: "Lorem ipsum"
  });
  HydraEdition.updateOne(
    { version: req.body.version },
    { $push: { content: newParagraph } },
    { upsert: true },
    function(err, doc) {
      if (err) return res.send(500, { error: err });
      return res.send("succesfully saved");
    }
  );
});

//@route    POST api/hydra/add
//@desc     Login user / Returning the JWT
//@access   Public
router.post("/addsection", (req, res) => {
  const newSection = new Section({
    version: req.body.version,
    title: "Lorem ipsum"
  });
  var sectionReference = { title: newSection.title, ref: newSection._id };
  newSection
    .save()
    .then(newSection =>
      HydraEdition.updateOne(
        { version: req.body.version },
        { $addToSet: { content: sectionReference } },
        { upsert: true },
        function(err, doc) {
          if (err) return res.send(500, { error: err });
          return res.send("succesfully saved");
        }
      )
    )
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: "error" });
    });
});
/*
//@route    POST api/hydra/add
//@desc     Login user / Returning the JWT
//@access   Public
router.post("/addimage2", (req, res) => {
  const newImage = new Image({
    title: "Lorem ipsum",
    path: "d:/asdf/dasd"
  });
  newImage
    .save()
    .then(newImage =>
      HydraEdition.updateOne(
        { version: req.body.version },
        { $addToSet: { content: newImage } },
        { upsert: true },
        function(err, doc) {
          if (err) return res.send(500, { error: err });
          return res.send("succesfully saved");
        }
      )
    )
    .catch(err => console.log(err));
});
*/
//@route    POST api/hydra/add
//@desc     Login user / Returning the JWT
//@access   Public
router.post("/addimage", (req, res) => {
  const newImage = new Image({
    title: "Lorem ipsum",
    path: "d:/asdf/dasd"
  });
  HydraEdition.updateOne(
    { version: req.body.version },
    { $addToSet: { content: newImage } },
    { upsert: true },
    function(err, doc) {
      if (err) return res.send(500, { error: err });
      return res.send("succesfully saved");
    }
  );
});

//@route    POST api/hydra/add
//@desc     Login user / Returning the JWT
//@access   Public
router.delete("/removecontent", (req, res) => {
  Section.updateOne(
    { _id: req.body.sectionid },
    { $pullAll: { content: [req.body.contentid] } },
    function(err, doc) {
      if (err) return res.send(500, { error: err });
      return res.send("succesfully saved");
    }
  );
});

module.exports = router;
