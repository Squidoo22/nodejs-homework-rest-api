/* eslint-disable no-useless-catch */
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const { SEND_GRID_KEY } = process.env;

sgMail.setApiKey(SEND_GRID_KEY);

const sendMail = async (data) => {
  try {
    const mail = { ...data, from: 'kolotilin890@gmail.com' };
    await sgMail.send(mail);
    return true;
  } catch (err) {
    throw err;
  }
};

module.exports = sendMail;
