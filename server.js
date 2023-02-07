const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const mongoose = require("mongoose");
const cors = require("cors");
const Post = require("./models/postSchema");
require("dotenv").config();

const app = express();

app.use(bodyParser.json());

// Use CORS middleware to allow request from origin of localhost:3000
app.use(cors({ origin: "http://localhost:3000" }));

mongoose.set("strictQuery", false);

const mongoDB = process.env.MONGODB_URI;

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongoDB);
}

// Post Route
app.post("/api/posts", (req, res) => {
  console.log(req.body);
  if (!req.body.title || !req.body.body || !req.body.tags) {
    return res
      .status(400)
      .json({ message: "Bad request. Required properties are missing." });
  }

  const newPost = new Post({
    title: req.body.title,
    media: {
      image: req.body.image || "",
      gifSearch: req.body.gifSearch || "",
    },
    body: req.body.body,
    tags: req.body.tags,
  });

  // Save post to MongoDB database.
  newPost
    .save()
    .then((post) => {
      res.status(201).json({
        message: "Post created successfully",
        post: post,
      });
    })
    .catch((err) => {
      console.log("Error:", err);
      res.status(500).json({
        error: err,
      });
    });
});

// Read Route
app.get("/api/posts", (req, res) => {
  Post.find()
    .then((posts) => {
      res.status(200).json({
        message: "Posts retrieved successfully",
        posts: posts,
      });
    })
    .catch((err) => {
      console.log("Error:", err);
      res.status(500).json({
        error: err,
      });
    });
});

// Update post by ID Route
app.put("/api/posts/:id", (req, res) => {
  const id = req.params.id;
  Post.findByIdAndUpdate(id, { $set: req.body }, { new: true })
    .then((post) => {
      if (!post) {
        return res.status(404).json({
          message: "Post not found with id " + id,
        });
      }
      res.status(200).json({
        message: "Post updated successfully",
        post: post,
      });
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).json({
          message: "Post not found with id " + id,
        });
      }
      return res.status(500).json({
        error: "Error updating post with id " + id,
      });
    });
});

// Delete post by ID Route
app.delete("/api/posts/:id", (req, res) => {
  const id = req.params.id;
  Post.findByIdAndRemove(id)
    .then((post) => {
      if (!post) {
        return res.status(404).json({
          message: "Post not found with id " + id,
        });
      }
      res.status(200).json({
        message: "Post deleted successfully",
        post: post,
      });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).json({
          message: "Post not found with id " + id,
        });
      }
      return res.status(500).json({
        error: "Error deleting post with id " + id,
      });
    });
});

app.listen(8000, () => {
  console.log("Server running on port 8000");
});
