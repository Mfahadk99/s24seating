console.log('availability.js file loaded successfully!');

// Add this right before the DOMContentLoaded event listener
console.log('Setting up DOMContentLoaded listener...');

// Global variables
let draggedElement = null;
let selectedTable = null;
let tableCounter = 0;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isMobile = window.innerWidth <= 768;
let isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

// Hard-coded floorPlanId as requested
const FLOOR_PLAN_ID = "68603b4fb615b17fb15c30fb";

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - starting initialization...');
    
    // Fetch and render tables from backend
    fetchAndRenderTables();
    
    // Initialize device type check first
    checkDeviceType();
    
    // Initialize mobile functionality
    initializeMobileFunctionality();
    
    // Initialize other functionality
    initializeDragAndDrop();
    initializeTableInteractions();
    initializeToolbarButtons();
    initializePublishButton();
    updateTableCount();

    // Add event listeners for form inputs with null checks
    const tableName = document.getElementById('tableName');
    const maxParty = document.getElementById('maxParty');
    const minParty = document.getElementById('minParty');

    if (tableName) {
        tableName.addEventListener('input', function () {
            const selected = document.querySelector('.ap-dropped-table.selected');
            if (selected && this.value.trim()) {
                selected.textContent = this.value.trim();
                // Update table on server
                updateTableOnServer(selected);
            }
        });
    }

    if (maxParty) {
        maxParty.addEventListener('change', function () {
            const selected = document.querySelector('.ap-dropped-table.selected');
            if (selected && this.value) {
                selected.dataset.seats = this.value;
                selected.dataset.maxParty = this.value;
                // Update table on server
                updateTableOnServer(selected);
            }
        });
    }

    if (minParty) {
        minParty.addEventListener('change', function () {
            const selected = document.querySelector('.ap-dropped-table.selected');
            if (selected && this.value) {
                selected.dataset.minParty = this.value;
                // Update table on server
                updateTableOnServer(selected);
            }
        });
    }

    // Initialize Create Floor Plan Modal
    initializeCreateFloorPlanModal();
});

// API Functions
async function createTableOnServer(tableData) {
    try {
        console.log('Creating table on server:', tableData);
        // Get the JWT token from cookies
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('authToken='))
            ?.split('=')[1] || '';
            
        const response = await fetch('/tables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(tableData)
        });

        console.log('Response:', response);
        // Check for redirect (status 302)
        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('Table created successfully:', result.data);
            return result.data;
        } else {
            console.error('Failed to create table:', result.message);
            throw new Error(result.message || 'Failed to create table');
        }
    } catch (error) {
        console.error('Error creating table:', error);
        throw error;
    }
}
async function updateTableOnServer(tableElement) {
    try {
        if (!tableElement.dataset.serverId) {
            console.log('Table not yet saved to server, skipping update');
            return;
        }

        const tableData = {
            name: tableElement.textContent,
            tableType: tableElement.dataset.type,
            seats: parseInt(tableElement.dataset.seats) || 4,
            position: {
                x: parseInt(tableElement.style.left) || 0,
                y: parseInt(tableElement.style.top) || 0
            },
            capacity: {
                minParty: parseInt(tableElement.dataset.minParty) || 1,
                maxParty: parseInt(tableElement.dataset.maxParty) || parseInt(tableElement.dataset.seats) || 4
            },
            status: "active",
            isReserved: false
        };

        console.log('Updating table on server:', tableData);
        
        // Get the JWT token from cookies
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('authToken='))
            ?.split('=')[1] || '';
        
        const response = await fetch(`/tables/${tableElement.dataset.serverId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(tableData)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('Table updated successfully:', result.data);
        } else {
            console.error('Failed to update table:', result.message);
        }
    } catch (error) {
        console.error('Error updating table:', error);
    }
}
async function deleteTableOnServer(serverId) {
    try {
        console.log('Deleting table on server:', serverId);
        
        const response = await fetch(`/api/tables/${serverId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('Table deleted successfully');
            return true;
        } else {
            console.error('Failed to delete table:', result.message);
            throw new Error(result.message || 'Failed to delete table');
        }
    } catch (error) {
        console.error('Error deleting table:', error);
        throw error;
    }
}

// Update device type check with better state management
function checkDeviceType() {
    const width = window.innerWidth;
    const wasMobile = isMobile;
    isMobile = width <= 768;
    isTablet = width <= 1024 && width > 768;
    
    console.log('Device check:', { width, isMobile, isTablet });
    
    // Handle state transition when device type changes
    if (wasMobile !== isMobile) {
        handleDeviceTypeChange(wasMobile);
    }
}

// Enhanced device type change handler
function handleDeviceTypeChange(wasMobile) {
    const sidebar = document.getElementById('ap-sidebarAvailability');
    const rightPanel = document.querySelector('.ap-right-panel');
    const overlay = document.querySelector('.ap-mobile-overlay');
    
    if (!sidebar) return;
    
    console.log('Handling device type change:', { wasMobile, isMobile });
    
    if (isMobile) {
        // Switching to mobile
        console.log('Switching to mobile view');
        
        // Remove desktop-specific classes
        sidebar.classList.remove('collapsed');
        
        // Reset mobile state
        sidebar.classList.remove('mobile-open');
        if (rightPanel) rightPanel.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        
        // Force transform for mobile
        sidebar.style.transform = 'translateX(-100%)';
        
    } else {
        // Switching to desktop
        console.log('Switching to desktop view');
        
        // Remove mobile-specific classes and styles
        sidebar.classList.remove('mobile-open');
        sidebar.style.transform = '';
        
        // Restore desktop collapsed state
        const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (wasCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
        
        // Clean up mobile state
        if (rightPanel) rightPanel.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
    }
    
    // Update UI elements visibility
    updateUIElementsVisibility();
}

// New function to update UI elements visibility
function updateUIElementsVisibility() {
    const mobileBurgerMenu = document.getElementById('ap-mobileBurgerMenu');
    const settingsBtn = document.getElementById('ap-mobileSettingsBtn');
    const desktopBurgerMenu = document.getElementById('ap-burgerMenuAvailability');
    
    if (isMobile) {
        if (mobileBurgerMenu) mobileBurgerMenu.style.display = 'flex';
        if (settingsBtn) settingsBtn.style.display = 'block';
        if (desktopBurgerMenu) desktopBurgerMenu.style.display = 'none';
    } else {
        if (mobileBurgerMenu) mobileBurgerMenu.style.display = 'none';
        if (settingsBtn) settingsBtn.style.display = 'none';
        if (desktopBurgerMenu) desktopBurgerMenu.style.display = 'flex';
    }
}

// Enhanced mobile sidebar open function
function openMobileSidebar() {
    const sidebar = document.getElementById('ap-sidebarAvailability');
    const overlay = document.querySelector('.ap-mobile-overlay');
    const rightPanel = document.querySelector('.ap-right-panel');
    
    if (!sidebar || !isMobile) return;
    
    console.log('Opening mobile sidebar');
    
    // Remove desktop classes
    sidebar.classList.remove('collapsed');
    
    // Add mobile classes
    sidebar.classList.add('mobile-open');
    sidebar.style.transform = 'translateX(0)';
    
    if (overlay) {
        overlay.classList.add('active');
    }
    
    // Close right panel if open
    if (rightPanel && rightPanel.classList.contains('mobile-open')) {
        rightPanel.classList.remove('mobile-open');
    }
}

// Enhanced mobile sidebar close function
function closeMobileSidebar() {
    const sidebar = document.getElementById('ap-sidebarAvailability');
    const overlay = document.querySelector('.ap-mobile-overlay');
    
    if (!sidebar || !isMobile) return;
    
    console.log('Closing mobile sidebar');
    
    // Remove mobile open class
    sidebar.classList.remove('mobile-open');
    sidebar.style.transform = 'translateX(-100%)';
    
    // Handle overlay
    const rightPanel = document.querySelector('.ap-right-panel');
    if (overlay && (!rightPanel || !rightPanel.classList.contains('mobile-open'))) {
        overlay.classList.remove('active');
    }
}

// Update the desktop sidebar toggle function
function toggleDesktopSidebar() {
    const sidebar = document.getElementById('ap-sidebarAvailability');
    
    if (!sidebar || isMobile) return;
    
    const isCollapsed = sidebar.classList.contains('collapsed');
    
    if (isCollapsed) {
        sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
        console.log('Desktop sidebar expanded');
    } else {
        sidebar.classList.add('collapsed');
        localStorage.setItem('sidebarCollapsed', 'true');
        console.log('Desktop sidebar collapsed');
    }
}

// Update initialization function
function initializeMobileFunctionality() {
    console.log('=== Initializing mobile functionality ===');
    
    // Initialize sidebar state first
    initializeSidebarState();
    
    const sidebar = document.getElementById('ap-sidebarAvailability');
    const mobileBurgerMenu = document.getElementById('ap-mobileBurgerMenu');
    const settingsBtn = document.getElementById('ap-mobileSettingsBtn');
    const rightPanel = document.querySelector('.ap-right-panel');
    
    // Create mobile overlay if it doesn't exist
    let overlay = document.querySelector('.ap-mobile-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'ap-mobile-overlay';
        overlay.id = 'ap-mobileOverlay';
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', function() {
            if (isMobile) {
                closeMobileSidebar();
                closeMobileRightPanel();
            }
        });
    }
    
    // Mobile burger menu functionality
    if (mobileBurgerMenu) {
        mobileBurgerMenu.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isMobile) return;
            
            console.log('Mobile burger menu clicked');
            
            if (sidebar.classList.contains('mobile-open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }
    
    // Desktop burger menu functionality
    const desktopBurgerMenu = document.getElementById('ap-burgerMenuAvailability');
    if (desktopBurgerMenu) {
        desktopBurgerMenu.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (isMobile) {
                closeMobileSidebar();
            } else {
                toggleDesktopSidebar();
            }
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', debounce(function() {
        checkDeviceType();
    }, 250));
    
    // Initial UI update
    updateUIElementsVisibility();
}

// Add debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update CSS for better transitions
const additionalStyles = `
    .ap-sidebar {
        transition: transform 0.3s ease, width 0.3s ease;
    }
    
    .ap-dropped-table.creating {
        border: 2px dashed #3b82f6;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
    }
    
    @media (max-width: 768px) {
        .ap-sidebar {
            transform: translateX(-100%);
            width: 280px !important;
        }
        
        .ap-sidebar.mobile-open {
            transform: translateX(0);
        }
    }
    
    @media (min-width: 769px) {
        .ap-sidebar {
            transform: none !important;
            transition: width 0.3s ease;
        }
    }
`;

// Add the styles to the document
function addStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', function() {
    addStyles();
    // ... rest of your initialization code ...
});

// Drag and Drop Functionality
function initializeDragAndDrop() {
    const tableElements = document.querySelectorAll('.ap-table-element');
    const canvas = document.getElementById('ap-canvas');
    const canvasContent = document.getElementById('ap-canvasContent');
    const dropZone = document.getElementById('ap-dropZone');

    // Add null checks
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Initialize both drag-and-drop and click-to-place functionality
    tableElements.forEach(element => {
        // Desktop drag and drop
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('dragend', handleDragEnd);

        // Mobile click to place
        element.addEventListener('click', handleMobileTableClick);
    });

    // Handle drop zone
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
    canvas.addEventListener('dragenter', handleDragEnter);
    canvas.addEventListener('dragleave', handleDragLeave);

    // Handle existing table dragging
    initializeExistingTableDragging();
}

function handleDragStart(e) {
    draggedElement = e.target.closest('.ap-table-element');
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/html', draggedElement.outerHTML);
}

function handleDragEnd(e) {
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleDragEnter(e) {
    e.preventDefault();
    document.getElementById('ap-dropZone').classList.add('active');
}

function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
        document.getElementById('ap-dropZone').classList.remove('active');
    }
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('ap-dropZone').classList.remove('active');

    if (!draggedElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createDroppedTable(draggedElement, x, y);
    updateTableCount();
}

// New function to handle mobile table element clicks
function handleMobileTableClick(e) {
    if (!isMobile) return; // Only handle clicks on mobile

    e.preventDefault();
    e.stopPropagation();

    const tableElement = e.currentTarget;
    console.log('Mobile table element clicked:', tableElement.dataset.type);

    // Close the sidebar
    closeMobileSidebar();

    // Show placement guide
    showMobilePlacementGuide(() => {
        // Callback when guide is dismissed
        const canvasContent = document.getElementById('ap-canvasContent');
        if (!canvasContent) return;

        // Calculate center position of the canvas viewport
        const canvas = document.getElementById('ap-canvas');
        const rect = canvas.getBoundingClientRect();
        const scrollLeft = canvas.scrollLeft;
        const scrollTop = canvas.scrollTop;

        // Place the table in the center of the visible canvas area
        const x = scrollLeft + (rect.width / 2);
        const y = scrollTop + (rect.height / 2);

        createDroppedTable(tableElement, x, y);
        updateTableCount();
    });
}

// New function to show mobile placement guide
function showMobilePlacementGuide(callback) {
    // Create and show a mobile-friendly guide overlay
    const guideOverlay = document.createElement('div');
    guideOverlay.className = 'ap-mobile-placement-guide';
    guideOverlay.innerHTML = `
        <div class="ap-guide-content">
            <h3>Table Placement</h3>
            <p>Your table will be placed in the center of the canvas.</p>
            <p>You can then drag it to adjust its position.</p>
            <button class="ap-guide-button">Place Table</button>
        </div>
    `;

    document.body.appendChild(guideOverlay);

    // Add styles for the guide
    const style = document.createElement('style');
    style.textContent = `
        .ap-mobile-placement-guide {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        }

        .ap-guide-content {
            background: white;
            padding: 20px;
            border-radius: 12px;
            max-width: 90%;
            width: 300px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .ap-guide-content h3 {
            margin: 0 0 12px 0;
            color: #1e293b;
            font-size: 18px;
        }

        .ap-guide-content p {
            margin: 8px 0;
            color: #64748b;
            font-size: 14px;
            line-height: 1.4;
        }

        .ap-guide-button {
            margin-top: 16px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .ap-guide-button:hover {
            background: #1d4ed8;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Handle button click
    const button = guideOverlay.querySelector('.ap-guide-button');
    button.addEventListener('click', () => {
        guideOverlay.remove();
        style.remove();
        if (callback) callback();
    });
}

// Modify makeTableDraggable for better mobile support
function makeTableDraggable(table) {
    if (isMobile) {
        // Mobile touch events
        table.addEventListener('touchstart', handleTableTouchStart, { passive: false });
        table.addEventListener('touchmove', handleTableTouchMove, { passive: false });
        table.addEventListener('touchend', handleTableTouchEnd);
    }

    // Existing mouse events
    table.addEventListener('mousedown', handleTableMouseDown);
    table.addEventListener('click', handleTableClick);
    table.addEventListener('dblclick', handleTableDoubleClick);
}

// New touch event handlers for mobile dragging
let touchDragging = false;
let touchStartX = 0;
let touchStartY = 0;
let initialTouchX = 0;
let initialTouchY = 0;

function handleTableTouchStart(e) {
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    const table = e.currentTarget;

    touchStartX = parseInt(table.style.left) || 0;
    touchStartY = parseInt(table.style.top) || 0;
    initialTouchX = touch.clientX;
    initialTouchY = touch.clientY;
    touchDragging = true;

    // Visual feedback
    table.classList.add('dragging');

    // Select the table
    document.querySelectorAll('.ap-dropped-table.selected').forEach(t => {
        t.classList.remove('selected');
    });
    table.classList.add('selected');
    updateRightPanel(table);
}

function handleTableTouchMove(e) {
    if (!touchDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const table = e.currentTarget;
    const canvas = document.getElementById('ap-canvasContent');

    const deltaX = touch.clientX - initialTouchX;
    const deltaY = touch.clientY - initialTouchY;

    const newX = touchStartX + deltaX;
    const newY = touchStartY + deltaY;

    // Apply constraints to keep table within canvas bounds
    const maxX = canvas.offsetWidth - table.offsetWidth;
    const maxY = canvas.offsetHeight - table.offsetHeight;

    table.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
    table.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
}

function handleTableTouchEnd(e) {
    const table = e.currentTarget;
    touchDragging = false;
    table.classList.remove('dragging');
    
    // Update position on server after drag ends
    updateTableOnServer(table);
}

// Update createDroppedTable to handle mobile positioning better
async function createDroppedTable(sourceElement, x, y) {
    const canvasContent = document.getElementById('ap-canvasContent');
    const tableType = sourceElement.dataset.type;
    const seats = parseInt(sourceElement.dataset.seats) || 4;

    tableCounter++;
    const tableId = `T${tableCounter}`;

    // Create the visual table element
    const droppedTable = document.createElement('div');
    droppedTable.className = 'ap-dropped-table';
    droppedTable.textContent = tableId;
    droppedTable.dataset.seats = seats;
    droppedTable.dataset.type = tableType;
    droppedTable.dataset.id = tableId;
    droppedTable.dataset.minParty = "1";
    droppedTable.dataset.maxParty = seats.toString();

    // Set initial size and shape
    setTableStyle(droppedTable, tableType, seats);

    // Calculate position considering table size
    const tableWidth = parseInt(droppedTable.style.width);
    const tableHeight = parseInt(droppedTable.style.height);
    const finalX = Math.max(0, x - (tableWidth / 2));
    const finalY = Math.max(0, y - (tableHeight / 2));
    
    droppedTable.style.left = `${finalX}px`;
    droppedTable.style.top = `${finalY}px`;

    // Prepare data for API call
    const tableData = {
        tableId: tableId,
        name: tableId,
        tableType: tableType,
        seats: seats,
        position: {
            x: finalX,
            y: finalY
        },
        capacity: {
            minParty: 1,
            maxParty: seats
        },
        status: "active",
        isReserved: false,
        floorPlanId: FLOOR_PLAN_ID
    };

    // Show loading state
    droppedTable.classList.add('creating');
    droppedTable.style.opacity = '0.7';

    try {
        // Call API to create table
        const createdTable = await createTableOnServer(tableData);
        
        // Store server ID for future updates
        droppedTable.dataset.serverId = createdTable._id;
        
        // Remove loading state
        droppedTable.classList.remove('creating');
        droppedTable.style.opacity = '1';
        
        console.log('Table created successfully with ID:', createdTable._id);
        
    } catch (error) {
        // Handle error - remove the table from UI
        console.error('Failed to create table:', error);
        droppedTable.remove();
        
        // Show error message
        alert('Failed to create table. Please try again.');
        return;
    }

    // Make it draggable
    makeTableDraggable(droppedTable);

    // Add to canvas
    canvasContent.appendChild(droppedTable);

    // For mobile, automatically select the newly placed table
    if (isMobile) {
        document.querySelectorAll('.ap-dropped-table.selected').forEach(t => {
            t.classList.remove('selected');
        });
        droppedTable.classList.add('selected');
        updateRightPanel(droppedTable);
    }
}

function setTableStyle(table, type, seats) {
    switch (type) {
        case 'round':
            table.style.borderRadius = '50%';
            if (seats <= 4) {
                table.style.width = '50px';
                table.style.height = '50px';
            } else if (seats <= 8) {
                table.style.width = '60px';
                table.style.height = '60px';
            } else {
                table.style.width = '80px';
                table.style.height = '80px';
            }
            break;
        case 'square':
            table.style.borderRadius = '4px';
            if (seats <= 4) {
                table.style.width = '50px';
                table.style.height = '50px';
            } else {
                table.style.width = '60px';
                table.style.height = '60px';
            }
            break;
        case 'rectangular':
            table.style.borderRadius = '4px';
            if (seats <= 4) {
                table.style.width = '80px';
                table.style.height = '40px';
            } else if (seats <= 8) {
                table.style.width = '120px';
                table.style.height = '60px';
            } else {
                table.style.width = '140px';
                table.style.height = '70px';
            }
            break;
        case 'hexagon':
            table.style.width = '50px';
            table.style.height = '50px';
            table.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)';
            break;
        case 'bar':
            table.style.width = '100px';
            table.style.height = '30px';
            table.style.borderRadius = '15px';
            break;
    }
}

// Initialize dragging for existing tables
function initializeExistingTableDragging() {
    const existingTables = document.querySelectorAll('.ap-dropped-table');
    existingTables.forEach(table => {
        makeTableDraggable(table);
    });
}

function handleTableMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    const table = e.currentTarget;
    let startX = e.clientX;
    let startY = e.clientY;
    let hasMoved = false;

    // Get initial position
    const canvasRect = document.getElementById('ap-canvas').getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();

    // Calculate proper offset from canvas
    const initialLeft = tableRect.left - canvasRect.left + document.getElementById('ap-canvas').scrollLeft;
    const initialTop = tableRect.top - canvasRect.top + document.getElementById('ap-canvas').scrollTop;

    // Calculate offset from mouse to table's top-left corner
    dragOffset.x = e.clientX - tableRect.left;
    dragOffset.y = e.clientY - tableRect.top;

    function handleMouseMove(e) {
        const deltaX = Math.abs(e.clientX - startX);
        const deltaY = Math.abs(e.clientY - startY);

        // Only start dragging if mouse moved more than 5 pixels
        if (deltaX > 5 || deltaY > 5) {
            if (!hasMoved) {
                hasMoved = true;
                isDragging = true;
                selectedTable = table;

                // Clear other selections and select this table
                document.querySelectorAll('.ap-dropped-table.selected').forEach(t => {
                    t.classList.remove('selected');
                });
                table.classList.add('selected');
                table.classList.add('dragging');

                // Update right panel
                updateRightPanel(table);
            }

            // Calculate new position relative to canvas
            const canvasRect = document.getElementById('ap-canvas').getBoundingClientRect();
            const newX = e.clientX - canvasRect.left - dragOffset.x + document.getElementById('ap-canvas').scrollLeft;
            const newY = e.clientY - canvasRect.top - dragOffset.y + document.getElementById('ap-canvas').scrollTop;

            // Apply constraints to keep table within canvas bounds
            const maxX = document.getElementById('ap-canvasContent').offsetWidth - table.offsetWidth;
            const maxY = document.getElementById('ap-canvasContent').offsetHeight - table.offsetHeight;

            table.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            table.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        }
    }

    function handleMouseUp(e) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (hasMoved) {
            table.classList.remove('dragging');
            isDragging = false;
            selectedTable = null;
            
            // Update position on server after drag ends
            updateTableOnServer(table);
        } else {
            // This was a click, not a drag
            // Handle selection
            document.querySelectorAll('.ap-dropped-table.selected').forEach(t => {
                t.classList.remove('selected');
            });
            table.classList.add('selected');
            updateRightPanel(table);
        }
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleTableClick(e) {
    e.stopPropagation();
    // This will be handled by mousedown/mouseup logic above
    // Only handle if it's not during a drag operation
    if (!isDragging) {
        const table = e.currentTarget;
        document.querySelectorAll('.ap-dropped-table.selected').forEach(t => {
            t.classList.remove('selected');
        });
        table.classList.add('selected');
        updateRightPanel(table);
    }
}

function handleTableDoubleClick(e) {
    e.stopPropagation();
    e.preventDefault();

    const table = e.currentTarget;
    const newLabel = prompt('Enter table label:', table.textContent);
    if (newLabel && newLabel.trim()) {
        table.textContent = newLabel.trim();
        // Update right panel if this table is selected
        if (table.classList.contains('selected')) {
            document.getElementById('tableName').value = newLabel.trim();
        }
    }
}

// Clear selection when clicking on canvas
document.addEventListener('click', function (e) {
    // Only clear selection if clicking on canvas background, not on tables or UI elements
    if (e.target.id === 'ap-canvas' || e.target.id === 'ap-canvasContent' || e.target.classList.contains('ap-drop-zone')) {
        document.querySelectorAll('.ap-dropped-table.selected').forEach(t => {
            t.classList.remove('selected');
        });
        // Clear right panel
        const tableName = document.getElementById('tableName');
        const minParty = document.getElementById('minParty');
        const maxParty = document.getElementById('maxParty');
        
        if (tableName) tableName.value = '';
        if (minParty) minParty.value = 1;
        if (maxParty) maxParty.value = 2;
    }
});

// Toolbar functionality
function initializeToolbarButtons() {
    const toolbarBtns = document.querySelectorAll('.ap-toolbar-btn');

    toolbarBtns.forEach((btn, index) => {
        btn.addEventListener('click', function () {
            switch (index) {
                case 0: // Zoom in
                    zoomCanvas(1.1);
                    break;
                case 1: // Zoom out
                    zoomCanvas(0.9);
                    break;
                case 2: // Settings
                    openSettings();
                    break;
                case 3: // Copy
                    copySelectedTable();
                    break;
                case 4: // Properties
                    openProperties();
                    break;
                case 5: // Save
                    saveFloorPlan();
                    break;
                case 6: // Statistics
                    showStatistics();
                    break;
            }
        });
    });
}

function zoomCanvas(factor) {
    const canvas = document.getElementById('ap-canvas');
    const currentScale = canvas.style.transform.match(/scale\(([^)]+)\)/);
    const scale = currentScale ? parseFloat(currentScale[1]) * factor : factor;

    canvas.style.transform = `scale(${Math.max(0.5, Math.min(2, scale))})`;
    canvas.style.transformOrigin = 'top left';
}

function openSettings() {
    alert('Settings panel would open here');
}

function copySelectedTable() {
    const selected = document.querySelector('.ap-dropped-table.selected');
    if (selected) {
        const rect = selected.getBoundingClientRect();
        const canvasRect = document.getElementById('ap-canvas').getBoundingClientRect();

        // Calculate new position (offset by 20px)
        const newX = parseInt(selected.style.left) + 20;
        const newY = parseInt(selected.style.top) + 20;

        // Create table element to simulate drag source
        const sourceElement = document.createElement('div');
        sourceElement.dataset.type = selected.dataset.type;
        sourceElement.dataset.seats = selected.dataset.seats;

        // Create the new table
        createDroppedTable(sourceElement, newX, newY);
        updateTableCount();
    }
}

function openProperties() {
    const selected = document.querySelector('.ap-dropped-table.selected');
    if (selected) {
        const seats = prompt('Number of seats:', selected.dataset.seats);
        if (seats && !isNaN(seats)) {
            selected.dataset.seats = seats;
        }
    } else {
        alert('Please select a table first');
    }
}

function saveFloorPlan() {
    const tables = Array.from(document.querySelectorAll('.ap-dropped-table')).map(table => ({
        id: table.dataset.id,
        label: table.textContent,
        type: table.dataset.type,
        seats: table.dataset.seats,
        x: parseInt(table.style.left),
        y: parseInt(table.style.top),
        width: parseInt(table.style.width),
        height: parseInt(table.style.height)
    }));

    console.log('Saving floor plan:', tables);
    
    // Show loading state
    const originalText = 'Save';
    const saveBtn = document.querySelector('[onclick="saveFloorPlan()"]');
    if (saveBtn) {
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            alert('Floor plan saved successfully!');
        }, 1000);
    } else {
        alert('Floor plan saved successfully!');
    }
}

function showStatistics() {
    const tables = document.querySelectorAll('.ap-dropped-table');
    const totalSeats = Array.from(tables).reduce((sum, table) => {
        return sum + parseInt(table.dataset.seats || 0);
    }, 0);

    const message = `Floor Plan Statistics:\nTables: ${tables.length}\nTotal Seats: ${totalSeats}`;
    
    if (isMobile) {
        // Use a more mobile-friendly alert
        const confirmed = confirm(message + '\n\nWould you like to continue?');
        console.log('Statistics viewed:', confirmed);
    } else {
        alert(message);
    }
}

// Publish functionality
function initializePublishButton() {
    const publishBtn = document.querySelector('.publish-btn');
    if (publishBtn) {
        publishBtn.addEventListener('click', publishUpdates);
    }
}

function publishUpdates() {
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const notice = document.querySelector('.unpublished-notice');
    if (notice) {
        notice.style.display = 'none';
    }

    const publishDate = document.querySelector('.publish-btn + div');
    if (publishDate) {
        publishDate.textContent = `Published: ${today}`;
    }

    alert('Changes published successfully!');
}

// Update table count
function updateTableCount() {
    const count = document.querySelectorAll('.ap-dropped-table').length;
    const countElement = document.getElementById('tableCount');
    if (countElement) {
        countElement.textContent = count;
    }
    updateRightPanelTableCount();
}

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            console.log('Navigating to:', this.textContent);
        });
    });
}

// Floor selector functionality
function initializeFloorSelector() {
    const floorSelector = document.querySelector('.floor-selector');
    if (floorSelector) {
        floorSelector.addEventListener('change', function () {
            console.log('Switching to floor:', this.value);
        });
    }
}

// Dining area functionality
function initializeDiningArea() {
    const diningAreaBtn = document.querySelector('.dining-area-btn');
    if (diningAreaBtn) {
        diningAreaBtn.addEventListener('click', function () {
            const areaName = prompt('Enter dining area name:');
            if (areaName && areaName.trim()) {
                console.log('Creating dining area:', areaName);
            }
        });
    }
}

// Keyboard shortcuts (disabled on mobile for better UX)
if (!isMobile) {
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const selected = document.querySelector('.ap-dropped-table.selected');
            if (selected) {
                selected.remove();
                updateTableCount();
            }
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'c':
                    e.preventDefault();
                    copySelectedTable();
                    break;
                case 's':
                    e.preventDefault();
                    saveFloorPlan();
                    break;
                case 'z':
                    e.preventDefault();
                    // Undo functionality would go here
                    break;
            }
        }
    });
}

// Update table properties in right panel when table is selected
function updateRightPanel(table) {
    if (table) {
        const tableName = document.getElementById('tableName');
        const minParty = document.getElementById('minParty');
        const maxParty = document.getElementById('maxParty');

        if (tableName) tableName.value = table.textContent || '';
        if (minParty) minParty.value = table.dataset.minParty || 1;
        if (maxParty) maxParty.value = table.dataset.maxParty || table.dataset.seats || 2;
    }
}

// Duplicate selected table function
function duplicateSelectedTable() {
    const selected = document.querySelector('.ap-dropped-table.selected');
    if (selected) {
        copySelectedTable();
    } else {
        alert('Please select a table first');
    }
}

// Delete selected table function
async function deleteSelectedTable() {
    const selected = document.querySelector('.ap-dropped-table.selected');
    if (selected) {
        if (confirm('Are you sure you want to delete this table?')) {
            // Show loading state
            selected.style.opacity = '0.5';
            
            try {
                // Delete from server if it has a server ID
                if (selected.dataset.serverId) {
                    await deleteTableOnServer(selected.dataset.serverId);
                }
                
                // Remove from UI
                selected.remove();
                updateTableCount();
                updateRightPanelTableCount();
                
                // Clear form
                const tableName = document.getElementById('tableName');
                const minParty = document.getElementById('minParty');
                const maxParty = document.getElementById('maxParty');
                
                if (tableName) tableName.value = '';
                if (minParty) minParty.value = 1;
                if (maxParty) maxParty.value = 2;
                
            } catch (error) {
                // Restore opacity on error
                selected.style.opacity = '1';
                alert('Failed to delete table. Please try again.');
            }
        }
    } else {
        alert('Please select a table first');
    }
}

// Create dining area function
function createDiningArea() {
    const areaName = prompt('Enter dining area name:');
    if (areaName && areaName.trim()) {
        const list = document.querySelector('.dining-areas-list');
        if (list) {
            const newItem = document.createElement('li');
            newItem.className = 'dining-area-item';
            newItem.innerHTML = `
              <div class="dining-area-name">${areaName.trim()}</div>
              <div class="dining-area-stats">0 tables • 1 floor plan</div>
            `;
            list.appendChild(newItem);
        }
    }
}

// Update right panel table count
function updateRightPanelTableCount() {
    const count = document.querySelectorAll('.ap-dropped-table').length;
    const countElement = document.getElementById('ap-rightPanelTableCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

function initializeTableInteractions() {
    // Initialize existing table dragging
    initializeExistingTableDragging();
    
    // Add any other table interaction logic here
    console.log('Table interactions initialized');
}

// Export functions for global access if needed
window.availabilityApp = {
    checkDeviceType,
    closeMobileSidebar,
    closeMobileRightPanel,
    duplicateSelectedTable,
    deleteSelectedTable,
    createDiningArea,
    saveFloorPlan,
    showStatistics,
    zoomCanvas
};

console.log('Availability.js initialization completed successfully!');

// Add this function to handle mobile right panel closing
function closeMobileRightPanel() {
    const rightPanel = document.querySelector('.ap-right-panel');
    const overlay = document.querySelector('.ap-mobile-overlay');
    
    if (!rightPanel || !isMobile) return;
    
    console.log('Closing mobile right panel');
    
    // Remove mobile open class
    rightPanel.classList.remove('mobile-open');
    
    // Handle overlay
    const sidebar = document.getElementById('ap-sidebarAvailability');
    if (overlay && (!sidebar || !sidebar.classList.contains('mobile-open'))) {
        overlay.classList.remove('active');
    }
}

// Add this function to initialize sidebar state
function initializeSidebarState() {
    const sidebar = document.getElementById('ap-sidebarAvailability');
    if (!sidebar) return;
    
    if (isMobile) {
        // Mobile initialization
        sidebar.classList.remove('collapsed');
        sidebar.style.transform = 'translateX(-100%)';
    } else {
        // Desktop initialization
        const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (wasCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
        sidebar.style.transform = '';
    }
    
    // Update UI elements visibility
    updateUIElementsVisibility();
}

async function fetchAndRenderTables() {
    try {
        const response = await fetch(`/tables/floorplan/${FLOOR_PLAN_ID}`);
        const result = await response.json();
        if (response.ok && result.success) {
            const tables = result.data;
            tables.forEach(table => {
                renderTableOnCanvas(table);
            });
            updateTableCount();
        } else {
            console.error('Failed to fetch tables:', result.message);
        }
    } catch (error) {
        console.error('Error fetching tables:', error);
    }
}

function renderTableOnCanvas(table) {
    const canvasContent = document.getElementById('ap-canvasContent');
    if (!canvasContent) return;

    const droppedTable = document.createElement('div');
    droppedTable.className = 'ap-dropped-table';
    droppedTable.textContent = table.name || table.tableId || table._id;
    droppedTable.dataset.seats = table.seats;
    droppedTable.dataset.type = table.tableType;
    droppedTable.dataset.id = table.tableId || table._id;
    droppedTable.dataset.minParty = table.capacity?.minParty || 1;
    droppedTable.dataset.maxParty = table.capacity?.maxParty || table.seats || 2;
    droppedTable.dataset.serverId = table._id;

    // Set size and shape
    setTableStyle(droppedTable, table.tableType, table.seats);

    // Set position
    droppedTable.style.left = `${table.position?.x || 0}px`;
    droppedTable.style.top = `${table.position?.y || 0}px`;

    // Make it draggable and interactive
    makeTableDraggable(droppedTable);

    // Add to canvas
    canvasContent.appendChild(droppedTable);
}

// Initialize Create Floor Plan Modal
function initializeCreateFloorPlanModal() {
    const createBtn = document.getElementById('createFloorPlanBtn');
    const modal = document.getElementById('createFloorPlanModal');
    const closeBtn = document.getElementById('closeCreateFloorPlanModal');
    const cancelBtn = document.getElementById('cancelCreateFloorPlan');
    const form = document.getElementById('createFloorPlanForm');
    const submitBtn = document.getElementById('createFloorPlanSubmit');
    const nameInput = document.getElementById('floorPlanName');
    const descriptionInput = document.getElementById('floorPlanDescription');
    const charCount = document.getElementById('descriptionCharCount');

    if (!createBtn || !modal) return;

    // Open modal
    createBtn.addEventListener('click', function() {
        openCreateFloorPlanModal();
    });

    // Close modal events
    closeBtn?.addEventListener('click', closeCreateFloorPlanModal);
    cancelBtn?.addEventListener('click', closeCreateFloorPlanModal);
    
    // Close modal when clicking overlay
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCreateFloorPlanModal();
        }
    });

    // Handle form submission
    form?.addEventListener('submit', handleCreateFloorPlanSubmit);

    // Character count for description
    descriptionInput?.addEventListener('input', function() {
        updateCharacterCount();
    });

    // Real-time validation
    nameInput?.addEventListener('input', function() {
        validateFloorPlanName();
    });

    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeCreateFloorPlanModal();
        }
    });
}

// Open Create Floor Plan Modal
function openCreateFloorPlanModal() {
    const modal = document.getElementById('createFloorPlanModal');
    const nameInput = document.getElementById('floorPlanName');
    
    if (!modal) return;

    // Reset form
    resetCreateFloorPlanForm();
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Focus on name input
    setTimeout(() => {
        nameInput?.focus();
    }, 300);

    console.log('Create Floor Plan modal opened');
}

// Close Create Floor Plan Modal
function closeCreateFloorPlanModal() {
    const modal = document.getElementById('createFloorPlanModal');
    
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Reset form after animation
    setTimeout(() => {
        resetCreateFloorPlanForm();
    }, 300);

    console.log('Create Floor Plan modal closed');
}

// Reset Create Floor Plan Form
function resetCreateFloorPlanForm() {
    const form = document.getElementById('createFloorPlanForm');
    const nameError = document.getElementById('nameError');
    const charCount = document.getElementById('descriptionCharCount');
    const submitBtn = document.getElementById('createFloorPlanSubmit');

    if (form) {
        form.reset();
    }

    // Clear error messages
    if (nameError) {
        nameError.textContent = '';
        nameError.classList.remove('show');
    }

    // Reset character count
    if (charCount) {
        charCount.textContent = '0';
        charCount.className = 'ap-char-count';
    }

    // Reset submit button
    if (submitBtn) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Handle Create Floor Plan Form Submission
async function handleCreateFloorPlanSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('floorPlanName');
    const descriptionInput = document.getElementById('floorPlanDescription');
    const submitBtn = document.getElementById('createFloorPlanSubmit');

    if (!nameInput || !validateFloorPlanName()) {
        return;
    }

    const formData = {
        name: nameInput.value.trim(),
        description: descriptionInput?.value.trim() || ''
    };

    // Show loading state
    if (submitBtn) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    }

    try {
        console.log('Creating floor plan:', formData);
        
        // TODO: Replace this with actual API call
        // const result = await createFloorPlanAPI(formData);
        
        // Simulate API call for now
        await simulateAPICall(formData);
        
        // Success
        showSuccessMessage('Floor plan created successfully!');
        closeCreateFloorPlanModal();
        
        // TODO: Refresh floor plan list or redirect to new floor plan
        
    } catch (error) {
        console.error('Error creating floor plan:', error);
        showErrorMessage('Failed to create floor plan. Please try again.');
    } finally {
        // Reset loading state
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
}

// Validate Floor Plan Name
function validateFloorPlanName() {
    const nameInput = document.getElementById('floorPlanName');
    const nameError = document.getElementById('nameError');
    
    if (!nameInput || !nameError) return false;

    const name = nameInput.value.trim();
    let isValid = true;
    let errorMessage = '';

    if (!name) {
        errorMessage = 'Floor plan name is required';
        isValid = false;
    } else if (name.length < 2) {
        errorMessage = 'Floor plan name must be at least 2 characters';
        isValid = false;
    } else if (name.length > 50) {
        errorMessage = 'Floor plan name must be less than 50 characters';
        isValid = false;
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
        errorMessage = 'Floor plan name can only contain letters, numbers, spaces, hyphens, and underscores';
        isValid = false;
    }

    if (isValid) {
        nameError.textContent = '';
        nameError.classList.remove('show');
        nameInput.style.borderColor = '#10b981';
    } else {
        nameError.textContent = errorMessage;
        nameError.classList.add('show');
        nameInput.style.borderColor = '#ef4444';
    }

    return isValid;
}

// Update Character Count for Description
function updateCharacterCount() {
    const descriptionInput = document.getElementById('floorPlanDescription');
    const charCount = document.getElementById('descriptionCharCount');
    
    if (!descriptionInput || !charCount) return;

    const currentLength = descriptionInput.value.length;
    const maxLength = 200;
    
    charCount.textContent = currentLength;
    
    // Update styling based on character count
    charCount.className = 'ap-char-count';
    
    if (currentLength > maxLength * 0.8) {
        charCount.classList.add('warning');
    }
    
    if (currentLength >= maxLength) {
        charCount.classList.add('error');
    }
}

// Simulate API Call (remove this when implementing real API)
function simulateAPICall(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Simulated API call with data:', data);
            resolve({ success: true, id: Date.now() });
        }, 1500);
    });
}

// Show Success Message
function showSuccessMessage(message) {
    // You can implement a toast notification system here
    alert(message); // Simple alert for now
}

// Show Error Message
function showErrorMessage(message) {
    // You can implement a toast notification system here
    alert(message); // Simple alert for now
}
