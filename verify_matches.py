import urllib.request
import json
import urllib.error

def verify_match():
    base_url = "http://127.0.0.1:8000"
    donor_id = "testdon@gmail.com"
    
    # 1. Get an active listing ID
    try:
        with urllib.request.urlopen(f"{base_url}/api/listings?status=active") as response:
            listings = json.loads(response.read().decode('utf-8'))
            if not listings:
                print("No active listings found to test with.")
                return
            listing_id = listings[0]['id']
            print(f"Testing with listing ID: {listing_id}")
    except Exception as e:
        print(f"Error getting listings: {e}")
        return

    # 2. Simulate right swipe (match)
    try:
        url = f"{base_url}/api/listings/{listing_id}/match"
        data = json.dumps({"donorId": donor_id}).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            print(f"Match response code: {response.status}")
    except Exception as e:
        print(f"Error matching listing: {e}")
        return

    # 3. Verify match appears in donor matches
    try:
        with urllib.request.urlopen(f"{base_url}/api/listings?donorId={donor_id}") as response:
            matches = json.loads(response.read().decode('utf-8'))
            if any(m['id'] == listing_id for m in matches):
                print("SUCCESS: Listing found in donor matches!")
            else:
                print("FAILURE: Listing not found in donor matches.")
    except Exception as e:
        print(f"Error verifying matches: {e}")

if __name__ == "__main__":
    verify_match()
