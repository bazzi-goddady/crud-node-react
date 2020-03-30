const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const authConfig = require('../config/auth');

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400
  });
}

router.get('/users', async(req, res) => {
  try {
    const users = await User.find();

    return res.json(users);

  } catch (error) {
    return res.status(400).send({ error: 'Failed to find the users' });
  }
});

router.post('/register', async(req, res) => {
  const { email } = req.body;

  try {
    if (await User.findOne({ email })) {
      return res.status(400).send({ error: 'User already exists.' });
    }

    const user = await User.create(req.body);

    user.password = undefined;

    return res.send({ 
      user, 
      token: generateToken({ id: user.id }) 
    });

  } catch (error) {
    return res.status(400).send({ error: 'Registration failed' });
  }
});

router.post('/authenticate', async(req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(400).send({ error: 'User not found' });
  }

  if (!await bcrypt.compare(password, user.password)) {
    return res.status(400).send({ error: 'Invalid password' });
  }

  user.password = undefined;

  res.send({ 
    user, 
    token: generateToken({ id: user.id }) 
  });
});

module.exports = app => app.use('/auth', router);