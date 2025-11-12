import React, { useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const ToastContext = React.createContext<{
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
}>({
  showToast: () => '',
  removeToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timeouts = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);

    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeToast(id);
      }, duration);
      
      timeouts.current.set(id, timeout);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    
    // Clear the timeout if it exists
    if (timeouts.current.has(id)) {
      clearTimeout(timeouts.current.get(id));
      timeouts.current.delete(id);
    }
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach((timeout) => clearTimeout(timeout));
      timeouts.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-4 rounded-md shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            } text-white`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return React.useContext(ToastContext);
};

export default useToast;
