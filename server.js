const { getGifs } = require("./api_calls/giphy");
const express = require("express");
const bodyParser = require("body-parser");
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

// Giphy API Endpoint
app.post("/api/giphy", async (req, res) => {
  const { query } = req.body;
  const results = await getGifs(query);
  res.send({ data: results });
});

// Post Route
app.post("/api/posts", async (req, res) => {
  console.log(req.body);
  if (!req.body.title || !req.body.body || !req.body.tags) {
    return res
      .status(400)
      .json({ message: "Bad request. Required properties are missing." });
  }

  // Save post to MongoDB database.
  const newPost = new Post({
    username: req.body.username,
    email: req.body.email,
    title: req.body.title,
    media: {
      gifSearch: req.body.media.gifSearch || "",
    },
    body: req.body.body,
    tags: req.body.tags,
  });

  try {
    const post = await newPost.save();
    res.status(201).json({
      message: "Post created successfully",
      post: post,
    });
  } catch (err) {
    console.log("Error:", err);
    res.status(500).json({
      error: err,
    });
  }
});

// Read Route
app.get("/api/posts", async (req, res) => {
  try {
    const retrievedPosts = await Post.find();
    res.status(200).json({
      message: "Posts retrieved successfully",
      posts: retrievedPosts,
    });
  } catch (err) {
    console.log("Error:", err);
    res.status(500).json({
      error: err,
    });
  }
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
