import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Controller to smoothly pan/fly map when alertCenter or focus changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons
export const caseIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const sightingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface LiveMapCaseItem {
  id: string;
  name?: string;
  missing_person_name?: string;
  lat?: number;
  lng?: number;
  last_seen_lat?: number;
  last_seen_lng?: number;
  lastSeenTime?: string;
  last_seen_time?: string;
  location_name?: string;
  last_seen_location_name?: string;
  primary_image_url?: string;
  urgency?: string;
  case_number?: string;
  description?: string;
}

export interface LiveMapSightingItem {
  id: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  sighting_time?: string;
  location_name?: string;
  description?: string;
  case_id?: string;
}

export interface LiveMapProps {
  cases?: LiveMapCaseItem[];
  sightings?: LiveMapSightingItem[];
  alertCenter?: [number, number];
  alertRadius?: number;
}

export default function LiveMap({
  cases = [],
  sightings = [],
  alertCenter,
  alertRadius
}: LiveMapProps) {
  const defaultCenter: [number, number] = [21.1938, 81.2869]; // Durg / Bhilai, Chhattisgarh as default

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-navy-800 shadow-xl relative z-10">
      <MapContainer 
        center={alertCenter || defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%', background: '#0b1329' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeView center={alertCenter || defaultCenter} zoom={13} />

        {/* Missing Person Case Markers */}
        {cases.map((c) => {
          const latitude = c.lat ?? c.last_seen_lat;
          const longitude = c.lng ?? c.last_seen_lng;
          const personName = c.name ?? c.missing_person_name ?? 'Missing Subject';
          const lastSeen = c.lastSeenTime ?? (c.last_seen_time ? new Date(c.last_seen_time).toLocaleString() : 'Recent');
          const location = c.location_name ?? c.last_seen_location_name ?? 'Bhilai Grid';

          if (latitude === undefined || longitude === undefined) return null;

          return (
            <Marker key={c.id} position={[latitude, longitude]} icon={caseIcon}>
              <Popup>
                <div style={{ minWidth: '180px', color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
                  {c.primary_image_url && (
                    <img 
                      src={c.primary_image_url} 
                      alt={personName}
                      style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }} 
                    />
                  )}
                  <strong style={{ fontSize: '13px', color: '#b91c1c' }}>🚨 Missing: {personName}</strong>
                  {c.case_number && (
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>{c.case_number}</div>
                  )}
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    <strong>Last seen:</strong> {lastSeen}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    <strong>Location:</strong> {location}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                    <a 
                      href={`/sightings?case_id=${c.id}`} 
                      style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        padding: '4px 6px', 
                        background: '#0284c7', 
                        color: '#fff', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        textDecoration: 'none' 
                      }}
                    >
                      Report Sighting
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Sighting Markers */}
        {sightings.map((s) => {
          const latitude = s.lat ?? s.latitude;
          const longitude = s.lng ?? s.longitude;
          const time = s.timestamp ?? (s.sighting_time ? new Date(s.sighting_time).toLocaleString() : 'Just now');
          const location = s.location_name ?? 'Reported Sighting';

          if (latitude === undefined || longitude === undefined) return null;

          return (
            <Marker key={s.id} position={[latitude, longitude]} icon={sightingIcon}>
              <Popup>
                <div style={{ minWidth: '160px', color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
                  <strong style={{ color: '#d97706', fontSize: '12px' }}>👁️ Sighting Reported</strong><br />
                  <span style={{ fontSize: '11px' }}><strong>Place:</strong> {location}</span><br />
                  <span style={{ fontSize: '11px' }}><strong>Time:</strong> {time}</span>
                  {s.description && (
                    <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                      {s.description.substring(0, 80)}...
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* SMS Alert Radius Indicator */}
        {alertCenter && alertRadius && (
          <Circle 
            center={alertCenter} 
            pathOptions={{ color: 'red', fillColor: '#f87171', fillOpacity: 0.2 }} 
            radius={alertRadius} // Radius in meters
          />
        )}
      </MapContainer>
    </div>
  );
}
