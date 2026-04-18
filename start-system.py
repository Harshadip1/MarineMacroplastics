"""
Marine Plastic Detection System Startup Script
Starts all components: Satellite Server, AI Model, Dashboard Backend
"""

import subprocess
import time
import sys
import os
import signal
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('system.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SystemManager:
    """Manages all system components"""
    
    def __init__(self):
        self.processes = {}
        self.base_dir = Path(__file__).parent
        logger.info("System Manager initialized")
    
    def start_dashboard_backend(self):
        """Start the main dashboard backend"""
        logger.info("🚀 Starting Dashboard Backend (Port 5000)...")
        try:
            process = subprocess.Popen(
                [sys.executable, 'server.js'],
                cwd=self.base_dir / 'backend',
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.processes['dashboard'] = process
            logger.info("✅ Dashboard Backend started")
            return process
        except Exception as e:
            logger.error(f"❌ Failed to start Dashboard Backend: {e}")
            return None
    
    def start_ai_model(self):
        """Start the AI Model server"""
        logger.info("🧠 Starting AI Model (Port 5001)...")
        try:
            process = subprocess.Popen(
                [sys.executable, 'app.py'],
                cwd=self.base_dir / 'ai-model',
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.processes['ai_model'] = process
            logger.info("✅ AI Model started")
            return process
        except Exception as e:
            logger.error(f"❌ Failed to start AI Model: {e}")
            return None
    
    def start_satellite_server(self):
        """Start the satellite server"""
        logger.info("🛰️ Starting Satellite Server (Port 6000)...")
        try:
            process = subprocess.Popen(
                ['npm', 'start'],
                cwd=self.base_dir / 'satellite',
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.processes['satellite'] = process
            logger.info("✅ Satellite Server started")
            return process
        except Exception as e:
            logger.error(f"❌ Failed to start Satellite Server: {e}")
            return None
    
    def check_dependencies(self):
        """Check if all dependencies are installed"""
        logger.info("🔍 Checking system dependencies...")
        
        # Check Node.js
        try:
            subprocess.run(['node', '--version'], check=True, capture_output=True)
            logger.info("✅ Node.js available")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("❌ Node.js not found. Please install Node.js")
            return False
        
        # Check Python
        try:
            subprocess.run([sys.executable, '--version'], check=True, capture_output=True)
            logger.info("✅ Python available")
        except subprocess.CalledProcessError:
            logger.error("❌ Python not found")
            return False
        
        # Check npm
        try:
            subprocess.run(['npm', '--version'], check=True, capture_output=True)
            logger.info("✅ npm available")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("❌ npm not found. Please install npm")
            return False
        
        return True
    
    def install_dependencies(self):
        """Install all system dependencies"""
        logger.info("📦 Installing dependencies...")
        
        # Install backend dependencies
        try:
            logger.info("Installing backend dependencies...")
            subprocess.run(['npm', 'install'], cwd=self.base_dir / 'backend', check=True)
            logger.info("✅ Backend dependencies installed")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Backend dependencies failed: {e}")
        
        # Install AI model dependencies
        try:
            logger.info("Installing AI model dependencies...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                        cwd=self.base_dir / 'ai-model', check=True)
            logger.info("✅ AI model dependencies installed")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ AI model dependencies failed: {e}")
        
        # Install satellite server dependencies
        try:
            logger.info("Installing satellite server dependencies...")
            subprocess.run(['npm', 'install'], cwd=self.base_dir / 'satellite', check=True)
            logger.info("✅ Satellite server dependencies installed")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Satellite server dependencies failed: {e}")
    
    def start_all(self):
        """Start all system components"""
        logger.info("🌊 Starting Marine Plastic Detection System...")
        logger.info("=" * 60)
        
        # Check dependencies
        if not self.check_dependencies():
            logger.error("❌ Dependencies check failed. Please install required software.")
            return False
        
        # Install dependencies
        self.install_dependencies()
        
        # Start services in order
        services = [
            ('Dashboard Backend', self.start_dashboard_backend),
            ('AI Model', self.start_ai_model),
            ('Satellite Server', self.start_satellite_server)
        ]
        
        for service_name, start_func in services:
            logger.info(f"\n🔄 Starting {service_name}...")
            process = start_func()
            if process:
                time.sleep(2)  # Give service time to start
            else:
                logger.error(f"❌ Failed to start {service_name}")
        
        # Show status
        self.show_status()
        
        # Wait for user input to stop
        try:
            logger.info("\n🟢 All services started successfully!")
            logger.info("Press Ctrl+C to stop all services")
            
            while True:
                time.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("\n🛑 Stopping all services...")
            self.stop_all()
            return
        
        return True
    
    def show_status(self):
        """Show current system status"""
        logger.info("\n📊 System Status:")
        logger.info("-" * 30)
        
        for service, process in self.processes.items():
            if process and process.poll() is None:
                logger.info(f"✅ {service.replace('_', ' ').title()}: Running (PID: {process.pid})")
            else:
                logger.info(f"❌ {service.replace('_', ' ').title()}: Stopped")
        
        logger.info("\n🌐 Access URLs:")
        logger.info("  Dashboard: http://localhost:3000")
        logger.info("  API: http://localhost:5000")
        logger.info("  AI Model: http://localhost:5001")
        logger.info("  Satellite: http://localhost:6000")
    
    def stop_all(self):
        """Stop all running processes"""
        for service, process in self.processes.items():
            if process and process.poll() is None:
                logger.info(f"🛑 Stopping {service}...")
                try:
                    process.terminate()
                    process.wait(timeout=5)
                    logger.info(f"✅ {service} stopped")
                except subprocess.TimeoutExpired:
                    logger.warning(f"⚠️ Force killing {service}...")
                    process.kill()
                    logger.info(f"✅ {service} force stopped")
                except Exception as e:
                    logger.error(f"❌ Failed to stop {service}: {e}")

def main():
    """Main startup function"""
    print("🌊 Marine Plastic Detection System")
    print("=" * 50)
    print("🚀 Complete System Startup")
    print("=" * 50)
    
    manager = SystemManager()
    
    try:
        success = manager.start_all()
        if success:
            print("\n🎉 System startup completed successfully!")
        else:
            print("\n❌ System startup failed!")
            
    except KeyboardInterrupt:
        print("\n👋 Startup interrupted by user")
        manager.stop_all()
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        manager.stop_all()

if __name__ == '__main__':
    main()
