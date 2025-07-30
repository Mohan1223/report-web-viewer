import { useState, useEffect } from 'react';

const STORAGE_KEY = 'installation-report-data';

export const useFormPersistence = <T>(initialData: T) => {
  const [data, setData] = useState<T>(initialData);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Merge saved data with initial data to ensure all properties exist
        setData({ ...initialData, ...parsedData });
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [data]);

  // Clear saved data
  const clearSavedData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing data from localStorage:', error);
    }
  };

  return [data, setData, clearSavedData] as const;
};