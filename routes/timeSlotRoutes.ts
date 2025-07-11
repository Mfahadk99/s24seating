import express from 'express';
import { 
  generateTimeSlots, 
  getTimeSlots, 
  getTimeSlotById, 
  updateTimeSlot, 
  deleteTimeSlot,
  deleteAllTimeSlots,
  getTimeSlotsByShiftId
} from '../controllers/timeSlot.controller';

const router = express.Router();

// Generate time slots for a restaurant
router.post('/generate', generateTimeSlots as any);

// Get all time slots for a restaurant
router.get('/restaurant/:restaurantId', getTimeSlots as any);

// Get a single time slot by ID
router.get('/:id', getTimeSlotById as any);

router.get('/shift/:shiftId', getTimeSlotsByShiftId as any);

// Update a time slot
router.put('/:id', updateTimeSlot as any);

// Delete a time slot
router.delete('/:id', deleteTimeSlot as any);

// Delete all time slots for a restaurant
router.delete('/restaurant/:restaurantId', deleteAllTimeSlots as any);

export default router; 