# API Contract

Rule: do not change a URL, field name, or response shape without telling the other person.

## Conventions
- All requests and responses are JSON, except `/api/qr` (PNG image) and `/api/card` (PDF).
- Endpoints marked 🔒 need a logged-in user.
- Errors always look like: `{ "error": "Human-readable message" }`
- Status codes: 200 OK, 201 created, 400 bad input, 401 not logged in, 404 not found, 429 too many requests.

## Profile fields
| Field | Type | Notes |
|---|---|---|
| full_name | string | required |
| age | number | required |
| blood_group | string | one of A+, A-, B+, B-, AB+, AB-, O+, O- |
| allergies | string[] | e.g. ["Penicillin"] |
| conditions | string[] | e.g. ["Type 2 diabetes"] |
| medicines | string[] | e.g. ["Metformin 500mg"] |
| doctor_name | string | optional |
| contacts | array | 1 to 3 items: { name, phone, relation } |
| public | object | true/false per field: allergies, conditions, medicines, doctor_name |

Always public: full_name, blood_group, contacts (an emergency page without them is useless).

---

## 1. POST /api/profile 🔒
Create a profile.

Request:
```json
{
  "full_name": "Ravi Kumar",
  "age": 72,
  "blood_group": "B+",
  "allergies": ["Penicillin"],
  "conditions": ["Type 2 diabetes", "Hypertension"],
  "medicines": ["Metformin 500mg", "Amlodipine 5mg"],
  "doctor_name": "Dr. Meena Rao",
  "contacts": [
    { "name": "Anita Kumar", "phone": "+919800000001", "relation": "Daughter" }
  ],
  "public": { "allergies": true, "conditions": true, "medicines": true, "doctor_name": false }
}
```
Response 201:
```json
{ "id": "a1b2c3d4", "public_token": "k9Xp2LmQ7vTz4RwY8nBc3H" }
```

## 2. PUT /api/profile/[id] 🔒
Update a profile. Request: same as above. Response 200: the full updated profile (same shape as endpoint 4).

## 3. GET /api/profile 🔒
List the logged-in user's profiles. Response 200:
```json
[
  { "id": "a1b2c3d4", "full_name": "Ravi Kumar", "blood_group": "B+", "created_at": "2026-11-27T09:30:00Z" }
]
```

## 4. GET /api/profile/[id] 🔒
One full profile, for the edit form. Response 200:
```json
{
  "id": "a1b2c3d4",
  "public_token": "k9Xp2LmQ7vTz4RwY8nBc3H",
  "full_name": "Ravi Kumar",
  "age": 72,
  "blood_group": "B+",
  "allergies": ["Penicillin"],
  "conditions": ["Type 2 diabetes", "Hypertension"],
  "medicines": ["Metformin 500mg", "Amlodipine 5mg"],
  "doctor_name": "Dr. Meena Rao",
  "contacts": [
    { "name": "Anita Kumar", "phone": "+919800000001", "relation": "Daughter" }
  ],
  "public": { "allergies": true, "conditions": true, "medicines": true, "doctor_name": false }
}
```

## 5. GET /api/public/[token] (no login)
Used by the emergency page. Returns ONLY public fields. Never returns owner id, email, or the profile id.
Also logs the scan and triggers the Telegram alert.

Response 200 (doctor_name was marked private, so it is absent):
```json
{
  "full_name": "Ravi Kumar",
  "age": 72,
  "blood_group": "B+",
  "allergies": ["Penicillin"],
  "conditions": ["Type 2 diabetes", "Hypertension"],
  "medicines": ["Metformin 500mg", "Amlodipine 5mg"],
  "contacts": [
    { "name": "Anita Kumar", "phone": "+919800000001", "relation": "Daughter" }
  ]
}
```
Response 404: `{ "error": "Profile not found" }`
Response 429: `{ "error": "Too many requests" }`

## 6. GET /api/qr/[id] 🔒
Returns a PNG image of a QR code that points to `https://<site>/e/<public_token>`.

## 7. GET /api/card/[id] 🔒
Returns a printable PDF card (name, blood group, allergies, QR, "Scan in emergency").

---

## Pages (frontend routes)
| Route | Login needed |
|---|---|
| /login, /signup | no |
| /dashboard | yes |
| /profile/new | yes |
| /profile/[id]/edit | yes |
| /e/[token] | no (public emergency page) |

## Database tables (owned by B)
- profiles: id, owner_id, public_token, full_name, age, blood_group, allergies, conditions, medicines, doctor_name, public (json), created_at
- contacts: id, profile_id, name, phone, relation
- scan_logs: id, profile_id, scanned_at