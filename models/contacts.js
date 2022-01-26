const fs = require('fs').promises;
const path = require('path');
const { v4 } = require('uuid');

const contactsPath = path.join(__dirname, 'contacts.json');

const listContacts = async () => {
  try {
    const data = await fs.readFile(contactsPath, 'utf-8');
    const contacts = JSON.parse(data);
    return contacts;
  } catch (e) {
    console.log(e.message);
  }
};

const getContactById = async (contactId) => {
  try {
    const contacts = await listContacts();
    const result = contacts.find((item) => item.id === contactId);
    if (!result) {
      return null;
    }
    return result;
  } catch (e) {
    console.log(e.message);
  }
};

const addContact = async (body) => {
  try {
    const data = { id: v4(), ...body };
    const contacts = await listContacts();
    contacts.push(data);
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
    return data;
  } catch (e) {
    console.log(e.message);
  }
};

const removeContact = async (contactId) => {
  try {
    const contacts = await listContacts();
    const idx = contacts.findIndex((item) => item.id === contactId);
    if (idx === -1) {
      return null;
    }
    const [deleteContact] = contacts.splice(idx, 1);
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
    return deleteContact;
  } catch (e) {
    console.log(e.message);
  }
};

const updateContact = async (contactId, body) => {
  const contacts = await listContacts();
  const idx = contacts.findIndex(
    (contact) => String(contact.id) === String(contactId)
  );

  if (idx === -1) {
    return null;
  }

  const updateContact = { ...contacts[idx], ...body };
  contacts[idx] = updateContact;
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return updateContact;
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
