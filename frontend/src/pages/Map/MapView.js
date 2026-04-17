import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Custom marker icons
const createMarkerIcon = (density, status) => {
  const colors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626'
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      background-color: ${colors[density] || colors.medium};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ${status === 'in_progress' ? 'animation: pulse 2s infinite;' : ''}
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Map bounds updater component
const MapBounds = ({ onBoundsChange }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleMove = () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    };
    
    map.on('moveend', handleMove);
    handleMove(); // Initial bounds
    
    return () => map.off('moveend', handleMove);
  }, [map, onBoundsChange]);
  
  return null;
};

const MapView = () => {
  const [detections, setDetections] = useState([]);
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    density: 'all',
    status: 'all',
    showDrones: true
  });
  const [selectedDetection, setSelectedDetection] = useState(null);

  // Default center (San Francisco Bay)
  const defaultCenter = [37.7749, -122.4194];
  const defaultZoom = 11;

  // Fetch map data
  const fetchMapData = useCallback(async (bounds = null) => {
    try {
      const params = new URLSearchParams();
      if (bounds) {
        params.append('bounds', [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ].join(','));
      }
      if (filters.density !== 'all') params.append('density', filters.density);
      if (filters.status !== 'all') params.append('status', filters.status);

      const [detectionsRes, dronesRes] = await Promise.all([
        axios.get(`${API_URL}/detection/map/data?${params}`),
        axios.get(`${API_URL}/drone`)
      ]);

      setDetections(detectionsRes.data.data);
      setDrones(dronesRes.data.data);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMapData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMapData, 30000);
    return () => clearInterval(interval);
  }, [fetchMapData]);

  const handleTriggerDrone = async (detectionId) => {
    try {
      await axios.post(`${API_URL}/drone/trigger`, {
        detectionId,
        priority: 'high'
      });
      alert('Drone dispatched successfully!');
    } catch (error) {
      alert('Failed to dispatch drone: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredDetections = detections.filter(d => {
    if (filters.density !== 'all' && d.density !== filters.density) return false;
    if (filters.status !== 'all' && d.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="p-6 flex gap-6 min-h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-white rounded-xl shadow-sm p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Map Filters</h2>
        
        {/* Density Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Density Level</label>
          <select
            value={filters.density}
            onChange={(e) => setFilters({ ...filters, density: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500"
          >
            <option value="all">All Densities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500"
          >
            <option value="all">All Statuses</option>
            <option value="detected">Detected</option>
            <option value="drone_verified">Drone Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="collected">Collected</option>
          </select>
        </div>

        {/* Show Drones Toggle */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.showDrones}
              onChange={(e) => setFilters({ ...filters, showDrones: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Show Drones</span>
          </label>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm">Low Density</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm">Medium Density</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm">High Density</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 mr-2" style={{ transform: 'rotate(45deg)' }}></div>
              <span className="text-sm">Drone</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Visible Zones</h3>
          <p className="text-2xl font-bold text-ocean-600">{filteredDetections.length}</p>
          <p className="text-xs text-gray-500">plastic detection zones</p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 200px)' }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBounds onBoundsChange={fetchMapData} />

          {/* Detection Markers */}
          {filteredDetections.map((detection) => (
            <Marker
              key={detection.id}
              position={[detection.coordinates[1], detection.coordinates[0]]}
              icon={createMarkerIcon(detection.density, detection.status)}
              eventHandlers={{
                click: () => setSelectedDetection(detection)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Plastic Detection
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Density:</strong> <span className={`density-${detection.density}`}>{detection.density}</span></p>
                    <p><strong>Confidence:</strong> {(detection.confidence * 100).toFixed(1)}%</p>
                    <p><strong>Status:</strong> {detection.status.replace('_', ' ')}</p>
                    <p><strong>Coordinates:</strong> {detection.coordinates[1].toFixed(4)}, {detection.coordinates[0].toFixed(4)}</p>
                  </div>
                  
                  {!detection.droneVerified && detection.status === 'detected' && (
                    <button
                      onClick={() => handleTriggerDrone(detection.id)}
                      className="mt-3 w-full px-3 py-2 bg-ocean-600 text-white text-sm rounded hover:bg-ocean-700 transition-colors"
                    >
                      Deploy Drone
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Drone Markers */}
          {filters.showDrones && drones.filter(d => d.isActive).map((drone) => (
            <Marker
              key={drone._id}
              position={[
                drone.currentLocation.coordinates[1],
                drone.currentLocation.coordinates[0]
              ]}
              icon={L.divIcon({
                className: 'drone-marker',
                html: `<div style="
                  width: 16px;
                  height: 16px;
                  background-color: #3b82f6;
                  border: 2px solid white;
                  transform: rotate(45deg);
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{drone.name}</h3>
                  <p className="text-sm text-gray-600">ID: {drone.droneId}</p>
                  <p className="text-sm">Status: <span className={`status-${drone.status}`}>{drone.status}</span></p>
                  <p className="text-sm">Battery: {drone.batteryLevel}%</p>
                  {drone.currentMission && (
                    <p className="text-sm text-ocean-600">On Mission</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
