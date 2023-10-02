//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 3000;
const _ = require("lodash");
const mongoose = require("mongoose");
const localhost = "127.0.0.1";
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const itemsSchema = new mongoose.Schema({
    name: String,
  });
  const Item = mongoose.model("Item", itemsSchema);
  const item1 = new Item({
    name: "Welcome to your todolist!",
  });
  const item2 = new Item({
    name: " HIt the + button to add a new item.",
  });
  const item3 = new Item({
    name: " <-- Hit  this to delete an item ",
  });
  const defaultItems = [item1, item2, item3];var foundItems =[];
  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
  });
  const List = mongoose.model("List", listSchema);
  if (foundItems.length===0) {
    await Item.insertMany(defaultItems)
      .then(function () {
        console.log("success in inserting");
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  app.get("/", async function (req, res) {
    try {
      foundItems = await Item.find({});
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    } catch (err) {
      console.log(err);
    }
  });

  app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName) ;
    const exist = await List.findOne({ name: customListName });
    if (exist) {
      res.render("list", { listTitle: exist.name, newListItems: exist.items });
    } else if (customListName !== "favicon.ico") {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      await list.save();
      res.redirect(`/${customListName}`);
    }
  });

  app.post("/", async function (req, res) {
    const itemNew = req.body.newItem;
    const listName = req.body.list;
    const itemtoadd = new Item({
      name: itemNew,
    });
    if(listName === "Today"){
      await itemtoadd.save()
      .then(function () {
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
    }else{
      const foundOne = await List.findOne({name : listName});
      foundOne.items.push(itemtoadd);
      await foundOne.save();
      res.redirect("/"+ listName);
    }
    
  });

  app.post("/delete", async function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName =req.body.list;
    if(listName ==="Today"){
      await Item.deleteOne({ _id: checkedItemId })
      .then(function () {
        console.log("successfully deleted!");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    }else{
      await List.findOneAndUpdate({name : listName},{$pull : {items : {_id : checkedItemId}}})
      .then(function(){console.log("success in findOneAndUpdate!")})
      .catch(function(err){console.log(err);})
      res.redirect("/"+listName);
    }
    
  });

  app.get("/about", function (req, res) {
    res.render("about");
  });

  app.listen(PORT, function () {
    console.log("Server started on port 3000");
  });
}
