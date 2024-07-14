const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const cors = require('cors');
const db = require('./db');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const { v4: uuidv4 } = require('uuid');

const SECRET_KEY = 'your_secret_key';
const PASSWORD = '123'; // Replace with your desired password

const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                res.status(401).send('Unauthorized');
            } else {
                req.user = decoded;
                next();
            }
        });
    } else {
        res.status(401).send('Unauthorized');
    }
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.post('/login', (req, res) => {
    const { password } = req.body;

    if (password === PASSWORD) {
        const token = jwt.sign({ user: 'admin' }, SECRET_KEY, { expiresIn: '1h' });

        res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour
        res.status(200).send('Login successful');
    } else {
        res.status(401).send('Invalid password');
    }
});

app.get('/login', (req, res) => {
    let options = {
        root: path.join(__dirname)
    }
    res.sendFile('login.html', options);
});

app.get('/admin', authenticate, (req, res) => {
    let options = {
        root: path.join(__dirname)
    }

    res.sendFile("admin.html", options);
});

app.post('/create-user', authenticate, (req, res) => {
    const { name } = req.body;

    db.createUser(name, (token) => {
        res.status(200).send(token);
    });
});

app.post('/delete-user', authenticate, (req, res) => {
    const { id } = req.body;

    db.deleteUser(id);
    res.sendStatus(200);
});

app.post('/delete-post', authenticate, (req, res) => {
    const { id } = req.body;

    db.deletePost(id);
    res.sendStatus(200);
});

app.get('/users', (req, res) => {
    db.getAllUsers((data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data, null, 1));
    });
});

app.get('/posts', (req, res) => {
    let { page, pageSize } = req.query;

    page = page || 0;
    pageSize = pageSize || 20;

    if (page < 0) {
        return res.status(400).send("Invalid page, cannot have negative page.");
    }

    pageSize = Math.min(Math.max(pageSize, 1), 50);

    db.getPosts(pageSize, page, (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data, null, 1));
    });
});

app.post('/post', async (req, res) => {
    const { token, message } = req.body;

    if (token === undefined || message === undefined) {
        return res.sendStatus(400);
    }

    let user = await db.getUserFromToken(token);

    if (user === undefined) {
        return res.sendStatus(401);
    }

    let id = db.createPost(user.id, message);
    res.status(200).send(id);
});

app.delete('/post', async (req, res) => {
    const { token, id } = req.body;

    let user = await db.getUserFromToken(token);
    let post = await db.getPost(id);

    if (user === undefined) {
        res.sendStatus(401);
    }

    if (post === undefined) {
        res.sendStatus(404);
    }

    if (post.userid !== user.id) {
        res.sendStatus(401);
    }

    db.deletePost(id);
    res.sendStatus(200);
});

app.get('/display', (req, res) => {
    let options = {
        root: path.join(__dirname)
    }
    res.sendFile('display.html', options);
})

server.listen(8045, () => console.log("Lisening on port :8045"));
