import urllib.request
import json
import urllib.error

def verify_swipe_persistence():
    base_url = "http://127.0.0.1:8000"
    donor_id = "testdon@gmail.com"
    
    # 1. Get an active listing ID
    try:
        with urllib.request.urlopen(f"{base_url}/api/listings?status=active&donorId={donor_id}") as response:
            listings = json.loads(response.read().decode('utf-8'))
            if not listings:
                print("No active listings found to test with.")
                return
            listing_id = listings[0]['id']
            print(f"Testing with listing ID: {listing_id}")
    except Exception as e:
        print(f"Error getting listings: {e}")
        return

    # 2. Simulate a swipe (left)
    try:
        url = f"{base_url}/api/listings/{listing_id}/swipe"
        data = json.dumps({"donorId": donor_id}).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            print(f"Swipe response code: {response.status}")
    except Exception as e:
        print(f"Error recording swipe: {e}")
        return

    # 3. Verify listing no longer appears for this donor
    try:
        with urllib.request.urlopen(f"{base_url}/api/listings?status=active&donorId={donor_id}") as response:
            listings = json.loads(response.read().decode('utf-8'))
            if any(l['id'] == listing_id for l in listings):
                print("FAILURE: Listing still appears after swipe!")
            else:
                print("SUCCESS: Listing excluded after swipe!")
    except Exception as e:
        print(f"Error verifying exclusion: {e}")

if __name__ == "__main__":
    verify_swipe_persistence()
