# Dokumentasi API Project Seal2

Dokumentasi ini menjelaskan endpoint API yang tersedia untuk autentikasi pengguna (Register, Login, Logout, Me), OAuth (Google, GitHub, Discord), dan Manajemen Cuti (Leave Management).

## Base URL

- **Root**: `/`
- **API Prefix**: `/api/v1`

## Daftar Endpoint

### 1. General

#### Check Server
Memeriksa apakah server berjalan dengan baik.

- **URL**: `/`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "hello": "world"
  }
  ```

---

## 2. Autentikasi (Email & Password)

#### Register
Mendaftarkan pengguna baru.

- **URL**: `/api/v1/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "password_confirmation": "Password123",
    "username": "johndoe"
  }
  ```
- **Response Sukses (201)**:
  ```json
  {
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "uuid-1",
        "username": "johndoe",
        "email": "user@example.com",
        "avatarUrl": null,
        "createdAt": "2026-01-07T08:19:28.442Z",
        "updatedAt": "2026-01-07T08:19:28.442Z"
      }
    }
  }
  ```
- **Error**:
  - `400`: Validasi gagal (email invalid, password tidak memenuhi kriteria, dll)
  - `409`: Email atau Username sudah terdaftar

#### Login
Masuk ke aplikasi menggunakan email dan password. Login menggunakan **Session-based Authentication** (cookie).

- **URL**: `/api/v1/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- **Response Sukses (200)**:
  ```json
  {
    "message": "Login successful",
    "data": {
      "user": {
        "id": "uuid-1",
        "username": "johndoe",
        "email": "user@example.com",
        "avatarUrl": null,
        "createdAt": "2026-01-07T08:19:28.442Z",
        "updatedAt": "2026-01-07T08:19:28.442Z"
      },
      "token": ""
    }
  }
  ```
- **Error**:
  - `401`: Email atau password salah
- **Catatan**: Server akan secara otomatis menyimpan session di cookie bernama `adonis-session`

#### Logout
Keluar dari sesi aplikasi. Endpoint ini dilindungi oleh middleware `auth:web`.

- **URL**: `/api/v1/logout`
- **Method**: `POST`
- **Headers**: Cookie session (otomatis dikirim oleh browser)
- **Response Sukses (200)**:
  ```json
  {
    "message": "Logout successful"
  }
  ```
- **Error**:
  - `401`: Tidak ada session aktif

#### Profil Saya (Me)
Mendapatkan informasi pengguna yang sedang login. Endpoint ini dilindungi oleh middleware `auth:web`.

- **URL**: `/api/v1/me`
- **Method**: `GET`
- **Headers**: Cookie session
- **Response Sukses (200)**:
  ```json
  {
    "message": "Profile retrieved",
    "data": {
      "id": "uuid-1",
      "username": "johndoe",
      "email": "user@example.com",
      "avatarUrl": null,
      "createdAt": "2026-01-07T08:19:28.442Z",
      "updatedAt": "2026-01-07T08:19:28.442Z"
    }
  }
  ```
- **Error**:
  - `401`: Tidak ada session aktif

---

## 3. OAuth (Social Login)

Mendukung login menggunakan akun Google, GitHub, dan Discord. OAuth menggunakan **Session-based Authentication** (sama seperti login email/password).

### Alur OAuth Login

1. **Pengguna mengklik tombol login dengan provider** (Google/GitHub/Discord).
2. **Aplikasi mengarahkan ke URL redirect**:
   - Google: `/api/v1/auth/google`
   - GitHub: `/api/v1/auth/github`
   - Discord: `/api/v1/auth/discord`
3. **Pengguna melakukan autentikasi di provider** (jika belum login) dan memberikan izin kepada aplikasi.
4. **Provider mengarahkan kembali ke aplikasi ke URL callback**:
   - Google: `/api/v1/auth/google/callback`
   - GitHub: `/api/v1/auth/github/callback`
   - Discord: `/api/v1/auth/discord/callback`
5. **Aplikasi memproses data dari provider**:
   - Jika pengguna baru, maka pengguna akan didaftarkan secara otomatis.
   - Jika sudah terdaftar, maka sesi akan dibuat dan pengguna akan diarahkan ke halaman utama aplikasi.

### Daftar OAuth Provider

#### Google OAuth

- **URL Redirect**: `/api/v1/auth/google` (GET)
- **URL Callback**: `/api/v1/auth/google/callback` (GET)

#### GitHub OAuth

- **URL Redirect**: `/api/v1/auth/github` (GET)
- **URL Callback**: `/api/v1/auth/github/callback` (GET)

#### Discord OAuth

- **URL Redirect**: `/api/v1/auth/discord` (GET)
- **URL Callback**: `/api/v1/auth/discord/callback` (GET)

---

## 4. Manajemen Cuti (Leave Management)

Endpoint untuk mengelola pengajuan cuti karyawan. Semua endpoint di bagian ini dilindungi oleh middleware `auth:web`.

### Business Rules

- **Kuota Cuti**: Setiap karyawan memiliki **12 hari cuti per tahun**.
- **Pengajuan**: Employee hanya dapat melihat dan mengajukan cuti mereka sendiri.
- **Approval**: Admin dapat melihat semua pengajuan cuti dan melakukan approve/reject.
- **Overlap Check**: Sistem akan mencegah pengajuan cuti yang tumpang tindih dengan cuti yang sudah di-approve.
- **Safe Delete**: Pengajuan cuti yang dihapus akan di-enkripsi untuk keamanan data.

### Employee Endpoints

#### Buat Pengajuan Cuti
Membuat pengajuan cuti baru sebagai employee dengan file attachment (opsional).

- **URL**: `/api/v1/leave/requests`
- **Method**: `POST`
- **Headers**: Cookie session (auth:web), Content-Type: multipart/form-data
- **Body** (Form Data):
  ```
  startDate: 2026-02-15
  endDate: 2026-02-20
  reason: Liburan keluarga ke Bali selama seminggu
  attachment: [file PDF/JPG/PNG/DOC/DOCX max 5MB] (optional)
  ```
- **Response Sukses (201)**:
  ```json
  {
    "message": "Pengajuan cuti berhasil dibuat",
    "data": {
      "id": "uuid-1",
      "userId": "uuid-user",
      "startDate": "2026-02-15",
      "endDate": "2026-02-20",
      "reason": "Liburan keluarga ke Bali selama seminggu",
      "attachment": "leave_attachments/uuid-1234567890.pdf",
      "status": "pending",
      "createdAt": "2026-01-07T08:19:28.442Z",
      "updatedAt": "2026-01-07T08:19:28.442Z"
    }
  }
  ```
- **Error**:
  - `400`: Validasi gagal (file terlalu besar, format tidak didukung, dll)
  - `400`: Tanggal cuti tumpang tindih
  - `400`: Kuota cuti tidak cukup
  - `401`: Tidak ada session aktif

#### Dapatkan Pengajuan Cuti Saya
Mendapatkan daftar semua pengajuan cuti milik employee (hanya yang belum dihapus).

- **URL**: `/api/v1/leave/requests`
- **Method**: `GET`
- **Headers**: Cookie session (auth:web)
- **Response Sukses (200)**:
  ```json
  {
    "message": "Pengajuan cuti berhasil diambil",
    "data": [
      {
        "id": "uuid-1",
        "userId": "uuid-user",
        "startDate": "2026-02-15",
        "endDate": "2026-02-20",
        "reason": "Liburan keluarga",
        "attachment": null,
        "status": "pending",
        "createdAt": "2026-01-07T08:19:28.442Z",
        "updatedAt": "2026-01-07T08:19:28.442Z"
      }
    ]
  }
  ```

#### Detail Pengajuan Cuti
Mendapatkan detail dari satu pengajuan cuti.

- **URL**: `/api/v1/leave/requests/:id`
- **Method**: `GET`
- **Headers**: Cookie session (auth:web)
- **Response Sukses (200)**:
  ```json
  {
    "message": "Detail pengajuan cuti berhasil diambil",
    "data": {
      "id": "uuid-1",
      "userId": "uuid-user",
      "startDate": "2026-02-15",
      "endDate": "2026-02-20",
      "reason": "Liburan keluarga",
      "attachment": null,
      "status": "pending",
      "createdAt": "2026-01-07T08:19:28.442Z",
      "updatedAt": "2026-01-07T08:19:28.442Z"
    }
  }
  ```
- **Error**:
  - `404`: Pengajuan cuti tidak ditemukan
  - `403`: Employee tidak dapat mengakses pengajuan cuti user lain
  - `401`: Tidak ada session aktif

#### Hapus Pengajuan Cuti (Safe Delete)
Menghapus pengajuan cuti dengan enkripsi data (hanya untuk admin, pengajuan dengan status pending).

- **URL**: `/api/v1/leave/requests/:id`
- **Method**: `DELETE`
- **Headers**: Cookie session (auth:web)
- **Response Sukses (200)**:
  ```json
  {
    "message": "Pengajuan cuti berhasil dihapus (data terenkripsi)"
  }
  ```
- **Error**:
  - `404`: Pengajuan cuti tidak ditemukan
  - `400`: Hanya pengajuan cuti dengan status pending yang dapat dihapus
  - `403`: Hanya admin yang dapat menghapus pengajuan cuti
  - `401`: Tidak ada session aktif
- **Catatan**: Data yang dihapus akan di-enkripsi dan disimpan di database dengan field `deleted_at` terisi. Data masih dapat dipulihkan oleh admin.

#### Dapatkan Kuota Cuti Saya
Mendapatkan informasi kuota cuti tahun ini.

- **URL**: `/api/v1/leave/quota`
- **Method**: `GET`
- **Headers**: Cookie session (auth:web)
- **Response Sukses (200)**:
  ```json
  {
    "message": "Kuota cuti berhasil diambil",
    "data": {
      "year": 2026,
      "quotaTotal": 12,
      "quotaUsed": 6,
      "quotaRemaining": 6
    }
  }
  ```

### Admin Endpoints

#### Dapatkan Semua Pengajuan Cuti
Mendapatkan daftar semua pengajuan cuti dari semua employee (Admin only, hanya yang belum dihapus).

- **URL**: `/api/v1/leave/admin/requests?page=1&limit=10`
- **Method**: `GET`
- **Headers**: Cookie session (auth:web)
- **Query Parameters**:
  - `page` (optional, default: 1): Halaman hasil
  - `limit` (optional, default: 10): Jumlah data per halaman
- **Response Sukses (200)**:
  ```json
  {
    "message": "Semua pengajuan cuti berhasil diambil",
    "data": {
      "data": [
        {
          "id": "uuid-1",
          "userId": "uuid-user1",
          "startDate": "2026-02-15",
          "endDate": "2026-02-20",
          "reason": "Liburan keluarga",
          "attachment": null,
          "status": "pending",
          "createdAt": "2026-01-07T08:19:28.442Z",
          "updatedAt": "2026-01-07T08:19:28.442Z"
        }
      ],
      "pagination": {
        "total": 25,
        "pages": 3
      }
    }
  }
  ```
- **Error**:
  - `403`: Hanya admin yang dapat mengakses endpoint ini
  - `401`: Tidak ada session aktif

#### Dapatkan Semua Pengajuan Cuti yang Dihapus
Mendapatkan daftar semua pengajuan cuti yang sudah di-delete (Admin only).

- **URL**: `/api/v1/leave/admin/requests/deleted?page=1&limit=10`
- **Method**: `GET`
- **Headers**: Cookie session (auth:web)
- **Query Parameters**:
  - `page` (optional, default: 1): Halaman hasil
  - `limit` (optional, default: 10): Jumlah data per halaman
- **Response Sukses (200)**:
  ```json
  {
    "message": "Daftar pengajuan cuti yang dihapus berhasil diambil",
    "data": {
      "data": [
        {
          "id": "uuid-1",
          "userId": "uuid-user1",
          "status": "pending",
          "deletedAt": "2026-01-08T10:30:00.000Z",
          "note": "Data terenkripsi. Gunakan restore endpoint untuk mengembalikan data."
        }
      ],
      "pagination": {
        "total": 5,
        "pages": 1
      }
    }
  }
  ```
- **Error**:
  - `403`: Hanya admin yang dapat mengakses endpoint ini
  - `401`: Tidak ada session aktif

#### Update Status Pengajuan Cuti
Approve atau reject pengajuan cuti (Admin only).

- **URL**: `/api/v1/leave/admin/requests/:id/status`
- **Method**: `PATCH`
- **Headers**: Cookie session (auth:web)
- **Body**:
  ```json
  {
    "status": "approved"
  }
  ```
- **Response Sukses (200)**:
  ```json
  {
    "message": "Status pengajuan cuti berhasil diperbarui",
    "data": {
      "id": "uuid-1",
      "userId": "uuid-user",
      "startDate": "2026-02-15",
      "endDate": "2026-02-20",
      "reason": "Liburan keluarga",
      "attachment": null,
      "status": "approved",
      "createdAt": "2026-01-07T08:19:28.442Z",
      "updatedAt": "2026-01-07T08:19:28.442Z"
    }
  }
  ```
- **Error**:
  - `400`: Status harus "approved" atau "rejected"
  - `404`: Pengajuan cuti tidak ditemukan
  - `403`: Hanya admin yang dapat mengakses endpoint ini
  - `401`: Tidak ada session aktif

#### Restore Pengajuan Cuti yang Dihapus
Mengembalikan (restore) pengajuan cuti yang sudah dihapus dengan mendekripsi data (Admin only).

- **URL**: `/api/v1/leave/admin/requests/:id/restore`
- **Method**: `POST`
- **Headers**: Cookie session (auth:web)
- **Response Sukses (200)**:
  ```json
  {
    "message": "Pengajuan cuti berhasil dikembalikan (data didekripsi)",
    "data": {
      "id": "uuid-1",
      "userId": "uuid-user",
      "startDate": "2026-02-15",
      "endDate": "2026-02-20",
      "reason": "Liburan keluarga",
      "attachment": null,
      "status": "pending",
      "createdAt": "2026-01-07T08:19:28.442Z",
      "updatedAt": "2026-01-07T08:19:28.442Z"
    }
  }
  ```
- **Error**:
  - `404`: Pengajuan cuti yang dihapus tidak ditemukan
  - `400`: Data terenkripsi tidak valid, tidak dapat dikembalikan
  - `403`: Hanya admin yang dapat mengakses endpoint ini
  - `401`: Tidak ada session aktif
- **Catatan**: Setelah restore, field `deleted_at` akan dikosongkan dan data akan kembali tampil di daftar pengajuan cuti biasa.

---

## 5. Safe Delete & Restore (Soft Delete dengan Enkripsi)

### Konsep Safe Delete

Sistem menggunakan **Soft Delete** dengan **Enkripsi Data** untuk menjaga keamanan dan integritas data yang dihapus:

- **Soft Delete**: Data tidak benar-benar dihapus dari database, melainkan ditandai dengan `deleted_at` timestamp.
- **Enkripsi**: Data yang dihapus di-enkripsi menggunakan algoritma AES-256 dan disimpan dalam field `reason`.
- **Recover**: Admin dapat mengembalikan data yang dihapus dengan mendekripsi kembali data tersebut.

### Alur Safe Delete

1. **Employee menghapus pengajuan cuti** melalui endpoint `DELETE /api/v1/leave/requests/:id`
2. **Sistem mengenkripsi data** pengajuan cuti (id, userId, startDate, endDate, reason, dll)
3. **Field `deleted_at` diisi** dengan timestamp saat ini
4. **Data masih tersimpan di database** dengan status "dihapus"
5. **Admin dapat melihat** daftar data yang dihapus melalui endpoint `/admin/requests/deleted`
6. **Admin dapat restore** data dengan endpoint `POST /admin/requests/:id/restore`
7. **Data didekripsi dan dikembalikan** ke state semula dengan `deleted_at = null`

### Keamanan Data

- Data yang dihapus **tidak dapat dibaca** tanpa kunci enkripsi
- **Hanya admin** yang dapat melihat dan mengembalikan data yang dihapus
- **Audit trail** tetap tersimpan dengan field `deleted_at`
- Data dapat **dipulihkan sepenuhnya** tanpa kehilangan informasi

---

## 6. Error Response Format

Semua error response mengikuti format berikut:

```json
{
  "success": false,
  "message": "Deskripsi error",
  "meta": {
    "timestamp": "2026-01-07T08:19:28.442Z",
    "requestId": "unique-request-id"
  }
}
```

---

## 7. Contoh Implementasi Frontend

### Login & Mengakses Protected Route

```javascript
const loginResponse = await fetch('http://localhost:3333/api/v1/login', {
  method: 'POST',
  credentials: 'include', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    password: 'Password123' 
  })
})

const meResponse = await fetch('http://localhost:3333/api/v1/me', {
  method: 'GET',
  credentials: 'include' 
})

const leaveResponse = await fetch('http://localhost:3333/api/v1/leave/requests', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startDate: '2026-02-15',
    endDate: '2026-02-20',
    reason: 'Liburan keluarga ke Bali'
  })
})
```

### Contoh Upload File

#### Frontend (Fetch API)
```javascript
const formData = new FormData()
formData.append('startDate', '2026-02-15')
formData.append('endDate', '2026-02-20')
formData.append('reason', 'Liburan keluarga ke Bali')
formData.append('attachment', fileInputElement.files[0]) 

const response = await fetch('http://localhost:3333/api/v1/leave/requests', {
  method: 'POST',
  credentials: 'include',
  body: formData 
})

const result = await response.json()
console.log(result)
```

#### Frontend (Axios)
```javascript
import axios from 'axios'

const formData = new FormData()
formData.append('startDate', '2026-02-15')
formData.append('endDate', '2026-02-20')
formData.append('reason', 'Liburan keluarga ke Bali')
formData.append('attachment', fileInputElement.files[0])

const response = await axios.post(
  'http://localhost:3333/api/v1/leave/requests',
  formData,
  {
    withCredentials: true,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
)

console.log(response.data)
```

### Contoh Delete & Restore

```javascript
const deleteResponse = await fetch('http://localhost:3333/api/v1/leave/requests/uuid-1', {
  method: 'DELETE',
  credentials: 'include'
})

const deletedResponse = await fetch('http://localhost:3333/api/v1/leave/admin/requests/deleted', {
  method: 'GET',
  credentials: 'include'
})


const restoreResponse = await fetch('http://localhost:3333/api/v1/leave/admin/requests/uuid-1/restore', {
  method: 'POST',
  credentials: 'include'
})

const result = await restoreResponse.json()
console.log(result)
```

---

## 8. Authentication & Authorization

- **Session-based**: Semua endpoint menggunakan session yang disimpan di cookie `adonis-session`.
- **Role-based Access Control (RBAC)**: 
  - **Employee**: Dapat membuat, melihat pengajuan cuti mereka sendiri, melihat quota mereka.
  - **Admin**: Dapat melihat semua pengajuan cuti, approve/reject, menghapus (soft delete), dan restore pengajuan yang dihapus.
- **Middleware**: Gunakan `.middleware('auth:web')` untuk melindungi route.