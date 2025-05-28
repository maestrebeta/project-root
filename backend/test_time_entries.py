#!/usr/bin/env python3
import requests
import json

def test_time_entries():
    try:
        # Login
        print("🔐 Iniciando sesión...")
        login_response = requests.post('http://localhost:8000/auth/login', 
                                     data={'username': 'ceo', 'password': '8164'})
        
        if login_response.status_code != 200:
            print(f"❌ Error en login: {login_response.status_code}")
            print(login_response.text)
            return
        
        token = login_response.json()['access_token']
        print("✅ Login exitoso")
        
        # Test time entries endpoint
        print("\n📊 Probando endpoint de time entries...")
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get('http://localhost:8000/time-entries/?skip=0&limit=5', 
                              headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Endpoint funcionando correctamente")
            print(f"📈 Entradas obtenidas: {len(data)}")
            
            if data:
                print("\n🔍 Primera entrada de ejemplo:")
                first_entry = data[0]
                print(f"  - ID: {first_entry.get('entry_id')}")
                print(f"  - Tipo de actividad: {first_entry.get('activity_type')}")
                print(f"  - Descripción: {first_entry.get('description')}")
                print(f"  - Estado: {first_entry.get('status')}")
                print(f"  - Duración: {first_entry.get('duration_hours')} horas")
        else:
            print(f"❌ Error en endpoint: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_time_entries() 