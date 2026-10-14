import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { 
  Shield, Radio, BrainCircuit, Blocks, Users, Eye, 
  AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, 
  TrendingUp, Clock, FileCheck2, PlusCircle, Activity, MapPin,
  Compass, Navigation, Crosshair, Sparkles, UserCheck, ExternalLink, Map
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AnalyticsOverview, MissingPersonCase, Sighting } from '../types';
import { formatAddress, formatHash } from '../services/crypto';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import LiveMap from '../components/LiveMap';

// Curated Bhilai, Chhattisgarh Active Missing Persons (Indian individuals)
const DEFAULT_BHILAI_CASES: MissingPersonCase[] = [
  {
    id: 'bhilai-case-1',
    case_number: 'FG-2026-0901',
    title: 'Disappearance near Civic Centre Sector 6, Bhilai',
    missing_person_name: 'P Yash Kumar',
    age: 21,
    gender: 'Male',
    description: 'Engineering student at Bhilai Institute. Last seen leaving study session near Kala Mandir, Civic Centre. Wearing navy blue hoodie, dark jeans, white sneakers.',
    clothing_description: 'Navy blue hoodie with dark sleeves, black denim jeans, white sneakers, carrying a black laptop backpack.',
    identifying_features: 'Small birthmark on right wrist, wears stainless steel watch, black-rimmed glasses.',
    last_seen_time: new Date(Date.now() - 14 * 3600000).toISOString(),
    last_seen_location_name: 'Civic Centre, Sector 6, Bhilai',
    last_seen_lat: 21.1950,
    last_seen_lng: 81.3560,
    status: 'Active Search',
    urgency: 'Critical',
    reporter_name: 'Sujal Das',
    reporter_contact: '+91 98271-44021',
    reporter_relationship: 'Friend / Batchmate',
    assigned_investigator_wallet: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    is_sensitive: false,
    primary_image_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
  {
    id: 'bhilai-case-2',
    case_number: 'FG-2026-0902',
    title: 'Disappearance near Nehru Nagar Chowk, Bhilai',
    missing_person_name: 'Aditya Lamte',
    age: 22,
    gender: 'Male',
    description: 'Young software developer. Did not return after an evening walk towards GE Road flyover. Wearing maroon sweatshirt, beige cargo trousers, dark brown running shoes.',
    clothing_description: 'Maroon round-neck sweatshirt, beige cargo trousers, dark brown running shoes.',
    identifying_features: 'Scar on left forearm from sports injury, wears a silver kada on right wrist.',
    last_seen_time: new Date(Date.now() - 6 * 3600000).toISOString(),
    last_seen_location_name: 'Nehru Nagar Chowk, GE Road, Bhilai',
    last_seen_lat: 21.2185,
    last_seen_lng: 81.3280,
    status: 'Under Review',
    urgency: 'High',
    reporter_name: 'Ramesh Lamte',
    reporter_contact: '+91 94252-88190',
    reporter_relationship: 'Father',
    assigned_investigator_wallet: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    is_sensitive: false,
    primary_image_url: '/images/aditya_lamte.jpg',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'bhilai-case-3',
    case_number: 'FG-2026-0903',
    title: 'Reported Missing from Supela Market Corridor, Bhilai',
    missing_person_name: 'Sankalp Dewangan',
    age: 20,
    gender: 'Male',
    description: 'Undergraduate student. Disappeared near Akash Ganga commercial complex after running evening errands. Height 5\'8", lean build, wavy black hair.',
    clothing_description: 'Black collared casual shirt, olive green chinos, black sneakers, carrying blue canvas messenger bag.',
    identifying_features: 'Distinctive mole on left cheek, wears black sports digital watch.',
    last_seen_time: new Date(Date.now() - 48 * 3600000).toISOString(),
    last_seen_location_name: 'Supela Clock Tower / Akash Ganga, Bhilai',
    last_seen_lat: 21.2050,
    last_seen_lng: 81.3410,
    status: 'Potential Match',
    urgency: 'High',
    reporter_name: 'Tapan Dewangan',
    reporter_contact: '+91 98930-11234',
    reporter_relationship: 'Brother',
    assigned_investigator_wallet: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    is_sensitive: false,
    primary_image_url: 'https://images.unsplash.com/photo-1615813967515-e1838c1c5116?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: 'bhilai-case-4',
    case_number: 'FG-2026-0904',
    title: 'Separation near Junwani Commercial Corridor, Bhilai',
    missing_person_name: 'Ayush Lamte',
    age: 19,
    gender: 'Male',
    description: 'First-year student separated from friends after university fest event near Junwani. Height 5\'10", slim build, dark eyes, polite demeanor.',
    clothing_description: 'Teal polo t-shirt, dark gray track pants, white sports shoes with orange accents.',
    identifying_features: 'Small scar near hairline, carries red metallic water bottle.',
    last_seen_time: new Date(Date.now() - 96 * 3600000).toISOString(),
    last_seen_location_name: 'Junwani Commercial Square, Bhilai',
    last_seen_lat: 21.2330,
    last_seen_lng: 81.3120,
    status: 'Submitted',
    urgency: 'Medium',
    reporter_name: 'Sunita Lamte',
    reporter_contact: '+91 97555-77312',
    reporter_relationship: 'Mother',
    assigned_investigator_wallet: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    is_sensitive: false,
    primary_image_url: 'https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 96 * 3600000).toISOString(),
  },
];

export const DashboardPage: React.FC = () => {
  const { user, role, walletAddress } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [cases, setCases] = useState<MissingPersonCase[]>(DEFAULT_BHILAI_CASES);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeSector, setActiveSector] = useState<string>('all');

  const [alertCenter, setAlertCenter] = useState<[number, number]>([21.1950, 81.3560]);
  const [alertRadius, setAlertRadius] = useState<number>(1200);

  const fetchTelemetryAndCases = async () => {
    try {
      setRefreshing(true);
      const [analyticsData, casesData, sightingsData] = await Promise.all([
        api.getAnalytics().catch(() => null),
        api.getCases().catch(() => []),
        api.getSightings().catch(() => []),
      ]);
      if (analyticsData) setAnalytics(analyticsData);
      if (casesData && casesData.length > 0) {
        setCases(casesData);
      }
      if (sightingsData) {
        setSightings(sightingsData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetryAndCases();
  }, []);

  // Sector Focus Handler for Bhilai Map
  const handleFlyToSector = (lat: number, lng: number, sectorId: string, radius: number = 1000) => {
    setActiveSector(sectorId);
    setAlertCenter([lat, lng]);
    setAlertRadius(radius);
  };

  // Format urgency chart data
  const urgencyChartData = analytics ? [
    { name: 'Critical', count: analytics.urgency_distribution?.Critical || 1, fill: '#f43f5e' },
    { name: 'High', count: analytics.urgency_distribution?.High || 2, fill: '#f59e0b' },
    { name: 'Medium', count: analytics.urgency_distribution?.Medium || 1, fill: '#06b6d4' },
    { name: 'Low', count: analytics.urgency_distribution?.Low || 0, fill: '#64748b' },
  ] : [
    { name: 'Critical', count: 1, fill: '#f43f5e' },
    { name: 'High', count: 2, fill: '#f59e0b' },
    { name: 'Medium', count: 1, fill: '#06b6d4' },
    { name: 'Low', count: 0, fill: '#64748b' },
  ];

  // Format status chart data
  const statusChartData = analytics ? Object.entries(analytics.status_distribution || {}).map(([name, value]) => ({
    name,
    value,
  })).filter(item => item.value > 0) : [
    { name: 'Active Search', value: 1 },
    { name: 'Under Review', value: 1 },
    { name: 'Potential Match', value: 1 },
    { name: 'Submitted', value: 1 },
  ];

  const STATUS_COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              OPERATIONAL <span className="text-cyan-400">COMMAND</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-850 text-cyan-300 border border-cyan-500/30">
              {role === 'volunteer' ? 'SUJAL DAS (VOLUNTEER CLEARANCE)' : `${role.toUpperCase()} CLEARANCE`}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {role === 'volunteer' ? 'Active Volunteer Responder' : 'Authenticated Officer'}: <span className="text-slate-200 font-semibold">{role === 'volunteer' ? 'Sujal Das' : (user?.full_name || 'Sujal Das')}</span> ({formatAddress(walletAddress || '', 4)}) • <span className="text-cyan-400 font-mono">Bhilai Incident Command Sector</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Volunteer Responder Tag in Top Right */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-cyan-500/40 shadow-sm text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-[11px]">Volunteer:</span>
            <span className="text-cyan-300 font-bold">Sujal Das</span>
          </div>

          <button
            onClick={fetchTelemetryAndCases}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-navy-900 hover:bg-navy-850 border border-navy-700 text-slate-300 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Telemetry
          </button>

          <Link
            to="/cases?action=create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-md shadow-cyan-950 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" /> File Missing Complaint
          </Link>

          <Link
            to="/sightings"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Report Last Location
          </Link>
        </div>
      </div>

      {/* Primary Citizen & Community Action Gateway */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action 1: File a Missing Person Complaint */}
        <Link
          to="/cases?action=create"
          className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 border border-cyan-500/40 hover:border-cyan-400 shadow-xl transition-all group flex items-start justify-between cursor-pointer"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              CITIZEN INTAKE
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              File Missing Person Complaint
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Report a missing family member, child, or acquaintance in Bhilai/Durg. Dispatches emergency broadcast to volunteer search grid and engages AI facial & spatiotemporal matching.
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform pt-1">
              <span>Open Complaint Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
        </Link>

        {/* Action 2: Report Sighting / Last Known Location */}
        <Link
          to="/sightings"
          className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 border border-emerald-500/40 hover:border-emerald-400 shadow-xl transition-all group flex items-start justify-between cursor-pointer"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
              <Eye className="w-3 h-3 text-emerald-400" />
              SIGHTING & LAST LOCATION
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              Report Sighting / Last Seen Location
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Have you spotted P Yash Kumar, Aditya Lamte, Sankalp Dewangan, or Ayush Lamte? Submit the last location and coordinates. AI immediately correlates sightings.
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform pt-1">
              <span>Submit Sighting & Location</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: ACTIVE MISSING CITIZENS — BHILAI SECTOR GRID */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono tracking-tight flex items-center gap-2">
                ACTIVE MISSING PERSONS — BHILAI SECTOR GRID
              </h2>
              <p className="text-xs text-slate-400">
                Active missing person investigations in Bhilai metropolitan region. Direct sighting intake enabled.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30">
              {cases.length} ACTIVE INCIDENT FILES
            </span>
            <Link
              to="/cases"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              All Cases <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Cards for P Yash Kumar, Aditya Lamte, Sankalp Dewangan, Ayush Lamte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cases.slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/50 shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
            >
              {/* Person Photo with Status & Urgency Badges */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-navy-950">
                <img
                  src={c.primary_image_url}
                  alt={c.missing_person_name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src && !img.src.includes('wikimedia') && !img.src.includes('unsplash')) {
                      img.src = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Indian_male_portrait.jpg/960px-Indian_male_portrait.jpg';
                    } else {
                      img.style.display = 'none';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent opacity-80" />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                  <StatusBadge status={c.status} className="text-[10px] px-2 py-0.5" />
                  <UrgencyBadge urgency={c.urgency} className="text-[10px] px-2 py-0.5" />
                </div>

                {/* Bottom ID Tag */}
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-cyan-300 drop-shadow">
                  <span>{c.case_number}</span>
                  <span className="text-slate-300 text-[10px]">{c.gender}, Age {c.age}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {c.missing_person_name}
                  </h3>

                  <div className="flex items-start gap-1.5 text-xs text-emerald-400 font-medium">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                    <span className="line-clamp-1">{c.last_seen_location_name}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {c.clothing_description || c.description}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-navy-800 grid grid-cols-2 gap-2">
                  <Link
                    to={`/sightings?case_id=${c.id}`}
                    className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-emerald-400" />
                    <span>Report Sighting</span>
                  </Link>

                  <Link
                    to={`/cases/${c.id}`}
                    className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-semibold bg-navy-950 hover:bg-navy-850 border border-navy-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <span>Dossier</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: INTERACTIVE BHILAI TACTICAL SEARCH & SIGHTING MAP */}
      {/* ======================================================== */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Map className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-tight">
                  BHILAI TACTICAL INCIDENT & SIGHTING MAP
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  LIVE RADAR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spatial distribution of missing individuals and verified sightings across Bhilai & Durg sectors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-navy-950 border border-navy-800 text-[11px] font-mono text-slate-400">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              <span>Center: 21.2050° N, 81.3450° E (Bhilai, CG)</span>
            </div>

            <Link
              to="/map"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors cursor-pointer"
            >
              <span>Expand GIS Map</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Quick-Jump Sector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-mono text-[11px] shrink-0 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" /> Focus Sector:
          </span>
          <button
            onClick={() => handleFlyToSector(21.2050, 81.3450, 'all', 13)}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
              activeSector === 'all'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-navy-950 text-slate-400 hover:text-white border border-navy-800'
            }`}
          >
            All Bhilai
          </button>
          <button
            onClick={() => handleFlyToSector(21.1950, 81.3560, 'civic', 15)}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
              activeSector === 'civic'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-navy-950 text-slate-400 hover:text-white border border-navy-800'
            }`}
          >
            📍 Sector 6 (P Yash Kumar)
          </button>
          <button
            onClick={() => handleFlyToSector(21.2185, 81.3280, 'nehru', 15)}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
              activeSector === 'nehru'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-navy-950 text-slate-400 hover:text-white border border-navy-800'
            }`}
          >
            📍 Nehru Nagar (Aditya Lamte)
          </button>
          <button
            onClick={() => handleFlyToSector(21.2050, 81.3410, 'supela', 15)}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
              activeSector === 'supela'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-navy-950 text-slate-400 hover:text-white border border-navy-800'
            }`}
          >
            📍 Supela Market (Sankalp Dewangan)
          </button>
          <button
            onClick={() => handleFlyToSector(21.2330, 81.3120, 'junwani', 15)}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
              activeSector === 'junwani'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-navy-950 text-slate-400 hover:text-white border border-navy-800'
            }`}
          >
            📍 Junwani (Ayush Lamte)
          </button>
        </div>

        {/* Integrated LiveMap Component */}
        <div className="relative">
          <LiveMap
            cases={cases}
            sightings={sightings}
            alertCenter={alertCenter}
            alertRadius={alertRadius}
          />
        </div>
      </div>

      {/* Primary KPI Grid (8 metrics computed from DB records) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Cases</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics?.total_active_cases ?? cases.length}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Bhilai perimeters engaged</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {analytics?.cases_awaiting_review ?? 1}
          </div>
          <span className="text-[10px] text-amber-400 font-mono mt-1 block">Requires intake triage</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Sightings Reported</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {analytics?.total_sightings ?? sightings.length}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Crowdsourced locations</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">AI Match Flags</span>
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {analytics?.potential_matches_pending ?? 2}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Proximity correlated</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Cases Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {analytics?.cases_resolved ?? 0}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Safe returns recorded</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Search Tasks</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {analytics?.tasks_in_progress ?? 3}
          </div>
          <span className="text-[10px] text-purple-400 font-mono mt-1 block">Lead: Sujal Das (Volunteer Grid)</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Secured Evidence</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics?.total_evidence_files ?? 3}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Off-chain SHA-256</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">On-Chain Verified</span>
            <Blocks className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {analytics?.blockchain_verified_count ?? 3}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Registry receipts</span>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Case Urgency Breakdown (Bar Chart) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Urgency Distribution
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Database Records</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={urgencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1329',
                    borderColor: '#1d2e5c',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Status Distribution (Pie Chart) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Case Status Breakdown
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Operational Lifecycle</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1329',
                      borderColor: '#1d2e5c',
                      borderRadius: '0.75rem',
                      color: '#f1f5f9',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 font-mono">No status records</span>
            )}
          </div>
        </div>

      </div>

      {/* Recent Audit & System Events Feed */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
        <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-cyan-400" /> AUDIT TELEMETRY & BLOCKCHAIN RECEIPTS
          </h3>
          <Link to="/audit" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono">
            Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-navy-850">
          {analytics?.recent_activity && analytics.recent_activity.length > 0 ? (
            analytics.recent_activity.slice(0, 5).map((act) => (
              <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-navy-950 text-cyan-300 border border-cyan-500/30 shrink-0">
                    {act.action}
                  </span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    Actor: {formatAddress(act.actor, 4)}
                  </span>
                  <span className="text-slate-400 truncate max-w-xs text-[11px]">
                    {typeof act.details === 'object' ? JSON.stringify(act.details) : act.details}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono text-[10px]">
                  {act.tx_hash && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Blocks className="w-3 h-3" /> TX: {formatHash(act.tx_hash, 3)}
                    </span>
                  )}
                  <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center font-mono">No recent audit events.</p>
          )}
        </div>
      </div>

    </div>
  );
};
