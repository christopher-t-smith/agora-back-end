const { getGifs } = require("./api_calls/giphy");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const Post = require("./models/postSchema");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const app = express();
app.use(bodyParser.json());

app.use(cors({ origin: "https://benevolent-cupcake-0248d3.netlify.app/" }));

mongoose.set("strictQuery", false);

const mongoDB = process.env.MONGODB_URI;
// console.log(mongoDB);

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
    likes: req.body.likes,
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

//OpenAI Configuration

const openAIKey = process.env.OPEN_AI_API_KEY;
const configuration = new Configuration({
  organization: "org-l3B18t6h888LtkGbBSFiKguz",
  apiKey: openAIKey,
});
const openai = new OpenAIApi(configuration);

//ChatGPT Server-Side API
app.post("/chatgpt", async (req, res) => {
  const { message } = req.body;
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `${message}`,
    max_tokens: 100,
    temperature: 0.5,
  });
  res.json({
    message: response.data.choices[0].text,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on ${ process.env.PORT }`)
});
