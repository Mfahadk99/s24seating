console.log("availability.js file loaded successfully!");

// Store the current floor plan ID globally
window.FLOOR_PLAN_ID = null;

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded - starting initialization...");

  // Make sure APIs are loaded
  if (!window.FloorPlanApi) {
    console.error("FloorPlanApi not loaded! Check script order.");
    return;
  }

  if (!window.TableApi) {
    console.error("TableApi not loaded! Check script order.");
    return;
  }

  // Make sure UI and Canvas modules are loaded
  if (!window.UIModule) {
    console.error("UIModule not loaded! Check script order.");
    return;
  }

  if (!window.CanvasModule) {
    console.error("CanvasModule not loaded! Check script order.");
    return;
  }

  // Initialize UI first
  window.UIModule.initializeUI();
  
  // Initialize Canvas functionality
  window.CanvasModule.initializeDragAndDrop();
  window.CanvasModule.initializeTableInteractions();
  window.CanvasModule.setupCanvasClickHandler();
  
  // Initialize other functionality
  window.CanvasModule.initializeToolbarButtons();
  window.CanvasModule.initializePublishButton();
  window.CanvasModule.updateTableCount();

  // Initialize fullscreen functionality
  initializeFullscreen();

  // Add window resize handler
  window.addEventListener('resize', debounce(function() {
    window.UIModule.checkDeviceType();
    adjustCanvasSize();
  }, 250));

  console.log("Availability.js initialization completed successfully!");
});

// Export functions for global access if needed
window.availabilityApp = {
  checkDeviceType: window.UIModule.checkDeviceType,
  closeMobileSidebar: window.UIModule.closeMobileSidebar,
  closeMobileRightPanel: window.UIModule.closeMobileRightPanel,
  duplicateSelectedTable: window.CanvasModule.duplicateSelectedTable,
  deleteSelectedTable: window.CanvasModule.deleteSelectedTable,
  createDiningArea: window.UIModule.createDiningArea,
  saveFloorPlan: window.UIModule.saveFloorPlan,
  showStatistics: window.UIModule.showStatistics,
  zoomCanvas: window.CanvasModule.zoomCanvas,
};

// Fullscreen functionality
function initializeFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const appContainer = document.querySelector('.app-container');

    if (!fullscreenBtn || !appContainer) {
        console.error('Fullscreen elements not found');
        return;
    }

    // Initialize fullscreen state from localStorage
    const isFullscreen = localStorage.getItem('isFullscreen') === 'true';
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
    localStorage.setItem('isFullscreen', 'true');
    
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
    localStorage.setItem('isFullscreen', 'false');
    
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

// Utility function for debouncing
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
