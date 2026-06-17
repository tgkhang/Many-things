# ⚛️ React — Từ Nền Tảng Đến Thực Hành

> Đọc từ đầu đến cuối theo thứ tự. Mỗi phần giải thích tại sao trước, rồi mới đến code.

---

## Mục Lục

- [⚛️ React — Từ Nền Tảng Đến Thực Hành](#️-react--từ-nền-tảng-đến-thực-hành)
  - [Mục Lục](#mục-lục)
- [1. React Sinh Ra Để Giải Quyết Vấn Đề Gì?](#1-react-sinh-ra-để-giải-quyết-vấn-đề-gì)
- [2. Component — Đơn Vị Cơ Bản](#2-component--đơn-vị-cơ-bản)
- [3. JSX — Viết HTML Trong JavaScript](#3-jsx--viết-html-trong-javascript)
- [4. Props — Truyền Dữ Liệu Xuống](#4-props--truyền-dữ-liệu-xuống)
- [5. State — Dữ Liệu Thay Đổi Theo Thời Gian](#5-state--dữ-liệu-thay-đổi-theo-thời-gian)
- [6. Re-render — Khi Nào React Vẽ Lại?](#6-re-render--khi-nào-react-vẽ-lại)
- [7. useEffect — Làm Gì Đó Ngoài Việc Render](#7-useeffect--làm-gì-đó-ngoài-việc-render)
- [8. useRef — Ghi Nhớ Mà Không Vẽ Lại](#8-useref--ghi-nhớ-mà-không-vẽ-lại)
- [9. useMemo và useCallback — Tối Ưu Hiệu Năng](#9-usememo-và-usecallback--tối-ưu-hiệu-năng)
- [10. Context API — Chia Sẻ Dữ Liệu Mà Không Prop Drilling](#10-context-api--chia-sẻ-dữ-liệu-mà-không-prop-drilling)
- [11. Custom Hook — Tách Logic Ra Khỏi UI](#11-custom-hook--tách-logic-ra-khỏi-ui)
- [12. Xử Lý Form](#12-xử-lý-form)
- [13. Lists và Keys](#13-lists-và-keys)
- [14. Error Boundary — Bắt Lỗi Trong UI](#14-error-boundary--bắt-lỗi-trong-ui)
- [15. Code Splitting và Lazy Loading](#15-code-splitting-và-lazy-loading)
  - [Tóm Tắt Các Điểm Quan Trọng Nhất](#tóm-tắt-các-điểm-quan-trọng-nhất)

---

# 1. React Sinh Ra Để Giải Quyết Vấn Đề Gì?

Trước React, khi dữ liệu thay đổi, developer phải tự tay cập nhật DOM.

Ví dụ: user đăng nhập → phải tìm element tên người dùng trên màn hình → sửa text → tìm badge thông báo → cập nhật số → tìm avatar → đổi ảnh. Mỗi thay đổi dữ liệu là một loạt thao tác DOM thủ công. Dễ sai, khó bảo trì.

**React đề xuất một ý tưởng đơn giản hơn:**

> Thay vì nói "hãy thay đổi cái này" — hãy nói "đây là giao diện nên trông như thế nào với dữ liệu này".

```
Cách cũ:
  Dữ liệu thay đổi → Developer tự cập nhật từng phần của DOM

Cách React:
  Dữ liệu thay đổi → React tự tính toán lại giao diện → Cập nhật DOM
```

React giới thiệu **Virtual DOM** — một bản sao nhẹ của DOM thật trong bộ nhớ. Khi dữ liệu thay đổi, React so sánh Virtual DOM mới và cũ, chỉ cập nhật những phần thực sự khác nhau. Quá trình so sánh này gọi là **reconciliation**.

---

# 2. Component — Đơn Vị Cơ Bản

Component là trung tâm của React. Hãy nghĩ về nó như một **hàm nhận dữ liệu vào và trả về giao diện**.

Mỗi phần của trang web là một component. Cái nút, cái thẻ sản phẩm, cái thanh điều hướng — tất cả đều là component. Các component lớn được tạo ra bằng cách ghép các component nhỏ lại.

```jsx
// Component đơn giản nhất — chỉ hiển thị thứ gì đó
function Greeting() {
  return <h1>Xin chào Khang!</h1>
}

// Component nhận dữ liệu vào (qua props)
function Greeting({ name }) {
  return <h1>Xin chào {name}!</h1>
}

// Dùng component
function App() {
  return (
    <div>
      <Greeting name="Khang" />
      <Greeting name="Alice" />
    </div>
  )
}
```

**Hai quy tắc bắt buộc:**

Thứ nhất, tên component phải bắt đầu bằng chữ HOA. `greeting` là HTML tag thông thường, còn `Greeting` là React component.

Thứ hai, mỗi component chỉ được trả về một element gốc. Nếu cần nhiều element ngang hàng, bọc chúng trong một thẻ cha hoặc dùng Fragment.

```jsx
// Sai — hai element ngang hàng không có cha
function Wrong() {
  return (
    <h1>Tiêu đề</h1>
    <p>Đoạn văn</p>
  )
}

// Đúng — có thẻ cha
function Correct() {
  return (
    <div>
      <h1>Tiêu đề</h1>
      <p>Đoạn văn</p>
    </div>
  )
}

// Đúng — Fragment không tạo thêm DOM node thật
function AlsoCorrect() {
  return (
    <>
      <h1>Tiêu đề</h1>
      <p>Đoạn văn</p>
    </>
  )
}
```

---

# 3. JSX — Viết HTML Trong JavaScript

JSX trông giống HTML nhưng thực ra là JavaScript. Trình biên dịch (Babel) chuyển JSX thành các lời gọi hàm `React.createElement()`.

Điều này có nghĩa là JSX theo cú pháp JavaScript, không phải HTML. Một số điểm khác nhau cần nhớ:

**Dùng `className` thay vì `class`** — vì `class` là từ khóa trong JavaScript.

**Dùng camelCase cho attributes** — `onclick` trở thành `onClick`, `maxlength` trở thành `maxLength`.

**Đặt JavaScript vào trong ngoặc nhọn `{}`** — đây là cách nhúng logic vào JSX.

```jsx
function ProductCard({ name, price, inStock }) {
  return (
    <div className="product-card">
      <h2>{name}</h2>

      {/* Hiển thị giá với format tiền tệ */}
      <p>{price.toLocaleString('vi-VN')} VNĐ</p>

      {/* Render có điều kiện */}
      {inStock
        ? <button className="btn-primary">Thêm vào giỏ</button>
        : <span className="out-of-stock">Hết hàng</span>
      }
    </div>
  )
}
```

**Chú ý về falsy values trong JSX:**

`false`, `null`, `undefined` không hiển thị gì. Nhưng `0` thì CÓ hiển thị (vì 0 là giá trị truthy trong DOM). Đây là lỗi thường gặp.

```jsx
// BUG: Khi count = 0, màn hình hiển thị số "0"
{count && <span>Có {count} thông báo</span>}

// Đúng: dùng toán tử 3 ngôi
{count > 0 && <span>Có {count} thông báo</span>}

// Hoặc rõ ràng hơn
{count > 0 ? <span>Có {count} thông báo</span> : null}
```

---

# 4. Props — Truyền Dữ Liệu Xuống

Props là cách component cha truyền dữ liệu cho component con. Props chỉ đi một chiều — từ trên xuống dưới. Component con **không được sửa** props nó nhận vào.

```jsx
// Component cha truyền props
function App() {
  const user = { name: 'Khang', age: 21 }

  return <UserProfile user={user} onEdit={() => console.log('edit')} />
}

// Component con nhận props
function UserProfile({ user, onEdit }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>Tuổi: {user.age}</p>
      <button onClick={onEdit}>Chỉnh sửa</button>
    </div>
  )
}
```

**Default props** — giá trị mặc định khi prop không được truyền vào:

```jsx
function Button({ label = 'Click me', variant = 'primary', disabled = false }) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
    >
      {label}
    </button>
  )
}

// Dùng với default values
<Button />                           // "Click me", primary
<Button label="Gửi đi" />           // "Gửi đi", primary
<Button label="Xóa" variant="danger" />
```

**Children prop** — truyền nội dung bên trong thẻ:

```jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">
        {children}  {/* Nội dung bất kỳ đặt bên trong <Card>...</Card> */}
      </div>
    </div>
  )
}

// Dùng
<Card title="Thông tin người dùng">
  <p>Tên: Khang</p>
  <p>Email: khang@example.com</p>
</Card>
```

---

# 5. State — Dữ Liệu Thay Đổi Theo Thời Gian

Props là dữ liệu từ bên ngoài, đọc được nhưng không sửa được. State là dữ liệu của riêng component, component tự quản lý và có thể thay đổi.

Mỗi khi state thay đổi, React render lại component đó và các component con của nó.

```jsx
import { useState } from 'react'

function Counter() {
  // useState trả về [giá trị hiện tại, hàm để cập nhật]
  const [count, setCount] = useState(0)  // 0 là giá trị ban đầu

  return (
    <div>
      <p>Đếm: {count}</p>
      <button onClick={() => setCount(count + 1)}>Tăng</button>
      <button onClick={() => setCount(count - 1)}>Giảm</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}
```

**State update không xảy ra ngay lập tức.** React gom các state update lại và xử lý theo batch. Nghĩa là sau khi gọi `setCount(count + 1)`, giá trị `count` trong cùng hàm đó vẫn là giá trị cũ.

```jsx
// Vấn đề với stale state
function Counter() {
  const [count, setCount] = useState(0)

  function handleTripleIncrement() {
    setCount(count + 1)  // count vẫn là 0
    setCount(count + 1)  // count vẫn là 0 — không phải 1!
    setCount(count + 1)  // count vẫn là 0 — không phải 2!
    // Kết quả: count = 1, không phải 3
  }

  // Giải pháp: dùng functional update — nhận giá trị MỚI NHẤT
  function handleTripleIncrementCorrect() {
    setCount(prev => prev + 1)  // prev = 0, result = 1
    setCount(prev => prev + 1)  // prev = 1, result = 2
    setCount(prev => prev + 1)  // prev = 2, result = 3
    // Kết quả: count = 3 ✅
  }
}
```

**State với object** — luôn phải tạo object mới khi cập nhật, không được mutate trực tiếp:

```jsx
function UserForm() {
  const [user, setUser] = useState({ name: '', email: '' })

  // SAI — mutate trực tiếp, React không biết có thay đổi
  function handleNameChangeBad(e) {
    user.name = e.target.value  // ❌ React không re-render!
    setUser(user)               // cùng reference → React nghĩ không đổi
  }

  // ĐÚNG — tạo object mới với spread operator
  function handleNameChange(e) {
    setUser({ ...user, name: e.target.value })  // ✅ object mới
  }

  return (
    <form>
      <input value={user.name} onChange={handleNameChange} />
      <input value={user.email}
             onChange={e => setUser({ ...user, email: e.target.value })} />
    </form>
  )
}
```

---

# 6. Re-render — Khi Nào React Vẽ Lại?

Đây là kiến thức quan trọng để tránh performance issues.

**React re-render component khi:**

- State của component đó thay đổi
- Props mà component nhận vào thay đổi
- Component cha re-render (mặc định, dù props không đổi!)

**Điểm quan trọng:** khi component cha re-render, TẤT CẢ component con đều re-render theo — kể cả những component có props không thay đổi.

```jsx
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <p>{count}</p>

      {/* ExpensiveChild re-render mỗi khi Parent re-render
          dù nó không cần count */}
      <ExpensiveChild />
    </div>
  )
}
```

Trong nhiều trường hợp điều này không thành vấn đề — re-render nhanh và React đủ thông minh. Chỉ cần tối ưu khi đo lường thấy chậm thật sự.

**Cách tránh re-render không cần thiết:**

Dùng `React.memo` để bọc component — component chỉ re-render khi props thực sự thay đổi.

```jsx
const ExpensiveChild = React.memo(function ExpensiveChild({ data }) {
  console.log('ExpensiveChild render')  // chỉ log khi data thay đổi
  return <div>{data.name}</div>
})
```

Nhưng chú ý: `React.memo` so sánh props bằng shallow equality. Nếu prop là object hay function tạo mới mỗi render, memo không giúp được gì.

```jsx
function Parent() {
  const [count, setCount] = useState(0)

  // Function này được tạo MỚI mỗi lần Parent render
  // → ExpensiveChild.props.onClick luôn "khác" → memo vô dụng!
  const handleClick = () => console.log('clicked')

  return <ExpensiveChild onClick={handleClick} />
}
```

---

# 7. useEffect — Làm Gì Đó Ngoài Việc Render

Component React là pure function — nhận vào props/state, trả ra UI. Nhưng ứng dụng thực tế cần làm những thứ khác: fetch data, thao tác DOM trực tiếp, subscribe event, set timeout.

Những thứ đó gọi là **side effects** — tác dụng phụ ngoài việc render. `useEffect` là nơi chứa chúng.

```jsx
import { useState, useEffect } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Code bên trong chạy SAU khi component render xong
    setLoading(true)

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setLoading(false)
      })

  }, [userId])
  // ↑ Dependency array: effect chạy lại khi userId thay đổi

  if (loading) return <p>Đang tải...</p>
  if (!user) return <p>Không tìm thấy</p>
  return <h1>{user.name}</h1>
}
```

**Dependency array (mảng phụ thuộc) — ý nghĩa của từng trường hợp:**

```jsx
// Không có dependency array → chạy sau MỖI lần render
useEffect(() => {
  console.log('chạy mỗi lần render')
})

// Mảng rỗng → chỉ chạy MỘT LẦN sau render đầu tiên
useEffect(() => {
  console.log('chỉ chạy một lần')
}, [])

// Có dependencies → chạy khi lần đầu VÀ khi dependency thay đổi
useEffect(() => {
  console.log('chạy khi userId hoặc filter thay đổi')
}, [userId, filter])
```

**Cleanup function** — chạy trước khi effect chạy lại, và khi component bị unmount:

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setTime(new Date())
  }, 1000)

  // Trả về cleanup function
  return () => {
    clearInterval(timer)  // Hủy timer khi component unmount
  }
}, [])
```

```jsx
// Ví dụ thực tế: subscribe và unsubscribe event
useEffect(() => {
  function handleResize() {
    setWindowWidth(window.innerWidth)
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)  // cleanup!
  }
}, [])
```

**Lỗi thường gặp — infinite loop:**

```jsx
// BUG: data là object/array → reference mới mỗi render
// → useEffect chạy → setData → re-render → useEffect chạy → ...
useEffect(() => {
  setData({ ...data, processed: true })
}, [data])  // ← data thay đổi → effect chạy → data thay đổi → ...

// Fix: cẩn thận với dependencies là object/array
// Thường là dấu hiệu của thiết kế logic chưa tốt
```

---

# 8. useRef — Ghi Nhớ Mà Không Vẽ Lại

`useRef` tạo ra một "hộp chứa" — có thể lưu bất cứ giá trị nào. Khi giá trị trong hộp thay đổi, component **không re-render**.

**Hai use case chính:**

**Thứ nhất:** Trỏ đến DOM element trực tiếp.

```jsx
function SearchInput() {
  const inputRef = useRef(null)

  function focusInput() {
    inputRef.current.focus()  // Truy cập DOM element trực tiếp
  }

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus ô tìm kiếm</button>
    </div>
  )
}
```

**Thứ hai:** Lưu giá trị giữa các lần render mà không trigger re-render.

```jsx
function VideoPlayer({ src }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef(null)  // lưu interval ID

  function startTimer() {
    intervalRef.current = setInterval(() => {
      // cập nhật progress
    }, 100)
  }

  function stopTimer() {
    clearInterval(intervalRef.current)
  }

  // Thay đổi intervalRef.current không gây re-render
  // nhưng vẫn truy cập được giá trị mới nhất ở lần sau
}
```

**Sự khác biệt so với useState:**

```
useState: thay đổi → component re-render
useRef:   thay đổi → component KHÔNG re-render
          nhưng giá trị vẫn được nhớ giữa các lần render
```

---

# 9. useMemo và useCallback — Tối Ưu Hiệu Năng

Trước khi đọc phần này: chỉ dùng khi thực sự cần. Tối ưu sớm mà không đo lường thường làm code phức tạp hơn mà không giúp gì nhiều.

**useMemo — ghi nhớ kết quả tính toán:**

```jsx
import { useMemo } from 'react'

function ProductList({ products, searchTerm, category }) {
  // Tính toán này nặng — lọc và sort 10.000 sản phẩm
  // Không dùng useMemo: chạy lại mỗi lần component re-render
  // Dùng useMemo: chỉ chạy lại khi products, searchTerm, hoặc category thay đổi
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => category === 'all' || p.category === category)
      .sort((a, b) => a.price - b.price)
  }, [products, searchTerm, category])

  return (
    <ul>
      {filteredProducts.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  )
}
```

**useCallback — ghi nhớ function:**

Khi component re-render, mọi function được khai báo bên trong đều được tạo mới. Nếu function đó được truyền xuống component con dùng `React.memo`, component con vẫn re-render vì "nhận prop mới".

`useCallback` giải quyết điều này bằng cách trả về cùng một function reference nếu dependencies không đổi.

```jsx
function Parent() {
  const [count, setCount] = useState(0)
  const [filter, setFilter] = useState('')

  // Không dùng useCallback: handleSubmit mới mỗi khi count thay đổi
  // → Form (memo) vẫn re-render dù filter không đổi
  const handleSubmit = useCallback((formData) => {
    submitForm(formData, filter)
  }, [filter])  // Chỉ tạo mới khi filter thay đổi

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveForm onSubmit={handleSubmit} />  {/* Không re-render khi count đổi */}
    </div>
  )
}
```

**Tóm lại khi nào dùng:**

```
useMemo: khi có tính toán nặng (filter/sort danh sách lớn)
         và không muốn tính lại mỗi render

useCallback: khi truyền function vào component được bọc bởi React.memo
             và không muốn component đó re-render mỗi khi cha render
```

---

# 10. Context API — Chia Sẻ Dữ Liệu Mà Không Prop Drilling

**Prop drilling** là khi bạn phải truyền props qua nhiều tầng component chỉ để đưa dữ liệu đến component cần nó.

```
App (có user)
  └── Layout (không cần user, nhưng phải truyền xuống)
        └── Header (không cần user, nhưng phải truyền xuống)
              └── Avatar (CẦN user — nhưng phải đi qua 3 tầng)
```

Context cho phép component ở bất kỳ tầng nào đọc dữ liệu mà không cần truyền qua từng tầng.

```jsx
import { createContext, useContext, useState } from 'react'

// 1. Tạo context
const UserContext = createContext(null)

// 2. Tạo Provider — bọc xung quanh những component cần dùng
function App() {
  const [user, setUser] = useState({ name: 'Khang', role: 'admin' })

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Layout />  {/* Layout không cần biết về user */}
    </UserContext.Provider>
  )
}

// 3. Dùng trong bất kỳ component con nào
function Avatar() {
  const { user } = useContext(UserContext)  // Lấy trực tiếp, không qua props
  return <img src={`/avatars/${user.name}.jpg`} alt={user.name} />
}
```

**Lưu ý quan trọng về performance:**

Khi giá trị trong Provider thay đổi, **tất cả** component đang dùng context đó đều re-render — kể cả những component chỉ cần một phần nhỏ của giá trị đó.

```jsx
// Vấn đề: user và theme trong cùng context
// Đổi theme → tất cả component dùng UserContext re-render, kể cả những component chỉ cần user
const AppContext = createContext({ user: null, theme: 'light' })

// Tốt hơn: tách ra
const UserContext = createContext(null)
const ThemeContext = createContext('light')
// Component cần user chỉ subscribe UserContext
// Component cần theme chỉ subscribe ThemeContext
```

---

# 11. Custom Hook — Tách Logic Ra Khỏi UI

Custom hook là hàm JavaScript bình thường bắt đầu bằng `use`, có thể gọi các hook khác bên trong. Dùng để tái sử dụng logic giữa các component.

```jsx
// Trước — logic và UI lẫn lộn
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => { setUser(data); setLoading(false) })
      .catch(err => { setError(err); setLoading(false) })
  }, [userId])

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  return <div>{user.name}</div>
}
```

```jsx
// Sau — tách logic vào custom hook
function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false) })
      .catch(err => { setError(err); setLoading(false) })
  }, [url])

  return { data, loading, error }
}

// Component bây giờ gọn hơn nhiều
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`)

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  return <div>{user.name}</div>
}

// Tái sử dụng cho component khác
function ProductDetail({ productId }) {
  const { data: product, loading } = useFetch(`/api/products/${productId}`)
  // ...
}
```

**Một custom hook thực tế nữa — window size:**

```jsx
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// Dùng ở bất kỳ component nào
function ResponsiveComponent() {
  const { width } = useWindowSize()
  return <div>{width > 768 ? 'Desktop' : 'Mobile'}</div>
}
```

---

# 12. Xử Lý Form

Có hai cách quản lý form trong React: controlled và uncontrolled.

**Controlled component** — React quản lý giá trị của input qua state. Đây là cách phổ biến hơn.

```jsx
function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Xóa lỗi khi user bắt đầu gõ lại
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function validate() {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email không được để trống'
    if (!formData.email.includes('@')) newErrors.email = 'Email không hợp lệ'
    if (formData.password.length < 8) newErrors.password = 'Mật khẩu tối thiểu 8 ký tự'
    return newErrors
  }

  function handleSubmit(e) {
    e.preventDefault()  // Ngăn form reload trang
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    console.log('Submit:', formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mật khẩu"
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <button type="submit">Đăng nhập</button>
    </form>
  )
}
```

---

# 13. Lists và Keys

Khi render một danh sách, React cần biết element nào là element nào để cập nhật hiệu quả. `key` là cách nói cho React biết.

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>  {/* key phải unique trong danh sách */}
          {todo.text}
        </li>
      ))}
    </ul>
  )
}
```

**Đừng dùng index làm key nếu danh sách có thể thay đổi thứ tự.** Nếu xóa item ở đầu, tất cả index thay đổi → React nghĩ tất cả items đều thay đổi → re-render không cần thiết, có thể gây lỗi.

```jsx
// Tệ khi có thể thêm/xóa/sắp xếp
{todos.map((todo, index) => <li key={index}>{todo.text}</li>)}

// Tốt — dùng ID thật từ data
{todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
```

---

# 14. Error Boundary — Bắt Lỗi Trong UI

Khi một component throw error, mặc định React unmount toàn bộ ứng dụng. Error Boundary là component đặc biệt bắt lỗi từ component con và hiển thị UI thay thế thay vì crash toàn bộ trang.

Error Boundary phải là class component (chưa có hook tương đương).

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Gửi error lên tracking service (Sentry, v.v.)
    console.error('Error caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Có lỗi xảy ra</h2>
          <p>Vui lòng tải lại trang</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Thử lại
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Dùng
function App() {
  return (
    <ErrorBoundary>
      <UserDashboard />  {/* Lỗi ở đây → ErrorBoundary bắt */}
    </ErrorBoundary>
  )
}
```

---

# 15. Code Splitting và Lazy Loading

Khi ứng dụng lớn, tải tất cả JavaScript cùng lúc làm trang load chậm. Code splitting cho phép tải từng phần JavaScript khi cần.

`React.lazy` tải component theo kiểu dynamic import. `Suspense` hiển thị UI fallback trong khi đang tải.

```jsx
import { lazy, Suspense } from 'react'

// Thay vì:
// import Dashboard from './Dashboard'  // tải ngay khi app load

// Dùng lazy:
const Dashboard = lazy(() => import('./Dashboard'))  // chỉ tải khi cần
const Settings = lazy(() => import('./Settings'))
const Analytics = lazy(() => import('./Analytics'))

function App() {
  return (
    <Suspense fallback={<div>Đang tải trang...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  )
}
```

Khi user vào route `/dashboard`, React mới tải code của Dashboard. Các trang khác không tải cho đến khi cần. Điều này giảm đáng kể kích thước bundle ban đầu.

---

## Tóm Tắt Các Điểm Quan Trọng Nhất

```
Component: hàm trả về UI, tên bắt đầu bằng chữ HOA

Props: dữ liệu từ cha xuống con, chỉ đọc, không sửa
State: dữ liệu của riêng component, thay đổi → re-render

useState: lưu state, thay đổi → re-render
useEffect: side effects (fetch, subscribe, timer)
useRef: lưu giá trị hoặc trỏ đến DOM, KHÔNG gây re-render
useMemo: ghi nhớ kết quả tính toán nặng
useCallback: ghi nhớ function để truyền xuống component con memo

Re-render: xảy ra khi state/props thay đổi, và khi cha re-render
           React.memo ngăn re-render không cần thiết từ cha

Context: chia sẻ dữ liệu qua nhiều tầng, tránh prop drilling
Custom Hook: tách logic ra khỏi UI, bắt đầu bằng "use"

Immutability: không bao giờ mutate state/props trực tiếp
              luôn tạo object/array mới
```
