import urllib.request
import json
import urllib.error

def test_create_listing():
    url = "http://localhost:8000/api/listings"
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
    
    try:
        print(f"Sending POST request to {url}...")
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req) as response:
            print(f"Status Code: {response.status}")
            print(f"Response Body: {response.read().decode('utf-8')}")
            
            if response.status == 200:
                print("SUCCESS: Listing created.")
            else:
                print("FAILURE: Server returned error.")
            
    except urllib.error.URLError as e:
        print(f"ERROR: Could not connect to server. Is it running on port 8000? {e}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_create_listing()
