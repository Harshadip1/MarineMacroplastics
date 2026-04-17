import React, { useEffect, useState } from 'react'
import { dashboardAPI, zonesAPI, workersAPI, detectionsAPI } from '../services/api'
import { MapPin, TrendingUp, Users, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAreas: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    totalPlastic: 0,
    activeWorkers: 0,
    recentDetections: []
  })

  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [dashboardRes, zonesRes, workersRes, detectionsRes, trendsRes] = await Promise.all([
        dashboardAPI.getStats().catch(() => null),
        zonesAPI.getAll().catch(() => null),
        workersAPI.getAll().catch(() => null),
        detectionsAPI.getAll({ limit: 5 }).catch(() => null),
        dashboardAPI.getTrends('6months').catch(() => null)
      ])

      // Calculate stats from real data
      const zones = zonesRes?.data?.data || []
      const workers = workersRes?.data?.data || []
      const detections = detectionsRes?.data?.data || []
      const trends = trendsRes?.data?.data || []

      const highRisk = zones.filter(z => z.riskLevel === 'high' || z.plasticAmount > 300).length
      const mediumRisk = zones.filter(z => z.riskLevel === 'medium' || (z.plasticAmount > 100 && z.plasticAmount <= 300)).length
      const lowRisk = zones.filter(z => z.riskLevel === 'low' || z.plasticAmount <= 100).length
      const totalPlastic = zones.reduce((sum, z) => sum + (z.plasticAmount || 0), 0)

      setStats({
        totalAreas: zones.length,
        highRisk,
        mediumRisk,
        lowRisk,
        totalPlastic: totalPlastic.toLocaleString(),
        activeWorkers: workers.length,
        recentDetections: detections
      })

      // Set monthly chart data from trends
      if (trends.length > 0) {
        setMonthlyData(trends)
      } else {
        // Fallback to default data
        setMonthlyData([
          { month: 'Jan', plastic: 120, collections: 45 },
          { month: 'Feb', plastic: 180, collections: 60 },
          { month: 'Mar', plastic: 150, collections: 55 },
          { month: 'Apr', plastic: 220, collections: 80 },
          { month: 'May', plastic: 280, collections: 95 },
          { month: 'Jun', plastic: 250, collections: 85 },
        ])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const areaData = [
    { name: 'High Risk', value: stats.highRisk || 8, color: '#ef4444' },
    { name: 'Medium Risk', value: stats.mediumRisk || 10, color: '#f59e0b' },
    { name: 'Low Risk', value: stats.lowRisk || 6, color: '#10b981' },
  ]

  const recentAreas = [
    { id: 1, name: 'Mumbai Coast', level: 'high', plastic: 450, lastUpdated: '2 hours ago' },
    { id: 2, name: 'Goa Beach', level: 'medium', plastic: 180, lastUpdated: '4 hours ago' },
    { id: 3, name: 'Kerala Shore', level: 'low', plastic: 75, lastUpdated: '6 hours ago' },
    { id: 4, name: 'Chennai Port', level: 'high', plastic: 320, lastUpdated: '8 hours ago' },
  ]

  const getLevelColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getLevelIcon = (level) => {
    switch (level) {
      case 'high': return <AlertTriangle size={16} />
      case 'medium': return <Clock size={16} />
      case 'low': return <CheckCircle size={16} />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor marine plastic pollution across all areas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Areas</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalAreas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <TrendingUp size={16} className="text-green-500 mr-1" />
            <span>+12% from last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Plastic (kg)</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalPlastic}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="text-red-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span className="text-red-500 font-medium">{stats.highRisk} high risk areas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Workers</p>
              <p className="text-3xl font-bold text-gray-800">{stats.activeWorkers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span>Currently deployed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Risk Distribution</p>
              <div className="flex gap-2 mt-1">
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">{stats.highRisk} High</span>
                <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">{stats.mediumRisk} Med</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Plastic Collection Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Bar dataKey="plastic" fill="#ef4444" name="Plastic Detected (kg)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collections" fill="#10b981" name="Collections (kg)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Area Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={areaData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {areaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {areaData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Areas Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Recent Area Updates</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Area Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Risk Level</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Plastic (kg)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Last Updated</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentAreas.map((area) => (
                <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{area.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(area.level)}`}>
                      {getLevelIcon(area.level)}
                      {area.level.charAt(0).toUpperCase() + area.level.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{area.plastic} kg</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{area.lastUpdated}</td>
                  <td className="px-6 py-4">
                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${
                      area.level === 'high' ? 'bg-red-500 animate-pulse' :
                      area.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></span>
                    <span className="text-sm text-gray-600">
                      {area.level === 'high' ? 'Action Required' :
                       area.level === 'medium' ? 'Monitoring' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
