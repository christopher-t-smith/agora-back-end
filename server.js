const getGifs = require("./api_calls/giphy").getGifs;
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const Post = require("./models/postSchema");
const multer = require("multer");
const fs = require("fs");
const { promisify } = require("util");
const readFileAsync = promisify(fs.readFile);
const Grid = require("gridfs-stream");
require("dotenv").config();

let gfs;

const app = express();

app.use(bodyParser.json());

// Use CORS middleware to allow request from origin of localhost:3000
app.use(cors({ origin: "http://localhost:3000" }));

mongoose.set("strictQuery", false);

const mongoDB = process.env.MONGODB_URI;

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongoDB);

  mongoose.connection.once("open", () => {
    gfs = Grid(mongoose.connection.db, mongoose.mongo);
    gfs.collection("posts");
  });
}

// Configure storage mechanism with multer for uploading files set file name format.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Giphy API Endpoint
app.post("/api/giphy", async (req, res) => {
  const { query } = req.body;
  const results = await getGifs(query);
  res.send({ data: results });
});

// Post Route
app.post("/api/posts", upload.single("image"), async (req, res) => {
  console.log(req.body);
  if (!req.body.title || !req.body.body || !req.body.tags) {
    return res
      .status(400)
      .json({ message: "Bad request. Required properties are missing." });
  }

  // Create a write stream to store the image file.
  if (req.file) {
    const writestream = gfs.createWriteStream({
      filename: req.file.filename,
      metadata: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      },
    });
    fs.createReadStream(req.file.path).pipe(writestream);
    writestream.on("finish", () => {
      console.log("Image successfully stored in the database");
    });
  } else if (req.body.image) {
    const writestream = gfs.createWriteStream({
      filename: req.body.image.filename,
      metadata: {
        originalname: req.body.image.originalname,
        mimetype: req.body.image.mimetype,
      },
    });
    fs.createReadStream(req.body.image.path).pipe(writestream);
    writestream.on("finish", () => {
      console.log("Image successfully stored in the database");
    });
  }  

  // Save post to MongoDB database.
  const newPost = new Post({
    username: req.body.username,
    email: req.body.email,
    title: req.body.title,
    media: {
      image: {
        filename: req.file ? req.file.filename : "",
        metadata: req.file
          ? {
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
            }
          : {},
      },
      gifSearch: req.body.gifSearch || "",
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
  // Decode Base64 string back to binary data and convert it back to an image format.
  try {
    const retrievedPosts = await Post.find();
    const posts = await Promise.all(
      retrievedPosts.map(async (post) => {
        if (req.body.image) {
          req.body.image = new Buffer.from(req.body.image, "base64");
        }
        return post;
      })
    );

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
