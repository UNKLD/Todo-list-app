require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoUri = process.env.DB_URL;
try {
  mongoose.connect(mongoUri, function (err) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("DB Connected");
  });
} catch (error) {
  console.log(error);
}

//Mongoose schemas
const itemsSchema = mongoose.Schema({
  name: String,
});
const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

//Mongoose models
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const defaultItems = [
  new Item({ name: "Welcome to your Todolist" }),
  new Item({ name: "Hit the + button to add new Todo" }),
  new Item({ name: "<-- Hit this to delete a todo" }),
];

app.get("/", async function (_req, res) {
  const items = await Item.find();
  if (items.length === 0) {
    await Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: items });
  }
});

app.post("/", async function (req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: newItem,
  });

  if (listName === "Today") {
    try {
      await item.save();
      res.redirect("/");
    } catch (error) {
      console.log(error);
      res.send("error");
    }
  } else {
    const foundList = await List.findOne({ name: listName });
    try {
      await foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (error) {
      console.log(error);
      res.send("<h1>Error</h1>");
    }
  }
});

app.post("/delete", async (req, res) => {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today") {
    try {
      await Item.deleteOne({ _id: itemId });
      res.redirect("/");
    } catch (error) {
      res.send("Error");
    }
  } else {
    try {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: itemId } } }
      );
      res.redirect("/" + listName);
    } catch (error) {
      res.send("Error");
    }
  }
});

app.get("/:customList", async function (req, res) {
  const customListName = _.capitalize(req.params.customList);
  const customList = await List.findOne({ name: customListName });
  if (!customList) {
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", {
      listTitle: customList.name,
      newListItems: customList.items,
    });
  }
});

app.get("/about", function (_req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
