package com.oceanguard.marineplastic.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.oceanguard.marineplastic.OceanGuardApp
import com.oceanguard.marineplastic.data.api.LoginRequest
import com.oceanguard.marineplastic.databinding.ActivityLoginBinding
import com.oceanguard.marineplastic.ui.main.MainActivity
import com.oceanguard.marineplastic.util.Resource
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
    }
    
    private fun setupUI() {
        // Check if already logged in
        val token = OceanGuardApp.instance.getToken()
        if (token != null) {
            navigateToMain()
            return
        }
        
        binding.loginButton.setOnClickListener {
            val email = binding.emailInput.text.toString().trim()
            val password = binding.passwordInput.text.toString().trim()
            
            if (validateInput(email, password)) {
                performLogin(email, password)
            }
        }
    }
    
    private fun validateInput(email: String, password: String): Boolean {
        var isValid = true
        
        if (email.isEmpty()) {
            binding.emailLayout.error = "Email is required"
            isValid = false
        } else {
            binding.emailLayout.error = null
        }
        
        if (password.isEmpty()) {
            binding.passwordLayout.error = "Password is required"
            isValid = false
        } else {
            binding.passwordLayout.error = null
        }
        
        return isValid
    }
    
    private fun performLogin(email: String, password: String) {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                val fcmToken = OceanGuardApp.instance.getFcmToken()
                val response = OceanGuardApp.apiService.login(
                    LoginRequest(email, password, fcmToken)
                )
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val loginResponse = response.body()!!
                    
                    // Save token and user data
                    OceanGuardApp.instance.saveToken(loginResponse.token)
                    OceanGuardApp.instance.saveUser(loginResponse.user)
                    
                    showLoading(false)
                    navigateToMain()
                } else {
                    showLoading(false)
                    val errorMsg = response.errorBody()?.string() ?: "Login failed"
                    showError(errorMsg)
                }
            } catch (e: Exception) {
                showLoading(false)
                showError("Network error: ${e.message}")
            }
        }
    }
    
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.loginButton.isEnabled = !show
    }
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
    
    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
