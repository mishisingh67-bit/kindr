import urllib.request
import json

def verify_admin_status_filters():
    base_url = "http://127.0.0.1:8000"
    
    statuses = ['pending', 'active', 'rejected']
    
    for status in statuses:
        try:
            url = f"{base_url}/api/listings?status={status}"
            with urllib.request.urlopen(url) as response:
                listings = json.loads(response.read().decode('utf-8'))
                print(f"Status '{status}': Found {len(listings)} listings")
                if len(listings) > 0:
                    print(f"  Example ID: {listings[0]['id']}")
        except Exception as e:
            print(f"Error fetching status '{status}': {e}")

if __name__ == "__main__":
    verify_admin_status_filters()
