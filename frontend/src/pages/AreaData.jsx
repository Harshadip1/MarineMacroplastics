import React, { useState, useEffect } from 'react'
import { zonesAPI } from '../services/api'
import { Search, Filter, Download, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const AreaData = () => {
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [selectedArea, setSelectedArea] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    try {
      const response = await zonesAPI.getAll()
      setAreas(response.data.data)
    } catch (error) {
      setAreas([
        { id: 1, name: 'Mumbai Coast', location: 'Maharashtra', riskLevel: 'high', plasticAmount: 450, workers: 5, status: 'active', lastUpdated: '2024-01-15 14:30' },
        { id: 2, name: 'Goa Beach', location: 'Goa', riskLevel: 'medium', plasticAmount: 180, workers: 3, status: 'active', lastUpdated: '2024-01-15 12:15' },
        { id: 3, name: 'Kerala Shore', location: 'Kerala', riskLevel: 'low', plasticAmount: 75, workers: 2, status: 'active', lastUpdated: '2024-01-15 10:45' },
        { id: 4, name: 'Chennai Port', location: 'Tamil Nadu', riskLevel: 'high', plasticAmount: 320, workers: 4, status: 'critical', lastUpdated: '2024-01-15 08:20' },
        { id: 5, name: 'Puri Beach', location: 'Odisha', riskLevel: 'medium', plasticAmount: 150, workers: 3, status: 'active', lastUpdated: '2024-01-14 16:00' },
        { id: 6, name: 'Visakhapatnam', location: 'Andhra Pradesh', riskLevel: 'low', plasticAmount: 45, workers: 2, status: 'inactive', lastUpdated: '2024-01-14 09:30' },
        { id: 7, name: 'Gujarat Coast', location: 'Gujarat', riskLevel: 'high', plasticAmount: 380, workers: 6, status: 'active', lastUpdated: '2024-01-15 11:45' },
        { id: 8, name: 'Karnataka Beach', location: 'Karnataka', riskLevel: 'medium', plasticAmount: 220, workers: 4, status: 'active', lastUpdated: '2024-01-15 13:20' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getRiskBg = (level) => {
    switch (level) {
      case 'high': return 'bg-red-50 border-red-200'
      case 'medium': return 'bg-yellow-50 border-yellow-200'
      case 'low': return 'bg-green-50 border-green-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high': return <AlertTriangle size={16} />
      case 'medium': return <Clock size={16} />
      case 'low': return <CheckCircle size={16} />
      default: return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAreas = areas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterLevel === 'all' || area.riskLevel === filterLevel
    return matchesSearch && matchesFilter
  })

  const handleExport = () => {
    const csvContent = [
      ['Area Name', 'Location', 'Risk Level', 'Plastic Amount (kg)', 'Workers', 'Status', 'Last Updated'],
      ...filteredAreas.map(area => [
        area.name, area.location, area.riskLevel, area.plasticAmount, area.workers, area.status, area.lastUpdated
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'area-data.csv'
    a.click()
  }

  const stats = {
    total: areas.length,
    high: areas.filter(a => a.riskLevel === 'high').length,
    medium: areas.filter(a => a.riskLevel === 'medium').length,
    low: areas.filter(a => a.riskLevel === 'low').length,
    totalPlastic: areas.reduce((sum, a) => sum + a.plasticAmount, 0),
    totalWorkers: areas.reduce((sum, a) => sum + a.workers, 0),
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Area Data Management</h1>
        <p className="text-gray-600">Manage and monitor all coastal areas with detailed analytics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className={`card p-4 text-center border-l-4 border-blue-500`}>
          <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
          <p className="text-sm text-gray-600">Total Areas</p>
        </div>
        <div className={`card p-4 text-center border-l-4 border-red-500`}>
          <h3 className="text-2xl font-bold text-red-600">{stats.high}</h3>
          <p className="text-sm text-gray-600">High Risk</p>
        </div>
        <div className={`card p-4 text-center border-l-4 border-yellow-500`}>
          <h3 className="text-2xl font-bold text-yellow-600">{stats.medium}</h3>
          <p className="text-sm text-gray-600">Medium Risk</p>
        </div>
        <div className={`card p-4 text-center border-l-4 border-green-500`}>
          <h3 className="text-2xl font-bold text-green-600">{stats.low}</h3>
          <p className="text-sm text-gray-600">Low Risk</p>
        </div>
        <div className={`card p-4 text-center border-l-4 border-purple-500`}>
          <h3 className="text-2xl font-bold text-purple-600">{stats.totalPlastic}</h3>
          <p className="text-sm text-gray-600">Total Plastic (kg)</p>
        </div>
        <div className={`card p-4 text-center border-l-4 border-indigo-500`}>
          <h3 className="text-2xl font-bold text-indigo-600">{stats.totalWorkers}</h3>
          <p className="text-sm text-gray-600">Active Workers</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={20} />
              Export CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Area
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Area Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Risk Level</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Plastic (kg)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Workers</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Last Updated</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAreas.map((area) => (
                <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        area.riskLevel === 'high' ? 'bg-red-500' :
                        area.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <span className="font-medium text-gray-800">{area.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{area.location}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(area.riskLevel)}`}>
                      {getRiskIcon(area.riskLevel)}
                      {area.riskLevel.charAt(0).toUpperCase() + area.riskLevel.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className={`font-semibold ${
                      area.plasticAmount > 300 ? 'text-red-600' :
                      area.plasticAmount > 100 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {area.plasticAmount} kg
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{area.workers}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(area.status)}`}>
                      {area.status.charAt(0).toUpperCase() + area.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{area.lastUpdated}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedArea(area)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAreas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No areas found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Color Coding Legend */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Color Coding System</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-red-800">High Risk (Red)</h4>
              <p className="text-sm text-red-600">Plastic &gt; 300kg - Immediate action required</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <Clock size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800">Medium Risk (Yellow)</h4>
              <p className="text-sm text-yellow-600">Plastic 100-300kg - Under monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-800">Low Risk (Green)</h4>
              <p className="text-sm text-green-600">Plastic &lt; 100kg - Normal conditions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AreaData
