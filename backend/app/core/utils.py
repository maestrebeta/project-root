# core/utils.py
import base64
import os
from dotenv import load_dotenv

load_dotenv()  # Carga las variables desde el archivo .env

def get_jira_headers():
    email = os.getenv("JIRA_EMAIL")
    api_token = os.getenv("JIRA_API_TOKEN")

    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Basic {get_basic_auth_token(email, api_token)}"
    }

def get_basic_auth_token(email, token):
    return base64.b64encode(f"{email}:{token}".encode("utf-8")).decode("utf-8")
