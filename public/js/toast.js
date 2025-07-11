// Toast Notification System
class Toast {
  constructor() {
    this.container = this.createContainer();
    this.toasts = new Map();
  }

  createContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = "info", options = {}) {
    const config = {
      title: "",
      duration: 4000,
      showProgress: true,
      closable: true,
      ...options,
    };

    const toast = this.createToast(message, type, config);
    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // Auto remove
    if (config.duration > 0) {
      const timeoutId = setTimeout(() => {
        this.remove(toast);
      }, config.duration);

      // Store timeout ID for manual removal
      this.toasts.set(toast, timeoutId);
    }

    return toast;
  }

  createToast(message, type, config) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
          ${config.title ? `<div class="toast-title">${config.title}</div>` : ""}
          <div class="toast-message">${message}</div>
        </div>
        ${config.closable ? '<button class="toast-close" type="button">×</button>' : ""}
        ${
          config.showProgress
            ? `
          <div class="toast-progress">
            <div class="toast-progress-bar" style="transform: scaleX(1); transition-duration: ${config.duration}ms;"></div>
          </div>
        `
            : ""
        }
      `;

    // Add close button functionality
    if (config.closable) {
      const closeBtn = toast.querySelector(".toast-close");
      closeBtn.addEventListener("click", () => {
        this.remove(toast);
      });
    }

    // Start progress bar animation
    if (config.showProgress && config.duration > 0) {
      requestAnimationFrame(() => {
        const progressBar = toast.querySelector(".toast-progress-bar");
        if (progressBar) {
          progressBar.style.transform = "scaleX(0)";
        }
      });
    }

    return toast;
  }

  remove(toast) {
    if (!toast.parentNode) return;

    // Clear timeout if exists
    if (this.toasts.has(toast)) {
      clearTimeout(this.toasts.get(toast));
      this.toasts.delete(toast);
    }

    // Animate out
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message, options = {}) {
    return this.show(message, "success", options);
  }

  error(message, options = {}) {
    return this.show(message, "error", options);
  }

  warning(message, options = {}) {
    return this.show(message, "warning", options);
  }

  info(message, options = {}) {
    return this.show(message, "info", options);
  }

  clear() {
    this.toasts.forEach((timeoutId, toast) => {
      clearTimeout(timeoutId);
      this.remove(toast);
    });
    this.toasts.clear();
  }
}

// Create global toast instance
window.toast = new Toast();

// Export for module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = Toast;
}
