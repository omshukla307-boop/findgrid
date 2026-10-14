import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, Radio, Eye, Layers, Filter, Plus, 
  Search, RefreshCw, Shield, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MissingPersonCase, Sighting, SearchTask } from '../types';

export const MapSearchPage: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & layer toggles
  const [selectedCaseId, setSelectedCaseId] = useState<string>(searchParams.get('case_id') || '');
  const [showSightings, setShowSightings] = useState<boolean>(true);
  const [showSearchZones, setShowSearchZones] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<{ type: 'case' | 'sighting' | 'task'; data: any } | null>(null);

  // Modal for new search sector
  const [zoneModalOpen, setZoneModalOpen] = useState<boolean>(false);
  const [zoneForm, setZoneForm] = useState({
    case_id: '',
    title: '',
    description: '',
    zone_name: '',
    zone_center_lat: 37.7749,
    zone_center_lng: -122.4194,
    zone_radius_meters: 500,
    priority: 'High',
  });
  const [creatingZone, setCreatingZone] = useState<boolean>(false);

  // Fetch all GIS data
  const loadMapData = async () => {
    try {
      setLoading(true);
      const [cList, sList, tList] = await Promise.all([
        api.getCases(),
        api.getSightings(),
        api.getTasks(),
      ]);
      setCases(cList);
      setSightings(sList);
      setTasks(tList);
      if (cList.length > 0 && !zoneForm.case_id) {
        setZoneForm(prev => ({ ...prev, case_id: cList[0].id }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load GIS map data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to San Francisco coordinates matching seed data
      const map = L.map(mapContainerRef.current, {
        center: [37.7785, -122.4150],
        zoom: 13,
        zoomControl: true,
      });

      // CartoDB Dark Matter tiles (dark cyber aesthetic)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render markers whenever data or toggles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Custom HTML Marker Icons
    const createCaseIcon = (urgency: string) => {
      const color = urgency === 'Critical' ? '#f43f5e' : urgency === 'High' ? '#f59e0b' : '#06b6d4';
      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #070b14; box-shadow: 0 0 15px ${color}; display: flex; items-center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background-color: white;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    const createSightingIcon = () => {
      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 4px; border: 2px solid #070b14; transform: rotate(45deg); box-shadow: 0 0 10px #3b82f6;"></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
    };

    // 1. Plot Missing Person Cases (Approximate Last-Seen)
    const filteredCases = selectedCaseId
      ? cases.filter(c => c.id === selectedCaseId)
      : cases;

    filteredCases.forEach((c) => {
      if (!c.last_seen_lat || !c.last_seen_lng) return;

      const marker = L.marker([c.last_seen_lat, c.last_seen_lng], {
        icon: createCaseIcon(c.urgency),
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #f1f5f9;">
          <div style="color: #22d3ee; font-family: monospace; font-weight: bold; margin-bottom: 2px;">
            ${c.case_number} [${c.urgency.toUpperCase()}]
          </div>
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">
            ${c.missing_person_name}
          </div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 4px;">
            Last Seen: ${c.last_seen_location_name}
          </div>
          <div style="color: #cbd5e1; font-size: 11px; margin-bottom: 6px;">
            ${c.description.substring(0, 80)}...
          </div>
          <a href="/cases/${c.id}" style="color: #22d3ee; text-decoration: none; font-weight: bold; font-size: 11px;">
            Open Case Dossier &rarr;
          </a>
        </div>
      `);

      marker.on('click', () => setSelectedItem({ type: 'case', data: c }));
      layerGroup.addLayer(marker);
    });

    // 2. Plot Sightings
    if (showSightings) {
      const filteredSightings = selectedCaseId
        ? sightings.filter(s => s.case_id === selectedCaseId)
        : sightings;

      filteredSightings.forEach((s) => {
        if (!s.latitude || !s.longitude) return;

        const marker = L.marker([s.latitude, s.longitude], {
          icon: createSightingIcon(),
        });

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #f1f5f9;">
            <div style="color: #38bdf8; font-family: monospace; font-weight: bold; margin-bottom: 2px;">
              SIGHTING REPORT [${s.status.toUpperCase()}]
            </div>
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${s.location_name}
            </div>
            <div style="color: #cbd5e1; font-size: 11px; margin-bottom: 4px;">
              ${s.description}
            </div>
            <div style="color: #94a3b8; font-size: 10px;">
              Time: ${new Date(s.sighting_time).toLocaleString()}
            </div>
          </div>
        `);

        marker.on('click', () => setSelectedItem({ type: 'sighting', data: s }));
        layerGroup.addLayer(marker);
      });
    }

    // 3. Plot Operational Search Zones (Circles)
    if (showSearchZones) {
      const filteredTasks = selectedCaseId
        ? tasks.filter(t => t.case_id === selectedCaseId)
        : tasks;

      filteredTasks.forEach((t) => {
        if (!t.zone_center_lat || !t.zone_center_lng) return;

        const color = t.priority === 'Urgent' ? '#f43f5e' : t.priority === 'High' ? '#f59e0b' : '#06b6d4';

        const circle = L.circle([t.zone_center_lat, t.zone_center_lng], {
          radius: t.zone_radius_meters,
          color: color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.15,
          dashArray: '4, 8',
        });

        circle.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #f1f5f9;">
            <div style="color: ${color}; font-family: monospace; font-weight: bold; margin-bottom: 2px;">
              SEARCH ZONE [${t.priority.toUpperCase()}]
            </div>
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${t.zone_name}
            </div>
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 4px;">
              Status: ${t.status} | Radius: ${t.zone_radius_meters}m
            </div>
            <div style="color: #cbd5e1; font-size: 11px;">
              ${t.description}
            </div>
          </div>
        `);

        circle.on('click', () => setSelectedItem({ type: 'task', data: t }));
        layerGroup.addLayer(circle);
      });
    }
  }, [cases, sightings, tasks, selectedCaseId, showSightings, showSearchZones]);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneForm.case_id || !zoneForm.title || !zoneForm.zone_name) {
      showToast('Please fill in required search zone fields.', 'error');
      return;
    }

    try {
      setCreatingZone(true);
      await api.createTask({
        case_id: zoneForm.case_id,
        title: zoneForm.title,
        description: zoneForm.description,
        zone_name: zoneForm.zone_name,
        zone_center_lat: zoneForm.zone_center_lat,
        zone_center_lng: zoneForm.zone_center_lng,
        zone_radius_meters: zoneForm.zone_radius_meters,
        priority: zoneForm.priority as any,
      });

      showToast(`Search zone "${zoneForm.zone_name}" deployed to tactical grid!`, 'success');
      setZoneModalOpen(false);
      loadMapData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create search zone.', 'error');
    } finally {
      setCreatingZone(false);
    }
  };

  const isInvestigator = role === 'investigator' || role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-5rem)]">
      
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" /> TACTICAL SEARCH & RESCUE MAP
          </h1>
          <p className="text-[11px] text-slate-400">
            Interactive Leaflet OpenStreetMap grid displaying approximate last-seen fixes, sightings, and sector sweep perimeters.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isInvestigator && (
            <button
              onClick={() => setZoneModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Deploy Search Sector
            </button>
          )}

          <button
            onClick={loadMapData}
            className="p-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 border border-navy-800 text-slate-400 hover:text-white"
            title="Reload Map Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Filter & Layer Toggles Bar */}
      <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        
        {/* Case selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 font-mono text-[11px]">Filter Case:</span>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-navy-950 border border-navy-800 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Active Incidents</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} — {c.missing_person_name}
              </option>
            ))}
          </select>
        </div>

        {/* Layer checkboxes */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showSightings}
              onChange={(e) => setShowSightings(e.target.checked)}
              className="rounded bg-navy-950 border-navy-800 text-cyan-500"
            />
            <span className="w-2 h-2 rounded-sm bg-blue-400"></span>
            Sightings ({sightings.length})
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showSearchZones}
              onChange={(e) => setShowSearchZones(e.target.checked)}
              className="rounded bg-navy-950 border-navy-800 text-cyan-500"
            />
            <span className="w-2 h-2 rounded-full border border-cyan-400"></span>
            Search Sectors ({tasks.length})
          </label>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Critical Fix
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High Fix
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Medium Fix
          </span>
        </div>

      </div>

      {/* Main Map View & Tactical Side Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-9 rounded-2xl overflow-hidden border border-navy-800 relative shadow-2xl h-full">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Selected Map Item Detail Drawer */}
        <div className="lg:col-span-3 rounded-2xl bg-navy-900 border border-navy-800 p-4 flex flex-col justify-between overflow-y-auto">
          {selectedItem ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-navy-850">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  {selectedItem.type.toUpperCase()} TELEMETRY
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-[10px] font-mono text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              </div>

              {selectedItem.type === 'case' && (
                <div className="space-y-2 text-xs">
                  <div className="font-mono text-cyan-300 font-bold">{selectedItem.data.case_number}</div>
                  <h3 className="text-base font-bold text-white">{selectedItem.data.missing_person_name}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{selectedItem.data.description}</p>
                  <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-850 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>Fix: {selectedItem.data.last_seen_location_name}</div>
                    <div>Urgency: {selectedItem.data.urgency}</div>
                    <div>Status: {selectedItem.data.status}</div>
                  </div>
                  <Link
                    to={`/cases/${selectedItem.data.id}`}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1 block text-center"
                  >
                    Open Case Dossier <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {selectedItem.type === 'sighting' && (
                <div className="space-y-2 text-xs">
                  <div className="font-mono text-blue-400 font-bold">FIELD SIGHTING</div>
                  <h3 className="text-sm font-bold text-white">{selectedItem.data.location_name}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{selectedItem.data.description}</p>
                  {selectedItem.data.clothing_observed && (
                    <div className="p-2 rounded bg-navy-950 text-cyan-300 font-mono text-[11px]">
                      Apparel: {selectedItem.data.clothing_observed}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-slate-400">
                    Status: {selectedItem.data.status}
                  </div>
                </div>
              )}

              {selectedItem.type === 'task' && (
                <div className="space-y-2 text-xs">
                  <div className="font-mono text-amber-400 font-bold">SEARCH SECTOR ZONE</div>
                  <h3 className="text-sm font-bold text-white">{selectedItem.data.zone_name}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{selectedItem.data.description}</p>
                  <div className="p-2.5 rounded bg-navy-950 font-mono text-[11px] text-slate-300 space-y-1">
                    <div>Radius: {selectedItem.data.zone_radius_meters} meters</div>
                    <div>Priority: {selectedItem.data.priority}</div>
                    <div>Status: {selectedItem.data.status}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-mono">Select any pin or sector perimeter on the map to inspect coordinates.</p>
            </div>
          )}

          <div className="pt-3 border-t border-navy-850 text-[10px] font-mono text-slate-500">
            OpenStreetMap CartoDB Tiles • WGS 84
          </div>
        </div>

      </div>

      {/* Deploy Search Sector Modal */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-2">
              DEPLOY SEARCH SECTOR PERIMETER
            </h3>
            <p className="text-xs text-slate-400 mb-4">Assign operational radius for volunteer search crews.</p>

            <form onSubmit={handleCreateZone} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Case *</label>
                <select
                  value={zoneForm.case_id}
                  onChange={(e) => setZoneForm({ ...zoneForm, case_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.missing_person_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sector Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector Echo - River North Trail"
                  value={zoneForm.zone_name}
                  onChange={(e) => setZoneForm({ ...zoneForm, zone_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mission Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Foot trail ground sweep"
                  value={zoneForm.title}
                  onChange={(e) => setZoneForm({ ...zoneForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Center Lat</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={zoneForm.zone_center_lat}
                    onChange={(e) => setZoneForm({ ...zoneForm, zone_center_lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Center Lng</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={zoneForm.zone_center_lng}
                    onChange={(e) => setZoneForm({ ...zoneForm, zone_center_lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Search Radius (Meters): {zoneForm.zone_radius_meters}m</label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={zoneForm.zone_radius_meters}
                  onChange={(e) => setZoneForm({ ...zoneForm, zone_radius_meters: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setZoneModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs bg-navy-950 text-slate-300 border border-navy-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingZone}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  {creatingZone ? 'Deploying...' : 'Deploy Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
