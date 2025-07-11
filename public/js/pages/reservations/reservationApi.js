class ReservationApi {
    static async fetchReservations(restaurantId, date) {
        try {
            const queryParams = new URLSearchParams({
                restaurantId: restaurantId,
                date: date,
                isJSON: 'true'
            });

            const response = await fetch(`/reservation?${queryParams}`);
            if (!response.ok) {
                throw new Error('Failed to fetch reservations');
            }

            const data = await response.json();
            return data.data; // Return the reservations array
        } catch (error) {
            console.error('Error fetching reservations:', error);
            throw error;
        }
    }

    static async deleteReservation(reservationId) {
        try {
            const response = await fetch(`/reservation/${reservationId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete reservation');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting reservation:', error);
            throw error;
        }
    }
}

window.ReservationApi = ReservationApi;
