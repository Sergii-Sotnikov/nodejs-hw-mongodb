import {
  createContact,
  deleteContact,
  getAllContacts,
  getContactById,
  patchContact,
} from '../services/contacts.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';

// GET ALL CONTACT CONTROLLER
export const getAllContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);

  if ('isFavourite' in req.query && filter.isFavourite === 'invalid') {
    throw createHttpError(400, 'isFavourite must be boolean (true or false)');
  }

  const students = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
    userId: req.user._id,
  });

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data: students,
  });
};

//GET CONTACT  BY ID CONTROLLER
export const getContactByIdController = async (req, res) => {
  const { contactId } = req.params;

  const contact = await getContactById(contactId, req.user._id);

  // Відповідь, якщо контакт не знайдено
  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(200).json({
    status: 200,
    message: `Successfully found contact with id ${contact.id}!`,
    data: contact,
  });
};

//POST CONTACT CONTROLLER
export const createContactController = async (req, res) => {
  const contact = await createContact({ ...req.body, userId: req.user._id });

  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
};

//DELETE CONTACT CONTROLLER
export const deleteContactController = async (req, res) => {
  const { contactId } = req.params;
  const contact = await deleteContact(contactId, req.user._id);

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(204).send();
};


//PATCH CONTACT CONTROLLER
export const patchContactController = async (req, res) => {
  const { contactId } = req.params;
  const result = await patchContact(contactId, req.user._id, req.body);
  
  if (!result) {
    throw createHttpError(404, 'Contact not found');
  }

  res.json({
    status: 200,
    message: `Successfully patched a contact!`,
    data: result.contact,
  });
};
