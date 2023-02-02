const express = require('express');
const app = express();
const { User, Kitten } = require('./db');
const bcrypt = require('bcrypt');
// require('dotenv').config();
const jwt = require('jsonwebtoken');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res, next) => {
  try {
    res.send(`
      <h1>Welcome to Cyber Kittens!</h1>
      <p>Cats are available at <a href="/kittens/1">/kittens/:id</a></p>
      <p>Create a new cat at <b><code>POST /kittens</code></b> and delete one at <b><code>DELETE /kittens/:id</code></b></p>
      <p>Log in via POST /login or register via POST /register</p>
    `);
  } catch (error) {
    console.error(error);
    next(error)
  }
});

// Verifies token with jwt.verify and sets req.user
// TODO - Create authentication middleware
app.use(async (req, res, next) => {
  const auth = req.header("Authorization");

  if (!auth) {
    next();
  } else {
    const [, token] = auth.split(' ');
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next()
  }
})

// POST /register
// OPTIONAL - takes req.body of {username, password} and creates a new user with the hashed password


// POST /login
// OPTIONAL - takes req.body of {username, password}, finds user by username, and compares the password with the hashed version from the DB

// GET /kittens/:id
// TODO - takes an id and returns the cat with that id
app.get('/kittens/:id', async (req, res, next) => {
  const kitten = await Kitten.findByPk(req.params.id);
  if (!req.user) {
    res.send(401);
  } else if (req.user.id !== kitten.ownerId) {
    res.send(401);
  } else {
    res.send({name: kitten.name, color: kitten.color, age: kitten.age});
  }
})

// POST /kittens
// TODO - takes req.body of {name, age, color} and creates a new cat with the given name, age, and color
app.post('/kittens/', async (req, res, next) => {
   if (!req.user) {
    res.send(401);
  } else {
    const {name, color, age} = req.body;
    const kitten = await Kitten.create({ownerId: req.user.id, name, color, age});
    res.status(201).send({name: kitten.name, age: kitten.age, color: kitten.color});
  }
})

// DELETE /kittens/:id
// TODO - takes an id and deletes the cat with that id
app.delete('/kittens/:id', async (req, res, next) => {
  const kitten = await Kitten.findByPk(req.params.id);
  if (!req.user) {
    res.send(401);
  } else if (req.user.id !== kitten.ownerId) {
    res.send(401);
  } else {
    await kitten.destroy()
    res.send(204)
  }
})

// error handling middleware, so failed tests receive them
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if (res.statusCode < 400) res.status(500);
  res.send({ error: error.message, name: error.name, message: error.message });
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
