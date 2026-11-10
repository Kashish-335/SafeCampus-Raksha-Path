import React, { createContext, useContext, useState } from 'react';
import { dataService } from '../services/dataService';
import { AlertDispatchResult } from '../services/alertService';

interface DemoContextType {
  isDemoMode: boolean;
  isNightMode: boolean;
  activeDispatchedAlert: AlertDispatchResult | null;
  toggleDemoMode: () => void;
  toggleNightMode: () => void;
  resetDemoData: () => void;
  setActiveDispatchedAlert: (alert: AlertDispatchResult | null) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isNightMode, setIsNightMode] = useState<boolean>(true); // Night scenario active by default
  const [activeDispatchedAlert, setActiveDispatchedAlert] = useState<AlertDispatchResult | null>(null);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const toggleNightMode = () => {
    setIsNightMode((prev) => !prev);
  };

  const resetDemoData = () => {
    dataService.resetDemoData();
    window.location.reload();
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        isNightMode,
        activeDispatchedAlert,
        toggleDemoMode,
        toggleNightMode,
        resetDemoData,
        setActiveDispatchedAlert,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
};
