'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  center: [number, number];
  marker: [number, number];
}

export default function MapComponent({ center, marker }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if it hasn't been initialized yet
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Create marker icon
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        shadowSize: [41, 41],
      });

      // Add marker
      L.marker(marker, { icon }).addTo(mapRef.current);
    } else {
      // Update view and marker position
      mapRef.current.setView(center, 15);
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          layer.setLatLng(marker);
        }
      });
    }
  }, [center, marker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainerRef} style={{ height: '200px', width: '100%' }} />;
} 