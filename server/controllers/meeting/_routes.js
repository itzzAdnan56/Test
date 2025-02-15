const express = require('express');
const router = express.Router();
const auth = require('../../middelwares/auth');
const meeting = require('./meeting');

// Create a new meeting
router.post('/', auth, meeting.create);

// Get all meetings
router.get('/', auth, meeting.index);

// Get a single meeting
router.get('/:id', auth, meeting.view);

// Update a meeting
router.put('/:id', auth, meeting.update);

// Delete a meeting
router.delete('/:id', auth, meeting.deleteData);

module.exports = router;