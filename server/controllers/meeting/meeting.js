const Meeting = require('../../model/schema/meeting');

// Validate meeting time
const isValidMeetingTime = (startTime, endTime) => {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    return start < end;
};

// Create a new meeting
const create = async (req, res) => {
    try {
        const { title, description, date, startTime, endTime, participants } = req.body;
        
        // Validate required fields
        if (!title || !description || !date || !startTime || !endTime) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate meeting time
        if (!isValidMeetingTime(startTime, endTime)) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        const meeting = new Meeting({
            ...req.body,
            organizer: req.user.userId
        });
        await meeting.save();
        
        const populatedMeeting = await Meeting.findById(meeting._id)
            .populate('organizer', 'username firstName lastName')
            .populate('participants', 'username firstName lastName');
            
        res.status(201).json({ message: 'Meeting created successfully', meeting: populatedMeeting });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all meetings
const index = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const query = { deleted: false };
        
        // Add status filter if provided
        if (status) {
            query.status = status;
        }
        
        // Add date range filter if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        const meetings = await Meeting.find(query)
            .populate('organizer', 'username firstName lastName')
            .populate('participants', 'username firstName lastName')
            .sort({ date: 1, startTime: 1 });
            
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single meeting
const view = async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ _id: req.params.id, deleted: false })
            .populate('organizer', 'username firstName lastName')
            .populate('participants', 'username firstName lastName');
            
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        
        res.status(200).json(meeting);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid meeting ID' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Update a meeting
const update = async (req, res) => {
    try {
        const { startTime, endTime } = req.body;
        
        // Validate meeting time if provided
        if (startTime && endTime && !isValidMeetingTime(startTime, endTime)) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        const meeting = await Meeting.findOne({ _id: req.params.id, deleted: false });
        
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        
        // Only allow organizer to update the meeting
        if (meeting.organizer.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Only the organizer can update the meeting' });
        }

        const updatedMeeting = await Meeting.findOneAndUpdate(
            { _id: req.params.id },
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        ).populate('organizer', 'username firstName lastName')
         .populate('participants', 'username firstName lastName');
        
        res.status(200).json({ message: 'Meeting updated successfully', meeting: updatedMeeting });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid meeting ID' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Soft delete a meeting
const deleteData = async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ _id: req.params.id, deleted: false });
        
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        
        // Only allow organizer to delete the meeting
        if (meeting.organizer.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Only the organizer can delete the meeting' });
        }

        meeting.deleted = true;
        meeting.updatedAt = Date.now();
        await meeting.save();
        
        res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid meeting ID' });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    create,
    index,
    view,
    update,
    deleteData
};