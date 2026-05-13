import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const KEY = "piq_demo";

export const DEMO_PROPERTY_IDS = [
  "a0000001-0000-0000-0000-000000000001",
  "a0000001-0000-0000-0000-000000000002",
  "a0000001-0000-0000-0000-000000000003",
  "a0000001-0000-0000-0000-000000000004",
  "a0000001-0000-0000-0000-000000000005",
];

export function isDemoIdString(id?: string | null) {
  return !!id && id.toLowerCase().startsWith("a0000001-");
}

export function usePropertyIQDemo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(KEY) === "1";
  });

  useEffect(() => {
    if (searchParams.get("demo") === "1") {
      sessionStorage.setItem(KEY, "1");
      setIsDemo(true);
    }
  }, [searchParams]);

  const exitDemo = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setIsDemo(false);
    navigate("/property-iq");
  }, [navigate]);

  return { isDemo, exitDemo };
}
