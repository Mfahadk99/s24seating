console.log('timeslots.js loaded');

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('shiftForm');
    const submitButton = document.getElementById('submitButton');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    // const timeSlotsList = document.getElementById('timeSlotsList');
    const timeSlotsLoading = document.getElementById('timeSlotsLoading');
    const restaurantId = document.getElementById('restaurantId').value;
    const modal = document.getElementById('shiftModal');
    const closeModal = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const deleteShiftButton = document.getElementById('deleteShiftButton');
    
    // Day name mapping
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Store all shifts
    let allShifts = [];
    
    // Show toast notification
    function showToast(message, isError = false) {
        toastMessage.textContent = message;
        const iconElement = toast.querySelector('i');
        if (isError) {
            toast.className = 'toast error show';
            iconElement.className = 'fas fa-exclamation-circle';
        } else {
            toast.className = 'toast show';
            iconElement.className = 'fas fa-check-circle';
        }
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }

    // Set loading state
    function setLoading(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<div class="spinner"></div><span class="loading-text">Processing...</span>';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-plus"></i> Create Shift';
        }
    }

    // Get auth token from cookies
    function getAuthToken() {
        return document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || '';
    }

    // Format time for display (24h to 12h format)
    function formatTime(time24) {
        const [hours, minutes] = time24.split(':');
        let period = 'AM';
        let hour = parseInt(hours, 10);
        if (hour >= 12) {
            period = 'PM';
            if (hour > 12) hour -= 12;
        }
        if (hour === 0) hour = 12;
        return `${hour}:${minutes} ${period}`;
    }
    
    // Convert hour to 24-hour format string
    function hourTo24Format(hour) {
        return hour.toString().padStart(2, '0') + ':00';
    }
    
    // Show modal with shift form
    function showModal(dayIndex, hour, shift = null, endHour = null) {
        // Reset form
        form.reset();
        
        // Set day and hour
        document.getElementById('selectedDay').value = dayIndex;
        document.getElementById('selectedHour').value = hour;
        document.getElementById('shiftDay').value = dayNames[dayIndex];
        
        if (shift) {
            // Edit mode
            modalTitle.textContent = 'Edit Shift';
            document.getElementById('shiftId').value = shift._id;
            document.getElementById('shiftName').value = shift.name || '';
            document.getElementById('shiftDay').value = shift.day || dayNames[dayIndex];
            document.getElementById('startTime').value = shift.startTime || hourTo24Format(hour);
            document.getElementById('endTime').value = shift.endTime || hourTo24Format(hour + 1);
            // document.getElementById('duration').value = shift.duration || 60;
            // document.getElementById('bufferTime').value = shift.bufferTime || 15;
            submitButton.innerHTML = '<i class="fas fa-save"></i> Update Shift';
            
            // Show delete button for existing shifts
            deleteShiftButton.style.display = 'flex';
            deleteShiftButton.onclick = () => deleteShift(shift._id);
            
            // Show time slots section
            // timeSlotsList.style.display = 'block';
            loadTimeSlots(shift._id);
        } else {
            // Create mode
            modalTitle.textContent = 'Create Shift';
            document.getElementById('shiftId').value = '';
            document.getElementById('startTime').value = hourTo24Format(hour);
            document.getElementById('endTime').value = hourTo24Format(endHour || (hour + 1));
            // document.getElementById('duration').value = 60;
            // document.getElementById('bufferTime').value = 15;
            submitButton.innerHTML = '<i class="fas fa-plus"></i> Create Shift';
            
            // Hide delete button for new shifts
            deleteShiftButton.style.display = 'none';
            
            // Hide time slots section
            // timeSlotsList.style.display = 'none';
        }
        
        // Show modal
        modal.classList.add('show');
    }
    
    // Close modal
    function closeModalHandler() {
        modal.classList.remove('show');
    }
    
    // Load time slots for a specific shift
    async function loadTimeSlots(shiftId) {
        const token = getAuthToken();
        const container = document.getElementById('timeSlotItems');
        
        if (!token) {
            showToast('Authentication required', true);
            return;
        }
        
        try {
            timeSlotsLoading.style.display = 'block';
            
            const response = await fetch(`/shifts/${shiftId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load time slots');
            
            const data = await response.json();
            const timeSlots = data.data.timeSlots || [];
            
            if (timeSlots.length === 0) {
                container.innerHTML = '<p class="text-center">No time slots available for this shift.</p>';
            } else {
                container.innerHTML = timeSlots.map(slot => `
                    <div class="time-slot-item">
                        <div class="time-slot-info">
                            <div class="time-slot-time">
                                <strong><i class="fas fa-clock"></i> Time Slot:</strong>
                                ${slot.label || `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`}
                            </div>
                            <div class="time-slot-details">
                                <span class="time-slot-detail"><i class="fas fa-hourglass-half"></i> Duration: ${slot.duration} min</span>
                                ${slot.capacity ? `<span class="time-slot-detail"><i class="fas fa-users"></i> Capacity: ${slot.capacity}</span>` : ''}
                                <span class="time-slot-detail"><i class="fas fa-info-circle"></i> Status: ${slot.status || 'Available'}</span>
                            </div>
                        </div>
                        <div class="time-slot-actions">
                            <button class="btn-delete" onclick="deleteTimeSlot('${slot._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (err) {
            container.innerHTML = `<p class="text-center text-danger">Error: ${err.message}</p>`;
        } finally {
            timeSlotsLoading.style.display = 'none';
        }
    }

    // Render shifts on the schedule grid
    function renderShifts() {
        // Clear all cells
        document.querySelectorAll('.schedule-cell').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('has-shift');
        });
        
        // Render each shift
        allShifts.forEach(shift => {
            // Get start and end hours
            const startHour = parseInt(shift.startTime.split(':')[0]);
            const endHour = parseInt(shift.endTime.split(':')[0]);
            
            // Get day index
            let dayIndices = [];
            if (shift.day === 'Everyday') {
                dayIndices = [0, 1, 2, 3, 4, 5, 6]; // All days
            } else if (shift.day === 'Weekdays') {
                dayIndices = [0, 1, 2, 3, 4]; // Monday to Friday
            } else if (shift.day === 'Weekends') {
                dayIndices = [5, 6]; // Saturday and Sunday
            } else {
                // Specific day
                const dayIndex = dayNames.indexOf(shift.day);
                if (dayIndex !== -1) {
                    dayIndices = [dayIndex];
                }
            }
            
                    // Add shift indicator for each day
        dayIndices.forEach(dayIndex => {
            // Create a single shift indicator that spans multiple cells
            const firstCell = document.getElementById(`cell-${dayIndex}-${startHour}`);
            if (firstCell) {
                // Mark all cells in the range as having a shift
                for (let hour = startHour; hour < endHour; hour++) {
                    const cell = document.getElementById(`cell-${dayIndex}-${hour}`);
                    if (cell) {
                        cell.classList.add('has-shift');
                    }
                }
                
                // Calculate the center cell for displaying shift name
                const hourSpan = endHour - startHour;
                
                // Create background span for the entire shift duration
                const backgroundSpan = document.createElement('div');
                backgroundSpan.className = 'shift-background';
                backgroundSpan.dataset.shiftId = shift._id;
                
                // Calculate the height based on the number of hours
                const heightPercentage = hourSpan * 60; // Each cell is 60px high
                
                // Style for spanning multiple cells with improved visual design
                backgroundSpan.style.position = 'absolute';
                backgroundSpan.style.height = `${heightPercentage}px`;
                backgroundSpan.style.top = '4px';
                backgroundSpan.style.left = '4px';
                backgroundSpan.style.right = '4px';
                backgroundSpan.style.backgroundColor = '#0051a1';
                backgroundSpan.style.borderRadius = '8px';
                backgroundSpan.style.zIndex = '1';
                backgroundSpan.style.pointerEvents = 'none';
                backgroundSpan.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                
                // Add shift name directly to the background span
                const shiftNameElement = document.createElement('div');
                shiftNameElement.className = 'shift-name';
                shiftNameElement.textContent = shift.name;
                shiftNameElement.style.position = 'absolute';
                shiftNameElement.style.top = '50%';
                shiftNameElement.style.left = '0';
                shiftNameElement.style.right = '0';
                shiftNameElement.style.transform = 'translateY(-50%)';
                shiftNameElement.style.color = 'white';
                shiftNameElement.style.fontWeight = '600';
                shiftNameElement.style.fontSize = '0.85rem';
                shiftNameElement.style.textAlign = 'center';
                shiftNameElement.style.padding = '0 10px';
                shiftNameElement.style.whiteSpace = 'nowrap';
                shiftNameElement.style.overflow = 'hidden';
                shiftNameElement.style.textOverflow = 'ellipsis';
                shiftNameElement.style.zIndex = '2';
                shiftNameElement.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
                
                // Add the shift name to the background span
                backgroundSpan.appendChild(shiftNameElement);
                
                // Add background span to the first cell
                firstCell.appendChild(backgroundSpan);
            }
        });
        });
    }
    
    // Load all shifts for the restaurant
    async function loadShifts() {
        const token = getAuthToken();
        
        if (!token) {
            showToast('Authentication required', true);
            return;
        }
        
        try {
            // Show loading state
            document.querySelectorAll('.schedule-cell').forEach(cell => {
                cell.innerHTML = '<div class="spinner" style="width: 1rem; height: 1rem; border-width: 2px;"></div>';
            });
            
            // Fetch shifts from API
            const response = await fetch(`/shifts/restaurant/${restaurantId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load shifts');
            
            const data = await response.json();
            allShifts = data.data || [];
            
            // Render shifts on the grid
            renderShifts();
        } catch (err) {
            showToast(`Error loading shifts: ${err.message}`, true);
            
            // Clear loading spinners
            document.querySelectorAll('.schedule-cell').forEach(cell => {                cell.innerHTML = '';
            });
        }
    }
    
    // Add these variables at the top of your DOMContentLoaded function
    let isDragging = false;
    let startCell = null;
    let currentHoverCell = null;
    let tempHighlightedCells = [];

    // Initialize schedule cells with drag functionality
    function initScheduleCells() {
        const cells = document.querySelectorAll('.schedule-cell');
        
        // Mouse down - start dragging
        cells.forEach(cell => {
            cell.addEventListener('mousedown', function(e) {
                // Only allow dragging on cells without shifts
                if (!this.classList.contains('has-shift')) {
                    e.preventDefault(); // Prevent text selection
                    isDragging = true;
                    startCell = this;
                    
                    // Clear any previous temporary highlights
                    clearTempHighlights();
                    
                    // Add highlight to the start cell
                    this.classList.add('temp-highlight');
                    tempHighlightedCells.push(this);
                }
            });
            
            // Mouse enter - highlight cells during drag
            cell.addEventListener('mouseenter', function() {
                if (isDragging && startCell) {
                    currentHoverCell = this;
                    
                    // Clear previous highlights
                    clearTempHighlights();
                    
                    // Get the day and hour ranges
                    const startDay = parseInt(startCell.dataset.day);
                    const startHour = parseInt(startCell.dataset.hour);
                    const currentDay = parseInt(this.dataset.day);
                    const currentHour = parseInt(this.dataset.hour);
                    
                    // Only allow dragging within the same day
                    if (startDay === currentDay) {
                        // Determine the range (handle both directions)
                        const minHour = Math.min(startHour, currentHour);
                        const maxHour = Math.max(startHour, currentHour);
                        
                        // Highlight all cells in the range
                        for (let hour = minHour; hour <= maxHour; hour++) {
                            const cellToHighlight = document.getElementById(`cell-${startDay}-${hour}`);
                            if (cellToHighlight && !cellToHighlight.classList.contains('has-shift')) {
                                cellToHighlight.classList.add('temp-highlight');
                                tempHighlightedCells.push(cellToHighlight);
                            }
                        }
                    }
                }
            });
        });
        
        // Mouse up - end dragging and create shift
        document.addEventListener('mouseup', function() {
            if (isDragging && startCell && currentHoverCell) {
                const startDay = parseInt(startCell.dataset.day);
                const startHour = parseInt(startCell.dataset.hour);
                const currentDay = parseInt(currentHoverCell.dataset.day);
                const currentHour = parseInt(currentHoverCell.dataset.hour);
                
                // Only create shift if on the same day
                if (startDay === currentDay) {
                    // Determine the range (handle both directions)
                    const minHour = Math.min(startHour, currentHour);
                    const maxHour = Math.max(startHour, currentHour);
                    
                    // Check if any cell in the range has a shift
                    let canCreateShift = true;
                    for (let hour = minHour; hour <= maxHour; hour++) {
                        const cell = document.getElementById(`cell-${startDay}-${hour}`);
                        if (cell && cell.classList.contains('has-shift')) {
                            canCreateShift = false;
                            break;
                        }
                    }
                    
                    if (canCreateShift) {
                        // Open modal with the selected range
                        showModal(startDay, minHour, null, maxHour + 1); // +1 because end time is exclusive
                    }
                }
                
                // Reset drag state
                isDragging = false;
                startCell = null;
                currentHoverCell = null;
                clearTempHighlights();
            }
        });
        
        // Cancel dragging if mouse leaves the grid
        document.querySelector('.schedule-grid').addEventListener('mouseleave', function() {
            if (isDragging) {
                isDragging = false;
                startCell = null;
                currentHoverCell = null;
                clearTempHighlights();
            }
        });
        
        // Handle click on cells with shifts (for editing)
        cells.forEach(cell => {
            cell.addEventListener('click', function() {
                // Only handle clicks, not drag operations
                if (!isDragging) {
                    const dayIndex = parseInt(this.dataset.day);
                    const hour = parseInt(this.dataset.hour);
                    
                    // Check if cell is part of a shift
                    if (this.classList.contains('has-shift')) {
                        // Find the shift that covers this cell
                        const relevantShift = allShifts.find(shift => {
                            // Get day index
                            let dayIndices = [];
                            if (shift.day === 'Everyday') {
                                dayIndices = [0, 1, 2, 3, 4, 5, 6];
                            } else if (shift.day === 'Weekdays') {
                                dayIndices = [0, 1, 2, 3, 4];
                            } else if (shift.day === 'Weekends') {
                                dayIndices = [5, 6];
                            } else {
                                const shiftDayIndex = dayNames.indexOf(shift.day);
                                if (shiftDayIndex !== -1) {
                                    dayIndices = [shiftDayIndex];
                                }
                            }
                            
                            // Check if this shift covers the clicked cell
                            if (dayIndices.includes(dayIndex)) {
                                const startHour = parseInt(shift.startTime.split(':')[0]);
                                const endHour = parseInt(shift.endTime.split(':')[0]);
                                return hour >= startHour && hour < endHour;
                            }
                            return false;
                        });
                        
                        if (relevantShift) {
                            // Edit existing shift
                            showModal(dayIndex, hour, relevantShift);
                        }
                    }
                }
            });
        });
    }

    // Helper function to clear temporary highlights
    function clearTempHighlights() {
        tempHighlightedCells.forEach(cell => {
            cell.classList.remove('temp-highlight');
        });
        tempHighlightedCells = [];
    }

    // Form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        setLoading(true);
        
        const formData = new FormData(form);
        const shiftData = {
            name: formData.get('name'),
            day: formData.get('day'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            // duration: parseInt(formData.get('duration')),
            // bufferTime: parseInt(formData.get('bufferTime')),
            restaurantId: formData.get('restaurantId')
        };
        
        const token = getAuthToken();
        const shiftId = formData.get('shiftId');
        const isEditMode = shiftId && shiftId.trim() !== '';
        
        if (!token) {
            showToast('Authentication required', true);
            setLoading(false);
            return;
        }
        
        try {
            let response;
            
            if (isEditMode) {
                // Update existing shift
                response = await fetch(`/shifts/${shiftId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(shiftData)
                });
            } else {
                // Create new shift
                response = await fetch('/shifts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(shiftData)
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save shift');
            }
            
            const data = await response.json();
            showToast(isEditMode ? 'Shift updated successfully!' : 'Shift created successfully with time slots!');
            
            // Close modal and reload shifts
            closeModalHandler();
            loadShifts();
        } catch (err) {
            showToast(`Error: ${err.message}`, true);
        } finally {
            setLoading(false);
        }
    });

    // Delete time slot
    window.deleteTimeSlot = async function (id) {
        if (!confirm('Are you sure you want to delete this time slot?')) return;
        
        const token = getAuthToken();
        if (!token) {
            showToast('Authentication required', true);
            return;
        }
        
        try {
            const response = await fetch(`/time-slots/${id}?restaurantId=${restaurantId}&isJSON=true`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showToast('Time slot deleted successfully!');
                
                // Remove the time slot element from the DOM
                const slotElement = document.querySelector(`[onclick*="deleteTimeSlot('${id}')"]`).closest('.time-slot-item');
                slotElement.remove();
                
                // Check if no more time slots
                const container = document.getElementById('timeSlotItems');
                if (container.children.length === 0) {
                    container.innerHTML = '<p class="text-center">No time slots available for this shift.</p>';
                }
            } else {
                throw new Error('Failed to delete time slot');
            }
        } catch (err) {
            showToast(`Error: ${err.message}`, true);
        }
    };

    // Delete shift
    async function deleteShift(id) {
        if (!confirm('Are you sure you want to delete this shift? This will also delete all associated time slots.')) return;
        
        const token = getAuthToken();
        if (!token) {
            showToast('Authentication required', true);
            return;
        }
        
        try {
            // Show loading state on delete button
            const deleteBtn = document.getElementById('deleteShiftButton');
            const originalText = deleteBtn.innerHTML;
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<div class="spinner"></div><span class="loading-text">Deleting...</span>';
            
            const response = await fetch(`/shifts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showToast('Shift deleted successfully!');
                
                // Close modal and reload shifts
                closeModalHandler();
                loadShifts();
            } else {
                throw new Error('Failed to delete shift');
            }
        } catch (err) {
            showToast(`Error: ${err.message}`, true);
        } finally {
            // Reset delete button state
            const deleteBtn = document.getElementById('deleteShiftButton');
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Shift';
        }
    }

    // Close modal when clicking the close button
    closeModal.addEventListener('click', closeModalHandler);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModalHandler();
        }
    });
    
    // Initialize
    initScheduleCells();
    loadShifts();
});