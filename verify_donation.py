import urllib.request
import json

def verify_donation_flow():
    base_url = "http://127.0.0.1:8000"
    donor_id = "testdon2@gmail.com"
    
    # 1. Get an active listing ID
    try:
        url = f"{base_url}/api/listings?status=active&donorId={donor_id}"
        with urllib.request.urlopen(url) as response:
            listings = json.loads(response.read().decode('utf-8'))
            if not listings:
                print("No active listings found for donor.")
                return
            listing = listings[0]
            listing_id = listing['id']
            initial_progress = listing.get('progress', 0)
            print(f"Testing donation for listing ID: {listing_id}, Initial Progress: {initial_progress}%")
    except Exception as e:
        print(f"Error getting listings: {e}")
        return

    # 2. Simulate donation confirmation
    try:
        url = f"{base_url}/api/listings/{listing_id}/donate"
        data = json.dumps({
            "donorId": donor_id,
            "amount": 50,
            "timestamp": "2026-01-15T09:30:00Z"
        }).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            new_progress = res_data.get('progress')
            print(f"Donation response: {res_data}")
            if new_progress > initial_progress:
                print(f"SUCCESS: Progress increased to {new_progress}%")
            else:
                print(f"FAILURE: Progress did not increase (Initial: {initial_progress}, New: {new_progress})")
    except Exception as e:
        print(f"Error recording donation: {e}")

if __name__ == "__main__":
    verify_donation_flow()
