/* eslint-disable new-cap */
const express = require('express');
const { CreateError } = require('http-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');
const { v4 } = require('uuid');
const sendMail = require('../../utils/sendMail');

const { User, schemas } = require('../../models/user');

const { SECRET_KEY } = process.env;

const { authMiddleware, uploadMiddleware } = require('../../middlewares');

const router = express.Router();

const avatarDir = path.join(__dirname, '../../', 'public', 'avatars');

router.post('/signup', async (req, res, next) => {
  try {
    const { error } = schemas.register.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }
    const { email, password, subscription } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new CreateError(409, 'Email in use');
    }
    const avatarURL = gravatar.url(email);
    const verificationToken = v4();
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    await User.create({
      email,
      password: hashPassword,
      subscription,
      avatarURL,
      verificationToken,
    });
    const mail = {
      to: email,
      subject: 'Email verification',
      html: `<a target="_blank" href='http://localhost:3000/api/users/verify/${verificationToken}'>Click to verify your email</a>`,
    };
    await sendMail(mail);
    res.status(201).json({
      user: {
        email,
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error } = schemas.register.validate(req.body);
    if (error) {
      throw new CreateError(400, error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new CreateError(401, 'Email or password is wrong');
    }
    const compareResult = await bcrypt.compare(password, user.password);
    if (!compareResult) {
      throw new CreateError(401, 'Email or password is wrong');
    }
    if (!user.verify) {
      throw new CreateError(401, 'Email not verify');
    }
    const payload = {
      id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
    await User.findByIdAndUpdate(user._id, { token });
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

router.patch(
  '/avatars',
  authMiddleware,
  uploadMiddleware.single('avatar'),
  async (req, res, next) => {
    if (!req.file) {
      throw new CreateError(400, 'Please upload file');
    }
    const { path: tempUpload, filename } = req.file;

    const image = await Jimp.read(tempUpload);
    await image.resize(250, 250);
    await image.writeAsync(tempUpload);

    const [extension] = filename.split('.').reverse();
    const newFileName = `${req.user._id}.${extension}`;
    const fileUpload = path.join(avatarDir, newFileName);

    await fs.rename(tempUpload, fileUpload);
    const avatarURL = path.join('avatars', newFileName);
    await User.findByIdAndUpdate(
      req.user_id,
      {
        avatarURL,
      },
      { new: true }
    );
    res.json({ avatarURL });
  }
);

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

router.get('/verify/:verificationToken', async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) throw new CreateError(404, 'User not found');

    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: null,
    });
    res.status(200).json('Verification successful');
  } catch (err) {
    next(err);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { error } = schemas.verifyEmail.validate(req.body);
    if (error) {
      throw CreateError(400, 'missing required field email');
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user.verify) {
      throw CreateError(400, 'Verification has already been passed');
    }
    const mail = {
      to: email,
      subject: 'Verify email',
      html: `<a target="_blank" href='http://localhost:3000/api/users/verify/${user.verificationToken}'>Click to verify your email</a>`,
    };
    await sendMail(mail);
    res.status(200).json('Verification email sent');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
