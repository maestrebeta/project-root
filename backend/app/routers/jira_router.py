# backend/app/routers/jira_router.py
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from app.core.utils import get_jira_headers
from urllib.parse import urlencode
import requests
import os

router = APIRouter(prefix="/jira", tags=["Jira"])

JIRA_BASE_URL = os.getenv("JIRA_BASE_URL")
PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")


@router.get("/oauth/login")
def oauth_login():
    params = {
        "audience": "api.atlassian.com",
        "client_id": os.getenv("JIRA_CLIENT_ID"),
        "scope": "read:jira-user read:jira-work",
        "redirect_uri": os.getenv("JIRA_REDIRECT_URI"),
        "response_type": "code",
        "prompt": "consent"
    }
    url = f"https://auth.atlassian.com/authorize?{urlencode(params)}"
    return RedirectResponse(url)

@router.get("/oauth/callback")
def oauth_callback(request: Request):
    code = request.query_params.get("code")
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
    access_token = token_data.get("access_token")
    if not access_token:
        return JSONResponse({"error": "No access token received"}, status_code=400)
    # Guarda el token en una cookie y redirige a http://localhost:5173/jira
    resp = RedirectResponse(url="http://localhost:5173/jira")
    resp.set_cookie(key="jira_access_token", value=access_token, httponly=True, max_age=3600)
    return resp

@router.get("/logout")
def logout():
    resp = RedirectResponse(url="/jira/oauth/login")
    resp.delete_cookie("jira_access_token")
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
