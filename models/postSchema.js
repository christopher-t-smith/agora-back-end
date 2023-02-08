const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  title: { type: String, required: true },
  media: {
    gifSearch: { type: String },
  },
  body: { type: String},
  tags: { type: [String], required: true },
});

// Require either body or GIF
PostSchema.path('body').validate(function(body) {
    return this.body || this.gifSearch;
  }, 'Body and/or GIF is required');

// Export model
module.exports = mongoose.model("Post", PostSchema);