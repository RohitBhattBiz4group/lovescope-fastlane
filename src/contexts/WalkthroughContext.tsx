import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

interface WalkthroughContextType {
  stopOnOutsideClick: boolean;
  setStopOnOutsideClick: (value: boolean) => void;
}

const WalkthroughContext = createContext<WalkthroughContextType>({
  stopOnOutsideClick: false,
  setStopOnOutsideClick: () => {},
});

export const useWalkthroughConfig = () => useContext(WalkthroughContext);

export const WalkthroughProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stopOnOutsideClick, setStopOnOutsideClickState] = useState(false);

  const setStopOnOutsideClick = useCallback((value: boolean) => {
    setStopOnOutsideClickState(value);
  }, []);

  const value = useMemo(() => ({
    stopOnOutsideClick,
    setStopOnOutsideClick,
  }), [stopOnOutsideClick, setStopOnOutsideClick]);

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
    </WalkthroughContext.Provider>
  );
};
