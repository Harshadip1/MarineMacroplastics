"""
System Integration Controller
Connects Satellite Server, AI Model, and Dashboard Backend
"""

import requests
import json
import time
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Service URLs
SATELLITE_URL = "http://localhost:6000/api/satellite/status"
AI_MODEL_URL = "http://localhost:5001/api/ai/health"
DASHBOARD_URL = "http://localhost:5000/api/detections/satellite"

class SystemIntegrator:
    """Manages integration between all system components"""
    
    def __init__(self):
        self.services_status = {
            'satellite': False,
            'ai_model': False,
            'dashboard': False
        }
        logger.info("System Integrator initialized")
    
    def check_all_services(self):
        """Check status of all services"""
        logger.info("Checking system services status...")
        
        # Check Satellite Server
        try:
            response = requests.get(SATELLITE_URL, timeout=5)
            if response.status_code == 200:
                self.services_status['satellite'] = True
                logger.info("✅ Satellite Server: Online")
            else:
                logger.warning(f"⚠️ Satellite Server: HTTP {response.status_code}")
        except Exception as e:
            logger.error(f"❌ Satellite Server: {e}")
        
        # Check AI Model
        try:
            response = requests.get(AI_MODEL_URL, timeout=5)
            if response.status_code == 200:
                self.services_status['ai_model'] = True
                logger.info("✅ AI Model: Online")
            else:
                logger.warning(f"⚠️ AI Model: HTTP {response.status_code}")
        except Exception as e:
            logger.error(f"❌ AI Model: {e}")
        
        # Check Dashboard Backend
        try:
            response = requests.get(f"{DASHBOARD_URL.replace('/satellite', '')}test", timeout=5)
            if response.status_code == 200:
                self.services_status['dashboard'] = True
                logger.info("✅ Dashboard Backend: Online")
            else:
                logger.warning(f"⚠️ Dashboard Backend: HTTP {response.status_code}")
        except Exception as e:
            logger.error(f"❌ Dashboard Backend: {e}")
        
        return self.services_status
    
    def test_integration(self):
        """Test complete integration pipeline"""
        logger.info("Testing complete integration pipeline...")
        
        # Test data flow: Satellite -> AI -> Dashboard
        test_data = {
            "image": "base64_test_image_data",  # Simplified for test
            "location": {
                "lat": 19.0760,
                "lng": 72.8777,
                "altitude": 400000,
                "timestamp": datetime.now().isoformat()
            },
            "metadata": {
                "satelliteId": "TEST-001",
                "resolution": 0.5,
                "cloudCover": 10
            }
        }
        
        try:
            # Send to AI Model
            ai_response = requests.post(
                "http://localhost:5001/api/ai/process",
                json=test_data,
                timeout=10
            )
            
            if ai_response.status_code == 200:
                logger.info("✅ AI Model processing successful")
                
                # Check if data was sent to dashboard
                ai_result = ai_response.json()
                if ai_result.get('data', {}).get('dashboardSent'):
                    logger.info("✅ Dashboard integration successful")
                    return True
                else:
                    logger.warning("⚠️ Dashboard integration failed")
                    return False
            else:
                logger.error(f"❌ AI Model processing failed: {ai_response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Integration test failed: {e}")
            return False
    
    def monitor_system(self, interval=30):
        """Continuously monitor system health"""
        logger.info(f"Starting system monitoring (interval: {interval}s)")
        
        while True:
            try:
                self.check_all_services()
                
                # Check if all services are online
                all_online = all(self.services_status.values())
                
                if all_online:
                    logger.info("🟢 All systems operational")
                else:
                    offline_services = [k for k, v in self.services_status.items() if not v]
                    logger.warning(f"🔴 Services offline: {', '.join(offline_services)}")
                
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("System monitoring stopped")
                break
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                time.sleep(interval)

def main():
    """Main integration function"""
    integrator = SystemIntegrator()
    
    print("🌊 Marine Plastic Detection System Integration")
    print("=" * 50)
    
    # Check initial status
    integrator.check_all_services()
    
    # Test integration
    print("\n🔗 Testing system integration...")
    integration_success = integrator.test_integration()
    
    if integration_success:
        print("✅ Integration test PASSED")
    else:
        print("❌ Integration test FAILED")
    
    # Show current status
    print("\n📊 Current System Status:")
    for service, status in integrator.services_status.items():
        status_icon = "✅" if status else "❌"
        print(f"  {service_icon} {service.replace('_', ' ').title()}: {'Online' if status else 'Offline'}")
    
    # Start monitoring (optional)
    try:
        choice = input("\n🔄 Start continuous monitoring? (y/n): ").lower()
        if choice == 'y':
            integrator.monitor_system()
        else:
            print("Monitoring skipped. System is ready!")
    except KeyboardInterrupt:
        print("\n👋 Integration test completed")

if __name__ == '__main__':
    main()
