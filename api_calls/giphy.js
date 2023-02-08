const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_KEY = process.env.GIPHY_API_KEY;

const getGifs = async (query) => {
  try {
    const res = await axios.get(
      `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${query}&limit=10`
    );
    return res.data.data;
  } catch (err) {
    console.error(err);
  }
};

module.exports = { getGifs };
