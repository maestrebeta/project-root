# backend/app/routers/jira_router.py
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from app.core.utils import get_jira_headers
from urllib.parse import urlencode
import requests
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/jira", tags=["Jira"])

JIRA_BASE_URL = os.getenv("JIRA_BASE_URL")
PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")
TOKEN_EXPIRY_DAYS = 30  # Token válido por 30 días

@router.get("/oauth/login")
def oauth_login(request: Request):
    # Guardar la URL de retorno original
    return_url = request.query_params.get("return_url", "http://localhost:5173/manager/jira-summary")
    
    params = {
        "audience": "api.atlassian.com",
        "client_id": os.getenv("JIRA_CLIENT_ID"),
        "scope": "read:jira-user read:jira-work offline_access",  # Agregamos offline_access para refresh token
        "redirect_uri": os.getenv("JIRA_REDIRECT_URI"),
        "response_type": "code",
        "prompt": "consent",
        "state": return_url  # Pasamos la URL de retorno en el state
    }
    url = f"https://auth.atlassian.com/authorize?{urlencode(params)}"
    return RedirectResponse(url)

@router.get("/oauth/callback")
def oauth_callback(request: Request):
    code = request.query_params.get("code")
    return_url = request.query_params.get("state", "http://localhost:5173/manager/jira-summary")
    
    if not code:
        return JSONResponse({"error": "No code provided"}, status_code=400)
    
    data = {
        "grant_type": "authorization_code",
        "client_id": os.getenv("JIRA_CLIENT_ID"),
        "client_secret": os.getenv("JIRA_CLIENT_SECRET"),
        "code": code,
        "redirect_uri": os.getenv("JIRA_REDIRECT_URI"),
    }
    
    response = requests.post("https://auth.atlassian.com/oauth/token", json=data)
    token_data = response.json()
    
    if "error" in token_data:
        return JSONResponse({"error": token_data["error_description"]}, status_code=400)
    
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    
    if not access_token:
        return JSONResponse({"error": "No access token received"}, status_code=400)
    
    # Crear respuesta con cookies seguras
    resp = RedirectResponse(url=return_url)
    expires = datetime.now() + timedelta(days=TOKEN_EXPIRY_DAYS)
    
    # Configurar cookies con mayor seguridad y duración
    resp.set_cookie(
        key="jira_access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=TOKEN_EXPIRY_DAYS * 24 * 3600,
        expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT")
    )
    
    if refresh_token:
        resp.set_cookie(
            key="jira_refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=TOKEN_EXPIRY_DAYS * 24 * 3600,
            expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT")
        )
    
    return resp

@router.get("/refresh-token")
async def refresh_token(request: Request):
    refresh_token = request.cookies.get("jira_refresh_token")
    if not refresh_token:
        return JSONResponse({"error": "No refresh token available"}, status_code=401)
    
    data = {
        "grant_type": "refresh_token",
        "client_id": os.getenv("JIRA_CLIENT_ID"),
        "client_secret": os.getenv("JIRA_CLIENT_SECRET"),
        "refresh_token": refresh_token
    }
    
    response = requests.post("https://auth.atlassian.com/oauth/token", json=data)
    token_data = response.json()
    
    if "error" in token_data:
        # Si el refresh token es inválido, redirigir al login
        resp = RedirectResponse(url="/jira/oauth/login")
        resp.delete_cookie("jira_access_token")
        resp.delete_cookie("jira_refresh_token")
        return resp
    
    access_token = token_data.get("access_token")
    new_refresh_token = token_data.get("refresh_token")
    
    resp = JSONResponse({"status": "Token refreshed successfully"})
    expires = datetime.now() + timedelta(days=TOKEN_EXPIRY_DAYS)
    
    resp.set_cookie(
        key="jira_access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=TOKEN_EXPIRY_DAYS * 24 * 3600,
        expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT")
    )
    
    if new_refresh_token:
        resp.set_cookie(
            key="jira_refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=TOKEN_EXPIRY_DAYS * 24 * 3600,
            expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT")
        )
    
    return resp

@router.get("/check-session")
async def check_session(request: Request):
    access_token = request.cookies.get("jira_access_token")
    if not access_token:
        return JSONResponse({"isAuthenticated": False})
    
    # Verificar si el token es válido haciendo una llamada a la API de Jira
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    
    response = requests.get(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        headers=headers
    )
    
    if response.status_code != 200:
        # Intentar refrescar el token
        refresh_response = await refresh_token(request)
        if isinstance(refresh_response, RedirectResponse):
            return JSONResponse({"isAuthenticated": False})
    
    return JSONResponse({"isAuthenticated": True})

@router.get("/logout")
def logout():
    resp = RedirectResponse(url="http://localhost:5173/manager/jira-summary")
    resp.delete_cookie("jira_access_token")
    resp.delete_cookie("jira_refresh_token")
    return resp

@router.get("/projects")
def get_projects(request: Request):
    access_token = request.cookies.get("jira_access_token")
    if not access_token:
        return RedirectResponse(url="/jira/oauth/login")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    # Obtén el cloudid de tu sitio
    cloud_response = requests.get(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        headers=headers
    )
    resources = cloud_response.json()
    if not isinstance(resources, list) or not resources:
        resp = RedirectResponse(url="/jira/oauth/login")
        resp.delete_cookie("jira_access_token")
        return resp
    cloudid = resources[0]["id"]
    # Llama a la API de Jira
    url = f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/project/search"
    response = requests.get(url, headers=headers)
    projects = response.json().get("values", [])
    # Filtra solo id, key y name
    filtered = [{"id": p["id"], "key": p["key"], "name": p["name"]} for p in projects]
    return {"projects": filtered}

@router.get("/projects-with-issues")
def get_projects_with_issues(request: Request):
    access_token = request.cookies.get("jira_access_token")
    if not access_token:
        return RedirectResponse(url="/jira/oauth/login")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    # Obtén el cloudid de tu sitio
    cloud_response = requests.get(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        headers=headers
    )
    resources = cloud_response.json()
    if not isinstance(resources, list) or not resources:
        resp = RedirectResponse(url="/jira/oauth/login")
        resp.delete_cookie("jira_access_token")
        return resp
    cloudid = resources[0]["id"]
    # Llama a la API de Jira para obtener los proyectos
    url_projects = f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/project/search"
    response_projects = requests.get(url_projects, headers=headers)
    projects = response_projects.json().get("values", [])
    result = []
    for p in projects:
        project_info = {
            "id": p["id"],
            "key": p["key"],
            "name": p["name"],
            "issues": []
        }
        # Obtén las tareas (issues) del proyecto
        jql = f"project={p['key']} ORDER BY created DESC"
        url_issues = f"https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/search?jql={jql}&fields=summary,description,status,labels,assignee,created,updated,duedate,startdate"
        response_issues = requests.get(url_issues, headers=headers)
        issues = response_issues.json().get("issues", [])
        for issue in issues:
            fields = issue.get("fields", {})
            project_info["issues"].append({
                "id": issue.get("id"),
                "key": issue.get("key"),
                "summary": fields.get("summary"),
                "description": fields.get("description"),
                "status": fields.get("status", {}).get("name") if fields.get("status") else None,
                "labels": fields.get("labels"),
                "assignee": fields.get("assignee", {}).get("displayName") if fields.get("assignee") else None,
                "created": fields.get("created"),
                "updated": fields.get("updated"),
                "duedate": fields.get("duedate"),
                "startdate": fields.get("startdate"),
            })
        result.append(project_info)
    return {"projects": result}

@router.get("/boards")
def get_boards():
    url = f"{JIRA_BASE_URL.replace('/rest/api/3','/rest/agile/1.0')}/board"
    headers = get_jira_headers()
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json().get("values", [])

@router.get("/sprints/{board_id}")
def get_sprints(board_id: int):
    url = f"{JIRA_BASE_URL.replace('/rest/api/3','/rest/agile/1.0')}/board/{board_id}/sprint"
    headers = get_jira_headers()
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json().get("values", [])

@router.get("/issues/{project_key}")
def get_issues(project_key: str):
    jql = f"project={project_key} ORDER BY created DESC"
    url = f"{JIRA_BASE_URL}/search?jql={jql}"
    headers = get_jira_headers()
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json().get("issues", [])
