/**
 * Toast Container Component
 * Displays all active toast notifications
 */

import { useEffect, useState } from "react";
import { subscribeToToasts } from "../utils/toast";

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      if (toast.remove) {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      } else {
        setToasts(prev => [...prev, toast]);
      }
    });

    return unsubscribe;
  }, []);

  const getToastStyles = (type) => {
    switch (type) {
      case "success":
        return "bg-green-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      case "warning":
        return "bg-yellow-600 text-white";
      case "info":
      default:
        return "bg-blue-600 text-white";
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
      default:
        return "ℹ";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-40 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in duration-300 ${getToastStyles(toast.type)}`}
        >
          <span className="font-bold text-lg">{getToastIcon(toast.type)}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => {
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }}
            className="hover:opacity-75 transition text-lg font-bold"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
