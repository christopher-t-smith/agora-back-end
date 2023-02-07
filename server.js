const express = require('express');
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose');
const Post = require('./models/postSchema');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());

mongoose.set('strictQuery', false);

const mongoDB = process.env.MONGODB_URI


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(mongoDB);
}

// Post Route
app.post('/api/posts', (req, res) => {
  console.log(req.body);
  if (!req.body.title || !req.body.body || !req.body.tags) {
    return res.status(400).json({ message: 'Bad request. Required properties are missing.' });
  }

  const newPost = new Post({
    title: req.body.title,
    media: {
      image: req.body.image || '',
      gifSearch: req.body.gifSearch || ''
    },
    body: req.body.body,
    tags: req.body.tags
  });

  // Save post to MongoDB database.
  newPost.save()
    .then(post => {
      res.status(201).json({
        message: "Post created successfully",
        post: post
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});