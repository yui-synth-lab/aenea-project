import os
import hashlib
import json
import csv
from pathlib import Path

DIRECTORY = r"E:\Projects\Git\github\aenea-project\knowledge"
REPORT_FILE = r"E:\Projects\Git\github\aenea-project\knowledge_inventory.csv"

def get_file_hash(filepath):
    hasher = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None

def analyze_file(filepath, seen_hashes):
    # Basic stats
    size_bytes = os.path.getsize(filepath)
    size_kb = size_bytes / 1024
    ext = Path(filepath).suffix.lower()
    
    issues = []
    lines = 0
    topic = "Unknown"
    content_text = ""
    
    # Duplicate check
    f_hash = get_file_hash(filepath)
    if f_hash:
        if f_hash in seen_hashes:
            issues.append(f"Duplicate content (matches {seen_hashes[f_hash]})")
        else:
            seen_hashes[f_hash] = Path(filepath).name

    # Try reading as UTF-8
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            if size_bytes < 5 * 1024 * 1024:  # read fully if < 5MB
                content_text = f.read()
                lines = content_text.count('\n') + 1
            else:
                # Read first 1000 lines for large files
                head_lines = []
                for _ in range(1000):
                    line = f.readline()
                    if not line:
                        break
                    head_lines.append(line)
                content_text = "".join(head_lines)
                lines = f"~{size_bytes // 50} (est)" # rough estimation
    except UnicodeDecodeError:
        issues.append("Encoding issues (Not valid UTF-8)")
    except Exception as e:
        issues.append(f"Read error: {str(e)}")

    if not content_text and size_bytes > 0 and "Encoding issues" not in issues:
        pass # maybe binary

    # Topic extraction & Structure validation
    if ext == '.json':
        try:
            if content_text:
                data = json.loads(content_text)
                if isinstance(data, dict):
                    keys = list(data.keys())[:5]
                    topic = f"JSON Object (Keys: {', '.join(keys)})"
                elif isinstance(data, list):
                    topic = f"JSON Array ({len(data)} items)"
                else:
                    topic = "JSON Value"
        except json.JSONDecodeError:
            issues.append("Malformed structure (Invalid JSON)")
            topic = "Invalid JSON"
            
    elif ext == '.csv':
        try:
            if content_text:
                reader = csv.reader(content_text.splitlines())
                header = next(reader, [])
                topic = f"CSV Data (Cols: {', '.join(header[:5])})"
                # Check for inconsistent columns
                for row in reader:
                    if len(row) != len(header):
                        issues.append("Malformed structure (Inconsistent CSV columns)")
                        break
        except Exception:
            issues.append("Malformed structure (Invalid CSV)")
            
    elif ext in ['.md', '.txt']:
        first_lines = [l.strip() for l in content_text.splitlines() if l.strip()]
        if first_lines:
            topic = first_lines[0][:100]
        else:
            topic = "Empty Text File"
            
    elif ext in ['.py', '.js', '.ts', '.html']:
        topic = f"Source Code ({ext})"
        if ext == '.py' and 'def ' not in content_text and 'class ' not in content_text:
            pass # just a script
            
    else:
        if size_bytes == 0:
            topic = "Empty File"
            issues.append("Missing fields / Empty File")
        else:
            topic = f"Binary/Other ({ext})"

    # Inappropriate content checks for RAG
    text_lower = content_text.lower()
    if ext in ['.py', '.js', '.ts', '.css', '.html', '.csv'] and size_bytes > 0:
        issues.append("Inappropriate format for RAG (Code/Raw Data without prose context)")
    
    if "lorem ipsum" in text_lower:
        issues.append("Inappropriate content (Placeholder text)")
    if "testtest" in text_lower or "dummy data" in text_lower:
        issues.append("Inappropriate content (Test/Dummy data)")

    if size_bytes == 0:
        issues.append("Empty file")

    return {
        "Filename": str(Path(filepath).relative_to(DIRECTORY)),
        "Format": ext if ext else "None",
        "Size (KB)": f"{size_kb:.2f}",
        "Lines": str(lines),
        "Topic": topic.replace(',', ';').replace('\n', ' '), # safe for csv
        "Quality Issues": " | ".join(issues) if issues else "OK"
    }

def main():
    seen_hashes = {}
    results = []
    
    for root, _, files in os.walk(DIRECTORY):
        # Skip git or node_modules inside knowledge if any
        if '.git' in root or 'node_modules' in root:
            continue
        for file in files:
            filepath = os.path.join(root, file)
            res = analyze_file(filepath, seen_hashes)
            results.append(res)
            
    # Write to CSV
    with open(REPORT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["Filename", "Format", "Size (KB)", "Lines", "Topic", "Quality Issues"])
        writer.writeheader()
        writer.writerows(results)
        
    print(f"Processed {len(results)} files. Report saved to {REPORT_FILE}")

if __name__ == "__main__":
    main()
