import { ContactsCollection } from "../db/models/contact.js";

// GET CONTACT SERVICE
export const getAllContacts = async () => {
  const contacts = await ContactsCollection.find();
  return contacts;
};

//GET ALL CONTACTS SERVICE
export const getContactById = async (contactId) => {
  const contact = await ContactsCollection.findById(contactId);
  return contact;
};

//POST CONTACT SERVICE
export const createContact = async (payload) => {
  const contact = await ContactsCollection.create(payload);
  return contact;
};

//DELETE CONTACT SERVICE
export const deleteContact = async (contactId) => {
  const contact = await ContactsCollection.findOneAndDelete({
    _id: contactId,
  });

  return contact;
};

//PATCH CONTACT SERVICE
export const patchContact = async (contactId, payload, options = {}) => {
  const rawResult = await ContactsCollection.findOneAndUpdate(
    { _id: contactId },
    payload,
    {
      new: true,
      includeResultMetadata: true,
      ...options,
    },
  );

  if (!rawResult || !rawResult.value) return null;

  return {
    contact: rawResult.value,
    isNew: Boolean(rawResult?.lastErrorObject?.upserted),
  };
};