import express from 'express';
import { createWaitlistEntry, getWaitlistByRestaurant, getWaitlistEntry, updateWaitlistEntry, deleteWaitlistEntry } from '../controllers/waitlistController';

const router = express.Router();

router.post('/', createWaitlistEntry as any);
router.get('/restaurant/:restaurantId', getWaitlistByRestaurant as any);
router.get('/:id', getWaitlistEntry as any);
router.put('/:id', updateWaitlistEntry as any);
router.delete('/:id', deleteWaitlistEntry as any);

export default router;


