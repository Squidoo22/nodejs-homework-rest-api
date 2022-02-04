const express = require('express');
const { CreateError } = require('http-errors');

const { Contact, schemas } = require('../../models/contact');

const router = express.Router();

const { authMiddleware } = require('../../middlewares');

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, favorite = true } = req.query;
    if (isNaN(page) || isNaN(limit)) {
      throw new CreateError(400, 'page or limit is not a number');
    }
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
    const { _id } = req.user;
    const contact = await Contact.findOne({
      _id: contactId,
      owner: _id,
    }).populate('owner', 'email');
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
    const { _id } = req.user;
    const newContact = await Contact.create({ ...req.body, owner: _id });
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
    const { _id } = req.user;
    const updateContact = await Contact.findOneAndUpdate(
      { _id: contactId, owner: _id },
      { ...req.body },
      {
        new: true,
      }
    );
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
    const { _id } = req.user;
    const updateContact = await Contact.findOneAndUpdate(
      { _id: contactId, owner: _id },
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
    const { _id } = req.user;
    const deleteContact = await Contact.findOneAndRemove({
      _id: contactId,
      owner: _id,
    });
    if (!deleteContact) throw new CreateError(404, 'Not found');
    res.json({ message: 'contact was deleted', deleteContact });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
