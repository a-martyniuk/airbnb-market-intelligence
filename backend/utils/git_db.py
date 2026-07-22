import os
import base64
import logging
import requests
from typing import List

logger = logging.getLogger(__name__)

def get_github_headers() -> dict:
    """Returns headers for GitHub API requests if GITHUB_TOKEN is configured."""
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        return {}
    return {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }

def sync_to_github(file_paths: List[str]) -> bool:
    """
    Synchronizes local files to the configured GitHub repository.
    Only executes if GITHUB_TOKEN and GITHUB_REPOSITORY are set.
    """
    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPOSITORY")
    
    if not token or not repo:
        logger.info("GitHub sync disabled: GITHUB_TOKEN or GITHUB_REPOSITORY environment variable not set.")
        return False
        
    headers = get_github_headers()
    success = True
    
    for relative_path in file_paths:
        # Standardize path separators to forward slashes for GitHub
        github_path = relative_path.replace("\\", "/")
        
        # Verify file exists locally
        if not os.path.exists(relative_path):
            logger.error(f"Local file does not exist, skipping sync: {relative_path}")
            success = False
            continue
            
        logger.info(f"Syncing {relative_path} to GitHub repository {repo}...")
        
        try:
            # 1. Fetch current file metadata from GitHub to obtain the blob SHA (required for updates)
            meta_url = f"https://api.github.com/repos/{repo}/contents/{github_path}"
            r_meta = requests.get(meta_url, headers=headers)
            
            sha = None
            if r_meta.status_code == 200:
                sha = r_meta.json().get("sha")
                logger.debug(f"Fetched existing SHA for {github_path}: {sha}")
            elif r_meta.status_code == 404:
                logger.info(f"File {github_path} does not exist in repo. Creating new file.")
            else:
                logger.error(f"Failed to fetch metadata for {github_path}: {r_meta.status_code} - {r_meta.text}")
                success = False
                continue
                
            # 2. Read local file and encode it in base64
            with open(relative_path, "rb") as f:
                file_content = f.read()
            encoded_content = base64.b64encode(file_content).decode("utf-8")
            
            # 3. Create the payload
            payload = {
                "message": f"chore: sync {os.path.basename(github_path)} from UI",
                "content": encoded_content
            }
            if sha:
                payload["sha"] = sha
                
            # 4. Upload the content
            r_put = requests.put(meta_url, headers=headers, json=payload)
            
            if r_put.status_code in (200, 201):
                new_sha = r_put.json().get("content", {}).get("sha")
                logger.info(f"Successfully synced {github_path} to GitHub. New SHA: {new_sha}")
            else:
                logger.error(f"Failed to push {github_path} to GitHub: {r_put.status_code} - {r_put.text}")
                success = False
                
        except Exception as e:
            logger.error(f"Unexpected exception syncing {relative_path} to GitHub: {str(e)}")
            success = False
            
    return success
