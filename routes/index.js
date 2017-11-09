'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db');

module.exports = function makeRouterWithSockets (io) {
  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT * FROM tweets', function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      //console.log(result.rows);    /*******/
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    var queries = 'SELECT * FROM users JOIN tweets ON users.id = tweets.user_id WHERE users.name = $1';
    client.query(queries, [req.params.username], function(err, result){
      if(err) return next(err);
      var tweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true,
        username: req.params.username
      });
    })
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var queries = 'SELECT * FROM users JOIN tweets ON users.id = tweets.user_id WHERE users.id = $1';
    client.query(queries, [req.params.id], function(err, result){
      if(err) return next(err);
      var tweets = result.rows;
      console.log("Tweets! ", tweets);
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets
      });
    })
  });

  // create a new tweet with correct UserID
  router.post('/tweets', function(req, res, next){
    var name = req.body.name, content = req.body.content;
    console.log("content1 ", content);
    var queries = 'INSERT INTO users (name) VALUES ($1) returning *';
    client.query(queries, [name], function(err, result){
      //insert tweet using result.rows[0].id as user_id
      //once I have the newly created tweet - emit new_tweet and redirect
      var usersID = result.rows[0].id;
      var queries1 = 'INSERT INTO tweets (user_id, content) VALUES ($1, $2)';
      console.log("content2 ", content);      
      client.query(queries1, [usersID, content], function (err, data) {
        console.log("content3 ", content);        
        var newTweet = {name: name, content: content};
        io.sockets.emit('new_tweet', newTweet);
        res.redirect('/');
      });
    });
    
  });

  // // create a new tweet
  // router.post('/tweets', function(req, res, next){
  //   var newTweet = tweetBank.add(req.body.name, req.body.content);
  //   io.sockets.emit('new_tweet', newTweet);
  //   res.redirect('/');
  // });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
