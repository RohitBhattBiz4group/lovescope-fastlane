import React, { createContext, useContext, useState, ReactNode } from "react";

interface NavigationContextType {
  activeRouteName: string | undefined;
  setActiveRouteName: (routeName: string | undefined) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeRouteName, setActiveRouteName] = useState<string | undefined>(
    undefined
  );

  return (
    <NavigationContext.Provider value={{ activeRouteName, setActiveRouteName }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      "useNavigationContext must be used within NavigationProvider"
    );
  }
  return context;
};

