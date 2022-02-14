const { Schema, model } = require('mongoose');
const Joi = require('joi');

const emailRegexp = /^\w+([\.-]?\w+)+@\w+([\.:]?\w+)+(\.[a-zA-Z0-9]{2,3})+$/;

const userSchema = Schema(
  {
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: emailRegexp,
    },
    subscription: {
      type: String,
      enum: ['starter', 'pro', 'business'],
      default: 'starter',
    },
    token: {
      type: String,
      default: null,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'user',
    },
    avatarURL: {
      type: String,
      default: '',
    },
  },
  { versionKey: false, timestamps: true }
);

const registerJoiSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
  subscription: Joi.string(),
});
const updateSubscriptionJoiSchema = Joi.object({
  _id: Joi.string(),
  subscription: Joi.string().valid('starter', 'pro', 'business'),
});

const User = model('user', userSchema);

const schemas = {
  register: registerJoiSchema,
  updateSubscription: updateSubscriptionJoiSchema,
};

module.exports = {
  User,
  schemas,
};
