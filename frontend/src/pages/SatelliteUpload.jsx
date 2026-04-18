import React, { useState } from 'react'
import { Upload, MapPin, Satellite, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const SatelliteUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [serverStatus, setServerStatus] = useState('checking')
  const [formData, setFormData] = useState({
    latitude: '19.0760',
    longitude: '72.8777',
    altitude: '400000',
    accuracy: '10',
    satelliteId: 'SAT-001',
    resolution: '0.5',
    cloudCover: '10',
    sensorType: 'optical'
  })

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.size <= 50 * 1024 * 1024) {
      setSelectedFile(file)
    } else {
      alert('File size too large. Maximum size is 50MB')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('dragover')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('dragover')
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.size <= 50 * 1024 * 1024) {
        setSelectedFile(file)
      } else {
        alert('File size too large. Maximum size is 50MB')
      }
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const setQuickLocation = (location) => {
    const locations = {
      mumbai: { lat: '19.0760', lng: '72.8777' },
      goa: { lat: '15.2993', lng: '74.1240' },
      kerala: { lat: '10.8505', lng: '76.2711' },
      chennai: { lat: '13.0827', lng: '80.2707' }
    }
    
    if (locations[location]) {
      setFormData({
        ...formData,
        latitude: locations[location].lat,
        longitude: locations[location].lng
      })
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select an image file')
      return
    }

    if (!formData.latitude || !formData.longitude) {
      alert('Please provide latitude and longitude')
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('image', selectedFile)
      
      const locationData = {
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude),
        altitude: parseFloat(formData.altitude) || 400000,
        accuracy: parseFloat(formData.accuracy) || 10,
        timestamp: new Date().toISOString()
      }
      formDataToSend.append('location', JSON.stringify(locationData))

      const metadata = {
        satelliteId: formData.satelliteId || 'SAT-001',
        captureTime: new Date().toISOString(),
        resolution: parseFloat(formData.resolution) || 0.5,
        cloudCover: parseFloat(formData.cloudCover) || 10,
        sensorType: formData.sensorType || 'optical'
      }
      formDataToSend.append('metadata', JSON.stringify(metadata))

      const response = await fetch('http://localhost:6000/api/satellite/upload', {
        method: 'POST',
        body: formDataToSend,
        mode: 'cors',
        credentials: 'omit'
      })

      const result = await response.json()

      if (result.success) {
        setUploadResult({
          success: true,
          data: result.data
        })
        setSelectedFile(null)
        // Reset file input
        document.getElementById('fileInput').value = ''
      } else {
        setUploadResult({
          success: false,
          message: result.message
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      let errorMessage = 'Upload failed'
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to satellite server. Please ensure the satellite server is running on http://localhost:6000'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setUploadResult({
        success: false,
        message: errorMessage
      })
    } finally {
      setUploading(false)
    }
  }

  // Check satellite server status
  React.useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:6000/test', {
          mode: 'cors',
          credentials: 'omit'
        })
        if (response.ok) {
          setServerStatus('online')
        } else {
          setServerStatus('offline')
        }
      } catch (error) {
        setServerStatus('offline')
      }
    }

    checkServerStatus()
    const interval = setInterval(checkServerStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Satellite className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Satellite Upload</h1>
                <p className="text-gray-600">Upload satellite images for AI-powered plastic detection</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              serverStatus === 'online' 
                ? 'bg-green-100 text-green-800' 
                : serverStatus === 'checking'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {serverStatus === 'online' ? '🟢 Server Online' : 
               serverStatus === 'checking' ? '🟡 Checking...' : '🔴 Server Offline'}
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div 
            className={`border-3 border-dashed border-blue-300 rounded-lg p-12 text-center cursor-pointer transition-all ${
              selectedFile ? 'border-green-400 bg-green-50' : 'hover:border-blue-400 hover:bg-blue-50'
            }`}
            onClick={() => document.getElementById('fileInput').click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-800 mb-2">
                  File Selected: {selectedFile.name}
                </div>
                <div className="text-sm text-gray-600">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-800 mb-2">
                  Click to select satellite image or drag & drop
                </div>
                <div className="text-sm text-gray-600">
                  Supports: JPEG, PNG, TIFF (Max 50MB)
                </div>
              </>
            )}
            <input
              id="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/tiff"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Location Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="0.0001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="19.0760"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="0.0001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="72.8777"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Altitude (meters)
              </label>
              <input
                type="number"
                name="altitude"
                value={formData.altitude}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="400000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accuracy (meters)
              </label>
              <input
                type="number"
                name="accuracy"
                value={formData.accuracy}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10"
              />
            </div>
          </div>

          {/* Quick Location Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickLocation('mumbai')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              Mumbai Coast
            </button>
            <button
              onClick={() => setQuickLocation('goa')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              Goa Beach
            </button>
            <button
              onClick={() => setQuickLocation('kerala')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              Kerala Shore
            </button>
            <button
              onClick={() => setQuickLocation('chennai')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              Chennai Port
            </button>
          </div>
        </div>

        {/* Satellite Metadata */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Satellite className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Satellite Metadata</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satellite ID
              </label>
              <input
                type="text"
                name="satelliteId"
                value={formData.satelliteId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SAT-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution (meters/pixel)
              </label>
              <input
                type="number"
                name="resolution"
                value={formData.resolution}
                onChange={handleInputChange}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cloud Cover (%)
              </label>
              <input
                type="number"
                name="cloudCover"
                value={formData.cloudCover}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sensor Type
              </label>
              <input
                type="text"
                name="sensorType"
                value={formData.sensorType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="optical"
              />
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
              uploading || !selectedFile
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 animate-spin" />
                <span>Processing satellite image with AI...</span>
              </div>
            ) : (
              'Upload & Process Image'
            )}
          </button>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`rounded-xl p-6 ${
            uploadResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              {uploadResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className={`text-lg font-semibold ${
                uploadResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
              </h3>
            </div>
            
            {uploadResult.success && uploadResult.data ? (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Image ID:</span>
                  <span className="text-gray-900">{uploadResult.data.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Location:</span>
                  <span className="text-gray-900">
                    {uploadResult.data.location.lat.toFixed(4)}, {uploadResult.data.location.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Plastic Detected:</span>
                  <span className="text-gray-900 font-semibold">
                    {uploadResult.data.detectionResults.totalPlasticAmount} kg
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Risk Level:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    uploadResult.data.detectionResults.riskLevel === 'high' 
                      ? 'bg-red-100 text-red-800'
                      : uploadResult.data.detectionResults.riskLevel === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {uploadResult.data.detectionResults.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Confidence:</span>
                  <span className="text-gray-900">
                    {(uploadResult.data.detectionResults.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="text-green-600 font-medium">Sent to Dashboard</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a 
                    href="/dashboard" 
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    🎯 View in Dashboard
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-red-800">
                <p className="font-medium">Error:</p>
                <p>{uploadResult.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SatelliteUpload
