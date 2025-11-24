# Import Mockup Document

## Overview

This mockup simulates the **first activity** for the client: importing an existing database into our system. It includes a variety of realistic scenarios to test all import functionalities.

---

## 1. Data Model Overview

| Field Name | Data Type | Description | Required | Example |
|------------|-----------|-------------|----------|---------|
| `student_id` | UUID | Unique identifier for each student | Yes | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |
| `first_name` | String | Student's first name | Yes | `Ana` |
| `last_name` | String | Student's last name | Yes | `Silva` |
| `email` | String (email) | Contact email | Yes | `ana.silva@example.com` |
| `birth_date` | Date (YYYY-MM-DD) | Date of birth | No | `1998-04-12` |
| `cohort_id` | UUID | Reference to the cohort the student belongs to | Yes | `d2c9e1b2-4f3a-4a9e-9c1b-5e7f9a2b6c3d` |
| `enrollment_status` | Enum (`active`, `pending`, `canceled`) | Current status | Yes | `active` |
| `created_at` | Timestamp | Record creation time | Yes | `2025-11-01T10:23:45Z` |

---

## 2. Sample Data Sets

### 2.1 Valid Full Dataset (All fields present and correct)

```json
[
  {
    "student_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "first_name": "Ana",
    "last_name": "Silva",
    "email": "ana.silva@example.com",
    "birth_date": "1998-04-12",
    "cohort_id": "d2c9e1b2-4f3a-4a9e-9c1b-5e7f9a2b6c3d",
    "enrollment_status": "active",
    "created_at": "2025-11-01T10:23:45Z"
  },
  {
    "student_id": "7b9c3e2d-8f5a-4d6b-9a3e-2c1f4b5e6d7f",
    "first_name": "Bruno",
    "last_name": "Costa",
    "email": "bruno.costa@example.com",
    "birth_date": "2000-09-30",
    "cohort_id": "d2c9e1b2-4f3a-4a9e-9c1b-5e7f9a2b6c3d",
    "enrollment_status": "pending",
    "created_at": "2025-11-02T08:15:00Z"
  }
]
```

---

### 2.2 Missing Optional Fields (e.g., `birth_date` omitted)

```json
[
  {
    "student_id": "9c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
    "first_name": "Carla",
    "last_name": "Mendes",
    "email": "carla.mendes@example.com",
    "cohort_id": "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "enrollment_status": "active",
    "created_at": "2025-11-03T14:45:20Z"
  }
]
```

---

### 2.3 Duplicate Records (same `student_id`)

```json
[
  {
    "student_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "first_name": "Ana",
    "last_name": "Silva",
    "email": "ana.duplicate@example.com",
    "birth_date": "1998-04-12",
    "cohort_id": "d2c9e1b2-4f3a-4a9e-9c1b-5e7f9a2b6c3d",
    "enrollment_status": "active",
    "created_at": "2025-11-04T09:00:00Z"
  }
]
```

---

### 2.4 Invalid Formats (malformed email, wrong date format)

```json
[
  {
    "student_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "first_name": "Diego",
    "last_name": "Ramos",
    "email": "diego.ramos[at]example.com",
    "birth_date": "12-31-1995",
    "cohort_id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    "enrollment_status": "active",
    "created_at": "2025-11-05T11:22:33Z"
  }
]
```

---

### 2.5 Edge Cases (extremely long strings, Unicode characters)

```json
[
  {
    "student_id": "ffffffff-ffff-ffff-ffff-ffffffffffff",
    "first_name": "Álvaro",
    "last_name": "Ñáñez",
    "email": "alvaro.náñez@example.com",
    "birth_date": "1995-07-20",
    "cohort_id": "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
    "enrollment_status": "active",
    "created_at": "2025-11-06T13:00:00Z"
  }
]
```

---

## 3. Import Scenarios Summary

- **Scenario A:** Full valid dataset – should import without errors.
- **Scenario B:** Missing optional fields – system must accept nulls for optional columns.
- **Scenario C:** Duplicate `student_id` – should trigger duplicate‑record handling (skip, merge, or error based on configuration).
- **Scenario D:** Invalid formats – validation errors must be reported with precise field messages.
- **Scenario E:** Edge cases – test limits on field length, Unicode handling, and performance with very large payloads.

---

*Use this mockup to feed the import routine and verify that all validation, error‑handling, and performance paths are exercised.*
