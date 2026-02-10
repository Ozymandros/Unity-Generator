"""
Core Semantic Kernel skills wrapper.

This module provides access to Microsoft's core Semantic Kernel plugins
if available, or provides fallback implementations.
"""

import logging
from typing import Optional

try:
    from semantic_kernel.functions import kernel_function
except ImportError:
    # Fallback for when semantic-kernel is not available
    def kernel_function(name: str = None, description: str = None):
        def decorator(func):
            return func
        return decorator

LOGGER = logging.getLogger(__name__)


class TextSkill:
    """
    Text manipulation skills (wraps Semantic Kernel core TextPlugin if available).
    
    Provides basic text operations like trimming, concatenation, etc.
    """

    @kernel_function(
        name="trim_text",
        description="Trims whitespace from the start and end of text."
    )
    def trim(self, text: str) -> str:
        """
        Trim whitespace from the start and end of text.
        
        Args:
            text: Text to trim.
        
        Returns:
            Trimmed text.
        
        Example:
            >>> skill = TextSkill()
            >>> skill.trim("  hello world  ")
            'hello world'
        """
        if not isinstance(text, str):
            return str(text).strip()
        return text.strip()

    @kernel_function(
        name="uppercase_text",
        description="Converts text to uppercase."
    )
    def uppercase(self, text: str) -> str:
        """
        Convert text to uppercase.
        
        Args:
            text: Text to convert.
        
        Returns:
            Uppercase text.
        
        Example:
            >>> skill = TextSkill()
            >>> skill.uppercase("hello")
            'HELLO'
        """
        if not isinstance(text, str):
            return str(text).upper()
        return text.upper()

    @kernel_function(
        name="lowercase_text",
        description="Converts text to lowercase."
    )
    def lowercase(self, text: str) -> str:
        """
        Convert text to lowercase.
        
        Args:
            text: Text to convert.
        
        Returns:
            Lowercase text.
        
        Example:
            >>> skill = TextSkill()
            >>> skill.lowercase("HELLO")
            'hello'
        """
        if not isinstance(text, str):
            return str(text).lower()
        return text.lower()


class TimeSkill:
    """
    Time-related skills (wraps Semantic Kernel core TimePlugin if available).
    
    Provides date and time formatting and manipulation.
    """

    @kernel_function(
        name="get_current_time",
        description="Gets the current date and time in ISO format."
    )
    def get_current_time(self) -> str:
        """
        Get the current date and time in ISO format.
        
        Returns:
            Current datetime as ISO format string.
        
        Example:
            >>> skill = TimeSkill()
            >>> time_str = skill.get_current_time()
            >>> "T" in time_str  # ISO format includes T separator
            True
        """
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()

    @kernel_function(
        name="format_date",
        description="Formats a date string according to the specified format."
    )
    def format_date(self, date_str: str, format_str: str = "%Y-%m-%d") -> str:
        """
        Format a date string according to the specified format.
        
        Args:
            date_str: Date string to format (ISO format expected).
            format_str: Python strftime format string. Defaults to "%Y-%m-%d".
        
        Returns:
            Formatted date string.
        
        Example:
            >>> skill = TimeSkill()
            >>> skill.format_date("2024-01-15T10:30:00", "%B %d, %Y")
            'January 15, 2024'
        """
        from datetime import datetime
        
        try:
            # Try parsing ISO format
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            return dt.strftime(format_str)
        except Exception as e:
            LOGGER.warning(f"Failed to format date {date_str}: {e}")
            return date_str


class MathSkill:
    """
    Mathematical operations skills (wraps Semantic Kernel core MathPlugin if available).
    
    Provides basic mathematical operations.
    """

    @kernel_function(
        name="add_numbers",
        description="Adds two numbers together."
    )
    def add(self, a: float, b: float) -> float:
        """
        Add two numbers.
        
        Args:
            a: First number.
            b: Second number.
        
        Returns:
            Sum of a and b.
        
        Example:
            >>> skill = MathSkill()
            >>> skill.add(5, 3)
            8.0
        """
        try:
            return float(a) + float(b)
        except (ValueError, TypeError) as e:
            LOGGER.error(f"Failed to add {a} and {b}: {e}")
            raise ValueError(f"Cannot add {a} and {b}: {e}")

    @kernel_function(
        name="multiply_numbers",
        description="Multiplies two numbers together."
    )
    def multiply(self, a: float, b: float) -> float:
        """
        Multiply two numbers.
        
        Args:
            a: First number.
            b: Second number.
        
        Returns:
            Product of a and b.
        
        Example:
            >>> skill = MathSkill()
            >>> skill.multiply(5, 3)
            15.0
        """
        try:
            return float(a) * float(b)
        except (ValueError, TypeError) as e:
            LOGGER.error(f"Failed to multiply {a} and {b}: {e}")
            raise ValueError(f"Cannot multiply {a} and {b}: {e}")
