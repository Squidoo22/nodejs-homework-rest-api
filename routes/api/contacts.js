const express = require('express');
const { CreateError } = require('http-errors');

const { Contact, schemas } = require('../../models/contact');

const router = express.Router();

const { authMiddleware } = require('../../middlewares');

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, favorite = true } = req.query;
    const skip = (page - 1) * limit;
    const { _id } = req.user;
    const contacts = await Contact.find(
      { owner: _id, favorite },
      '-createdAt - updatedAt',
      { skip, limit: Number(limit) }
    ).populate('owner', 'email');
    res.json(contacts);
  } catch (e) {
    next(e);
  }
});

router.get('/:contactId', authMiddleware, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new CreateError(404, 'Not found');
    }
    res.json(contact);
  } catch (e) {
    next(e);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { error } = schemas.joiShema.validate(req.body);
    if (error) throw new CreateError(400, 'missing required name field');
    const newContact = await Contact.create(req.body);
    if (!newContact) throw new CreateError(404, 'Not found');
    res.status(201).json(newContact);
  } catch (e) {
    if (e.message.includes('validation failed')) {
      e.status = 400;
    }
    next(e);
  }
});

router.put('/:contactId', authMiddleware, async (req, res, next) => {
  try {
    const { error } = schemas.joiShema.validate(req.body);
    if (error) throw new CreateError(400, error.message);
    const { contactId } = req.params;
    const updateContact = await Contact.findByIdAndUpdate(contactId, req.body, {
      new: true,
    });
    res.json(updateContact);
  } catch (e) {
    next(e);
  }
});

router.patch('/:contactId/favorite', authMiddleware, async (req, res, next) => {
  try {
    const { error } = schemas.joiShema.validate();
    if (error) throw new CreateError(400, error.message);
    const { contactId, favorite = false } = req.params;
    const updateContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite },
      {
        new: true,
      }
    );
    res.json(updateContact);
  } catch (e) {
    next(e);
  }
});

router.delete('/:contactId', authMiddleware, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const deleteContact = await Contact.findByIdAndDelete(contactId);
    if (!deleteContact) throw new CreateError(404, 'Not found');
    res.json({ message: 'contact was deleted', deleteContact });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
