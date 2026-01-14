import urllib.request
import json
import urllib.error
import time

def test_create_listing():
    url = "http://127.0.0.1:8000/api/listings"
    payload = {
        "message": "New Request",
        "recipientId": "test@example.com",
        "title": "Test Request",
        "description": "This is a test request",
        "category": "Education",
        "urgency": "High",
        "location": "Test City",
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "documents": [],
        "qrCode": None
    }
    
    print(f"Testing connectivity to {url}...")
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req) as response:
            print(f"Status Code: {response.status}")
            print(f"Response Body: {response.read().decode('utf-8')}")
            
    except urllib.error.URLError as e:
        print(f"ERROR: Could not connect to server. {e}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_create_listing()
