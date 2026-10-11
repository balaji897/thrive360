import urllib.request
import os
import urllib.parse

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

base_url = 'https://qiscet.edu.in/qiscet/'
items = [
    ('images/full_head_qiscet copy.JPG', 'logo_header.jpg'),
    ('images/SA 1.jpg', 'campus_sa1.jpg'),
    ('images/SA112.jpg', 'campus_sa112.jpg'),
    ('images/qiscetGal_1.jpg', 'campus_gal1.jpg'),
    ('images/qiscetGal_2.jpg', 'campus_gal2.jpg'),
    ('images/qiscetGal_3.jpg', 'campus_gal3.jpg'),
    ('images/qiscetGal_4.jpg', 'campus_gal4.jpg'),
    ('images/s2.jpg', 'campus_s2.jpg'),
    ('images/s3.jpg', 'campus_s3.jpg'),
    ('images/s4.jpg', 'campus_s4.jpg'),
    ('images/s5.jpg', 'campus_s5.jpg'),
    ('images/s6.jpg', 'campus_s6.jpg'),
    ('images/s7.jpg', 'campus_s7.jpg'),
    ('images/office.png', 'campus_office.png')
]

os.makedirs('frontend/public/images', exist_ok=True)

downloaded = []
for rel, fname in items:
    quoted_rel = urllib.parse.quote(rel)
    full_url = urllib.parse.urljoin(base_url, quoted_rel)
    dest = os.path.join('frontend/public/images', fname)
    try:
        req = urllib.request.Request(full_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            with open(dest, 'wb') as f:
                f.write(data)
            print(f"SUCCESS {fname}: {len(data)} bytes ({full_url})")
            downloaded.append((fname, len(data)))
    except Exception as e:
        print(f"FAILED {fname}: {e} ({full_url})")

print("Total downloaded:", len(downloaded))
