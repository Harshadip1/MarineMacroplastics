import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, detectionsRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/dashboard`),
        axios.get(`${API_URL}/detection?limit=5&plasticDetected=true`)
      ]);

      setStats(statsRes.data.data);
      setRecentDetections(detectionsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for offline mode
      setStats({
        overview: {
          totalDetections: 156,
          plasticDetections: 142,
          collectedCount: 67,
          collectionRate: '42.7',
          totalWeight: 2345.6,
          totalWorkers: 3,
          totalZones: 2
        },
        recentActivity: {
          detectionsLast7Days: 23,
          collectionsLast7Days: 8
        }
      });
      setRecentDetections([
        {
          _id: 'det_001',
          location: { coordinates: [-122.4194, 37.7749] },
          detectionResult: { density: 'high', confidence: 0.87 },
          priority: 'high',
          status: 'detected',
          createdAt: new Date()
        },
        {
          _id: 'det_002',
          location: { coordinates: [-122.4094, 37.7649] },
          detectionResult: { density: 'medium', confidence: 0.72 },
          priority: 'medium',
          status: 'drone_verified',
          createdAt: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
        </div>
      </div>
    );
  }

  const priorityChartData = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [{
      data: [15, 25, 35, 25],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#dc2626'],
      borderWidth: 0,
      borderRadius: 8
    }]
  };

  const statusChartData = {
    labels: ['Detected', 'Verified', 'In Progress', 'Collected'],
    datasets: [{
      label: 'Detections',
      data: [45, 23, 18, 67],
      backgroundColor: '#3b82f6',
      borderRadius: 8
    }]
  };

  const trendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Detections',
        data: [12, 19, 15, 25, 22, 30, 28],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Collections',
        data: [5, 8, 6, 12, 10, 15, 13],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ]
  };

  const StatCard = ({ title, value, subtitle, color, icon, trend }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${trend.color}`}>{trend.value}</span>
              <span className="text-xs text-slate-500 ml-1">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md p-4 border border-slate-200 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 ${color}`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Hero Header - Top Section */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-4 lg:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">Marine Protection Dashboard</h1>
            <p className="text-blue-100 text-base lg:text-lg mb-4">Real-time monitoring and collection system for ocean plastic detection</p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">System Online</span>
              </div>
              <div className="text-sm text-blue-100">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg self-start"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 lg:p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Detections"
          value={stats?.overview?.totalDetections || 156}
          subtitle={`${stats?.overview?.plasticDetections || 142} with plastic detected`}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
          trend={{ value: '+12%', color: 'text-green-600', label: 'vs last week' }}
        />
        <StatCard
          title="Collected & Verified"
          value={stats?.overview?.collectedCount || 67}
          subtitle={`${stats?.overview?.collectionRate || '42.7'}% collection rate`}
          color="bg-gradient-to-br from-green-500 to-green-600"
          icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          trend={{ value: '+8%', color: 'text-green-600', label: 'vs last week' }}
        />
        <StatCard
          title="Total Weight"
          value={`${(stats?.overview?.totalWeight || 2345.6).toFixed(1)} kg`}
          subtitle="Plastic collected"
          color="bg-gradient-to-br from-yellow-500 to-orange-500"
          icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2" /></svg>}
          trend={{ value: '+15%', color: 'text-green-600', label: 'vs last week' }}
        />
        <StatCard
          title="Active Workers"
          value={stats?.overview?.totalWorkers || 3}
          subtitle={`${stats?.overview?.totalZones || 2} zones covered`}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          trend={{ value: '100%', color: 'text-green-600', label: 'active rate' }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          title="New Detection"
          description="Report plastic sighting"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
          color="hover:bg-blue-50"
          onClick={() => console.log('New Detection')}
        />
        <QuickAction
          title="Deploy Drone"
          description="Send drone to location"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
          color="hover:bg-green-50"
          onClick={() => console.log('Deploy Drone')}
        />
        <QuickAction
          title="Assign Task"
          description="Create collection task"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          color="hover:bg-purple-50"
          onClick={() => console.log('Assign Task')}
        />
        <QuickAction
          title="Generate Report"
          description="Export analytics data"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m3 0h6" /></svg>}
          color="hover:bg-orange-50"
          onClick={() => console.log('Generate Report')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Priority Distribution</h3>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <div className="h-64">
            <Doughnut 
              data={priorityChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: {
                      padding: 15,
                      font: { size: 11 }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Status Breakdown</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="h-64">
            <Bar 
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Weekly Trend</h3>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
          <div className="h-64">
            <Line 
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: {
                      padding: 10,
                      font: { size: 10 }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Detections</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Density</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDetections.map((detection) => (
                <tr key={detection._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {detection.location.coordinates[1].toFixed(4)}, {detection.location.coordinates[0].toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      detection.detectionResult.density === 'high' ? 'bg-red-100 text-red-800' :
                      detection.detectionResult.density === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {detection.detectionResult.density}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(detection.detectionResult.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      detection.priority === 'high' ? 'bg-red-100 text-red-800' :
                      detection.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {detection.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      detection.status === 'detected' ? 'bg-blue-100 text-blue-800' :
                      detection.status === 'drone_verified' ? 'bg-purple-100 text-purple-800' :
                      detection.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {detection.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(detection.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
