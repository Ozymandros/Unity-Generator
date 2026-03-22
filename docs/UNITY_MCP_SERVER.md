# Unity MCP Server (Unity-MCP-Server)

This document is about the **MCP server that talks to the Unity Editor** — **not** the Python `unity-mcp-plugin` package.  
For the Semantic Kernel Python bridge, see [UNITY_MCP_INTEGRATION.md](./UNITY_MCP_INTEGRATION.md) and [UNITY_MCP_SK_INTEGRATION.md](./UNITY_MCP_SK_INTEGRATION.md).

## Source repository (install here)

| Item | Value |
|------|--------|
| **GitHub** | **[github.com/Ozymandros/Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server)** |
| **Clone (HTTPS)** | `https://github.com/Ozymandros/Unity-MCP-Server.git` |
| **GHCR image (Docker)** | **`ghcr.io/ozymandros/unity-mcp-server`** — package page: **[github.com/Ozymandros/Unity-MCP-Server/pkgs/container/unity-mcp-server](https://github.com/Ozymandros/Unity-MCP-Server/pkgs/container/unity-mcp-server)** |
| **Typical CLI name** | `unity-mcp` (global .NET tool or built executable — follow upstream README) |

**Installation** is defined **upstream**: clone the repo and follow **Unity-MCP-Server** `README.md` (e.g. `dotnet tool install`, Unity package, or build steps). This Unity-Generator repo does **not** ship the server binary; it expects the executable to exist locally or on `PATH`.

### Docker install from GHCR

Official container images are published here:

**[Unity-MCP-Server — Package `unity-mcp-server` (GHCR)](https://github.com/Ozymandros/Unity-MCP-Server/pkgs/container/unity-mcp-server)**

| Item | Value |
|------|--------|
| **Registry / image** | `ghcr.io/ozymandros/unity-mcp-server` |
| **Tags** | Use the package page for current tags (e.g. `latest`, version tags like `v3.2.1`, or `sha-<commit>` digests). Prefer a **version tag** or digest for reproducible installs. |

**Pull** (replace `<tag>` with a tag from the [package page](https://github.com/Ozymandros/Unity-MCP-Server/pkgs/container/unity-mcp-server), e.g. `latest` or `v3.2.1`):

```bash
docker pull ghcr.io/ozymandros/unity-mcp-server:<tag>
```

**Run** (example only — **port and env vars** must match **Unity-MCP-Server** docs for MCP HTTP vs stdio; adjust `-p` and any `-e` flags per upstream):

```bash
docker run --rm -p <HOST_PORT>:<CONTAINER_PORT> ghcr.io/ozymandros/unity-mcp-server:<tag>
```

- If the image is **private**, authenticate to GHCR before `pull` / `run`, e.g. [GitHub docs: Working with the Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) (`docker login ghcr.io` with a PAT that has `read:packages`).
- For **Unity-Generator** integration over **HTTP**, publish the port the server uses for **Streamable HTTP**, then set **`UNITY_MCP_SERVER_URL`** (see table below).

You can also build/run from a local **`Dockerfile`** / **`docker-compose.yml`** in the **[Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server)** repo if you prefer; the **GHCR** image is the usual binary-free install path.

#### How GHCR Docker maps to this app

| Integration path in this app | Transport | How Docker usually fits |
|------------------------------|-----------|-------------------------|
| **Finalize / orchestrator** (`unity_mcp_client.py`) | **Streamable HTTP** if you set **`UNITY_MCP_SERVER_URL`** | Run the container with a **published port** (e.g. `-p 8080:8080`). Set **`UNITY_USE_MCP=1`** and **`UNITY_MCP_SERVER_URL`** to the MCP HTTP endpoint the server exposes (must match upstream — often `http://127.0.0.1:<port>/...`). In `unity_mcp_client.py`, if **`UNITY_MCP_SERVER_URL`** is set, the **HTTP** client is used and **stdio** (`UNITY_MCP_COMMAND`) is not used for that call. |
| **Semantic Kernel agent** (`unity_mcp_plugin.py`) | **stdio** (spawns **`UNITY_MCP_COMMAND`**) | A container is **not** a drop-in replacement unless you run a **host binary** or a small wrapper. Prefer installing the server on the host for the agent, or extend **`unity-mcp-plugin`** / server to support HTTP for the SK path (not configured in this repo today). |

**Typical Docker flow for this app (HTTP-capable server):**

1. **Pull** from GHCR and **run** the container (see [package tags](https://github.com/Ozymandros/Unity-MCP-Server/pkgs/container/unity-mcp-server)):

   ```bash
   docker pull ghcr.io/ozymandros/unity-mcp-server:<tag>
   docker run --rm -p <HOST_PORT>:<CONTAINER_PORT> ghcr.io/ozymandros/unity-mcp-server:<tag>
   ```

   Alternatively, use **`docker compose`** or a **Dockerfile** from the **[Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server)** repo if upstream documents it.

2. Confirm the Unity Editor / MCP server can still communicate (same machine or documented networking).

3. For **finalize** MCP tools, set for the backend process:

   ```sh
   set UNITY_USE_MCP=1
   set UNITY_MCP_SERVER_URL=http://127.0.0.1:<PORT><path-if-required>
   ```

   Use the **same URL** your browser or `curl` would use for the server’s **Streamable HTTP** MCP endpoint per upstream docs.

4. For HTTP-only finalize flows, **`UNITY_MCP_SERVER_URL`** alone is enough for `unity_mcp_client` (stdio command is skipped when the URL is set).

**Security:** If the container exposes MCP on a network interface, restrict with firewall, bind to `127.0.0.1`, or upstream auth tokens — do not expose an unsecured MCP endpoint to the internet.

---

## What this app uses it for

- **Semantic Kernel agent** (`unity_mcp_plugin.py`): spawns/connects to the server process for **tool discovery** and Unity automation from the LLM.
- **Finalize / orchestrator** (`unity_mcp_client.py`, optional): when **`UNITY_USE_MCP=1`**, uses the MCP Python SDK to call **Unity-MCP-Server** tools (e.g. package install, scene setup) over **stdio** or **Streamable HTTP**.

---

## Where configuration is defined in this repository

### 1. Environment variables (runtime — backend)

| Variable | Purpose | Default / notes |
|----------|-----------|-----------------|
| **`UNITY_MCP_COMMAND`** | Path or name of the **server executable** (not your Unity project folder). | `unity-mcp` |
| **`UNITY_MCP_ARGS`** | Extra arguments passed to that executable (space-separated in code). | empty |
| **`UNITY_MCP_SERVER_URL`** | Optional **HTTP** MCP endpoint (Streamable HTTP). If set, used when applicable; otherwise **stdio** via `UNITY_MCP_COMMAND`. | empty |
| **`UNITY_USE_MCP`** | **`1` / `true` / `yes`** enables MCP in **`unity_mcp_client.py`** (finalize/orchestrator path). | off (MCP client not used) |

**Code references:**

- `backend/app/agents/unity_mcp_plugin.py` — `UNITY_MCP_COMMAND`, `UNITY_MCP_ARGS` (SK plugin).
- `backend/app/services/unity_mcp_client.py` — `UNITY_USE_MCP`, `UNITY_MCP_SERVER_URL`, `UNITY_MCP_COMMAND`, `UNITY_MCP_ARGS`.

### 2. Sample MCP JSON (optional)

- **`backend/mcp_config.json`** — example `mcpServers.unity-mcp-server` with `command` / `args` (for tools that consume MCP-style config; **not** the only source of truth for FastAPI).

### 3. Cursor / VS Code MCP (IDE only)

- **`.vscode/mcp.json`** — **`mcpServers.unity-mcp-server`**: `command` + `args` for the **editor** MCP client. This configures **Cursor/VS Code**, not the Unity-Generator backend unless you mirror the same env vars.

**Important:** `UNITY_MCP_*` env vars apply to **Python processes** (backend). The IDE file is separate; keep **`unity-mcp`** on `PATH` or align `command` with the same binary you use for the backend.

### 4. Docs cross-references

- **`docs/DEVELOPMENT.md`** — Automation mode (`UNITY_USE_MCP`, batch vs MCP).
- **`docs/UNITY_MCP_INTEGRATION.md`** — End-to-end SK + server overview.
- **`backend/app/agents/SKILLS_USAGE.md`** — Unity MCP skill notes and server link.

---

## Path terminology (server vs Unity project)

- **`UNITY_MCP_COMMAND`** must point to the **MCP server binary** (e.g. `unity-mcp` or `UnityMcp.Server.exe`), **not** to the Unity project root (`Assets/`).
- Your **Unity project path** is passed separately to tools (e.g. `projectPath` / session) — see [UNITY_MCP_INTEGRATION.md](./UNITY_MCP_INTEGRATION.md) § Path terminology.

---

## Quick checklist

1. Install **Unity-MCP-Server** from **[GitHub](https://github.com/Ozymandros/Unity-MCP-Server)** (upstream README), **or** run it from **[GHCR](https://github.com/Ozymandros/Unity-MCP-Server/pkgs/container/unity-mcp-server)** (`docker pull ghcr.io/ozymandros/unity-mcp-server:<tag>` — see [Docker install from GHCR](#docker-install-from-ghcr)).
2. Ensure the server is running with Unity / Editor as required by that project.
3. Set **`UNITY_MCP_COMMAND`** if `unity-mcp` is not on `PATH` (stdio / SK agent path).
4. For finalize MCP automation, set **`UNITY_USE_MCP=1`** and configure **stdio** (`UNITY_MCP_COMMAND`) or **`UNITY_MCP_SERVER_URL`** (Docker/HTTP) per `unity_mcp_client.py`.

---

## Related repositories

| Role | GitHub |
|------|--------|
| **MCP server (this page)** | [Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server) |
| **Python SK bridge (`unity_mcp` package)** | [Unity-MCP-SK-Plugin](https://github.com/Ozymandros/Unity-MCP-SK-Plugin) |
