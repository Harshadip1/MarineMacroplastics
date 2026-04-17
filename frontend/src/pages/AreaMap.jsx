import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { zonesAPI } from '../services/api'
import { AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react'

// Custom icons for different risk levels
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 15px ${color}80;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">⚠</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

const AreaMap = () => {
  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    try {
      const response = await zonesAPI.getAll()
      setAreas(response.data.data)
    } catch (error) {
      // Mock data if API fails
      setAreas([
        { id: 1, name: 'Mumbai Coast', lat: 19.0760, lng: 72.8777, riskLevel: 'high', plasticAmount: 450, lastUpdated: '2 hours ago', description: 'High plastic concentration detected' },
        { id: 2, name: 'Goa Beach', lat: 15.2993, lng: 74.1240, riskLevel: 'medium', plasticAmount: 180, lastUpdated: '4 hours ago', description: 'Moderate pollution levels' },
        { id: 3, name: 'Kerala Shore', lat: 10.8505, lng: 76.2711, riskLevel: 'low', plasticAmount: 75, lastUpdated: '6 hours ago', description: 'Low pollution, monitoring required' },
        { id: 4, name: 'Chennai Port', lat: 13.0827, lng: 80.2707, riskLevel: 'high', plasticAmount: 320, lastUpdated: '8 hours ago', description: 'Critical pollution levels' },
        { id: 5, name: 'Puri Beach', lat: 19.8135, lng: 85.8312, riskLevel: 'medium', plasticAmount: 150, lastUpdated: '12 hours ago', description: 'Moderate pollution detected' },
        { id: 6, name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, riskLevel: 'low', plasticAmount: 45, lastUpdated: '1 day ago', description: 'Minimal pollution levels' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getRiskBgColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high': return <AlertTriangle size={16} />
      case 'medium': return <Clock size={16} />
      case 'low': return <CheckCircle size={16} />
      default: return <MapPin size={16} />
    }
  }

  const center = [15.2993, 74.1240] // Center of India

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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Area Map</h1>
        <p className="text-gray-600">Visual representation of plastic pollution across coastal areas</p>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Risk Level Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md"></div>
            <span className="text-sm text-gray-600">High Risk (&gt;300kg plastic)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-md"></div>
            <span className="text-sm text-gray-600">Medium Risk (100-300kg)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-md"></div>
            <span className="text-sm text-gray-600">Low Risk (&lt;100kg)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 card overflow-hidden" style={{ height: '600px' }}>
          <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {areas.map((area) => (
              <React.Fragment key={area.id}>
                <Circle
                  center={[area.lat, area.lng]}
                  radius={area.plasticAmount * 50}
                  pathOptions={{
                    color: getRiskColor(area.riskLevel),
                    fillColor: getRiskColor(area.riskLevel),
                    fillOpacity: 0.3,
                    weight: 2,
                  }}
                />
                <Marker
                  position={[area.lat, area.lng]}
                  icon={createCustomIcon(getRiskColor(area.riskLevel))}
                  eventHandlers={{
                    click: () => setSelectedArea(area),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-gray-800 mb-2">{area.name}</h3>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white mb-2 ${getRiskBgColor(area.riskLevel)}`}>
                        {getRiskIcon(area.riskLevel)}
                        {area.riskLevel.toUpperCase()} RISK
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Plastic:</strong> {area.plasticAmount} kg
                      </p>
                      <p className="text-sm text-gray-500">{area.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Updated: {area.lastUpdated}</p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>

        {/* Area List */}
        <div className="card p-6 max-h-[600px] overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Area Details</h3>
          <div className="space-y-4">
            {areas.map((area) => (
              <div
                key={area.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedArea?.id === area.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedArea(area)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{area.name}</h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getRiskBgColor(area.riskLevel)}`}>
                    {getRiskIcon(area.riskLevel)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getRiskBgColor(area.riskLevel)}`}></div>
                    {area.plasticAmount} kg
                  </span>
                  <span>{area.lastUpdated}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-red-600">{areas.filter(a => a.riskLevel === 'high').length}</h3>
          <p className="text-gray-600">High Risk Areas</p>
          <p className="text-sm text-gray-500 mt-1">Require immediate attention</p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Clock className="text-yellow-600" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-yellow-600">{areas.filter(a => a.riskLevel === 'medium').length}</h3>
          <p className="text-gray-600">Medium Risk Areas</p>
          <p className="text-sm text-gray-500 mt-1">Under monitoring</p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-green-600">{areas.filter(a => a.riskLevel === 'low').length}</h3>
          <p className="text-gray-600">Low Risk Areas</p>
          <p className="text-sm text-gray-500 mt-1">Normal conditions</p>
        </div>
      </div>
    </div>
  )
}

export default AreaMap
