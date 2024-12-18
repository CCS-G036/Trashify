// Import package
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Import routes
const mainRoutes = require('./src/routes/main');

// initialize server and db
const app = express();
const port = process.env.PORT || 5000;
const dbUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;

// Middleware for parsing body from request
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// setup view engine using ejs
app.use(express.static(path.join(__dirname, './src/views')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './src/views'));

// initiate cookie
app.use(cookieParser());
app.use('/', mainRoutes);

// Connect db
mongoose.connect(dbUrl + dbName)
    .then(() => {
        console.log('DB connected:', dbName);
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

// Run server
app.listen(port, () => console.log('Server running:', port));