package com.oceanguard.marineplastic.data.model

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val phone: String?,
    @SerializedName("currentLocation")
    val currentLocation: Location?,
    @SerializedName("assignedZone")
    val assignedZone: Zone?,
    val stats: WorkerStats?
)

data class Location(
    val type: String,
    val coordinates: List<Double> // [longitude, latitude]
) {
    fun getLongitude(): Double = coordinates[0]
    fun getLatitude(): Double = coordinates[1]
}

data class Zone(
    val id: String,
    val name: String,
    val code: String
)

data class WorkerStats(
    @SerializedName("totalCollections")
    val totalCollections: Int = 0,
    @SerializedName("totalWeight")
    val totalWeight: Double = 0.0,
    @SerializedName("tasksCompleted")
    val tasksCompleted: Int = 0,
    @SerializedName("tasksAssigned")
    val tasksAssigned: Int = 0
)

data class Task(
    val id: String,
    @SerializedName("taskId")
    val taskId: String,
    val detection: DetectionSummary?,
    val title: String,
    val description: String?,
    val priority: String, // low, medium, high, critical
    val location: Location,
    @SerializedName("location.address")
    val address: String?,
    val status: String, // pending, accepted, in_progress, paused, completed, verified, rejected
    @SerializedName("assignedTo")
    val assignedTo: String,
    @SerializedName("assignedAt")
    val assignedAt: String,
    @SerializedName("scheduledDate")
    val scheduledDate: String,
    @SerializedName("dueDate")
    val dueDate: String?,
    @SerializedName("startedAt")
    val startedAt: String?,
    @SerializedName("completedAt")
    val completedAt: String?,
    @SerializedName("estimatedWeight")
    val estimatedWeight: Double?,
    @SerializedName("estimatedTime")
    val estimatedTime: Double?, // in hours
    @SerializedName("collectionData")
    val collectionData: CollectionData?
)

data class DetectionSummary(
    val id: String,
    val location: Location,
    @SerializedName("detectionResult")
    val detectionResult: DetectionResult
)

data class Detection(
    val id: String,
    val location: Location,
    @SerializedName("satelliteImage")
    val satelliteImage: SatelliteImage?,
    @SerializedName("detectionResult")
    val detectionResult: DetectionResult,
    val priority: String,
    val status: String,
    @SerializedName("droneVerification")
    val droneVerification: DroneVerification?,
    @SerializedName("assignedTo")
    val assignedTo: User?,
    @SerializedName("assignedAt")
    val assignedAt: String?,
    val collection: CollectionData?
)

data class SatelliteImage(
    val url: String,
    val source: String,
    @SerializedName("captureDate")
    val captureDate: String,
    val resolution: String?
)

data class DetectionResult(
    @SerializedName("plasticDetected")
    val plasticDetected: Boolean,
    val density: String, // low, medium, high, none
    val confidence: Double,
    @SerializedName("estimatedArea")
    val estimatedArea: Double?,
    @SerializedName("estimatedWeight")
    val estimatedWeight: Double?,
    @SerializedName("plasticTypes")
    val plasticTypes: List<String>?
)

data class DroneVerification(
    val verified: Boolean,
    @SerializedName("droneId")
    val droneId: String?,
    @SerializedName("verificationDate")
    val verificationDate: String?,
    @SerializedName("highResImage")
    val highResImage: String?,
    @SerializedName("refinedEstimate")
    val refinedEstimate: RefinedEstimate?
)

data class RefinedEstimate(
    val area: Double,
    val weight: Double,
    val confidence: Double
)

data class CollectionData(
    val weight: Double,
    val volume: Double?,
    @SerializedName("plasticTypes")
    val plasticTypes: List<String>?,
    val photos: List<String>?,
    val notes: String?,
    val conditions: String?
)

// FCM Notification Data
enum class NotificationType {
    TASK_ASSIGNED,
    TASK_REMINDER,
    TASK_OVERDUE,
    DRONE_VERIFIED,
    ALERT
}

data class NotificationData(
    val type: NotificationType,
    val title: String,
    val message: String,
    val taskId: String? = null,
    val detectionId: String? = null,
    val priority: String? = null
)
