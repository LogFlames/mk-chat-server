const MongoClient = require('mongodb').MongoClient;
const { v4: uuidv4 } = require('uuid');
const url = "mongodb://localhost:27017";

var _db;

MongoClient.connect(url).then((client) => {
    _db = client.db('mk-chat-server');
    if (_db === undefined) {
        console.log("No existing database"); 
    } else {
        console.log("Connected to database")
    }
}).catch((err) => {
    throw err;
});

module.exports = {
    createUser: async function(name, callback) {
        let token = uuidv4();
        let maxId = await _db.collection('users').find({},{projection:{id: true, _id: false}}).sort({id: -1}).limit(1).toArray();
        if (maxId.length == 0) {
            maxId = -1;
        } else {
            maxId = maxId[0]['id'];
        }
        _db.collection('users').insertOne({name: name, token: token, id: maxId + 1 });
        callback(token);
    },
    deleteUser: function(id) {
        _db.collection('users').findOneAndDelete({"id": +id});
    },
    deletePost: function(id) {
        _db.collection('posts').findOneAndDelete({"id": id});
    },
    getAllUsers: function(callback) {
        _db.collection('users').find({},{projection:{_id: false, token: false}}).toArray().then(result => {
            callback(result)
        });
    },
    getPosts: function(pageSize, page, callback) {
        _db.collection('posts').find({},{projection:{_id: false}}).sort({createat: -1}).skip(page * pageSize).limit(pageSize).toArray().then(result => {
            callback(result);
        });
    },
    getAllPosts: function(callback) {
        _db.collection('posts').find({},{projection:{_id: false}}).sort({createat: -1}).toArray().then(result => {
            callback(result);
        });
    },
    getPost: async function(id) {
        let posts = await _db.collection('posts').find({ id }).toArray();
        return posts[0];
    },
    getUserFromToken: async function(token) {
        let users = await _db.collection('users').find({ token }).toArray();
        return users[0];
    },
    createPost: function(userid, message) {
        let id = uuidv4();
        let now = Date.now();
        _db.collection('posts').insertOne({id: id, userid: userid, message: message, createat: now});
        return id;
    }
}
