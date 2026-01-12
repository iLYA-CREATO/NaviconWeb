const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all bid types
router.get('/', auth, async (req, res) => {
    try {
        const bidTypes = await prisma.bidType.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(bidTypes);
    } catch (error) {
        console.error('Error fetching bid types:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new bid type
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, statuses, transitions } = req.body;
        const bidType = await prisma.bidType.create({
            data: { name, description, statuses: statuses || [], transitions: transitions || [] }
        });

        res.status(201).json(bidType);
    } catch (error) {
        console.error('Error creating bid type:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Bid type with this name already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update a bid type
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, statuses, transitions } = req.body;
        const bidType = await prisma.bidType.update({
            where: { id: parseInt(id) },
            data: { name, description, statuses: statuses || [], transitions: transitions || [] }
        });
        res.json(bidType);
    } catch (error) {
        console.error('Error updating bid type:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Bid type not found' });
        } else if (error.code === 'P2002') {
            res.status(400).json({ error: 'Bid type with this name already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Delete a bid type
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.bidType.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting bid type:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Bid type not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Get all bid statuses for a bid type
router.get('/:bidTypeId/statuses', auth, async (req, res) => {
    try {
        const { bidTypeId } = req.params;
        const bidType = await prisma.bidType.findUnique({
            where: { id: parseInt(bidTypeId) }
        });
        if (!bidType) {
            return res.status(404).json({ error: 'Bid type not found' });
        }
        const statuses = bidType.statuses || [];
        // Sort by position
        statuses.sort((a, b) => a.position - b.position);
        res.json(statuses);
    } catch (error) {
        console.error('Error fetching bid statuses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new bid status
router.post('/:bidTypeId/statuses', auth, async (req, res) => {
    try {
        const { bidTypeId } = req.params;
        const { name, position, allowedActions } = req.body;

        // Check if bidType exists
        const bidType = await prisma.bidType.findUnique({
            where: { id: parseInt(bidTypeId) }
        });
        if (!bidType) {
            return res.status(404).json({ error: 'Bid type not found' });
        }

        // Check if position is valid
        if (position < 1 || position > 999) {
            return res.status(400).json({ error: 'Position must be between 1 and 999' });
        }

        const statuses = bidType.statuses || [];

        // Check if position already exists
        if (statuses.some(s => s.position === position)) {
            return res.status(400).json({ error: `Status with position ${position} already exists` });
        }

        // Check if name already exists
        if (statuses.some(s => s.name === name)) {
            return res.status(400).json({ error: 'Status with this name already exists' });
        }

        const newStatus = { name, position, allowedActions: allowedActions || [] };
        statuses.push(newStatus);

        await prisma.bidType.update({
            where: { id: parseInt(bidTypeId) },
            data: { statuses }
        });

        res.status(201).json(newStatus);
    } catch (error) {
        console.error('Error creating bid status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a bid status
router.put('/:bidTypeId/statuses/:position', auth, async (req, res) => {
    try {
        const { bidTypeId, position } = req.params;
        const { name, allowedActions } = req.body;

        const bidType = await prisma.bidType.findUnique({
            where: { id: parseInt(bidTypeId) }
        });
        if (!bidType) {
            return res.status(404).json({ error: 'Bid type not found' });
        }

        const statuses = bidType.statuses || [];
        const statusIndex = statuses.findIndex(s => s.position === parseInt(position));

        if (statusIndex === -1) {
            return res.status(404).json({ error: 'Bid status not found' });
        }

        // For default statuses (position 1 or 999), only allow updating name and allowedActions
        if (parseInt(position) === 1 || parseInt(position) === 999) {
            statuses[statusIndex].name = name;
            statuses[statusIndex].allowedActions = allowedActions || statuses[statusIndex].allowedActions;
        } else {
            statuses[statusIndex].name = name;
            statuses[statusIndex].allowedActions = allowedActions || statuses[statusIndex].allowedActions;
        }

        await prisma.bidType.update({
            where: { id: parseInt(bidTypeId) },
            data: { statuses }
        });

        res.json(statuses[statusIndex]);
    } catch (error) {
        console.error('Error updating bid status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a bid status
router.delete('/:bidTypeId/statuses/:position', auth, async (req, res) => {
    try {
        const { bidTypeId, position } = req.params;

        const bidType = await prisma.bidType.findUnique({
            where: { id: parseInt(bidTypeId) }
        });
        if (!bidType) {
            return res.status(404).json({ error: 'Bid type not found' });
        }

        const statuses = bidType.statuses || [];
        const statusIndex = statuses.findIndex(s => s.position === parseInt(position));

        if (statusIndex === -1) {
            return res.status(404).json({ error: 'Bid status not found' });
        }

        // Prevent deleting open or closed statuses
        if (parseInt(position) === 1 || parseInt(position) === 999) {
            return res.status(400).json({ error: 'Cannot delete default open or closed status' });
        }

        statuses.splice(statusIndex, 1);

        await prisma.bidType.update({
            where: { id: parseInt(bidTypeId) },
            data: { statuses }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting bid status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transitions for a bid type
router.get('/:bidTypeId/transitions', auth, async (req, res) => {
    try {
        const { bidTypeId } = req.params;
        const bidType = await prisma.bidType.findUnique({
            where: { id: parseInt(bidTypeId) }
        });
        if (!bidType) {
            return res.status(404).json({ error: 'Bid type not found' });
        }
        const transitions = bidType.transitions || [];
        res.json(transitions);
    } catch (error) {
        console.error('Error fetching transitions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a transition
router.post('/:bidTypeId/transitions', auth, async (req, res) => {
    try {
        const { bidTypeId } = req.params;
        const { fromPosition, toPosition } = req.body;

        const bidType = await prisma.bidType.findUnique({
            where: { id: parseInt(bidTypeId) }
        });
        if (!bidType) {
            return res.status(404).json({ error: 'Bid type not found' });
        }

        const statuses = bidType.statuses || [];
        const fromStatus = statuses.find(s => s.position === fromPosition);
        const toStatus = statuses.find(s => s.position === toPosition);
        if (!fromStatus || !toStatus) {
            return res.status(400).json({ error: 'Invalid status positions' });
        }

        const transitions = bidType.transitions || [];
        if (transitions.some(t => t.fromPosition === fromPosition && t.toPosition === toPosition)) {
            return res.status(400).json({ error: 'Transition already exists' });
        }

        const newTransition = { fromPosition, toPosition };
        transitions.push(newTransition);

        await prisma.bidType.update({
            where: { id: parseInt(bidTypeId) },
            data: { transitions }
        });

        res.status(201).json(newTransition);
    } catch (error) {
        console.error('Error creating transition:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a transition
router.delete('/:bidTypeId/transitions/:fromPosition/:toPosition', auth, async (req, res) => {
    try {
        const { bidTypeId, fromPosition, toPosition } = req.params;

        const bidType = await prisma.bidType.findUnique({
            where: { id: parseInt(bidTypeId) }
        });
        if (!bidType) {
            return res.status(404).json({ error: 'Bid type not found' });
        }

        const transitions = bidType.transitions || [];
        const index = transitions.findIndex(t => t.fromPosition === parseInt(fromPosition) && t.toPosition === parseInt(toPosition));
        if (index === -1) {
            return res.status(404).json({ error: 'Transition not found' });
        }

        transitions.splice(index, 1);

        await prisma.bidType.update({
            where: { id: parseInt(bidTypeId) },
            data: { transitions }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting transition:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;