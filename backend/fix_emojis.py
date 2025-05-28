#!/usr/bin/env python3
"""Script para reemplazar emojis por texto simple en archivos Python"""

import re

def fix_emojis_in_file(filename):
    """Reemplazar emojis por texto simple en un archivo"""
    emoji_replacements = {
        '🚀': '[START]',
        '📊': '[DATA]',
        '🔄': '[PROCESS]',
        '📍': '[INIT]',
        '🏢': '[ORG]',
        '👥': '[CLIENTS]',
        '👤': '[USERS]',
        '📋': '[PROJECTS]',
        '📖': '[EPICS]',
        '🎫': '[TICKETS]',
        '⏰': '[TIME]',
        '✅': '[OK]',
        '❌': '[ERROR]',
        '🎉': '[SUCCESS]',
        '⚠️': '[WARN]',
        'ℹ️': '[INFO]',
        '🔧': '[TOOL]'
    }
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Reemplazar emojis
        for emoji, replacement in emoji_replacements.items():
            content = content.replace(emoji, replacement)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"[OK] Fixed emojis in {filename}")
        return True
    except Exception as e:
        print(f"[ERROR] Error fixing {filename}: {e}")
        return False

if __name__ == "__main__":
    files_to_fix = [
        "app/core/init_data.py",
        "verify_and_fix_db.py"
    ]
    
    for file in files_to_fix:
        fix_emojis_in_file(file)
    
    print("[OK] All emojis fixed!") 