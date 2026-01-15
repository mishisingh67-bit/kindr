import urllib.request
import json
import urllib.error

def verify_deletion():
    base_url = "http://127.0.0.1:8000"
    recipient_email = "testrec@gmail.com" # Using an existing recipient for test
    
    # 1. Get listings for the recipient
    try:
        with urllib.request.urlopen(f"{base_url}/api/listings?recipientId={recipient_email}") as response:
            listings = json.loads(response.read().decode('utf-8'))
            if not listings:
                print("No listings found for recipient to test deletion.")
                return
            listing_id = listings[0]['id']
            print(f"Testing deletion for listing ID: {listing_id}")
    except Exception as e:
        print(f"Error getting listings: {e}")
        return

    # 2. Simulate DELETE request
    try:
        url = f"{base_url}/api/listings/{listing_id}"
        req = urllib.request.Request(url, method='DELETE')
        with urllib.request.urlopen(req) as response:
            print(f"Delete response code: {response.status}")
            res_data = json.loads(response.read().decode('utf-8'))
            print(f"Delete response: {res_data}")
    except Exception as e:
        print(f"Error deleting listing: {e}")
        return

    # 3. Verify listing is gone
    try:
        with urllib.request.urlopen(f"{base_url}/api/listings?recipientId={recipient_email}") as response:
            listings = json.loads(response.read().decode('utf-8'))
            if any(l['id'] == listing_id for l in listings):
                print("FAILURE: Listing still exists after deletion!")
            else:
                print("SUCCESS: Listing deleted successfully!")
    except Exception as e:
        print(f"Error verifying deletion: {e}")

if __name__ == "__main__":
    verify_deletion()
