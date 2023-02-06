
const express = require('express');
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const app = express();

MongoClient.connect('mongodb+srv://agora1:TLGlearning@cluster0.hrrhqut.mongodb.net/?retryWrites=true&w=majority', {
    useUnifiedTopology: true
    
});   

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

