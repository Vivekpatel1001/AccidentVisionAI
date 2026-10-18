import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CityContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState<string>('');

  return (
    <CityContext.Provider value={{ selectedCity, setSelectedCity }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCityFilter = (): CityContextType => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCityFilter must be used within a CityProvider');
  }
  return context;
};
