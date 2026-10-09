import { useState, useEffect } from 'react';

/**
 * Validates whether the given string is a valid Google Maps Platform API key.
 * Google Maps API keys are 39 characters long starting with 'AIza'.
 * Dummy keys like '11103', 'YOUR_KEY', empty strings, etc., are rejected.
 */
export function isValidGoogleMapsKey(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  // Must match the standard Google Cloud / Google Maps API Key pattern
  return /^AIza[0-9A-Za-z-_]{30,}$/.test(trimmed);
}

/**
 * Custom hook to safely get and validate Google Maps API key.
 * Listens for global quota/auth errors to failover to Leaflet if the key fails at runtime.
 */
export function useGoogleMapsKey() {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const [authFailed, setAuthFailed] = useState<boolean>(false);

  useEffect(() => {
    const handleAuthFail = () => {
      setAuthFailed(true);
    };

    window.addEventListener('gmp-auth-failed', handleAuthFail);
    window.addEventListener('gmp-quota-exceeded', handleAuthFail);

    return () => {
      window.removeEventListener('gmp-auth-failed', handleAuthFail);
      window.removeEventListener('gmp-quota-exceeded', handleAuthFail);
    };
  }, []);

  const isValid = isValidGoogleMapsKey(envKey) && !authFailed;

  return {
    apiKey: isValid ? envKey : '',
    isValid,
    authFailed,
    hasRawKey: envKey.length > 0,
  };
}
