import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

urls = [
    'https://qiscet.edu.in/',
    'https://qiscet.edu.in/qiscet/',
    'https://qis.edu.in/'
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            print(f"=== {url} ===")
            imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I)
            for img in imgs[:15]:
                print(img)
            bg_imgs = re.findall(r'url\(["\']?([^"\'\)]+\.(?:jpg|png|webp|jpeg))["\']?\)', html, re.I)
            for bg in bg_imgs[:10]:
                print("BG:", bg)
    except Exception as e:
        print(f"Error for {url}:", e)
