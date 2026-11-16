"use client";

import { useCallback, useLayoutEffect, useState } from "react";

const KEY = "nexteuer.privacy";
const CLASS = "privacy";

function readStored(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function apply(on: boolean) {
  document.documentElement.classList.toggle(CLASS, on);
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

export function usePrivacy() {
  const [on, setOn] = useState(false);

  useLayoutEffect(() => {
    const stored = readStored();
    setOn(stored);
    apply(stored);
  }, []);

  const toggle = useCallback(() => {
    setOn((current) => {
      const next = !current;
      apply(next);
      return next;
    });
  }, []);

  return { on, toggle };
}
