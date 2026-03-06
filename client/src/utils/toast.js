/**
 * Toast Notification System
 * Simple toast notification manager without external dependencies
 */

let toastId = 0;
const listeners = [];

/**
 * Toast notification object
 */
class Toast {
  constructor(message, type = "info", duration = 3000) {
    this.id = toastId++;
    this.message = message;
    this.type = type; // success, error, warning, info
    this.duration = duration;
    this.createdAt = Date.now();
  }
}

/**
 * Show a toast notification
 */
export const showToast = (message, type = "info", duration = 3000) => {
  const toast = new Toast(message, type, duration);
  notify(toast);
  return toast.id;
};

/**
 * Show success toast
 */
export const showSuccessToast = (message, duration = 3000) => {
  return showToast(message, "success", duration);
};

/**
 * Show error toast
 */
export const showErrorToast = (message, duration = 3000) => {
  return showToast(message, "error", duration);
};

/**
 * Show warning toast
 */
export const showWarningToast = (message, duration = 3000) => {
  return showToast(message, "warning", duration);
};

/**
 * Show info toast
 */
export const showInfoToast = (message, duration = 3000) => {
  return showToast(message, "info", duration);
};

/**
 * Notify all listeners
 */
const notify = (toast) => {
  listeners.forEach(listener => listener(toast));

  if (toast.duration > 0) {
    setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);
  }
};

/**
 * Remove toast notification
 */
export const removeToast = (id) => {
  listeners.forEach(listener => listener({ id, remove: true }));
};

/**
 * Subscribe to toast events
 */
export const subscribeToToasts = (listener) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};
