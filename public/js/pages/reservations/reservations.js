document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the reservations page
    const canvasContent = document.getElementById('ap-canvasContent');
    if (!canvasContent) {
        console.log('Not on reservations page, skipping initialization');
        return;
    }

    // Get reservations data from the data attribute
    const reservationsDataElement = document.getElementById('reservations-data');
    if (reservationsDataElement) {
        reservationsData = JSON.parse(reservationsDataElement.getAttribute('data-reservations'));
    }
    
    initializeReservationsPage();
    
    // Prevent any draggable functionality from availability.js
    preventTableDragging();
});

// Function to prevent tables from being draggable
function preventTableDragging() {
    // Override makeTableDraggable function if it exists
    if (window.makeTableDraggable) {
        window.makeTableDraggable = function(table) {
            // Do nothing - tables should not be draggable
            console.log('Table dragging disabled in reservations view');
            return table;
        };
    }
    
    // Add event listeners to prevent default drag behavior
    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('ap-dropped-table') || 
            e.target.classList.contains('canvas-table')) {
            e.preventDefault();
            return false;
        }
    });
    
    // Disable any existing draggable tables
    document.querySelectorAll('.ap-dropped-table, .canvas-table').forEach(table => {
        table.setAttribute('draggable', 'false');
        table.style.cursor = 'pointer';
    });
}

function initializeReservationsPage() {
    renderTablesOnCanvas();
    setupEventListeners();
    setupFilters();
    setupDateNavigation();
    initializeFullscreen();
    initializeZoomButtons();
    initializeSectionToggles();
}

// Initialize fullscreen functionality
function initializeFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const appContainer = document.querySelector('.app-container');

    if (!fullscreenBtn || !appContainer) {
        console.error('Fullscreen elements not found');
        return;
    }

    // Initialize fullscreen state from localStorage
    const isFullscreen = localStorage.getItem('reservationsIsFullscreen') === 'true';
    if (isFullscreen) {
        appContainer.classList.add('fullscreen');
    }

    fullscreenBtn.addEventListener('click', function() {
        toggleFullscreen(appContainer);
    });

    // Handle escape key to exit fullscreen
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && appContainer.classList.contains('fullscreen')) {
            exitFullscreen(appContainer);
        }
    });
}

function toggleFullscreen(container) {
    if (!container) return;

    const isFullscreen = container.classList.contains('fullscreen');
    
    if (isFullscreen) {
        exitFullscreen(container);
    } else {
        enterFullscreen(container);
    }
}

function enterFullscreen(container) {
    container.classList.add('fullscreen');
    localStorage.setItem('reservationsIsFullscreen', 'true');
    
    // Adjust canvas size after entering fullscreen
    adjustCanvasSize();
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Update button icon/state
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.title = 'Exit fullscreen';
    }
}

function exitFullscreen(container) {
    container.classList.remove('fullscreen');
    localStorage.setItem('reservationsIsFullscreen', 'false');
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    // Update button icon/state
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.title = 'Enter fullscreen';
    }
    
    // Reset canvas size
    adjustCanvasSize();
}

function adjustCanvasSize() {
    const canvas = document.querySelector('.ap-canvas');
    const container = document.querySelector('.ap-canvas-container');
    
    if (!canvas || !container) return;
    
    // Allow a brief moment for the transition to complete
    setTimeout(() => {
        // Trigger a resize event to ensure proper layout
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

// Initialize zoom buttons
function initializeZoomButtons() {
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function() {
            zoomCanvas(1.2); // Zoom in by 20%
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function() {
            zoomCanvas(0.8); // Zoom out by 20%
        });
    }
}

function setupDateNavigation() {
    const prevBtn = document.getElementById('prev-date');
    const nextBtn = document.getElementById('next-date');
    const currentDateDisplay = document.getElementById('current-date');
    const datePicker = document.getElementById('date-picker');

    // Previous day
    prevBtn.addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
        loadReservationsForDate();
    });

    // Next day
    nextBtn.addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
        loadReservationsForDate();
    });

    // Click on date to open picker
    currentDateDisplay.addEventListener('click', function() {
        datePicker.click();
    });

    // Date picker change
    datePicker.addEventListener('change', function() {
        currentDate = new Date(this.value);
        updateDateDisplay();
        loadReservationsForDate();
    });

    // Initialize date display
    updateDateDisplay();
}

function updateDateDisplay() {
    const currentDateDisplay = document.getElementById('current-date');
    const datePicker = document.getElementById('date-picker');
    
    // Update display
    currentDateDisplay.textContent = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Update hidden input
    datePicker.value = currentDate.toISOString().split('T')[0];
}

function loadReservationsForDate() {
    // Show loading state
    const tableList = document.getElementById('table-list');
    tableList.innerHTML = `
        <div class="no-data">
            <i class="la la-spinner la-spin"></i>
            <h4>Loading Reservations...</h4>
            <p>Please wait while we load the data.</p>
        </div>
    `;

    // Format date for API call
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Reload page with new date parameter
    const url = new URL(window.location);
    url.searchParams.set('date', dateString);
    window.location.href = url.toString();
}

function renderTablesOnCanvas() {
    const canvasContent = document.getElementById('ap-canvasContent');
    if (!canvasContent) {
        console.error('Canvas content element not found!');
        return;
    }
    // Clear existing content while preserving drop zone
    const dropZone = canvasContent.querySelector('.ap-drop-zone');
    canvasContent.innerHTML = '';
    if (dropZone) {
        canvasContent.appendChild(dropZone);
    }
    // Get unique tables from reservations
    const tables = getUniqueTablesFromReservations();
    // Render each table
    tables.forEach(table => {
        const tableElement = createCanvasTableElement(table);
        canvasContent.appendChild(tableElement);
    });
}

function getUniqueTablesFromReservations() {
    const tables = [];
    const seenTables = new Set();
    
    reservationsData.forEach(reservation => {
        if (reservation.tableId && !seenTables.has(reservation.tableId._id)) {
            seenTables.add(reservation.tableId._id);
            tables.push(reservation.tableId);
        }
    });
    
    return tables;
}

function createCanvasTableElement(table) {
    const tableElement = document.createElement('div');
    tableElement.className = `canvas-table ${table.tableType} ${table.isReserved ? 'reserved' : 'available'}`;
    tableElement.textContent = table.name || table.tableId;
    tableElement.dataset.tableId = table._id;
    tableElement.dataset.tableType = table.tableType;
    tableElement.dataset.tableSeats = table.seats;
    
    // Set position (use default if not available)
    const x = table.position ? table.position.x : Math.random() * 400 + 50;
    const y = table.position ? table.position.y : Math.random() * 300 + 50;
    
    tableElement.style.left = `${x}px`;
    tableElement.style.top = `${y}px`;
    
    // Set size based on table type and seats
    const size = getTableSize(table.tableType, table.seats);
    tableElement.style.width = `${size.width}px`;
    tableElement.style.height = `${size.height}px`;
    
    // Add click event
    tableElement.addEventListener('click', () => selectTable(table._id));
    
    return tableElement;
}

function getTableSize(tableType, seats) {
    const baseSizes = {
        round: { width: 60, height: 60 },
        square: { width: 50, height: 50 },
        rectangular: { width: 80, height: 40 },
        hexagon: { width: 60, height: 60 },
        bar: { width: 100, height: 30 }
    };
    
    const baseSize = baseSizes[tableType] || baseSizes.round;
    const seatMultiplier = Math.max(1, seats / 4);
    
    return {
        width: Math.round(baseSize.width * seatMultiplier),
        height: Math.round(baseSize.height * seatMultiplier)
    };
}

function selectTable(tableId) {
    if (!tableId) return;
    // Remove previous selections
    document.querySelectorAll('.canvas-table.selected, .reservation-row.selected').forEach(el => {
        el.classList.remove('selected');
    });
    // Add selection to canvas table
    const canvasTable = document.querySelector(`.canvas-table[data-table-id="${tableId}"]`);
    if (canvasTable) {
        canvasTable.classList.add('selected');
        canvasTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Add selection to list items (there might be multiple reservations for same table)
    const listItems = document.querySelectorAll(`.reservation-row[data-table-id="${tableId}"]`);
    listItems.forEach(item => {
        item.classList.add('selected');
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    selectedTableId = tableId;
    // Trigger custom event for other components
    const event = new CustomEvent('tableSelected', { detail: { tableId } });
    document.dispatchEvent(event);
}

function setupEventListeners() {
    // Table list item clicks
    document.querySelectorAll('.table-item').forEach(item => {
        item.addEventListener('click', function() {
            const tableId = this.dataset.tableId;
            selectTable(tableId);
        });
    });

    // Filter toggle button
    const filterToggleBtn = document.getElementById('filter-toggle');
    const filterSection = document.getElementById('filter-section');
    
    filterToggleBtn.addEventListener('click', function() {
        filterSection.classList.toggle('show');
        this.classList.toggle('active');
    });

    // Filter apply button
    document.getElementById('filter-apply').addEventListener('click', function() {
        applyFilters();
        filterSection.classList.remove('show');
        filterToggleBtn.classList.remove('active');
        updateFilterBadge();
    });

    // Filter reset button
    document.getElementById('filter-reset').addEventListener('click', function() {
        resetFilters();
        updateFilterBadge();
    });

    // Search input
    document.getElementById('filter-search').addEventListener('input', function() {
        applyFilters();
    });
}

function setupFilters() {
    // Initialize filter values
    const statusFilter = document.getElementById('filter-status');
    const typeFilter = document.getElementById('filter-type');
    const seatsFilter = document.getElementById('filter-seats');
    
    // Set initial values from URL params if available
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('status')) statusFilter.value = urlParams.get('status');
    if (urlParams.has('type')) typeFilter.value = urlParams.get('type');
    if (urlParams.has('seats')) seatsFilter.value = urlParams.get('seats');
    
    // Update active filters object
    updateActiveFilters();
    updateFilterBadge();
}

function updateActiveFilters() {
    activeFilters = {};
    
    const statusFilter = document.getElementById('filter-status').value;
    const typeFilter = document.getElementById('filter-type').value;
    const seatsFilter = document.getElementById('filter-seats').value;
    
    if (statusFilter) activeFilters.status = statusFilter;
    if (typeFilter) activeFilters.type = typeFilter;
    if (seatsFilter) activeFilters.seats = parseInt(seatsFilter);
}

function updateFilterBadge() {
    const filterCount = Object.keys(activeFilters).length;
    const filterBadge = document.getElementById('filter-badge');
    
    if (filterCount > 0) {
        filterBadge.textContent = filterCount;
        filterBadge.classList.add('show');
    } else {
        filterBadge.classList.remove('show');
    }
}

function resetFilters() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-seats').value = '';
    
    activeFilters = {};
    applyFilters();
}

function applyFilters() {
    updateActiveFilters();
    
    const searchFilter = document.getElementById('filter-search').value.toLowerCase();
    const tableItems = document.querySelectorAll('.table-item');
    const canvasTables = document.querySelectorAll('.canvas-table');
    
    // Filter table list items
    tableItems.forEach(item => {
        let show = true;
        
        // Status filter
        if (activeFilters.status) {
            const isReserved = item.classList.contains('reserved');
            if (activeFilters.status === 'reserved' && !isReserved) show = false;
            if (activeFilters.status === 'available' && isReserved) show = false;
        }
        
        // Type filter
        if (activeFilters.type && show) {
            const tableType = item.dataset.tableType;
            if (tableType !== activeFilters.type) show = false;
        }
        
        // Seats filter
        if (activeFilters.seats && show) {
            const tableSeats = parseInt(item.dataset.tableSeats);
            if (tableSeats < activeFilters.seats) show = false;
        }
        
        // Search filter
        if (searchFilter && show) {
            const itemText = item.textContent.toLowerCase();
            if (!itemText.includes(searchFilter)) show = false;
        }
        
        item.style.display = show ? 'block' : 'none';
    });
    
    // Filter canvas tables
    canvasTables.forEach(table => {
        let show = true;
        
        // Status filter
        if (activeFilters.status) {
            const isReserved = table.classList.contains('reserved');
            if (activeFilters.status === 'reserved' && !isReserved) show = false;
            if (activeFilters.status === 'available' && isReserved) show = false;
        }
        
        // Type filter
        if (activeFilters.type && show) {
            const tableType = table.dataset.tableType;
            if (tableType !== activeFilters.type) show = false;
        }
        
        // Seats filter
        if (activeFilters.seats && show) {
            const tableSeats = parseInt(table.dataset.tableSeats);
            if (tableSeats < activeFilters.seats) show = false;
        }
        
        table.style.display = show ? 'flex' : 'none';
    });
    
    // Check if any tables are visible after filtering
    checkNoResults();
}

function checkNoResults() {
    const visibleTables = document.querySelectorAll('.table-item[style="display: block;"]').length;
    const tableList = document.getElementById('table-list');
    const noDataElement = tableList.querySelector('.no-data');
    
    if (visibleTables === 0) {
        if (!noDataElement) {
            tableList.innerHTML += `
                <div class="no-data">
                    <i class="la la-filter"></i>
                    <h4>No Matching Tables</h4>
                    <p>No tables match your current filter criteria.</p>
                </div>
            `;
        }
    } else {
        if (noDataElement) {
            noDataElement.remove();
        }
    }
}

function zoomCanvas(factor) {
    canvasScale *= factor;
    canvasScale = Math.max(0.5, Math.min(2, canvasScale)); // Limit zoom between 0.5x and 2x
    
    const canvasContent = document.getElementById('ap-canvasContent');
    canvasContent.style.transform = `scale(${canvasScale})`;
    canvasContent.style.transformOrigin = 'top left';
}

function resetCanvas() {
    canvasScale = 1;
    const canvasContent = document.getElementById('ap-canvasContent');
    canvasContent.style.transform = 'scale(1)';
    canvasContent.scrollTop = 0;
    canvasContent.scrollLeft = 0;
}

function renderReservationsList(reservations = []) {
    const tableList = document.getElementById('table-list');
    if (!tableList) return;
    // Calculate pagination
    const totalPages = Math.ceil(reservations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentReservations = reservations.slice(startIndex, endIndex);
    let html = '';
    if (currentReservations.length === 0) {
        html = `
            <div class="no-data">
                <i class="la la-calendar-times-o"></i>
                <h4>No Reservations Found</h4>
                <p>No reservations available for the selected date.</p>
            </div>
        `;
    } else {
        html = `
            <div class="reservation-list-header">
                <div class="reservation-row header">
                    <div class="col table-name">Table</div>
                    <div class="col seats">Seats</div>
                    <div class="col time">Time</div>
                    <div class="col customer">Customer</div>
                </div>
            </div>
            <div class="reservation-list-body">
                ${currentReservations.map(reservation => `
                    <div class="reservation-row" 
                         data-table-id="${reservation.tableId?._id || ''}"
                         data-reservation-id="${reservation._id}">
                        <div class="col table-name">
                            ${reservation.tableId ? (reservation.tableId.name || reservation.tableId.tableId) : 'Unknown Table'}
                        </div>
                        <div class="col seats">
                            ${reservation.tableId?.seats || 'N/A'}
                        </div>
                        <div class="col time">
                            ${formatTime(reservation.startTime)} - 
                            ${formatTime(reservation.endTime)}
                        </div>
                        <div class="col customer">
                            ${reservation.metadata?.name || 'Guest'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        if (totalPages > 1) {
            html += `
                <div class="pagination">
                    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                            onclick="changePage(${currentPage - 1})">
                        Previous
                    </button>
                    <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
                    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                            onclick="changePage(${currentPage + 1})">
                        Next
                    </button>
                </div>
            `;
        }
    }
    tableList.innerHTML = html;
    setupTableClickListeners();
}

async function loadFloorPlan(floorPlanId) {
    if (!floorPlanId) return;
    const canvasContent = document.getElementById('ap-canvasContent');
    if (!canvasContent) return;
    try {
        // Show loading state
        canvasContent.innerHTML = `
            <div class="loading-indicator">
                <i class="la la-spinner la-spin"></i>
                <p>Loading floor plan...</p>
            </div>
        `;
        // Use TableApi to fetch tables with proper error handling
        const tables = await window.TableApi.fetchTablesForFloorPlan(floorPlanId);
        // Clear loading state and restore drop zone
        canvasContent.innerHTML = `
            <div class="ap-drop-zone" id="ap-dropZone">
                <div class="ap-drop-message">Drop table here to add to floor plan</div>
            </div>
        `;
        // Render tables
        tables.forEach(table => {
            renderTableOnCanvas(table);
        });
    } catch (error) {
        console.error('Error loading floor plan:', error);
        canvasContent.innerHTML = `
            <div class="error-state">
                <i class="la la-exclamation-circle"></i>
                <h4>Error Loading Floor Plan</h4>
                <p>${error.message || 'Please try again later'}</p>
                <button onclick="retryLoadFloorPlan('${floorPlanId}')">Retry</button>
            </div>
        `;
    }
}

// Initialize section toggle functionality
function initializeSectionToggles() {
    document.querySelectorAll('.section-toggle-btn').forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const sectionContent = document.getElementById(`${sectionId}-section`);
            const icon = this.querySelector('i');
            
            if (sectionContent.style.display === 'none' || !sectionContent.classList.contains('expanded')) {
                // Expand section
                sectionContent.style.display = 'block';
                sectionContent.classList.add('expanded');
                icon.classList.remove('la-angle-down');
                icon.classList.add('la-angle-up');
                
                // Small delay to ensure smooth animation
                setTimeout(() => {
                    sectionContent.style.height = sectionContent.scrollHeight + 'px';
                }, 0);
            } else {
                // Collapse section
                sectionContent.classList.remove('expanded');
                sectionContent.style.display = 'none';
                icon.classList.remove('la-angle-up');
                icon.classList.add('la-angle-down');
            }
        });
    });

    // Initialize the Reservations section as expanded by default
    const reservationsSection = document.getElementById('reservations-section');
    if (reservationsSection) {
        reservationsSection.classList.add('expanded');
        reservationsSection.style.display = 'block';
    }
}
