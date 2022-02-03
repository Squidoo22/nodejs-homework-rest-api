/* eslint-disable new-cap */
const express = require('express');
const { CreateError } = require('http-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User, schemas } = require('../../models/user');

const { SECRET_KEY } = process.env;

const { authMiddleware } = require('../../middlewares');

const router = express.Router();

router.post('signup', async (req, res, next) => {
  try {
    const { error } = schemas.user.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new CreateError(409, 'Email in use');
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    await User.create({ email, password: hashPassword });
    res.status(201).json({
      user: {
        email,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error } = schemas.user.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }
    const { email, password } = req.body;
    const user = User.findOne({ email });
    const comparePassword = await bcrypt.compare(password, user.password);
    if (!user || !comparePassword) {
      throw new CreateError(401, 'Email or password is wrong');
    }

    const payload = {
      id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '2h' });
    res.json({
      token,
      user: {
        email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/logout', authMiddleware, async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.status(204).send();
});

router.get('/current', authMiddleware, async (req, res, next) => {
  const { email, subscription } = req.user;
  res.json({
    user: {
      email,
      subscription,
    },
  });
});

router.patch('/', authMiddleware, async (req, res, next) => {
  try {
    const { error } = schemas.user.validate();
    if (error) throw new CreateError(400, error.message);
    const { contactId, subscription = 'starter' } = req.params;
    const updateUser = await User.findByIdAndUpdate(
      contactId,
      { subscription },
      {
        new: true,
      }
    );
    res.json(updateUser);
  } catch (error) {
    next(error);
  }
});

router.module.exports = router;
