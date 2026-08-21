import urllib.request, json

def test(url, method='GET', data=None, headers={}):
    req = urllib.request.Request(url, method=method, headers=headers)
    body = json.dumps(data).encode('utf-8') if data else None
    if data:
        req.add_header('Content-Type', 'application/json')
    for k, v in headers.items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, data=body) as resp:
            print(f"[{method}] {url} -> Status {resp.status}")
            return resp.read().decode('utf-8')
    except Exception as e:
        print(f"[{method}] {url} -> ERROR: {e}")

print("--- MULTI-CARD API & ROUTES VERIFICATION ---")
cards_res = test("http://localhost:8000/api/cards")
cards = json.loads(cards_res)
print("Loaded", len(cards), "invitation cards from DB.")
for c in cards:
    print(f" - Card ID {c['id']}: slug = {c['slug']}")

# Test card slug endpoints
c1 = test("http://localhost:8000/api/cards/nguyen-hoai-nam-f6034e")
c2 = test("http://localhost:8000/api/cards/thuy-linh-ttna-08")

# Test web routes
r1 = test("http://localhost:8000/t/nguyen-hoai-nam-f6034e")
r2 = test("http://localhost:8000/t/thuy-linh-ttna-08")
admin_page = test("http://localhost:8000/admin")

# Test Create 3rd card via Admin API
new_card_res = test("http://localhost:8000/api/cards", method="POST", data={
    "slug": "tran-van-a-2026",
    "person_name": "Trần Văn A",
    "degree_title": "Kỹ sư Phần mềm",
    "school_name": "Đại Học Bách Khoa",
    "event_date": "2026-10-10T10:00:00",
    "event_location": "Hội Trường C1",
    "event_address": "Số 1 Đại Cồ Việt, Hà Nội",
    "custom_message": "Mời bạn tới tham dự Lễ Tốt Nghiệp!"
}, headers={"X-Admin-Passcode": "123456"})

# Test RSVP submission for card 1
rsvp_res = test("http://localhost:8000/api/rsvps", method="POST", data={
    "card_id": cards[0]["id"],
    "guest_name": "Lê Văn Cường",
    "phone": "0987654321",
    "attending": True,
    "guest_count": 1,
    "note": "Chúc mừng Nam bro nhé!"
})
