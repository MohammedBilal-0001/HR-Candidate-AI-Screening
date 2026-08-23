import { useCallback, useState } from "react";

const KEY = "gemini_api_key";
export function useGeminiKey(): [string, (value: string) => void] {
  const [key, setKeyState] = useState(() => window.localStorage.getItem(KEY) ?? "");
  const setKey = useCallback((value: string) => {
    setKeyState(value);
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  }, []);
  return [key, setKey];
}