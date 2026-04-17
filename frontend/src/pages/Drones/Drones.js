import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Drones = () => {
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrones();
    const interval = setInterval(fetchDrones, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchDrones = async () => {
    try {
      const response = await axios.get(`${API_URL}/drone`);
      setDrones(response.data.data);
    } catch (error) {
      console.error('Error fetching drones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      idle: 'bg-green-100 text-green-800',
      flying: 'bg-blue-100 text-blue-800',
      charging: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-orange-100 text-orange-800',
      offline: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBatteryColor = (level) => {
    if (level > 60) return 'bg-green-500';
    if (level > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drone Fleet</h1>
          <p className="text-gray-600">Monitor and manage all drone operations</p>
        </div>
        <button 
          onClick={fetchDrones}
          className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
        >
          Refresh Status
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Total Drones</p>
          <p className="text-2xl font-bold">{drones.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {drones.filter(d => d.status === 'idle' && d.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Flying</p>
          <p className="text-2xl font-bold text-blue-600">
            {drones.filter(d => d.status === 'flying').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Charging</p>
          <p className="text-2xl font-bold text-yellow-600">
            {drones.filter(d => d.status === 'charging').length}
          </p>
        </div>
      </div>

      {/* Drones Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drones.map((drone) => (
            <div key={drone._id} className="bg-white rounded-xl shadow-sm p-6 card-hover">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{drone.name}</h3>
                  <p className="text-sm text-gray-500">{drone.droneId}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(drone.status)}`}>
                  {drone.status}
                </span>
              </div>

              {/* Battery */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Battery</span>
                  <span className="font-medium">{drone.batteryLevel}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getBatteryColor(drone.batteryLevel)}`}
                    style={{ width: `${drone.batteryLevel}%` }}
                  ></div>
                </div>
              </div>

              {/* Location */}
              <div className="text-sm text-gray-600 mb-4">
                <p>Location: {drone.currentLocation.coordinates[1].toFixed(4)}, {drone.currentLocation.coordinates[0].toFixed(4)}</p>
                <p className="text-xs mt-1">Last ping: {new Date(drone.lastPing).toLocaleTimeString()}</p>
              </div>

              {/* Current Mission */}
              {drone.currentMission && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-blue-900">Active Mission</p>
                  <p className="text-xs text-blue-700">Progress: {drone.currentMission.progress}%</p>
                  <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${drone.currentMission.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-sm border-t pt-4">
                <div>
                  <p className="font-semibold">{drone.stats.totalFlights}</p>
                  <p className="text-gray-500 text-xs">Flights</p>
                </div>
                <div>
                  <p className="font-semibold">{drone.stats.totalVerifications}</p>
                  <p className="text-gray-500 text-xs">Verifications</p>
                </div>
                <div>
                  <p className="font-semibold">{drone.specifications.maxFlightTime}m</p>
                  <p className="text-gray-500 text-xs">Flight Time</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Drones;
