import { createReservation, getAllReservations, getAvailableTimeSlots, getReservation, deleteReservation, updateReservation } from '../controllers/reservation.controller'
import express from 'express'

const router = express.Router()

router.post('/', createReservation as any)
router.get('/', getAllReservations as any)
router.get('/available-slots', getAvailableTimeSlots as any)
router.get('/detail/:reservationId', getReservation as any)
router.delete('/:reservationId', deleteReservation as any)
router.put('/:reservationId', updateReservation as any)

export default router