const express = require("express");
const router = express.Router();
const HydraEdition = require("../../models/HydraEdition");
const Section = require("../../models/Section");
const Paragraph = require("../../models/Paragraph");
const Image = require("../../models/Image");
var ObjectId = require("mongoose").Types.ObjectId;

//@route    GET api/hydra/:id
//@desc     Finding and returning section with specified id
//@access   Public
router.get("/:id", (req, res) => {
  Section.findOne({ _id: req.params.id }).then(section => {
    res.json(section);
  });
});

//@route    POST api/hydra/:id?/section
//@desc     Add section to s
//@access   Public
router.post("/:id?/section", (req, res) => {
  const newSection = new Section({
    version: req.body.version,
    title: req.body.title
  });
  newSection
    .save()
    .then(section => {
      const parentid =
        req.params.id !== undefined || req.params.id == "root"
          ? req.params.id
          : "root";
      const sectionRef = {
        title: section.title,
        _id: new ObjectId(section._id)
      };
      var position;
      if (req.body.position !== null || req.body.position !== undefined) {
        position = req.body.position;
      }
      if (parentid === "root") {
        return res.json(section);
      } else {
        addSectionRef(sectionRef, parentid, position, (err, section) => {
          if (err) return res.send(500, { error: err });
          section.parentid = parentid;
          return res.json(section);
        });
      }
    })
    .catch(err => console.log(err));
});

const addSectionRef = (sectionRef, parentid, position, callback) => {
  if (sectionRef === null) throw new Error("Section not found!");
  const section = {
    title: sectionRef.title,
    _id: new ObjectId(sectionRef._id)
  };

  var modifiers = {
    content: { $each: [section] }
  };
  if (Number.isInteger(position)) {
    modifiers.content.$position = position;
  }
  Section.findByIdAndUpdate(
    parentid,
    { $push: modifiers },
    { upsert: true, useFindAndModify: false, new: true },
    (err, section) => callback(err, sectionRef)
  );
};
/*
router.put("/section/:id", (req, res) => {
  const oldParent = req.body.oldparent;
  const newParent = req.body.newparent;
  Section.findById(req.params.id, function(err, section) {
    var sectionRef = { _id: section._id, title: section.title };
    Section.findByIdAndUpdate(
      oldParent.id,
      { $pull: { content: sectionRef._id } },
      { multi: true, useFindAndModify: false, new: true },
      function(err, doc) {
        if (err) return res.send(500, { error: err });
        if (newParent.id !== null || newParent.id !== undefined) {
          var postion = newParent.position;
          addSubsection(sectionRef, newParent.id, postion, (err, section) => {
            if (err) {
              return res.send(500, { error: err });
            } else {
              return res.json(section);
            }
          });
        } else {
          return res.json(doc);
        }
      }
    );
  });
});
*/
/*
router.put("/section/:id", (req, res) => {
  const oldParent = req.body.oldparent;
  const newParent = req.body.newparent;
  Section.findByIdAndUpdate(
    oldParent.id,
    {
      $pull: {
        content: { _id: new ObjectId(req.params.id) }
      }
    },
    { multi: true, useFindAndModify: false, new: true },
    function(err, doc) {
      if (err) return res.send(500, { error: err });
      if (newParent.id !== null || newParent.id !== undefined) {
      }
      return res.json(doc);
    }
  );
});
*/
/*
// Moving subdocument with oldparent.id and newparent.id
router.put("/section/:id", (req, res) => {
  const oldParent = req.body.oldparent;
  const newParent = req.body.newparent;
  Section.findById(oldParent.id, function(err, section) {
    if (section !== null) {
      var removeItems = [];
      var remainingItems = [];
      section.content.forEach(element => {
        if (element._id == req.params.id) {
          removeItems.push(element);
        } else {
          remainingItems.push(element);
        }
      });
      section.content = remainingItems;
      section.save(err => {
        console.log(err);
      });
    }
    if (newParent !== undefined && removeItems.length > 0) {
      addSubsection(
        removeItems[0],
        newParent.id,
        newParent.position,
        (err, section) => {
          return res.json(section);
        }
      );
    } else {
      return res.json(removeItems[0]);
    }
  });
});
*/
// The section endpoint should only be responsible for handling sections (no images, no paragraphs, etc.)
router.put("/section/:id", (req, res) => {
  const newParent = req.body.newparent;
  var moveSection;

  //Trying to find parent
  Section.findOne({ "content._id": new ObjectId(req.params.id) }).then(
    section => {
      if (section != null) {
        //No parent found => It's a section on the root
        var removeItems = [];
        var remainingItems = [];
        section.content.forEach(element => {
          if (element._id == req.params.id) {
            removeItems.push(element);
          } else {
            remainingItems.push(element);
          }
        });
        section.content = remainingItems;

        moveSection = removeItems.length > 0 ? removeItems[0] : null;
        section.save(err => {
          console.log(err);
          return;
        });
        addSectionRef(
          moveSection,
          newParent.id,
          newParent.position,
          (err, section) => {
            if (err) return res.send(500, { error: err });
            return res.json(section);
          }
        );
      } else {
        // Section must be on the root, we need to find it for the needed values ()
        Section.findById(req.params.id).then(section => {
          moveSection = section !== null ? section : null;
          addSectionRef(
            moveSection,
            newParent.id,
            newParent.position,
            (err, section) => {
              if (err) return res.send(500, { error: err });
              return res.json(section);
            }
          );
        });
      }
    }
  );
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
  const position = req.body.position;
  addSubsection(newParagraph, req.body.parentId, position, (err, section) => {
    if (err) return res.send(500, { error: err });
    return res.json(section);
  });
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
