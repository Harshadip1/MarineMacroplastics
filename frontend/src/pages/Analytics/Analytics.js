import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [dashboardRes, trendsRes, zonesRes, typesRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/dashboard`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/analytics/trends`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/analytics/zones`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/analytics/plastic-types`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setData({
        dashboard: dashboardRes.data.data,
        trends: trendsRes.data.data,
        zones: zonesRes.data.data,
        plasticTypes: typesRes.data.data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed insights and performance metrics</p>
        </div>
        <button 
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Detections</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data?.dashboard?.overview?.totalDetections || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data?.dashboard?.overview?.plasticDetections || 0} with plastic
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-600">Collection Rate</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {data?.dashboard?.overview?.collectionRate || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data?.dashboard?.overview?.collectedCount || 0} collected
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Weight</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {(data?.dashboard?.overview?.totalWeight || 0).toFixed(1)} kg
          </p>
          <p className="text-xs text-gray-500 mt-1">Plastic collected</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-600">Active Workers</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data?.dashboard?.overview?.totalWorkers || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data?.dashboard?.overview?.totalZones || 0} zones
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 7 Days)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">New Detections</p>
            <p className="text-2xl font-bold text-blue-600">
              {data?.dashboard?.recentActivity?.detectionsLast7Days || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Collections Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {data?.dashboard?.recentActivity?.collectionsLast7Days || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Zone Performance */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Zone Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Detections</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">High Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.zones?.map((zone) => (
                <tr key={zone._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {zone.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {zone.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zone.totalDetections}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zone.highPriorityDetections}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zone.collected}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plastic Types Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plastic Types Collected</h3>
        <div className="space-y-3">
          {data?.plasticTypes?.map((type) => (
            <div key={type._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-ocean-500 rounded-full mr-3"></div>
                <span className="font-medium text-gray-900">{type._id}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{type.count} items</p>
                <p className="text-sm text-gray-500">{type.totalWeight.toFixed(1)} kg</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
