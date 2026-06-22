import os
import re

TARGET_DIRS = ["frontend/src/app", "frontend/src/components"]

# Regex map using word boundaries and precise tailwind matching
REPLACEMENTS = {
    r'\btext-\[9px\]\b': 'text-[10px]',
    r'\btext-\[10px\]\b': 'text-xs',
    r'\btext-gray-600\b': 'text-gray-400',
    r'\btext-gray-500\b': 'text-gray-300'
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, repl in REPLACEMENTS.items():
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

for d in TARGET_DIRS:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

print("Typography update complete.")
