const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  title: { type: String, required: true },
  media: {
    image: { type: String },
    gifSearch: { type: String }
  },
  body: { type: String},
  tags: { type: [String], required: true },
});

// Require either body or media
PostSchema.path('body').validate(function(body) {
    return this.body || this.media.image || this.media.gifSearch;
  }, 'Body or Media is required');

// Export model
module.exports = mongoose.model("Post", PostSchema);