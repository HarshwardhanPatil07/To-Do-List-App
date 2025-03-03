const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://pisinside:harshwardhan@cluster0.foym1.mongodb.net/todolistDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//// ITEM SCHEMA ////
const itemsSchema = { name: String };
const Item = mongoose.model("Item", itemsSchema);

//// DEFAULT ITEMS ////
const item1 = new Item({ name: "Type a new item below" });
const item2 = new Item({ name: "Click the + button to add the new item" });
const item3 = new Item({ name: "<--Click this to delete an item" });
const defaultItems = [item1, item2, item3];

//// CUSTOM LIST ITEM SCHEMA ////
const listSchema = { name: String, items: [itemsSchema] };
const List = mongoose.model("List", listSchema);

////// HOME ROUTE //////
app.get("/", async (req, res) => {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to DB");
      return res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
  }
});

///// ADD NEW ITEM /////
app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({ name: itemName });

  if (itemName !== "") {
    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    }
  }
});

///// CUSTOM LIST ROUTE /////
app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  try {
    let foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      foundList = new List({ name: customListName, items: defaultItems });
      await foundList.save();
      return res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.error(err);
  }
});

//// DELETE ITEM ////
app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  try {
    if (listName === "Today") {
      // Replaced findByIdAndRemove with findByIdAndDelete
      await Item.findByIdAndDelete(checkedItemId);
      console.log("Successfully deleted item");
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.error(err);
  }
});

let port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server has started successfully!");
});
