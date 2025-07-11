// Canvas & Table Interaction Logic
console.log("Canvas module loaded");

// Global variables for canvas operations
window.draggedElement = null;
window.selectedTable = null;
window.tableCounter = 0;
window.isDragging = false;
window.dragOffset = { x: 0, y: 0 };

// Instead, add them to a touch state object in the window namespace
window.touchState = {
    dragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
};

// Update createDroppedTable to handle mobile positioning better
async function createDroppedTable(sourceElement, x, y) {
  const canvasContent = document.getElementById("ap-canvasContent");
  const tableType = sourceElement.dataset.type;
  const seats = parseInt(sourceElement.dataset.seats) || 4;

  // Generate a random table name with a letter followed by a number
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNumber = Math.floor(Math.random() * 10) + 1; // 1 to 10
  const tableId = `${randomLetter}${randomNumber}`;

  // Create the visual table element
  const droppedTable = document.createElement("div");
  droppedTable.className = "ap-dropped-table";
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
  const finalX = Math.max(0, x - tableWidth / 2);
  const finalY = Math.max(0, y - tableHeight / 2);

  droppedTable.style.left = `${finalX}px`;
  droppedTable.style.top = `${finalY}px`;

  // Set initial reserve status
  droppedTable.dataset.isReserved = "false"; // New tables are available by default

  // Prepare data for API call
  const tableData = {
    tableId: tableId,
    name: tableId,
    tableType: tableType,
    seats: seats,
    position: {
      x: finalX,
      y: finalY,
    },
    capacity: {
      minParty: 1,
      maxParty: seats,
    },
    status: "active",
    isReserved: false, // New tables are available by default
    floorPlanId: window.FLOOR_PLAN_ID,
  };

  // Show loading state
  droppedTable.classList.add("creating");
  droppedTable.style.opacity = "0.7";

  try {
    // Call API to create table
    const createdTable = await window.TableApi.createTableOnServer(tableData);

    // Store server ID for future updates
    droppedTable.dataset.serverId = createdTable._id;

    // Remove loading state
    droppedTable.classList.remove("creating");
    droppedTable.style.opacity = "1";

    console.log("Table created successfully with ID:", createdTable._id);
  } catch (error) {
    // Handle error - remove the table from UI
    console.error("Failed to create table:", error);
    droppedTable.remove();

    // Show error message
    alert("Failed to create table. Please try again.");
    return;
  }

  // Make it draggable
  makeTableDraggable(droppedTable);

  // Add to canvas
  canvasContent.appendChild(droppedTable);

  // For mobile, automatically select the newly placed table
  if (window.isMobile) {
    document.querySelectorAll(".ap-dropped-table.selected").forEach((t) => {
      t.classList.remove("selected");
    });
    droppedTable.classList.add("selected");
    updateRightPanel(droppedTable);
  }
}

async function fetchAndRenderTables() {
  try {
    // Use the global floor plan ID or get it from the dropdown
    const floorPlanId = window.FLOOR_PLAN_ID || document.querySelector(".floor-selector")?.value;
    
    if (!floorPlanId) {
      console.log("No floor plan selected, skipping table fetch");
      return;
    }
    
    console.log("Fetching tables for floor plan:", floorPlanId);
    
    // Clear existing tables from canvas first
    const canvasContent = document.getElementById("ap-canvasContent");
    if (canvasContent) {
      const tables = canvasContent.querySelectorAll(".ap-dropped-table");
      tables.forEach(table => table.remove());
    }
    
    const tables = await window.TableApi.fetchTablesForFloorPlan(floorPlanId);
    
    // Render the tables on the canvas
    tables.forEach((table) => {
      renderTableOnCanvas(table);
    });
    
    updateTableCount();
  } catch (error) {
    console.error("Error fetching and rendering tables:", error);
  }
}

function renderTableOnCanvas(table) {
  const canvasContent = document.getElementById("ap-canvasContent");
  if (!canvasContent) return;

  const droppedTable = document.createElement("div");
  droppedTable.className = "ap-dropped-table";
  droppedTable.textContent = table.name || table.tableId || table._id;
  droppedTable.dataset.seats = table.seats;
  droppedTable.dataset.type = table.tableType;
  droppedTable.dataset.id = table.tableId || table._id;
  droppedTable.dataset.minParty = table.capacity?.minParty || 1;
  droppedTable.dataset.maxParty = table.capacity?.maxParty || table.seats || 2;
  droppedTable.dataset.serverId = table._id;
  
  // Set reserve status from server data
  droppedTable.dataset.isReserved = table.isReserved ? "true" : "false";
  
  // Add reserved styling if table is reserved
  if (table.isReserved) {
    droppedTable.classList.add("reserved");
  }

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

function initializeDragAndDrop() {
  const tableElements = document.querySelectorAll(".ap-table-element");
  const canvas = document.getElementById("ap-canvas");
  const canvasContent = document.getElementById("ap-canvasContent");
  const dropZone = document.getElementById("ap-dropZone");

  // Add null checks
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }

  // Initialize both drag-and-drop and click-to-place functionality
  tableElements.forEach((element) => {
    // Desktop drag and drop
    element.addEventListener("dragstart", handleDragStart);
    element.addEventListener("dragend", handleDragEnd);

    // Mobile click to place
    element.addEventListener("click", handleMobileTableClick);
  });

  // Handle drop zone
  canvas.addEventListener("dragover", handleDragOver);
  canvas.addEventListener("drop", handleDrop);
  canvas.addEventListener("dragenter", handleDragEnter);
  canvas.addEventListener("dragleave", handleDragLeave);

  // Handle existing table dragging
  initializeExistingTableDragging();
}

function handleDragStart(e) {
  window.draggedElement = e.target.closest(".ap-table-element");
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData("text/html", window.draggedElement.outerHTML);
}

function handleDragEnd(e) {
  window.draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
}

function handleDragEnter(e) {
  e.preventDefault();
  document.getElementById("ap-dropZone").classList.add("active");
}

function handleDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    document.getElementById("ap-dropZone").classList.remove("active");
  }
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById("ap-dropZone").classList.remove("active");

  if (!window.draggedElement) return;

  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  createDroppedTable(window.draggedElement, x, y);
  updateTableCount();
}

function handleMobileTableClick(e) {
  if (!window.isMobile) return; // Only handle clicks on mobile

  e.preventDefault();
  e.stopPropagation();

  const tableElement = e.currentTarget;
  console.log("Mobile table element clicked:", tableElement.dataset.type);

  // Close the sidebar
  window.closeMobileSidebar();

  // Show placement guide
  showMobilePlacementGuide(() => {
    // Callback when guide is dismissed
    const canvasContent = document.getElementById("ap-canvasContent");
    if (!canvasContent) return;

    // Calculate center position of the canvas viewport
    const canvas = document.getElementById("ap-canvas");
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.scrollLeft;
    const scrollTop = canvas.scrollTop;

    // Place the table in the center of the visible canvas area
    const x = scrollLeft + rect.width / 2;
    const y = scrollTop + rect.height / 2;

    createDroppedTable(tableElement, x, y);
    updateTableCount();
  });
}

function showMobilePlacementGuide(callback) {
  // Create and show a mobile-friendly guide overlay
  const guideOverlay = document.createElement("div");
  guideOverlay.className = "ap-mobile-placement-guide";
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
  const style = document.createElement("style");
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
  const button = guideOverlay.querySelector(".ap-guide-button");
  button.addEventListener("click", () => {
    guideOverlay.remove();
    style.remove();
    if (callback) callback();
  });
}

// Modify makeTableDraggable for better mobile support
function makeTableDraggable(table) {
  if (window.isMobile) {
    // Mobile touch events
    table.addEventListener("touchstart", handleTableTouchStart, { passive: false });
    table.addEventListener("touchmove", handleTableTouchMove, { passive: false });
    table.addEventListener("touchend", handleTableTouchEnd);
  }

  // Mouse events
  table.addEventListener("mousedown", handleTableMouseDown);
  table.addEventListener("click", handleTableClick);
  table.addEventListener("dblclick", handleTableDoubleClick);
}

// Then update the touch event handlers to use the window.touchState object:
function handleTableTouchStart(e) {
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    const table = e.currentTarget;

    window.touchState.startX = parseInt(table.style.left) || 0;
    window.touchState.startY = parseInt(table.style.top) || 0;
    window.touchState.initialX = touch.clientX;
    window.touchState.initialY = touch.clientY;
    window.touchState.dragging = true;

    // Visual feedback
    table.classList.add("dragging");

    // Select the table
    document.querySelectorAll(".ap-dropped-table.selected").forEach((t) => {
        t.classList.remove("selected");
    });
    table.classList.add("selected");
    updateRightPanel(table);
}

function handleTableTouchMove(e) {
    if (!window.touchState.dragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const table = e.currentTarget;
    const canvas = document.getElementById("ap-canvasContent");

    const deltaX = touch.clientX - window.touchState.initialX;
    const deltaY = touch.clientY - window.touchState.initialY;

    const newX = window.touchState.startX + deltaX;
    const newY = window.touchState.startY + deltaY;

    // Apply constraints to keep table within canvas bounds
    const maxX = canvas.offsetWidth - table.offsetWidth;
    const maxY = canvas.offsetHeight - table.offsetHeight;

    table.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
    table.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
}

function handleTableTouchEnd(e) {
    const table = e.currentTarget;
    window.touchState.dragging = false;
    table.classList.remove("dragging");

    // Update position on server immediately
    try {
      window.TableApi.updateTableOnServer(table)
        .then(() => {
          console.log("Table position updated on server");
        })
        .catch(error => {
          console.error("Error updating table position:", error);
          // Optionally show a non-intrusive notification
          const notification = document.createElement('div');
          notification.className = 'ap-notification error';
          notification.textContent = 'Failed to update table position';
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        });
    } catch (error) {
      console.error("Error updating table position:", error);
    }
}

function setTableStyle(table, type, seats) {
  switch (type) {
    case "round":
      table.style.borderRadius = "50%";
      if (seats <= 4) {
        table.style.width = "50px";
        table.style.height = "50px";
      } else if (seats <= 8) {
        table.style.width = "60px";
        table.style.height = "60px";
      } else {
        table.style.width = "80px";
        table.style.height = "80px";
      }
      break;
    case "square":
      table.style.borderRadius = "4px";
      if (seats <= 4) {
        table.style.width = "50px";
        table.style.height = "50px";
      } else {
        table.style.width = "60px";
        table.style.height = "60px";
      }
      break;
    case "rectangular":
      table.style.borderRadius = "4px";
      if (seats <= 4) {
        table.style.width = "80px";
        table.style.height = "40px";
      } else if (seats <= 8) {
        table.style.width = "120px";
        table.style.height = "60px";
      } else {
        table.style.width = "140px";
        table.style.height = "70px";
      }
      break;
    case "hexagon":
      table.style.width = "50px";
      table.style.height = "50px";
      table.style.clipPath = "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)";
      break;
    case "bar":
      table.style.width = "100px";
      table.style.height = "30px";
      table.style.borderRadius = "15px";
      break;
  }
}

function handleTableMouseDown(e) {
  e.preventDefault();
  e.stopPropagation();

  const table = e.currentTarget;
  let startX = e.clientX;
  let startY = e.clientY;
  let hasMoved = false;

  // Get initial position
  const canvasRect = document.getElementById("ap-canvas").getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();

  // Calculate proper offset from canvas
  const initialLeft = tableRect.left - canvasRect.left + document.getElementById("ap-canvas").scrollLeft;
  const initialTop = tableRect.top - canvasRect.top + document.getElementById("ap-canvas").scrollTop;

  // Calculate offset from mouse to table's top-left corner
  window.dragOffset.x = e.clientX - tableRect.left;
  window.dragOffset.y = e.clientY - tableRect.top;

  function handleMouseMove(e) {
    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);

    // Only start dragging if mouse moved more than 5 pixels
    if (deltaX > 5 || deltaY > 5) {
      if (!hasMoved) {
        hasMoved = true;
        window.isDragging = true;
        window.selectedTable = table;

        // Clear other selections and select this table
        document.querySelectorAll(".ap-dropped-table.selected").forEach((t) => {
          t.classList.remove("selected");
        });
        table.classList.add("selected");
        table.classList.add("dragging");
      }

      // Calculate new position relative to canvas
      const canvasRect = document.getElementById("ap-canvas").getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - window.dragOffset.x + document.getElementById("ap-canvas").scrollLeft;
      const newY = e.clientY - canvasRect.top - window.dragOffset.y + document.getElementById("ap-canvas").scrollTop;

      // Apply constraints to keep table within canvas bounds
      const maxX = document.getElementById("ap-canvasContent").offsetWidth - table.offsetWidth;
      const maxY = document.getElementById("ap-canvasContent").offsetHeight - table.offsetHeight;

      table.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
      table.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
    }
  }

  async function handleMouseUp(e) {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    if (hasMoved) {
      table.classList.remove("dragging");
      window.isDragging = false;
      window.selectedTable = null;

      // Update position on server immediately after drag ends
      try {
        await window.TableApi.updateTableOnServer(table);
        console.log("Table position updated on server");
      } catch (error) {
        console.error("Error updating table position:", error);
        // Optionally show a non-intrusive notification
        const notification = document.createElement('div');
        notification.className = 'ap-notification error';
        notification.textContent = 'Failed to update table position';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    } else {
      // This was a click, not a drag
      // Handle selection
      document.querySelectorAll(".ap-dropped-table.selected").forEach((t) => {
        t.classList.remove("selected");
      });
      table.classList.add("selected");
    }
  }

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleTableClick(e) {
  e.stopPropagation();
  // Only handle selection if not dragging
  if (!window.isDragging) {
    const table = e.currentTarget;
    document.querySelectorAll(".ap-dropped-table.selected").forEach((t) => {
      t.classList.remove("selected");
    });
    table.classList.add("selected");
  }
}

function openTableSettingsModal(table) {
  const modal = document.getElementById('tableSettingsModal');
  if (!modal) return;

  // Populate modal fields
  const tableName = document.getElementById("modalTableName");
  const minParty = document.getElementById("modalMinParty");
  const maxParty = document.getElementById("modalMaxParty");
  const tableReserved = document.getElementById("modalTableReserved");
  const reserveStatusLabel = document.getElementById("modalReserveStatusLabel");

  if (tableName) tableName.value = table.textContent || "";
  if (minParty) minParty.value = table.dataset.minParty || 1;
  if (maxParty) maxParty.value = table.dataset.maxParty || table.dataset.seats || 2;
  
  if (tableReserved && reserveStatusLabel) {
    const isReserved = table.dataset.isReserved === "true";
    tableReserved.checked = isReserved;
    
    if (isReserved) {
      reserveStatusLabel.textContent = "Reserved";
      reserveStatusLabel.className = "ap-toggle-label reserved";
    } else {
      reserveStatusLabel.textContent = "Available";
      reserveStatusLabel.className = "ap-toggle-label available";
    }
  }

  // Show modal
  modal.classList.add('active');
}

// Add modal close handler
document.getElementById('closeTableSettingsModal')?.addEventListener('click', () => {
  document.getElementById('tableSettingsModal')?.classList.remove('active');
});

// Close modal when clicking outside
document.getElementById('tableSettingsModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.remove('active');
  }
});

// Update save handler
document.getElementById('modalSaveTableChanges')?.addEventListener('click', async function() {
  const selected = document.querySelector(".ap-dropped-table.selected");
  if (!selected) return;

  const tableName = document.getElementById("modalTableName");
  const minParty = document.getElementById("modalMinParty");
  const maxParty = document.getElementById("modalMaxParty");
  const tableReserved = document.getElementById("modalTableReserved");

  if (tableName && tableName.value.trim()) {
    selected.textContent = tableName.value.trim();
  }
  if (minParty) selected.dataset.minParty = minParty.value;
  if (maxParty) {
    selected.dataset.seats = maxParty.value;
    selected.dataset.maxParty = maxParty.value;
  }
  if (tableReserved) {
    selected.dataset.isReserved = tableReserved.checked ? "true" : "false";
    if (tableReserved.checked) {
      selected.classList.add("reserved");
    } else {
      selected.classList.remove("reserved");
    }
  }

  try {
    // Update table on server
    await window.TableApi.updateTableOnServer(selected);
    
    // Close modal
    document.getElementById('tableSettingsModal')?.classList.remove('active');
    
  } catch (error) {
    console.error("Error saving table changes:", error);
    alert("Failed to save changes. Please try again.");
  }
});

// Update delete handler
document.getElementById('modalDeleteTable')?.addEventListener('click', async function() {
  const selected = document.querySelector(".ap-dropped-table.selected");
  if (!selected) return;

  if (confirm("Are you sure you want to delete this table?")) {
    try {
      // Delete from server if it has a server ID
      if (selected.dataset.serverId) {
        await window.TableApi.deleteTableOnServer(selected.dataset.serverId);
      }

      // Remove from UI
      selected.remove();
      window.CanvasModule.updateTableCount();

      // Close modal
      document.getElementById('tableSettingsModal')?.classList.remove('active');
      
    } catch (error) {
      console.error("Error deleting table:", error);
      alert("Failed to delete table. Please try again.");
    }
  }
});

function handleTableDoubleClick(e) {
  e.stopPropagation();
  e.preventDefault();

  const table = e.currentTarget;
  // Make sure this table is selected
  document.querySelectorAll(".ap-dropped-table.selected").forEach((t) => {
    t.classList.remove("selected");
  });
  table.classList.add("selected");
  
  // Open the settings modal
  openTableSettingsModal(table);
}

function updateRightPanel(table) {
  if (table) {
    const tableName = document.getElementById("tableName");
    const minParty = document.getElementById("minParty");
    const maxParty = document.getElementById("maxParty");
    const tableReserved = document.getElementById("tableReserved");
    const reserveStatusLabel = document.getElementById("reserveStatusLabel");

    if (tableName) tableName.value = table.textContent || "";
    if (minParty) minParty.value = table.dataset.minParty || 1;
    if (maxParty) maxParty.value = table.dataset.maxParty || table.dataset.seats || 2;
    
    // Update reserve status
    if (tableReserved && reserveStatusLabel) {
      const isReserved = table.dataset.isReserved === "true";
      tableReserved.checked = isReserved;
      
      if (isReserved) {
        reserveStatusLabel.textContent = "Reserved";
        reserveStatusLabel.className = "ap-toggle-label reserved";
      } else {
        reserveStatusLabel.textContent = "Available";
        reserveStatusLabel.className = "ap-toggle-label available";
      }
    }
  }
}

function updateTableCount() {
  const count = document.querySelectorAll(".ap-dropped-table").length;
  const countElement = document.getElementById("tableCount");
  if (countElement) {
    countElement.textContent = count;
  }
  updateRightPanelTableCount();
}

function updateRightPanelTableCount() {
  const count = document.querySelectorAll(".ap-dropped-table").length;
  const countElement = document.getElementById("ap-rightPanelTableCount");
  if (countElement) {
    countElement.textContent = count;
  }
}

function initializeExistingTableDragging() {
  console.log("Initializing existing table dragging");
  
  // Find all existing tables on the canvas
  const existingTables = document.querySelectorAll(".ap-dropped-table");
  
  // Make each table draggable
  existingTables.forEach(table => {
    makeTableDraggable(table);
  });
}

function initializeTableInteractions() {
  // Initialize existing table dragging
  initializeExistingTableDragging();

  // Add any other table interaction logic here
  console.log("Table interactions initialized");
}

function duplicateSelectedTable() {
  const selected = document.querySelector(".ap-dropped-table.selected");
  if (selected) {
    const rect = selected.getBoundingClientRect();
    const canvasRect = document.getElementById("ap-canvas").getBoundingClientRect();

    // Calculate new position (offset by 20px)
    const newX = parseInt(selected.style.left) + 20;
    const newY = parseInt(selected.style.top) + 20;

    // Create table element to simulate drag source
    const sourceElement = document.createElement("div");
    sourceElement.dataset.type = selected.dataset.type;
    sourceElement.dataset.seats = selected.dataset.seats;

    // Create the new table
    createDroppedTable(sourceElement, newX, newY);
    updateTableCount();
  } else {
    alert("Please select a table first");
  }
}

async function deleteSelectedTable() {
  const selected = document.querySelector(".ap-dropped-table.selected");
  if (selected) {
    if (confirm("Are you sure you want to delete this table?")) {
      // Show loading state
      selected.style.opacity = "0.5";

      try {
        // Delete from server if it has a server ID
        if (selected.dataset.serverId) {
          await window.TableApi.deleteTableOnServer(selected.dataset.serverId);
        }

        // Remove from UI
        selected.remove();
        updateTableCount();
        updateRightPanelTableCount();

        // Clear form
        const tableName = document.getElementById("tableName");
        const minParty = document.getElementById("minParty");
        const maxParty = document.getElementById("maxParty");

        if (tableName) tableName.value = "";
        if (minParty) minParty.value = 1;
        if (maxParty) maxParty.value = 2;
      } catch (error) {
        // Restore opacity on error
        selected.style.opacity = "1";
        alert("Failed to delete table. Please try again.");
      }
    }
  } else {
    alert("Please select a table first");
  }
}

function zoomCanvas(factor) {
  const canvas = document.getElementById("ap-canvas");
  const currentScale = canvas.style.transform.match(/scale\(([^)]+)\)/);
  const scale = currentScale ? parseFloat(currentScale[1]) * factor : factor;

  canvas.style.transform = `scale(${Math.max(0.5, Math.min(2, scale))})`;
  canvas.style.transformOrigin = "top left";
}

// Setup canvas click handler
function setupCanvasClickHandler() {
  document.addEventListener("click", function (e) {
    // Only clear selection if clicking on canvas background, not on tables or UI elements
    if (
      e.target.id === "ap-canvas" ||
      e.target.id === "ap-canvasContent" ||
      e.target.classList.contains("ap-drop-zone")
    ) {
      document.querySelectorAll(".ap-dropped-table.selected").forEach((t) => {
        t.classList.remove("selected");
      });
      // Clear right panel
      const tableName = document.getElementById("tableName");
      const minParty = document.getElementById("minParty");
      const maxParty = document.getElementById("maxParty");

      if (tableName) tableName.value = "";
      if (minParty) minParty.value = 1;
      if (maxParty) maxParty.value = 2;
    }
  });
}

// Initialize toolbar buttons
function initializeToolbarButtons() {
  console.log('Initializing toolbar buttons...');
  
  const zoomInBtn = document.querySelector('.ap-toolbar-btn[title="Zoom in"]');
  const zoomOutBtn = document.querySelector('.ap-toolbar-btn[title="Zoom out"]');
  
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => zoomCanvas(1.1));
  }
  
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => zoomCanvas(0.9));
  }
}

// Initialize publish button
function initializePublishButton() {
  const publishBtn = document.querySelector('.publish-btn');
  if (publishBtn) {
    publishBtn.addEventListener('click', () => {
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
    });
  }
}

// Export canvas functions
window.CanvasModule = {
  initializeDragAndDrop,
  initializeTableInteractions,
  fetchAndRenderTables,
  renderTableOnCanvas,
  createDroppedTable,
  makeTableDraggable,
  updateTableCount,
  updateRightPanel,
  duplicateSelectedTable,
  deleteSelectedTable,
  zoomCanvas,
  setupCanvasClickHandler,
  initializeToolbarButtons,
  initializePublishButton
};
