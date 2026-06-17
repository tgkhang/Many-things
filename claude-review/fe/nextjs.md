# 🔺 Next.js, SEO & Web Performance
>
> Từ React đến production-ready app — rendering, routing, SEO, Core Web Vitals

---

## Mục Lục

- [🔺 Next.js, SEO \& Web Performance](#-nextjs-seo--web-performance)
  - [Mục Lục](#mục-lục)
- [1. Next.js Thêm Gì Vào React?](#1-nextjs-thêm-gì-vào-react)
- [2. Các Kiểu Rendering — Hiểu Trước Khi Code](#2-các-kiểu-rendering--hiểu-trước-khi-code)
  - [CSR — Client-Side Rendering (React thuần)](#csr--client-side-rendering-react-thuần)
  - [SSR — Server-Side Rendering](#ssr--server-side-rendering)
  - [SSG — Static Site Generation](#ssg--static-site-generation)
  - [ISR — Incremental Static Regeneration](#isr--incremental-static-regeneration)
- [3. App Router — Cách Tổ Chức File](#3-app-router--cách-tổ-chức-file)
- [4. Server Component vs Client Component](#4-server-component-vs-client-component)
  - [Server Component](#server-component)
  - [Client Component](#client-component)
  - [Khi Nào Dùng Cái Nào?](#khi-nào-dùng-cái-nào)
- [5. Data Fetching Trong App Router](#5-data-fetching-trong-app-router)
  - [Fetch trong Server Component](#fetch-trong-server-component)
  - [Parallel Data Fetching — Tải Song Song](#parallel-data-fetching--tải-song-song)
- [6. Loading và Error States](#6-loading-và-error-states)
- [7. Layouts và Nested Layouts](#7-layouts-và-nested-layouts)
- [8. SEO — Nền Tảng Lý Thuyết](#8-seo--nền-tảng-lý-thuyết)
  - [Cách Google Hoạt Động](#cách-google-hoạt-động)
  - [Các Yếu Tố SEO Quan Trọng](#các-yếu-tố-seo-quan-trọng)
  - [Canonical URL — Tránh Duplicate Content](#canonical-url--tránh-duplicate-content)
- [9. Metadata API Trong Next.js](#9-metadata-api-trong-nextjs)
  - [Static Metadata](#static-metadata)
  - [Dynamic Metadata — Thay Đổi Theo Dữ Liệu](#dynamic-metadata--thay-đổi-theo-dữ-liệu)
  - [Template Title — Tự Động Thêm Tên Site](#template-title--tự-động-thêm-tên-site)
- [10. Open Graph và Social Sharing](#10-open-graph-và-social-sharing)
- [11. Core Web Vitals — Google Đo Gì?](#11-core-web-vitals--google-đo-gì)
  - [LCP — Largest Contentful Paint](#lcp--largest-contentful-paint)
  - [FID / INP — Interaction to Next Paint](#fid--inp--interaction-to-next-paint)
  - [CLS — Cumulative Layout Shift](#cls--cumulative-layout-shift)
- [12. Tối Ưu Ảnh với next/image](#12-tối-ưu-ảnh-với-nextimage)
- [13. Tối Ưu Font với next/font](#13-tối-ưu-font-với-nextfont)
- [14. Sitemap và Robots.txt](#14-sitemap-và-robotstxt)
  - [Sitemap](#sitemap)
  - [Robots.txt](#robotstxt)
- [15. Route Handlers — API trong Next.js](#15-route-handlers--api-trong-nextjs)
- [16. Middleware](#16-middleware)
- [17. Triển Khai Và Môi Trường](#17-triển-khai-và-môi-trường)
  - [Environment Variables](#environment-variables)
  - [next.config.js](#nextconfigjs)
  - [Tóm Tắt Nhanh](#tóm-tắt-nhanh)

---

# 1. Next.js Thêm Gì Vào React?

React là thư viện UI — nó biết cách render component, quản lý state, xử lý event. Nhưng React không quyết định ứng dụng của bạn được phục vụ như thế nào, route được tổ chức thế nào, hay trang được tối ưu SEO ra sao.

Next.js là **framework** xây dựng trên React, giải quyết những vấn đề đó.

```
React cho bạn:
  Component, State, Hooks, Virtual DOM

Next.js thêm vào:
  File-based routing   — cấu trúc thư mục = URL
  Server-side rendering — HTML được tạo ở server
  Static generation     — HTML được tạo lúc build
  API routes           — viết backend trong cùng project
  Image optimization   — tự động nén, lazy load ảnh
  Font optimization    — tự động tối ưu font Google
  Built-in SEO tools   — Metadata API
  Code splitting tự động — mỗi trang là một bundle riêng
```

---

# 2. Các Kiểu Rendering — Hiểu Trước Khi Code

Đây là phần quan trọng nhất cần hiểu trong Next.js. Chọn sai kiểu rendering → trang chậm hoặc SEO kém.

## CSR — Client-Side Rendering (React thuần)

HTML trống được gửi về browser. JavaScript tải xuống, chạy, rồi mới render nội dung.

```
Server gửi:  <div id="root"></div>  ← trang trắng!
JavaScript tải xuống
JavaScript chạy
Browser hiển thị nội dung
```

**Vấn đề:**

- Người dùng thấy trang trắng trong lúc JS đang tải
- Google bot nhận HTML trống → không thấy nội dung → SEO kém
- Thời gian đến khi thấy nội dung (Time to Content) chậm

**Khi nào vẫn dùng:** Dashboard nội bộ, ứng dụng cần đăng nhập, những trang Google không cần index.

## SSR — Server-Side Rendering

Server tạo HTML đầy đủ cho mỗi request. Browser nhận HTML có nội dung ngay từ đầu.

```
User request → Server fetch data → Server render HTML → Gửi về browser
Browser hiển thị ngay (có nội dung!)
JavaScript tải → "hydrate" (gắn event listeners vào HTML đã có)
```

**Ưu điểm:**

- SEO tốt — Google thấy nội dung đầy đủ
- Người dùng thấy nội dung nhanh hơn CSR
- Luôn fresh data (render lại mỗi request)

**Nhược điểm:**

- Server phải làm việc cho mỗi request → tốn tài nguyên server hơn
- Không thể cache tốt ở CDN

**Khi nào dùng:** Trang cần dữ liệu realtime và cần SEO — news feed, trang sản phẩm với giá cập nhật liên tục.

## SSG — Static Site Generation

HTML được tạo **một lần** lúc build. File HTML được lưu và phục vụ thẳng từ CDN.

```
Build time: Next.js fetch data → render → lưu HTML files
Deploy: HTML files lên CDN
User request → CDN trả file HTML ngay (không cần server xử lý!)
```

**Ưu điểm:**

- Nhanh nhất — CDN phục vụ file tĩnh
- Rẻ nhất — không cần server mạnh
- SEO tốt

**Nhược điểm:**

- Dữ liệu stale — muốn cập nhật phải build lại
- Không phù hợp nếu dữ liệu thay đổi thường xuyên

**Khi nào dùng:** Blog, landing page, documentation, trang marketing — nội dung ít thay đổi.

## ISR — Incremental Static Regeneration

Kết hợp tốt nhất của SSG và SSR. Trang được generate tĩnh, nhưng tự động regenerate sau một khoảng thời gian nhất định.

```
Lần đầu: như SSG (serve HTML đã cache)
Sau 60 giây: Next.js ngầm regenerate trang đó
Request tiếp theo: nhận trang đã được cập nhật
```

**Khi nào dùng:** Trang sản phẩm e-commerce (giá thay đổi theo ngày, không cần realtime), bài viết blog có comment, bảng giá.

---

# 3. App Router — Cách Tổ Chức File

Next.js 13+ giới thiệu App Router. Cấu trúc thư mục trong `app/` trực tiếp xác định URL của ứng dụng.

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx          → /about
├── blog/
│   ├── page.tsx          → /blog
│   └── [slug]/
│       └── page.tsx      → /blog/bat-ky-slug-nao
├── dashboard/
│   ├── layout.tsx        → layout chung cho /dashboard/*
│   ├── page.tsx          → /dashboard
│   ├── settings/
│   │   └── page.tsx      → /dashboard/settings
│   └── profile/
│       └── page.tsx      → /dashboard/profile
└── layout.tsx            → root layout (áp dụng cho toàn bộ app)
```

**Các file đặc biệt trong App Router:**

```
page.tsx     — giao diện của route đó (bắt buộc phải có để route tồn tại)
layout.tsx   — wrapper bao xung quanh page và các route con
loading.tsx  — UI hiển thị khi page đang tải
error.tsx    — UI hiển thị khi có lỗi
not-found.tsx — UI khi không tìm thấy resource
```

**Dynamic routes** — URL có tham số:

```
app/
└── products/
    ├── page.tsx           → /products
    └── [id]/
        └── page.tsx       → /products/123, /products/abc, ...

// Trong page.tsx của [id]:
export default function ProductPage({ params }: { params: { id: string } }) {
  return <div>Sản phẩm: {params.id}</div>
}
```

**Catch-all routes:**

```
app/docs/[...slug]/page.tsx  → /docs/react, /docs/react/hooks, /docs/react/hooks/useState
```

---

# 4. Server Component vs Client Component

Đây là sự thay đổi lớn nhất của App Router. Mặc định, tất cả component trong `app/` đều là **Server Component**.

## Server Component

Chạy hoàn toàn trên server. HTML được tạo ở server và gửi về browser. JavaScript của component đó **không được gửi xuống browser**.

```tsx
// app/blog/[slug]/page.tsx
// Đây là Server Component — không cần 'use client'

async function BlogPost({ params }: { params: { slug: string } }) {
  // Có thể fetch data trực tiếp — không cần useEffect, không cần useState
  const post = await fetch(`https://api.example.com/posts/${params.slug}`)
    .then(res => res.json())

  // Có thể đọc database trực tiếp!
  // const post = await prisma.post.findUnique({ where: { slug: params.slug } })

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}

export default BlogPost
```

**Server Component KHÔNG THỂ:**

- Dùng `useState`, `useEffect`, hay bất kỳ hook nào
- Gắn event listeners (`onClick`, `onChange`)
- Truy cập browser APIs (`window`, `document`, `localStorage`)

## Client Component

Thêm `'use client'` ở đầu file. Component này có thể dùng hooks, xử lý events, truy cập browser.

```tsx
'use client'  // ← dòng này chỉ định đây là Client Component

import { useState } from 'react'

function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)

  async function handleLike() {
    setLiked(true)
    setCount(c => c + 1)
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
  }

  return (
    <button onClick={handleLike}>
      {liked ? '❤️' : '🤍'} {count}
    </button>
  )
}

export default LikeButton
```

## Khi Nào Dùng Cái Nào?

```
Dùng SERVER COMPONENT cho:
  ✅ Fetch data từ database hay API
  ✅ Hiển thị nội dung tĩnh
  ✅ Component không có tương tác
  ✅ Muốn giảm JavaScript gửi xuống browser
  → Mặc định — không cần làm gì thêm

Dùng CLIENT COMPONENT cho:
  ✅ Cần useState, useEffect
  ✅ Xử lý events (onClick, onChange)
  ✅ Truy cập browser APIs
  ✅ Dùng các thư viện chỉ chạy ở browser
  → Thêm 'use client' ở đầu file

Chiến lược tốt nhất:
  Giữ Server Component ở trên cùng (fetch data, layout)
  Đẩy Client Component xuống lá (interactive elements)
```

**Ví dụ kết hợp:**

```tsx
// app/products/[id]/page.tsx — Server Component
async function ProductPage({ params }: { params: { id: string } }) {
  // Fetch data trên server — không gửi code này xuống browser
  const product = await getProduct(params.id)

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>{product.price} VNĐ</p>

      {/* Client Component chỉ là phần interactive nhỏ */}
      <AddToCartButton productId={product.id} />
    </div>
  )
}
```

---

# 5. Data Fetching Trong App Router

## Fetch trong Server Component

```tsx
// Đơn giản nhất — fetch thẳng trong async component
async function ProductList() {
  const products = await fetch('https://api.example.com/products', {
    // Kiểm soát caching:
    cache: 'force-cache',       // cache mãi mãi (như SSG)
    // cache: 'no-store',       // không cache, luôn fetch mới (như SSR)
    next: { revalidate: 3600 } // cache và regenerate sau 3600s (như ISR)
  }).then(res => res.json())

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  )
}
```

**Next.js tự động deduplicate fetch requests.** Nếu nhiều component trên cùng trang fetch cùng URL, Next.js chỉ gọi API một lần và dùng chung kết quả.

## Parallel Data Fetching — Tải Song Song

```tsx
// Tuần tự (chậm): request thứ 2 chờ request thứ 1 xong
async function Page({ params }) {
  const user = await getUser(params.id)        // chờ 1s
  const posts = await getUserPosts(params.id)  // chờ thêm 1s
  // Tổng: 2s
}

// Song song (nhanh hơn): cả hai request chạy cùng lúc
async function Page({ params }) {
  const [user, posts] = await Promise.all([
    getUser(params.id),
    getUserPosts(params.id)
  ])
  // Tổng: ~1s (cùng lúc)
}
```

---

# 6. Loading và Error States

Next.js có cơ chế tự động cho loading và error. Chỉ cần tạo file đúng tên trong thư mục route.

**Loading state:**

```tsx
// app/dashboard/loading.tsx
// Tự động hiển thị trong khi page.tsx đang fetch data
export default function DashboardLoading() {
  return (
    <div>
      {/* Skeleton loader */}
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-32 w-full" />
    </div>
  )
}
```

**Error state:**

```tsx
// app/dashboard/error.tsx
'use client'  // Error component phải là client component

export default function DashboardError({
  error,
  reset
}: {
  error: Error
  reset: () => void  // hàm thử lại
}) {
  return (
    <div>
      <h2>Có lỗi xảy ra</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Thử lại</button>
    </div>
  )
}
```

---

# 7. Layouts và Nested Layouts

Layout là component bao bọc các trang. Khi user chuyển giữa các trang, layout **không bị unmount** — React giữ nguyên layout, chỉ swap phần nội dung bên trong.

```tsx
// app/layout.tsx — Root layout, áp dụng cho toàn bộ app
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

```tsx
// app/dashboard/layout.tsx — Chỉ áp dụng cho /dashboard và các trang con
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-container">
      <Sidebar />          {/* Sidebar chỉ xuất hiện trong /dashboard/* */}
      <div className="content">
        {children}         {/* Nội dung từng trang */}
      </div>
    </div>
  )
}
```

Khi user vào `/dashboard/settings`:

- `RootLayout` render (Navbar, Footer)
- `DashboardLayout` render bên trong (Sidebar)
- `settings/page.tsx` render bên trong DashboardLayout

Khi user chuyển sang `/dashboard/profile`:

- RootLayout và DashboardLayout **không unmount** — giữ nguyên
- Chỉ phần `{children}` thay đổi

---

# 8. SEO — Nền Tảng Lý Thuyết

SEO (Search Engine Optimization) là tập hợp kỹ thuật giúp trang web xuất hiện cao hơn trên kết quả tìm kiếm.

## Cách Google Hoạt Động

Google có một chương trình gọi là **crawler** (Googlebot) liên tục duyệt qua các trang web. Crawler đọc HTML của trang, theo dõi các link, và ghi lại nội dung vào index — cơ sở dữ liệu khổng lồ của Google.

Khi user tìm kiếm, Google tra cứu index và xếp hạng các trang phù hợp.

```
Crawler đọc trang → Indexing (đưa vào database) → Ranking (xếp hạng khi search)
```

**Điều quan trọng:** Crawler đọc HTML. Nếu trang dùng CSR (JavaScript render nội dung), crawler nhận HTML trống → không thấy nội dung → không index → không xuất hiện khi search.

SSR hoặc SSG là bắt buộc cho các trang cần SEO.

## Các Yếu Tố SEO Quan Trọng

**On-page SEO** — những thứ bạn kiểm soát trực tiếp trong code:

```
Title tag:        tiêu đề trang, xuất hiện trên tab browser và kết quả search
Meta description: mô tả ngắn xuất hiện dưới title trong kết quả search
Headings (H1-H6): cấu trúc nội dung, H1 là quan trọng nhất
URL structure:    URL ngắn, có từ khóa, dùng dấu gạch ngang
Image alt text:   mô tả ảnh cho crawler và accessibility
Internal links:   link giữa các trang trong site
Page speed:       trang nhanh → rank cao hơn
Mobile-friendly:  Google ưu tiên mobile-first indexing
```

**Một trang chỉ nên có 1 H1.** H1 là tiêu đề chính, thường là tên sản phẩm hay tiêu đề bài viết.

```html
<h1>iPhone 16 Pro Max — Giá và Thông Số</h1>   ← chỉ 1 H1
<h2>Thông số kỹ thuật</h2>
<h3>Camera</h3>
<h3>Pin</h3>
<h2>So sánh với đời trước</h2>
```

## Canonical URL — Tránh Duplicate Content

Đôi khi cùng nội dung có thể truy cập qua nhiều URL:

- `https://example.com/product`
- `https://example.com/product?ref=homepage`
- `https://example.com/product?sort=price`

Google có thể nghĩ đây là nhiều trang khác nhau và chia nhỏ "link juice" của chúng. Canonical tag chỉ cho Google biết URL "chính thức" là cái nào.

```html
<link rel="canonical" href="https://example.com/product" />
```

---

# 9. Metadata API Trong Next.js

Next.js App Router có Metadata API — cách khai báo `<title>`, meta tags, và các SEO tags trực tiếp trong code TypeScript.

## Static Metadata

```tsx
// app/about/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Về Chúng Tôi | Tên Công Ty',
  description: 'Tìm hiểu về lịch sử và đội ngũ của chúng tôi.',

  // Keywords (ít quan trọng hơn trước, nhưng vẫn tốt)
  keywords: ['về chúng tôi', 'công ty', 'đội ngũ'],

  // Canonical URL
  alternates: {
    canonical: 'https://example.com/about'
  },

  // Ngăn Google index trang này (dùng cho trang nội bộ)
  robots: {
    index: true,
    follow: true
  }
}

export default function AboutPage() {
  return <main>Nội dung trang About</main>
}
```

## Dynamic Metadata — Thay Đổi Theo Dữ Liệu

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from 'next'

// generateMetadata nhận cùng params như page component
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const product = await getProduct(params.id)

  return {
    title: `${product.name} | Shop Của Tôi`,
    description: product.description.substring(0, 160),  // tối đa 160 ký tự
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.imageUrl }]
    }
  }
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id)
  return <div>{product.name}</div>
}
```

## Template Title — Tự Động Thêm Tên Site

```tsx
// app/layout.tsx — định nghĩa template ở root
export const metadata: Metadata = {
  title: {
    default: 'Tên Website Của Tôi',          // dùng khi trang không set title
    template: '%s | Tên Website Của Tôi'     // %s = title từ trang con
  },
  description: 'Mô tả mặc định cho toàn site'
}

// app/blog/page.tsx
export const metadata: Metadata = {
  title: 'Blog'  // Kết quả: "Blog | Tên Website Của Tôi"
}

// app/about/page.tsx
export const metadata: Metadata = {
  title: 'Về Chúng Tôi'  // Kết quả: "Về Chúng Tôi | Tên Website Của Tôi"
}
```

---

# 10. Open Graph và Social Sharing

Open Graph là protocol do Facebook tạo ra, hiện được dùng bởi hầu hết mạng xã hội. Khi bạn share link lên Facebook, Zalo, Twitter — họ đọc Open Graph tags để biết hiển thị tiêu đề, mô tả, ảnh gì.

```
Share link lên Facebook →
  Facebook đọc og:title   → tiêu đề của card
  Facebook đọc og:description → mô tả
  Facebook đọc og:image   → ảnh thumbnail
  Facebook render card đẹp!
```

```tsx
// Next.js Metadata API cho Open Graph
export const metadata: Metadata = {
  openGraph: {
    title: 'iPhone 16 Pro Max — Giá Tốt Nhất',
    description: 'Mua iPhone 16 Pro Max chính hãng, giao hàng nhanh toàn quốc.',
    url: 'https://shop.example.com/products/iphone-16',
    siteName: 'Shop Của Tôi',
    images: [
      {
        url: 'https://shop.example.com/images/iphone-16-og.jpg',
        width: 1200,
        height: 630,    // Tỉ lệ 1.91:1 là chuẩn cho OG image
        alt: 'iPhone 16 Pro Max màu titan đen'
      }
    ],
    locale: 'vi_VN',
    type: 'website'     // hoặc 'article' cho bài viết
  },

  // Twitter Card (dùng cho Twitter/X)
  twitter: {
    card: 'summary_large_image',  // hiển thị ảnh lớn
    title: 'iPhone 16 Pro Max',
    description: 'Mua ngay với giá tốt nhất!',
    images: ['https://shop.example.com/images/iphone-16-og.jpg']
  }
}
```

**Kích thước ảnh OG chuẩn:**

```
Tối thiểu: 600x315 pixels
Khuyến nghị: 1200x630 pixels
Tỉ lệ: 1.91:1
Format: JPG hoặc PNG
Dung lượng: dưới 8MB
```

---

# 11. Core Web Vitals — Google Đo Gì?

Core Web Vitals là bộ 3 chỉ số Google dùng để đo trải nghiệm người dùng thực tế. Chúng ảnh hưởng trực tiếp đến ranking.

## LCP — Largest Contentful Paint

**Đo: Thời gian để phần tử lớn nhất có thể nhìn thấy được (thường là ảnh hero hoặc heading lớn).**

```
Tốt:     ≤ 2.5 giây
Cần cải thiện: 2.5 – 4.0 giây
Tệ:      > 4.0 giây
```

**Cách cải thiện LCP:**

- Dùng `priority` cho ảnh hero (preload ngay, không lazy load)
- Dùng SSR/SSG thay CSR
- Optimize server response time
- Dùng CDN cho ảnh và static assets

## FID / INP — Interaction to Next Paint

**Đo: Thời gian từ khi user tương tác (click, tap) đến khi browser có thể phản hồi.**

```
Tốt:     ≤ 200ms
Cần cải thiện: 200 – 500ms
Tệ:      > 500ms
```

**Cách cải thiện:**

- Code splitting — không tải JavaScript không cần thiết
- Tránh long tasks (JavaScript chạy quá 50ms liên tục)
- Defer third-party scripts

## CLS — Cumulative Layout Shift

**Đo: Mức độ trang bị dịch chuyển bất ngờ khi đang tải.** Bạn đang đọc rồi bỗng nhiên quảng cáo load làm toàn bộ nội dung tụt xuống — đó là CLS cao.

```
Tốt:     ≤ 0.1
Cần cải thiện: 0.1 – 0.25
Tệ:      > 0.25
```

**Nguyên nhân thường gặp:**

- Ảnh không có width/height → browser không biết reserve không gian → layout shift khi ảnh load
- Quảng cáo inject vào trang sau khi load
- Font swap (web font load xong thay thế fallback font)

**Cách fix:**

- Luôn đặt `width` và `height` cho `<img>` hoặc dùng `next/image`
- Reserve không gian cho quảng cáo
- Dùng `next/font` để tối ưu font

---

# 12. Tối Ưu Ảnh với next/image

`next/image` là component ảnh của Next.js, tự động làm nhiều thứ bạn phải làm thủ công.

```tsx
import Image from 'next/image'

// Thay vì <img> thông thường:
<img src="/products/iphone.jpg" alt="iPhone" />
// Vấn đề: không lazy load, không tối ưu kích thước, không WebP, CLS issues

// Dùng next/image:
<Image
  src="/products/iphone.jpg"
  alt="iPhone 16 Pro Max màu titan đen"
  width={800}
  height={600}
  // priority: tải ngay không lazy load — dùng cho ảnh hero (LCP element)
  // Những ảnh khác tự động lazy load
/>
```

**Những gì `next/image` làm tự động:**

- Lazy loading (chỉ tải khi gần viewport)
- Serve đúng kích thước theo màn hình (không tải ảnh 4K cho mobile)
- Convert sang WebP hoặc AVIF (format nhỏ hơn JPEG)
- Giữ nguyên tỉ lệ, không layout shift
- Tích hợp với CDN

```tsx
// Ảnh từ URL bên ngoài — cần khai báo trong next.config.js
<Image
  src="https://images.unsplash.com/photo-xxx"
  alt="..."
  width={1200}
  height={800}
/>
```

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  }
}
```

**`fill` layout — ảnh fill container:**

```tsx
<div className="relative h-64 w-full">
  <Image
    src="/banner.jpg"
    alt="Banner"
    fill
    className="object-cover"  // như CSS object-fit: cover
  />
</div>
```

---

# 13. Tối Ưu Font với next/font

Font là một trong những nguyên nhân phổ biến gây CLS và LCP chậm. `next/font` giải quyết bằng cách:

- Download font lúc build, host trên server của bạn (không gọi Google Fonts mỗi request)
- Tự động tạo CSS `font-display: optional` để tránh layout shift
- Không gửi request đến Google — tốt cho privacy

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],        // chỉ tải subset ký tự cần dùng
  variable: '--font-inter',  // tạo CSS variable
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

```css
/* Dùng CSS variable trong Tailwind hoặc CSS modules */
.code-block {
  font-family: var(--font-mono);
}
```

---

# 14. Sitemap và Robots.txt

## Sitemap

Sitemap là file XML liệt kê tất cả URL trên website, giúp Google crawler tìm thấy tất cả trang.

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch các trang dynamic từ database
  const products = await getAllProducts()
  const posts = await getAllBlogPosts()

  const productUrls = products.map(product => ({
    url: `https://example.com/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }))

  const postUrls = posts.map(post => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6
  }))

  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0    // Trang chủ — priority cao nhất
    },
    {
      url: 'https://example.com/about',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5
    },
    ...productUrls,
    ...postUrls
  ]
}
// Truy cập tại: /sitemap.xml
```

## Robots.txt

Robots.txt cho crawler biết trang nào được phép index và trang nào không.

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',         // áp dụng cho tất cả crawler
        allow: '/',             // cho phép tất cả
        disallow: [
          '/admin/',            // không cho phép crawl trang admin
          '/dashboard/',        // không cho phép crawl dashboard
          '/api/',              // không cho phép crawl API routes
        ]
      }
    ],
    sitemap: 'https://example.com/sitemap.xml'  // chỉ cho crawler đến sitemap
  }
}
// Truy cập tại: /robots.txt
```

---

# 15. Route Handlers — API trong Next.js

Route Handlers cho phép viết API endpoint trong cùng Next.js project, không cần Express server riêng.

```
app/
└── api/
    ├── users/
    │   ├── route.ts          → GET, POST /api/users
    │   └── [id]/
    │       └── route.ts      → GET, PUT, DELETE /api/users/:id
    └── products/
        └── route.ts          → GET, POST /api/products
```

```tsx
// app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server'

// GET /api/users
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') ?? '1'

  const users = await getUsersFromDb({ page: parseInt(page) })

  return NextResponse.json({
    users,
    page: parseInt(page)
  })
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validation
  if (!body.email || !body.name) {
    return NextResponse.json(
      { error: 'Email và tên là bắt buộc' },
      { status: 400 }
    )
  }

  const user = await createUser(body)
  return NextResponse.json(user, { status: 201 })
}
```

```tsx
// app/api/users/[id]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserById(params.id)

  if (!user) {
    return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteUser(params.id)
  return new NextResponse(null, { status: 204 })
}
```

---

# 16. Middleware

Middleware chạy trước khi request đến route handler hoặc page. Dùng cho authentication, redirect, logging, A/B testing.

```tsx
// middleware.ts — đặt ở gốc project (ngang với app/)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Kiểm tra authentication cho /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')

    if (!token) {
      // Redirect về login, kèm URL hiện tại để sau khi login quay lại
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Thêm header custom cho tất cả response
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  return response
}

// Chỉ chạy middleware cho các path này (tăng hiệu năng)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    // Bỏ qua static files và _next
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
```

---

# 17. Triển Khai Và Môi Trường

## Environment Variables

```bash
# .env.local (development, không commit git)
DATABASE_URL=postgresql://localhost:5432/mydb
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# .env.production (production values)
DATABASE_URL=postgresql://prod-server:5432/mydb
NEXT_PUBLIC_API_URL=https://api.example.com
```

**Quan trọng:** Biến bắt đầu bằng `NEXT_PUBLIC_` được nhúng vào JavaScript gửi về browser — **không đặt secret key vào đây**. Biến không có `NEXT_PUBLIC_` chỉ dùng được ở server.

```tsx
// Server-only — an toàn
const dbUrl = process.env.DATABASE_URL

// Client-accessible — xuất hiện trong browser bundle
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

## next.config.js

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cho phép ảnh từ domain bên ngoài
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.example.com' }
    ]
  },

  // Redirect
  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true  // 308 redirect
      }
    ]
  },

  // Custom headers cho security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

---

## Tóm Tắt Nhanh

```
RENDERING:
  CSR:  JavaScript render ở browser — tệ cho SEO
  SSR:  HTML từ server mỗi request — tốt cho realtime + SEO
  SSG:  HTML tạo lúc build — nhanh nhất, tốt cho nội dung ít thay đổi
  ISR:  SSG + tự động regenerate — cân bằng tốt

APP ROUTER:
  Server Component (mặc định): fetch data, không JS xuống browser
  Client Component ('use client'): hooks, events, browser APIs
  Giữ client component nhỏ, đẩy xuống lá

SEO CẦN NHỚ:
  Title unique và mô tả chính xác cho mỗi trang
  1 H1 mỗi trang
  Alt text cho tất cả ảnh
  URL ngắn, có nghĩa, dùng dấu gạch ngang
  Canonical tag tránh duplicate content
  Sitemap để crawler tìm thấy tất cả trang

CORE WEB VITALS:
  LCP: ảnh hero load nhanh (dùng priority trong next/image)
  INP: không block main thread (code split, defer scripts)
  CLS: đặt width/height cho ảnh, reserve space (dùng next/image)

METADATA:
  Dùng Metadata API — đừng đặt <head> thủ công
  Open Graph cho social sharing
  Dynamic metadata cho trang có data từ DB
```
