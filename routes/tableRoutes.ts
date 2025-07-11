import express from 'express';
import {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  updateTablePositions,
  findAvailableTables,
  getTablesByRestaurantId
} from '../controllers/tableController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Public routes (no authentication required)
router.post('/', createTable as any); // Remove authentication for table creation
router.get('/floorplan/:floorPlanId', getTables as any);
router.get('/search', findAvailableTables as any);
router.get('/restaurant/:restaurantId', getTablesByRestaurantId as any);
router.get('/:id', getTableById as any);

// Protected routes (authentication required)
router.put('/:id', authenticateToken, updateTable as any);
router.delete('/:id', authenticateToken, deleteTable as any);
router.put('/positions/bulk', authenticateToken, updateTablePositions as any);

export default router;
