# Dokumentasi API Project Seal2

Dokumentasi ini menjelaskan endpoint API yang tersedia untuk autentikasi pengguna (Register, Login, Logout, Me) dan OAuth (Google, GitHub, Discord).

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

### 2. Autentikasi (Email & Password)

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
        "id": "1",
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
  - `400`: Validasi gagal (contoh: email invalid, password terlalu pendek)
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
        "id": "1",
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
      "id": "1",
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

### 3.1. Redirect & Callback

- **URL Redirect**: `/api/v1/auth/:provider` (GET)
- **URL Callback**: `/api/v1/auth/:provider/callback` (GET)
- **Parameter `:provider`**:
  - `google`
  - `github`
  - `discord`
- **Deskripsi**: Mengarahkan user ke provider untuk login, dan menerima callback untuk memproses login/register di aplikasi.

### 3.2. Contoh Implementasi

#### Google

- **URL Redirect**: `/api/v1/auth/google`
- **URL Callback**: `/api/v1/auth/google/callback`

#### GitHub

- **URL Redirect**: `/api/v1/auth/github`
- **URL Callback**: `/api/v1/auth/github/callback`

#### Discord

- **URL Redirect**: `/api/v1/auth/discord`
- **URL Callback**: `/api/v1/auth/discord/callback` 