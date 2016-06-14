var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var POSTS_COLLECTION = "posts";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect('mongodb://localhost:27017/posts', function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8088, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// POSTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/posts"
 *    GET: finds all posts
 *    POST: creates a new post
 */

app.get("/posts", function(req, res) {
  db.collection(POSTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/posts", function(req, res) {
  var newPost = req.body;
  newPost.createDate = new Date();

  if (!(req.body.title || req.body.content)) {
    handleError(res, "Invalid user input", "Must provide a first or last name.", 400);
  }

  db.collection(POSTS_COLLECTION).insertOne(newPost, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new post.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*  "/posts/:id"
 *    GET: find post by id
 *    PUT: update post by id
 *    DELETE: deletes post by id
 */

app.get("/posts/:id", function(req, res) {
  db.collection(POSTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get post");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/posts/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(POSTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update post");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/posts/:id", function(req, res) {
  db.collection(POSTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete post");
    } else {
      res.status(204).end();
    }
  });
});