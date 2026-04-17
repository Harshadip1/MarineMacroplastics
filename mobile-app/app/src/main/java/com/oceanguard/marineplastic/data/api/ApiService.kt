package com.oceanguard.marineplastic.data.api

import com.oceanguard.marineplastic.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    // Authentication
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @GET("auth/me")
    suspend fun getCurrentUser(): Response<UserResponse>
    
    @PUT("auth/location")
    suspend fun updateLocation(@Body request: LocationUpdateRequest): Response<Unit>
    
    // Tasks
    @GET("tasks")
    suspend fun getMyTasks(
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1
    ): Response<TasksResponse>
    
    @GET("tasks/{taskId}")
    suspend fun getTaskDetail(@Path("taskId") taskId: String): Response<TaskDetailResponse>
    
    @PUT("tasks/{taskId}/accept")
    suspend fun acceptTask(@Path("taskId") taskId: String): Response<Task>
    
    @PUT("tasks/{taskId}/start")
    suspend fun startTask(@Path("taskId") taskId: String): Response<Task>
    
    @PUT("tasks/{taskId}/complete")
    suspend fun completeTask(
        @Path("taskId") taskId: String,
        @Body request: TaskCompleteRequest
    ): Response<Task>
    
    // Worker Stats
    @GET("worker/{id}/stats")
    suspend fun getWorkerStats(@Path("id") workerId: String): Response<WorkerStatsResponse>
    
    // Detections (read-only for workers)
    @GET("detection/{id}")
    suspend fun getDetectionDetail(@Path("id") detectionId: String): Response<Detection>
}

data class LoginRequest(
    val email: String,
    val password: String,
    val fcmToken: String? = null
)

data class LoginResponse(
    val success: Boolean,
    val token: String,
    val user: User
)

data class UserResponse(
    val success: Boolean,
    val user: User
)

data class LocationUpdateRequest(
    val longitude: Double,
    val latitude: Double
)

data class TasksResponse(
    val success: Boolean,
    val data: List<Task>,
    val total: Int,
    val page: Int,
    val pages: Int
)

data class TaskDetailResponse(
    val success: Boolean,
    val data: Task
)

data class TaskCompleteRequest(
    val weight: Double,
    val volume: Double? = null,
    val plasticTypes: List<String>? = null,
    val photos: List<String>? = null,
    val notes: String? = null,
    val conditions: String? = null
)

data class WorkerStatsResponse(
    val success: Boolean,
    val data: WorkerStats
)
