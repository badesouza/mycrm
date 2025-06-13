import express from 'express';
import { createUser, getUsers, getUser, updateUser, deleteUser } from '../controllers/userController';

const router = express.Router();

// Create a new user
router.post('/', createUser);

// Get all users
router.get('/', getUsers);

// Get a single user
router.get('/:id', getUser);

// Update a user
router.put('/:id', updateUser);

// Delete a user
router.delete('/:id', deleteUser);

export default router; 