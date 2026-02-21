
import logging
from semantic_kernel.connectors.mcp import MCPStdioPlugin

def create_unity_mcp_plugin() -> MCPStdioPlugin:
    """
    Crea el plugin fent servir l'eina global instal·lada al sistema.
    Net, portàtil i professional.
    """
    logger = logging.getLogger("unity_mcp_plugin")
    logger.info("Creating UnityMCP plugin...")
    try:
        plugin = MCPStdioPlugin(
            name="UnityMCP",
            description="Unity Editor automation tools",
            # Simplement fem servir el nom de l'eina global
            command="unity-mcp", 
            args=[],
            load_tools=True,
            request_timeout=30,
        )
        logger.info("UnityMCP plugin created successfully.")
        return plugin
    except Exception as e:
        logger.error(f"Failed to create UnityMCP plugin: {e}")
        raise