// UI Module - Handles all UI-related functionality
console.log("UI module loaded");

// Global variables
// let isMobile = window.innerWidth <= 768;
// let isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

// Instead, use window namespace
window.isMobile = window.innerWidth <= 768;
window.isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

// Hard-coded restaurant ID
const RESTAURANT_ID = new URLSearchParams(window.location.search).get('restaurantId');

// Store the current floor plan ID globally
window.FLOOR_PLAN_ID = null;

// Function to check device type
function checkDeviceType() {
  const width = window.innerWidth;
  const wasMobile = window.isMobile;
  window.isMobile = width <= 768;
  window.isTablet = width <= 1024 && width > 768;
  
  if (wasMobile !== window.isMobile) {
    handleDeviceTypeChange(wasMobile);
  }
}

function handleDeviceTypeChange(wasMobile) {
  const sidebar = document.getElementById("ap-sidebarAvailability");
  const rightPanel = document.querySelector(".ap-right-panel");
  const overlay = document.querySelector(".ap-mobile-overlay");
  
  if (!sidebar) return;
  
  if (window.isMobile) {
    sidebar.classList.remove("collapsed");
    sidebar.classList.remove("mobile-open");
    if (rightPanel) rightPanel.classList.remove("mobile-open");
    if (overlay) overlay.classList.remove("active");
    sidebar.style.transform = "translateX(-100%)";
  } else {
    sidebar.classList.remove("mobile-open");
    sidebar.style.transform = "";
    const wasCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    if (wasCollapsed) {
      sidebar.classList.add("collapsed");
    } else {
      sidebar.classList.remove("collapsed");
    }
    if (rightPanel) rightPanel.classList.remove("mobile-open");
    if (overlay) overlay.classList.remove("active");
  }
  
  updateUIElementsVisibility();
}

// Function to close mobile sidebar
function closeMobileSidebar() {
  const sidebar = document.getElementById("ap-sidebarAvailability");
  const overlay = document.querySelector(".ap-mobile-overlay");
  
  if (!sidebar || !window.isMobile) return;
  
  console.log("Closing mobile sidebar");
  sidebar.classList.remove("mobile-open");
  
  // Handle overlay
  const rightPanel = document.querySelector(".ap-right-panel");
  if (overlay && (!rightPanel || !rightPanel.classList.contains("mobile-open"))) {
    overlay.classList.remove("active");
  }
}

// Function to open mobile sidebar
function openMobileSidebar() {
  const sidebar = document.getElementById("ap-sidebarAvailability");
  const overlay = document.querySelector(".ap-mobile-overlay");
  
  if (!sidebar || !window.isMobile) return;
  
  console.log("Opening mobile sidebar");
  sidebar.classList.add("mobile-open");
  
  // Show overlay
  if (overlay) {
    overlay.classList.add("active");
  }
}

// Add this function to handle mobile right panel closing
function closeMobileRightPanel() {
  const rightPanel = document.querySelector(".ap-right-panel");
  const overlay = document.querySelector(".ap-mobile-overlay");

  if (!rightPanel || !window.isMobile) return;

  console.log("Closing mobile right panel");

  // Remove mobile open class
  rightPanel.classList.remove("mobile-open");

  // Handle overlay
  const sidebar = document.getElementById("ap-sidebarAvailability");
  if (overlay && (!sidebar || !sidebar.classList.contains("mobile-open"))) {
    overlay.classList.remove("active");
  }
}

// Add this function to initialize sidebar state
function initializeSidebarState() {
  const sidebar = document.getElementById("ap-sidebarAvailability");
  if (!sidebar) return;

  if (window.isMobile) {
    // Mobile initialization
    sidebar.classList.remove("collapsed");
    sidebar.style.transform = "translateX(-100%)";
  } else {
    // Desktop initialization
    const wasCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    if (wasCollapsed) {
      sidebar.classList.add("collapsed");
    } else {
      sidebar.classList.remove("collapsed");
    }
    sidebar.style.transform = "";
  }

  // Update UI elements visibility
  updateUIElementsVisibility();
}

// Add this function before initializeSidebarState
function updateUIElementsVisibility() {
  const sidebar = document.getElementById("ap-sidebarAvailability");
  const mainContent = document.querySelector(".ap-main-content");
  const rightPanel = document.querySelector(".ap-right-panel");
  
  if (!sidebar) return;
  
  // Update visibility based on device type and sidebar state
  if (window.isMobile) {
    // Mobile specific UI updates
    if (sidebar.classList.contains("mobile-open")) {
      // When sidebar is open on mobile
      console.log("Mobile sidebar open - updating UI");
    } else {
      // When sidebar is closed on mobile
      console.log("Mobile sidebar closed - updating UI");
    }
  } else {
    // Desktop specific UI updates
    const isCollapsed = sidebar.classList.contains("collapsed");
    if (isCollapsed) {
      console.log("Desktop sidebar collapsed - updating UI");
      if (mainContent) mainContent.style.marginLeft = "50px";
    } else {
      console.log("Desktop sidebar expanded - updating UI");
      if (mainContent) mainContent.style.marginLeft = "160px";
    }
  }
  
  // Update right panel visibility if needed
  if (rightPanel && window.isMobile) {
    // Mobile right panel handling
  }
}

// Initialize Create Floor Plan Modal
function initializeCreateFloorPlanModal() {
    const createBtn = document.getElementById('createFloorPlanBtn');
    const modal = document.getElementById('createFloorPlanModal');
    
    if (!createBtn || !modal) {
        console.error('Create floor plan button or modal not found');
        return;
    }

    // Open modal
    createBtn.addEventListener('click', function() {
        console.log('Opening create floor plan modal');
        modal.classList.add('active');
    });

    // Close modal events
    const closeBtn = document.getElementById('closeCreateFloorPlanModal');
    const cancelBtn = document.getElementById('cancelCreateFloorPlan');

    const closeModal = () => {
        modal.classList.remove('active');
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Handle form submission
    const form = document.getElementById('createFloorPlanForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('floorPlanName');
            const descInput = document.getElementById('floorPlanDescription');
            
            try {
                const response = await window.FloorPlanApi.createFloorPlan({
                    name: nameInput.value,
                    description: descInput.value
                });
                
                closeModal();
                // Refresh floor plan list
                await fetchFloorPlans();
            } catch (error) {
                console.error('Error creating floor plan:', error);
                alert('Failed to create floor plan. Please try again.');
            }
        });
    }
}

// Function to fetch floor plans using the API
async function fetchFloorPlans() {
  try {
    console.log("Fetching floor plans...");
    
    const floorPlans = await window.FloorPlanApi.fetchFloorPlans(RESTAURANT_ID);
    populateFloorPlanDropdown(floorPlans);
    
    // Add this section to load the first floor plan automatically
    if (floorPlans && floorPlans.length > 0) {
      const firstFloorPlanId = floorPlans[0]._id;
      console.log("Loading first floor plan:", firstFloorPlanId);
      await loadFloorPlan(firstFloorPlanId);
    }
    
    return floorPlans;
  } catch (error) {
    console.error("Error in fetchFloorPlans:", error);
    populateFloorPlanDropdown([]); // Empty array to show "No floor plans available"
    return [];
  }
}

// Function to populate the floor plan dropdown
function populateFloorPlanDropdown(floorPlans) {
  const floorSelector = document.querySelector(".floor-selector");
  if (!floorSelector) {
    console.error("Floor selector dropdown not found!");
    return;
  }

  // Clear existing options
  floorSelector.innerHTML = "";

  // Add floor plans to dropdown
  if (floorPlans && floorPlans.length > 0) {
    floorPlans.forEach((floorPlan, index) => {
      const option = document.createElement("option");
      option.value = floorPlan._id;
      option.textContent = floorPlan.name;

      // Automatically select the first floor plan
      if (index === 0) {
        option.selected = true;
      }

      floorSelector.appendChild(option);
    });

    // Enable the floor selector
    floorSelector.disabled = false;
  } else {
    // If no floor plans, add a "No floor plans" option
    const noPlansOption = document.createElement("option");
    noPlansOption.value = "";
    noPlansOption.textContent = "No floor plans";
    noPlansOption.disabled = true;
    noPlansOption.selected = true;
    floorSelector.appendChild(noPlansOption);

    // Disable the floor selector
    floorSelector.disabled = true;
  }
}


// Add event listener for floor plan selection
function initializeFloorPlanSelection() {
  const floorSelector = document.querySelector(".floor-selector");
  if (floorSelector) {
    floorSelector.addEventListener("change", function() {
      const selectedFloorPlanId = this.value;
      if (selectedFloorPlanId) {
        console.log("Selected floor plan ID:", selectedFloorPlanId);
        // Load the selected floor plan
        loadFloorPlan(selectedFloorPlanId);
      }
    });
  }
}

// Function to load a specific floor plan
async function loadFloorPlan(floorPlanId) {
  try {
    // Clear existing tables from canvas
    const canvasContent = document.getElementById("ap-canvasContent");
    if (canvasContent) {
      // Keep only the drop zone, remove all tables
      const tables = canvasContent.querySelectorAll(".ap-dropped-table");
      tables.forEach(table => table.remove());
    }
    
    // Update the global floor plan ID
    window.FLOOR_PLAN_ID = floorPlanId;
    
    // Fetch and render tables for this floor plan
    window.CanvasModule.fetchAndRenderTables();
    
    // Update UI to show the selected floor plan is active
    document.querySelectorAll(".floor-selector option").forEach(option => {
      if (option.value === floorPlanId) {
        option.selected = true;
      }
    });
  } catch (error) {
    console.error("Error loading floor plan:", error);
    alert("Failed to load the selected floor plan. Please try again.");
  }
}

// Update the desktop sidebar toggle function
function toggleDesktopSidebar() {
  const sidebar = document.getElementById("ap-sidebarAvailability");

  if (!sidebar || !window.isMobile) return;

  const isCollapsed = sidebar.classList.contains("collapsed");

  if (isCollapsed) {
    sidebar.classList.remove("collapsed");
    localStorage.setItem("sidebarCollapsed", "false");
    console.log("Desktop sidebar expanded");
  } else {
    sidebar.classList.add("collapsed");
    localStorage.setItem("sidebarCollapsed", "true");
    console.log("Desktop sidebar collapsed");
  }
}

// Update initialization function
function initializeMobileFunctionality() {
  console.log("=== Initializing mobile functionality ===");

  // Initialize sidebar state first
  initializeSidebarState();

  const sidebar = document.getElementById("ap-sidebarAvailability");
  const mobileBurgerMenu = document.getElementById("ap-mobileBurgerMenu");
  const settingsBtn = document.getElementById("ap-mobileSettingsBtn");
  const rightPanel = document.querySelector(".ap-right-panel");

  // Create mobile overlay if it doesn't exist
  let overlay = document.querySelector(".ap-mobile-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "ap-mobile-overlay";
    overlay.id = "ap-mobileOverlay";
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function () {
      if (window.isMobile) {
        closeMobileSidebar();
        closeMobileRightPanel();
      }
    });
  }

  // Mobile burger menu functionality
  if (mobileBurgerMenu) {
    mobileBurgerMenu.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (!window.isMobile) return;

      console.log("Mobile burger menu clicked");

      if (sidebar.classList.contains("mobile-open")) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  // Desktop burger menu functionality
  const desktopBurgerMenu = document.getElementById("ap-burgerMenuAvailability");
  if (desktopBurgerMenu) {
    desktopBurgerMenu.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (window.isMobile) {
        closeMobileSidebar();
      } else {
        toggleDesktopSidebar();
      }
    });
  }

  // Handle window resize
  window.addEventListener(
    "resize",
    debounce(function () {
      checkDeviceType();
    }, 250)
  );

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

// Add CSS for better transitions
function addStyles() {
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
  
  const styleSheet = document.createElement("style");
  styleSheet.textContent = additionalStyles;
  document.head.appendChild(styleSheet);
}

// Toolbar functionality
function initializeToolbarButtons() {
  // Get only the zoom buttons by title, not by class or index
  const zoomInBtn = document.querySelector('.ap-toolbar-btn[title="Zoom in"]');
  const zoomOutBtn = document.querySelector('.ap-toolbar-btn[title="Zoom out"]');
  
  console.log("Initializing toolbar buttons - zoom functionality");
  console.log("Zoom in button found:", !!zoomInBtn);
  console.log("Zoom out button found:", !!zoomOutBtn);
  
  if (zoomInBtn) {
    zoomInBtn.onclick = function(e) {
      e.preventDefault();
      console.log("Zoom in button clicked");
      window.CanvasModule.zoomCanvas(1.1);
    };
  }
  
  if (zoomOutBtn) {
    zoomOutBtn.onclick = function(e) {
      e.preventDefault();
      console.log("Zoom out button clicked");
      window.CanvasModule.zoomCanvas(0.9);
    };
  }
}

function openSettings() {
  alert("Settings panel would open here");
}

function saveFloorPlan() {
  const tables = Array.from(document.querySelectorAll(".ap-dropped-table")).map((table) => ({
    id: table.dataset.id,
    label: table.textContent,
    type: table.dataset.type,
    seats: table.dataset.seats,
    x: parseInt(table.style.left),
    y: parseInt(table.style.top),
    width: parseInt(table.style.width),
    height: parseInt(table.style.height),
  }));

  console.log("Saving floor plan:", tables);

  // Show loading state
  const originalText = "Save";
  const saveBtn = document.querySelector('[onclick="saveFloorPlan()"]');
  if (saveBtn) {
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      alert("Floor plan saved successfully!");
    }, 1000);
  } else {
    alert("Floor plan saved successfully!");
  }
}

function showStatistics() {
  const tables = document.querySelectorAll(".ap-dropped-table");
  const totalSeats = Array.from(tables).reduce((sum, table) => {
    return sum + parseInt(table.dataset.seats || 0);
  }, 0);

  const message = `Floor Plan Statistics:\nTables: ${tables.length}\nTotal Seats: ${totalSeats}`;

  if (window.isMobile) {
    // Use a more mobile-friendly alert
    const confirmed = confirm(message + "\n\nWould you like to continue?");
    console.log("Statistics viewed:", confirmed);
  } else {
    alert(message);
  }
}

// Publish functionality
function initializePublishButton() {
  const publishBtn = document.querySelector(".publish-btn");
  if (publishBtn) {
    publishBtn.addEventListener("click", publishUpdates);
  }
}

function publishUpdates() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const notice = document.querySelector(".unpublished-notice");
  if (notice) {
    notice.style.display = "none";
  }

  const publishDate = document.querySelector(".publish-btn + div");
  if (publishDate) {
    publishDate.textContent = `Published: ${today}`;
  }

  alert("Changes published successfully!");
}

function createDiningArea() {
  const areaName = prompt("Enter dining area name:");
  if (areaName && areaName.trim()) {
    const list = document.querySelector(".dining-areas-list");
    if (list) {
      const newItem = document.createElement("li");
      newItem.className = "dining-area-item";
      newItem.innerHTML = `
              <div class="dining-area-name">${areaName.trim()}</div>
              <div class="dining-area-stats">0 tables • 1 floor plan</div>
            `;
      list.appendChild(newItem);
    }
  }
}

// Update the setupFormInputHandlers function
function setupFormInputHandlers() {
  const tableName = document.getElementById("tableName");
  const maxParty = document.getElementById("maxParty");
  const minParty = document.getElementById("minParty");
  const tableReserved = document.getElementById("tableReserved");
  const reserveStatusLabel = document.getElementById("reserveStatusLabel");
  const saveBtn = document.getElementById("saveTableChanges");

  // Handle table name changes
  if (tableName) {
    tableName.addEventListener("input", function () {
      const selected = document.querySelector(".ap-dropped-table.selected");
      if (selected && this.value.trim()) {
        selected.textContent = this.value.trim();
      }
    });
  }

  // Handle max party changes
  if (maxParty) {
    maxParty.addEventListener("change", function () {
      const selected = document.querySelector(".ap-dropped-table.selected");
      if (selected && this.value) {
        selected.dataset.seats = this.value;
        selected.dataset.maxParty = this.value;
      }
    });
  }

  // Handle min party changes
  if (minParty) {
    minParty.addEventListener("change", function () {
      const selected = document.querySelector(".ap-dropped-table.selected");
      if (selected && this.value) {
        selected.dataset.minParty = this.value;
      }
    });
  }

  // Handle reserve toggle changes
  if (tableReserved && reserveStatusLabel) {
    tableReserved.addEventListener("change", function () {
      const selected = document.querySelector(".ap-dropped-table.selected");
      if (selected) {
        selected.dataset.isReserved = this.checked ? "true" : "false";
        
        // Update label and styling
        if (this.checked) {
          reserveStatusLabel.textContent = "Reserved";
          reserveStatusLabel.className = "ap-toggle-label reserved";
          selected.classList.add("reserved");
        } else {
          reserveStatusLabel.textContent = "Available";
          reserveStatusLabel.className = "ap-toggle-label available";
          selected.classList.remove("reserved");
        }
      }
    });
  }

  // Add Save Changes button functionality
  if (saveBtn) {
    saveBtn.addEventListener("click", async function () {
      const selected = document.querySelector(".ap-dropped-table.selected");
      
      if (!selected) {
        alert("Please select a table first");
        return;
      }

      // Show loading state
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      try {
        // Update table on server
        await window.TableApi.updateTableOnServer(selected);
        
        // Show success message
        saveBtn.textContent = "Saved!";
        setTimeout(() => {
          saveBtn.textContent = "Save";
          saveBtn.disabled = false;
        }, 1500);
        
      } catch (error) {
        console.error("Error saving table changes:", error);
        alert("Failed to save changes. Please try again.");
        
        // Reset button state
        saveBtn.textContent = "Save";
        saveBtn.disabled = false;
      }
    });
  }
}

// Initialize UI
function initializeUI() {
  // Add styles
  addStyles();
  
  // Check device type
  checkDeviceType();
  
  // Initialize mobile functionality
  initializeMobileFunctionality();
  
  // Initialize toolbar buttons
  initializeToolbarButtons();
  
  // Initialize publish button
  initializePublishButton();
  
  // Initialize create floor plan modal
  initializeCreateFloorPlanModal();
  
  // Setup form input handlers
  setupFormInputHandlers();

  // Add these two lines
  initializeFloorPlanSelection();  // Initialize floor plan dropdown events
  fetchFloorPlans();  // Fetch and populate initial floor plans
}

// Export UI functions
window.UIModule = {
  initializeUI,
  checkDeviceType,
  closeMobileSidebar,
  openMobileSidebar,
  closeMobileRightPanel,
  initializeFloorPlanSelection,
  loadFloorPlan,
  fetchFloorPlans,
  saveFloorPlan,
  showStatistics,
  createDiningArea,
  toggleDesktopSidebar
};