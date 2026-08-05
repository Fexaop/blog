"use client";

import {
  createContext,
  useContext,
  useEffect,
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
  theme,
  animateOnMount,
  animateOnHover,
}: PropsWithChildren<Partial<CrumbleConfig>>) {
  const config = getCrumbleConfig();
  const [currentTheme, setCurrentTheme] = useState<CrumbleTheme>(
    theme ?? config.theme,
  );

  useEffect(() => {
    if (theme !== undefined) {
      setCurrentTheme(theme);
    }
  }, [theme]);

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
      <SetThemeContext.Provider value={setCurrentTheme}>
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
