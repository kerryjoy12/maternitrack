import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def test_branding_endpoints():
    print("🚀 Starting Hospital Branding API Integration Test...")
    
    # 1. Login to get JWT Token
    login_url = f"{BASE_URL}/api/v1/auth/login/"
    login_data = {
        "email": "neville@itierionursinghome.co.ke",
        "password": "#Itierio@254"
    }
    print(f"🔑 Logging in via {login_url}...")
    response = requests.post(login_url, json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed with status code {response.status_code}: {response.text}")
        return False
    
    token = response.json().get("access")
    print("✅ Login successful! JWT Access Token acquired.")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }

    # 2. Get current settings (Public endpoint)
    settings_url = f"{BASE_URL}/api/v1/core/hospital-settings/"
    print(f"📥 Fetching current settings from {settings_url}...")
    response = requests.get(settings_url)
    if response.status_code != 200:
        print(f"❌ Failed to fetch current settings: {response.text}")
        return False
    
    original_settings = response.json()
    print("✅ Current branding settings retrieved:")
    print(json.dumps(original_settings, indent=2))

    # 3. Update settings (Admin-only endpoint)
    update_url = f"{BASE_URL}/api/v1/core/hospital-settings/update/"
    print(f"📤 Updating settings via {update_url}...")
    
    logo_path = "/home/Neville/Pictures/projectattachment/maternity-tracker/test_logo.png"
    bg_path = "/home/Neville/Pictures/projectattachment/maternity-tracker/test_login_bg.png"
    
    if not os.path.exists(logo_path) or not os.path.exists(bg_path):
        print("❌ Test files do not exist. Please check paths.")
        return False

    with open(logo_path, "rb") as logo_file, open(bg_path, "rb") as bg_file:
        files = {
            "logo": ("test_logo.png", logo_file, "image/png"),
            "login_image": ("test_login_bg.png", bg_file, "image/png")
        }
        data = {
            "hospital_name": "St. Mary's General Hospital",
            "hospital_abbreviation": "SMGH"
        }
        
        response = requests.post(update_url, headers=headers, data=data, files=files)
        if response.status_code != 200:
            print(f"❌ Failed to update settings: {response.status_code} - {response.text}")
            return False
        
        updated_settings = response.json()
        print("✅ Settings updated successfully! Response:")
        print(json.dumps(updated_settings, indent=2))

    # 4. Verify GET settings returns the new values
    print("📥 Verifying settings update via GET...")
    response = requests.get(settings_url)
    if response.status_code != 200:
        print(f"❌ Failed to fetch updated settings: {response.text}")
        return False
    
    fetched_updated = response.json()
    assert fetched_updated["hospital_name"] == "St. Mary's General Hospital"
    assert fetched_updated["hospital_abbreviation"] == "SMGH"
    assert fetched_updated["logo_url"] is not None
    assert fetched_updated["login_image_url"] is not None
    print("✅ Verification GET request matches updated parameters!")
    print(f"Logo URL: {fetched_updated['logo_url']}")
    print(f"Login Image URL: {fetched_updated['login_image_url']}")

    # 5. Restore default settings to clean up
    print("🧹 Restoring default settings...")
    data_restore = {
        "hospital_name": "Itierio Maternity and Nursing Home",
        "hospital_abbreviation": "IMNH"
    }
    # Send empty strings or null to clear image URLs in real scenarios, or just do it in script
    # Since we can just let it keep the new values or override it, let's restore the default settings
    # without files to verify text changes persist, but we can write the default JSON configuration back directly too.
    response = requests.post(update_url, headers=headers, data=data_restore)
    if response.status_code != 200:
        print(f"❌ Failed to restore default settings: {response.text}")
        return False
    
    print("🎉 All integration tests passed successfully!")
    return True

if __name__ == "__main__":
    test_branding_endpoints()
