# API Connection Test Script
# Run this to test if your FastAPI backend is properly configured for CORS

import requests
import json

def test_api_connection():
    base_url = "http://localhost:8001"
    
    print("Testing FastAPI CORS configuration...")
    print(f"Base URL: {base_url}")
    print("-" * 50)
    
    # Test 1: Basic health check
    try:
        print("1. Testing basic connection...")
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("   ✅ API docs accessible")
        else:
            print(f"   ❌ API docs failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
    
    # Test 2: OpenAPI spec
    try:
        print("2. Testing OpenAPI spec...")
        response = requests.get(f"{base_url}/openapi.json")
        if response.status_code == 200:
            print("   ✅ OpenAPI spec accessible")
        else:
            print(f"   ❌ OpenAPI spec failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ OpenAPI spec failed: {e}")
    
    # Test 3: CORS preflight (OPTIONS request)
    try:
        print("3. Testing CORS preflight...")
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type',
        }
        response = requests.options(f"{base_url}/api/video/videos/count", headers=headers)
        if response.status_code == 200:
            print("   ✅ CORS preflight successful")
            if 'Access-Control-Allow-Origin' in response.headers:
                print(f"   ✅ CORS headers present: {response.headers.get('Access-Control-Allow-Origin')}")
            else:
                print("   ⚠️  CORS headers missing")
        else:
            print(f"   ❌ CORS preflight failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ CORS preflight failed: {e}")
    
    # Test 4: Actual API call
    try:
        print("4. Testing API endpoint...")
        headers = {
            'Origin': 'http://localhost:3000',
            'Content-Type': 'application/json',
        }
        response = requests.get(f"{base_url}/api/video/videos/count", headers=headers)
        if response.status_code == 200:
            print("   ✅ API endpoint successful")
            data = response.json()
            print(f"   📊 Response: {data}")
        else:
            print(f"   ❌ API endpoint failed: {response.status_code}")
            print(f"   📄 Response: {response.text}")
    except Exception as e:
        print(f"   ❌ API endpoint failed: {e}")
    
    print("-" * 50)
    print("Test completed!")
    print("\nIf CORS tests fail, add this to your FastAPI main file:")
    print("""
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    """)

if __name__ == "__main__":
    test_api_connection()