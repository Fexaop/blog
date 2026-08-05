"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  CrumbleContext,
  getCrumbleConfig,
  type CrumbleConfig,
  type CrumbleTheme,
} from "@/lib/rough";

const SetThemeContext = createContext<(theme: CrumbleTheme) => void>(() => {});

export function CrumbleProvider({
  children,
  theme: themeProp,
  animateOnMount,
  animateOnHover,
}: PropsWithChildren<Partial<CrumbleConfig>>) {
  const config = getCrumbleConfig();
  // Controlled when `theme` prop is passed; otherwise local (setTheme) state
  const [uncontrolledTheme, setUncontrolledTheme] = useState<CrumbleTheme>(
    themeProp ?? config.theme,
  );
  const currentTheme = themeProp ?? uncontrolledTheme;

  const contextValue = useMemo(
    () => ({
      theme: currentTheme,
      animateOnMount: animateOnMount ?? config.animateOnMount,
      animateOnHover: animateOnHover ?? config.animateOnHover,
    }),
    [animateOnHover, animateOnMount, config, currentTheme],
  );

  return (
    <CrumbleContext.Provider value={contextValue}>
      <SetThemeContext.Provider value={setUncontrolledTheme}>
        <div data-crumble-theme={currentTheme} className="min-h-full">
          {children}
        </div>
      </SetThemeContext.Provider>
    </CrumbleContext.Provider>
  );
}

export function useCrumble() {
  const context = useContext(CrumbleContext);
  const setTheme = useContext(SetThemeContext);
  return { ...context, setTheme };
}

export { CrumbleContext };
