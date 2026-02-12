import logging
import sys
import os

# Add parent directory to sys.path to import agents.unity_skills
sys.path.append(os.path.abspath('.'))

from agents.unity_skills import UnityCodeSkill

logging.basicConfig(level=logging.WARNING)

skill = UnityCodeSkill()
valid_code = """
using UnityEngine;

public class TestScript : MonoBehaviour
{
    void Start()
    {
        Debug.Log("Hello");
    }
}
"""

print(f"Validating code:\n{valid_code}")
result = skill.validate_syntax(valid_code)
print(f"Result: {result}")

if not result:
    print("FAILED")
    # Let's see which line caused it if we can
    for i, line in enumerate(valid_code.splitlines()):
        if line.count('"') % 2 != 0:
            print(f"Line {i+1} has odd number of quotes: {line}")
else:
    print("PASSED")
