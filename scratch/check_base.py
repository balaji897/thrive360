import urllib.request
import re
from urllib.parse import urljoin

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

req = urllib.request.Request('https://qiscet.edu.in/', headers=headers)
html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')

# find base href
base_match = re.search(r'<base\s+href=["\']([^"\']+)["\']', html, re.I)
base_url = base_match.group(1) if base_match else 'https://qiscet.edu.in/'
print("Base URL:", base_url)

for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I):
    rel = m.group(1)
    full = urljoin(base_url, rel)
    print("Found img:", rel, "->", full)
