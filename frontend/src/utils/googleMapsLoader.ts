import { useState, useEffect } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';

declare global {
  interface Window {
    google?: typeof google;
    __googleMapsLoadingPromise?: Promise<typeof google.maps>;
  }
}

export function loadGoogleMapsScript(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__googleMapsLoadingPromise) {
    return window.__googleMapsLoadingPromise;
  }

  window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script loaded without window.google.maps'));
        }
      });
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry,visualization&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        // Poll briefly in case google.maps initializes shortly after onload
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.google?.maps) {
            clearInterval(interval);
            resolve(window.google.maps);
          } else if (attempts > 20) {
            clearInterval(interval);
            reject(new Error('Timeout waiting for window.google.maps initialization'));
          }
        }, 100);
      }
    };

    script.onerror = (err) => {
      reject(new Error(`Failed to load Google Maps SDK: ${err}`));
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoadingPromise;
}

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    return typeof window !== 'undefined' && Boolean(window.google?.maps);
  });
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoaded) return;

    let mounted = true;
    loadGoogleMapsScript()
      .then(() => {
        if (mounted) setIsLoaded(true);
      })
      .catch((err) => {
        if (mounted) setLoadError(err);
      });

    return () => {
      mounted = false;
    };
  }, [isLoaded]);

  return { isLoaded, loadError };
}
