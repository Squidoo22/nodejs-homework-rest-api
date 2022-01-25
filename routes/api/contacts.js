const express = require('express');
const { CreateError } = require('http-errors');
const Joi = require('joi');

const router = express.Router();

const contactsOperation = require('../../models/contacts');

const joiShema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
});

router.get('/', async (req, res, next) => {
  try {
    const contacts = await contactsOperation.listContacts();
    res.json(contacts);
  } catch (e) {
    next(e);
  }
});

router.get('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await contactsOperation.getContactById(contactId);
    if (!contact) {
      throw new CreateError(404, 'Not found');
    }
    res.json(contact);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { error } = joiShema.validate();
    if (error) throw new CreateError(400, 'missing required name field');
    const newContact = await contactsOperation.addContact(req.body);
    if (!newContact) throw new CreateError(404, 'Not found');
    res.status(201).json(newContact);
  } catch (e) {
    next(e);
  }
});

router.delete('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const deleteContact = await contactsOperation.removeContact(contactId);
    if (!deleteContact) throw new CreateError(404, 'Not found');
    res.json({ message: 'contast was deleted', deleteContact });
  } catch (e) {
    next(e);
  }
});

router.put('/:contactId', async (req, res, next) => {
  try {
    const { error } = joiShema.validate();
    if (error) throw new CreateError(400, error.message);
    const { contactId } = req.params;
    const updateContact = contactsOperation.updateContact(contactId, req.body);
    res.json(updateContact);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
