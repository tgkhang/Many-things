# 🗂️ State Management — Redux & Zustand
>
> Lý Thuyết Nền Tảng → Cơ Chế Bên Trong → Pattern Thực Tế

---

## 📚 Mục Lục

1. [Tại Sao Cần State Management?](#1-tại-sao-cần-state-management)
2. [Redux — Triết Lý & 3 Nguyên Tắc](#2-redux--triết-lý--3-nguyên-tắc)
3. [Redux Core — Store, Action, Reducer](#3-redux-core--store-action-reducer)
4. [Redux Data Flow — Cơ Chế Từng Bước](#4-redux-data-flow--cơ-chế-từng-bước)
5. [Redux Middleware — Thunk & Saga](#5-redux-middleware--thunk--saga)
6. [Redux Toolkit (RTK) — Modern Redux](#6-redux-toolkit-rtk--modern-redux)
7. [RTK Query — Data Fetching](#7-rtk-query--data-fetching)
8. [Zustand — Triết Lý Khác Hoàn Toàn](#8-zustand--triết-lý-khác-hoàn-toàn)
9. [Zustand Cơ Chế Bên Trong](#9-zustand-cơ-chế-bên-trong)
10. [Zustand Patterns — Nâng Cao](#10-zustand-patterns--nâng-cao)
11. [Redux vs Zustand vs Context — Khi Nào Dùng Gì?](#11-redux-vs-zustand-vs-context--khi-nào-dùng-gì)
12. [Selector & Derived State](#12-selector--derived-state)
13. [State Normalization](#13-state-normalization)
14. [Common Bugs & Anti-Patterns](#14-common-bugs--anti-patterns)

---

# 1. Tại Sao Cần State Management?

## 1.1 Vấn Đề Gốc: Prop Drilling

```
Không có state management:

App
 └── Header
 └── Dashboard
      └── Sidebar
           └── UserProfile   ← cần user data
      └── MainContent
           └── Feed
                └── Post
                     └── CommentBox ← cần user data để check permission
                          └── Avatar ← cần user.avatar

Solution? Pass user qua props từ App xuống...
App → Dashboard → Feed → Post → CommentBox → Avatar
                         ↑
                    Post không cần user nhưng phải nhận và pass xuống
                    → "Prop Drilling"
```

**Prop Drilling** gây ra:

- Components nhận props mà chúng không dùng (chỉ để pass xuống)
- Refactor một component → phải update cả chain
- Khó debug (data đi qua nhiều layers)
- Components tightly coupled với parent hierarchy

## 1.2 Vấn Đề Thứ Hai: Shared State Giữa Components Không Liên Quan

```
Sidebar:  hiển thị số notifications
Header:   hiển thị notification bell icon
NotificationPanel: list của notifications

Tất cả cần cùng notification data!
Nhưng chúng không có quan hệ parent-child trực tiếp.

Giải pháp naive: "Lift state up" lên App
→ App trở thành "God component" chứa tất cả state
→ Mọi update nhỏ re-render App + tất cả children
→ Performance nightmare
```

## 1.3 Vấn Đề Thứ Ba: State Logic Phức Tạp

```
Shopping cart:
  addItem(item)          → add, update quantity nếu đã có
  removeItem(id)         → remove
  updateQuantity(id, n)  → update, remove nếu n=0
  applyPromo(code)       → validate, tính discount
  checkout()             → validate cart, calculate total, call API

Logic này ở đâu?
Component? → khó test, khó reuse
Multiple components? → duplicate, inconsistent
```

## 1.4 State Management Giải Quyết Bằng Cách Nào?

```
Ý tưởng cốt lõi: Tách STATE ra khỏi COMPONENT TREE.

Thay vì:        Component giữ state
Thay bằng:      Centralized store giữ state
                Components "subscribe" vào store
                Components "dispatch" actions để update

Benefits:
  ✅ Component truy cập state trực tiếp từ store (không prop drilling)
  ✅ Predictable: biết chính xác state thay đổi khi nào và tại sao
  ✅ Testable: logic tách ra ngoài component → dễ test
  ✅ DevTools: time-travel debugging, state inspection
  ✅ Shared state: multiple components cùng subscribe, luôn sync
```

---

# 2. Redux — Triết Lý & 3 Nguyên Tắc

## 2.1 Tại Sao Redux Phổ Biến Đến Vậy?

Redux (2015, Dan Abramov) lấy cảm hứng từ **Flux** (Facebook) và **Elm architecture**. Ý tưởng: áp dụng functional programming vào UI state.

Redux không phải React-specific. Nó là pure JavaScript library. Có thể dùng với Vue, Angular, Svelte, hay plain HTML.

## 2.2 Ba Nguyên Tắc Redux

**Nguyên Tắc 1: Single Source of Truth**

```
Toàn bộ application state được lưu trong MỘT object tree
trong MỘT store duy nhất.

{
  user: { id: 1, name: "Khang", role: "ADMIN" },
  cart: { items: [...], total: 500000 },
  ui: { sidebarOpen: false, theme: "dark" },
  notifications: { unread: 3, list: [...] }
}

Tại sao? Dễ debug (inspect toàn bộ app state tại bất kỳ thời điểm),
dễ hydrate từ server, dễ serialize/deserialize.
```

**Nguyên Tắc 2: State is Read-Only**

```
Không được TRỰC TIẾP thay đổi state.
Cách DUY NHẤT để thay đổi: dispatch một action.

// ❌ WRONG:
store.getState().user.name = "New Name";

// ✅ CORRECT:
store.dispatch({ type: "user/setName", payload: "New Name" });

Tại sao? Centralized mutations → dễ track, dễ log, dễ test.
Actions là plain objects → serializable → time-travel debugging!
```

**Nguyên Tắc 3: Changes Made with Pure Functions (Reducers)**

```
Reducer = pure function nhận state cũ + action → trả state mới.

(previousState, action) → newState

PURE nghĩa là:
  - Cùng input → LUÔN cùng output
  - Không có side effects (không call API, không random, không Date.now())
  - KHÔNG MODIFY state cũ → trả state MỚI (immutability!)

Tại sao pure? Predictable, testable, time-travel.
Tại sao immutable? React uses reference equality (===) to detect changes.
                    Mutate same object → reference unchanged → no re-render!
```

## 2.3 Redux vs Flux — Sự Khác Biệt

```
Flux (Facebook):
  Multiple stores → complicated sync between stores
  Store có cả data lẫn logic
  Dispatcher phân phát đến tất cả stores

Redux:
  Single store → simple
  Reducers xử lý logic (pure functions)
  No dispatcher → dispatch trực tiếp đến store
  Composable reducers → chia nhỏ logic
```

---

# 3. Redux Core — Store, Action, Reducer

## 3.1 Action — "Tin Nhắn" Mô Tả Điều Gì Xảy Ra

```javascript
// Action = plain JavaScript object với field "type"
// type: string mô tả sự kiện (convention: "domain/eventName")

// Action đơn giản:
const incrementAction = { type: "counter/increment" };

// Action với payload:
const addToCartAction = {
  type: "cart/addItem",
  payload: {
    id: "prod_123",
    name: "Áo thun",
    price: 150000,
    quantity: 2
  }
};

// Action với metadata:
const fetchUserAction = {
  type: "user/fetchById",
  payload: { id: 1 },
  meta: { timestamp: Date.now(), requestId: "req_abc" },
  error: false
};

// Action Creator — function trả action:
const addItem = (item) => ({ type: "cart/addItem", payload: item });

// Tại sao dùng Action Creator?
// 1. Tránh typo trong type string
// 2. Centralizes action creation logic
// 3. Easier to test
// 4. Composable (có thể add metadata, logging)
```

## 3.2 Reducer — "Hàm Xử Lý" State Transitions

```javascript
// Reducer = pure function (state, action) → newState

// RULE: Không bao giờ:
//   - Modify state directly (state.value = ...)
//   - Fetch API, setTimeout (side effects!)
//   - Date.now() hay Math.random() (không pure)

// Counter Reducer (đơn giản):
const initialState = { value: 0 };

function counterReducer(state = initialState, action) {
  switch (action.type) {
    case "counter/increment":
      return { ...state, value: state.value + 1 };    // new object!
    case "counter/decrement":
      return { ...state, value: state.value - 1 };
    case "counter/incrementByAmount":
      return { ...state, value: state.value + action.payload };
    default:
      return state;  // CRITICAL: trả state hiện tại cho unknown actions!
  }
}

// Cart Reducer (phức tạp hơn):
const cartInitial = { items: [], total: 0 };

function cartReducer(state = cartInitial, action) {
  switch (action.type) {
    case "cart/addItem": {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        // Item exists: update quantity
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          )
        };
      }
      // Item new: append
      return {
        ...state,
        items: [...state.items, action.payload]
      };
    }
    case "cart/removeItem":
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload)
      };
    default:
      return state;
  }
}

// TẠI SAO IMMUTABILITY QUAN TRỌNG:
// React/Redux dùng shallow equality để detect changes:
//   prevState === nextState → no change → no re-render
//
// Nếu mutate:
//   state.items.push(newItem)  ← same array reference!
//   prevState === nextState → TRUE → React thinks nothing changed → no re-render!
//
// Nếu return new object:
//   return { ...state, items: [...state.items, newItem] }
//   prevState !== nextState → React re-renders!
```

## 3.3 Store — "Trung Tâm" Quản Lý State

```javascript
import { createStore, combineReducers } from "redux";

// Combine multiple reducers (each handles its slice):
const rootReducer = combineReducers({
  counter: counterReducer,    // state.counter
  cart: cartReducer,          // state.cart
  user: userReducer,          // state.user
});

// Create store:
const store = createStore(rootReducer);

// Store API:
store.getState()        // → current state object
store.dispatch(action)  // → dispatch action → runs reducers → new state
store.subscribe(fn)     // → subscribe to state changes (returns unsubscribe fn)

// Manual usage (without React):
store.subscribe(() => {
  console.log("State changed:", store.getState());
});

store.dispatch({ type: "counter/increment" });
// Logs: "State changed: { counter: { value: 1 }, cart: {...} }"

// TẠI SAO combineReducers?
// Reducer thuần túy nên xử lý 1 phần state (slice).
// combineReducers: mỗi reducer chỉ nhận/trả SLICE của nó, không toàn bộ state.
// → Separation of concerns
// → Mỗi reducer independent, testable separately
```

---

# 4. Redux Data Flow — Cơ Chế Từng Bước

## 4.1 Unidirectional Data Flow

```
Redux enforces STRICT unidirectional flow. Không có shortcut.

┌─────────────────────────────────────────────────────┐
│                                                     │
│   UI Event                                          │
│   (user clicks "Add to Cart")                       │
│        ↓                                            │
│   Dispatch Action                                   │
│   store.dispatch({ type: "cart/addItem", payload }) │
│        ↓                                            │
│   Middleware (if any)                               │
│   (logging, async, etc.)                            │
│        ↓                                            │
│   Reducer(s)                                        │
│   (state, action) → newState                        │
│        ↓                                            │
│   Store updates state                               │
│   (replaces old state with new)                     │
│        ↓                                            │
│   Subscribers notified                              │
│   (React components re-render)                      │
│        ↓                                            │
│   UI re-renders with new state                      │
│                                                     │
└─────────────────────────────────────────────────────┘

Tại sao UNIDIRECTIONAL?
Predictable: luôn biết data đến từ đâu.
Debuggable: follow action → reducer → state change.
Time-travel: có thể replay actions → rebuild any past state.
```

## 4.2 Bên Trong `store.dispatch(action)`

```javascript
// Đây là cách Redux store hoạt động internally (simplified):

function createStore(reducer) {
  let state;           // current state
  let listeners = [];  // subscribers

  function getState() {
    return state;
  }

  function dispatch(action) {
    // 1. Run reducer với current state + action
    state = reducer(state, action);

    // 2. Notify tất cả subscribers
    listeners.forEach(listener => listener());

    return action;
  }

  function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
      listeners = listeners.filter(l => l !== listener);
    };
  }

  // 3. Initialize state bằng dispatch dummy action
  dispatch({ type: "@@INIT" });

  return { getState, dispatch, subscribe };
}

// Khi app start: dispatch({ type: "@@INIT" })
// → tất cả reducers chạy với state=undefined
// → trả defaultState (từ default parameter)
// → store khởi tạo với tất cả initial states!
```

## 4.3 combineReducers — Cơ Chế

```javascript
// combineReducers thực sự làm gì?
function combineReducers(reducers) {
  return function rootReducer(state = {}, action) {
    return Object.keys(reducers).reduce((newState, key) => {
      // Mỗi reducer nhận SLICE của state (state[key])
      // không phải toàn bộ state
      newState[key] = reducers[key](state[key], action);
      return newState;
    }, {});
  };
}

// Kết quả:
// cartReducer chỉ nhận và trả state.cart
// userReducer chỉ nhận và trả state.user
// Tất cả reducers đều nhận CÙNG action → mỗi reducer quyết định có xử lý không

// Điều này nghĩa là:
// Một action có thể được xử lý bởi NHIỀU reducers cùng lúc!
// VD: { type: "user/logout" }
//   → userReducer: clear user data
//   → cartReducer: clear cart (user logged out → clear their cart)
//   → notificationReducer: clear notifications
```

## 4.4 React-Redux — useSelector và useDispatch

```javascript
// React-Redux kết nối Redux store với React components.

// Provider: inject store vào React tree
import { Provider } from "react-redux";
function App() {
  return (
    <Provider store={store}>
      <Router>...</Router>
    </Provider>
  );
}

// useSelector: subscribe và select data từ store
function CartIcon() {
  // selector function: (state) => value
  const itemCount = useSelector(state => state.cart.items.length);
  const total = useSelector(state => state.cart.total);

  // CƠ CHẾ: useSelector subscribe to store.
  // Mỗi khi state thay đổi, selector chạy lại.
  // Nếu return value CHANGED (strict equality ===):
  //   → component re-renders
  // Nếu return value SAME:
  //   → component SKIPS re-render (optimization!)

  return <div>Cart ({itemCount}) - {total}đ</div>;
}

// useDispatch: trả dispatch function
function AddToCartButton({ product }) {
  const dispatch = useDispatch();

  const handleClick = () => {
    dispatch({ type: "cart/addItem", payload: product });
  };

  return <button onClick={handleClick}>Add to Cart</button>;
}

// TẠI SAO useSelector KHÔNG gây re-render vô tội vạ:
// store.subscribe() → mọi state change đều notify
// useSelector: check if selected value CHANGED (===)
// Object.is(prev, next) → false → re-render
// Object.is(prev, next) → true → skip re-render

// CẢNH BÁO: selector không nên trả object mới mỗi lần!
// useSelector(state => ({ a: state.a, b: state.b }))
// → NEW object mỗi lần → luôn re-render! (reference khác)
// Fix: dùng nhiều useSelector hoặc shallowEqual hoặc memoized selector
```

---

# 5. Redux Middleware — Thunk & Saga

## 5.1 Middleware — Lý Thuyết

```
Vấn đề: Reducer phải là pure function (không có side effects).
Nhưng real app cần: fetch API, set localStorage, log, analytics...

Giải pháp: Middleware.

Middleware là layer nằm giữa dispatch và reducer.
Có thể intercept, transform, delay, hoặc replace actions.

store.dispatch(action)
    ↓
[Middleware 1]   ← có thể modify, delay, cancel
    ↓
[Middleware 2]   ← logging, analytics
    ↓
[Middleware 3]   ← thunk, saga
    ↓
rootReducer(state, action)
    ↓
new state

Middleware signature:
store => next => action => { ... next(action) ... }
  ^         ^        ^
  Middleware có thể   next = dispatch đến middleware tiếp theo
  access getState()  action = action được dispatch
```

## 5.2 Redux Thunk — Async Actions

```javascript
// Vấn đề: store.dispatch chỉ nhận plain objects.
// Nhưng async operations (fetch API) cần dispatch nhiều actions:
//   1. dispatch "loading started"
//   2. await fetch(...)
//   3. dispatch "success" với data HOẶC dispatch "failed" với error

// Thunk: middleware cho phép dispatch FUNCTIONS (thay vì chỉ objects).
// Khi dispatch nhận function → thunk middleware gọi function đó
//   với (dispatch, getState) arguments.

// Middleware implementation (simplified):
const thunkMiddleware = store => next => action => {
  if (typeof action === "function") {
    // Action is a function! Thunk case.
    return action(store.dispatch, store.getState);  // gọi function
  }
  // Action is plain object, pass through normally.
  return next(action);
};

// Usage — "Thunk Action Creator":
export const fetchUser = (userId) => async (dispatch, getState) => {
  // dispatch loading state:
  dispatch({ type: "user/fetchPending" });

  try {
    // async operation:
    const response = await fetch(`/api/users/${userId}`);
    const user = await response.json();

    // dispatch success:
    dispatch({ type: "user/fetchFulfilled", payload: user });
  } catch (error) {
    // dispatch failure:
    dispatch({ type: "user/fetchRejected", payload: error.message });
  }
};

// Trong component:
const dispatch = useDispatch();
useEffect(() => {
  dispatch(fetchUser(1));  // dispatch function!
}, []);

// Flow:
// dispatch(fetchUser(1))
//   → thunk middleware: typeof fetchUser(1) === "function"
//   → gọi fetchUser(1)(dispatch, getState)
//   → dispatch({ type: "user/fetchPending" }) → reducer
//   → await fetch...
//   → dispatch({ type: "user/fetchFulfilled", payload }) → reducer
```

## 5.3 Redux Saga — Phức Tạp Hơn Nhưng Mạnh Hơn

```javascript
// Redux Saga dùng ES6 Generators để handle side effects.
// Thunk: imperative (async/await flow trong action creator)
// Saga: declarative (describe effects, saga runtime executes them)

import { call, put, takeLatest, select, all } from "redux-saga/effects";

// Saga = generator function:
function* fetchUserSaga(action) {
  try {
    yield put({ type: "user/fetchPending" });  // dispatch action

    // call: describe "call this async function with these args"
    // Saga runtime thực sự execute việc này
    const user = yield call(userApi.fetchById, action.payload);

    yield put({ type: "user/fetchFulfilled", payload: user });
  } catch (error) {
    yield put({ type: "user/fetchRejected", payload: error.message });
  }
}

// Watcher saga: listen for specific actions
function* watchFetchUser() {
  // takeLatest: nếu dispatch fetchUser nhiều lần,
  // cancel tất cả ngoại trừ lần cuối (debounce!)
  yield takeLatest("user/fetchById", fetchUserSaga);
}

// takeEvery: xử lý TẤT CẢ dispatched actions
// takeLatest: chỉ latest (cancel previous)
// takeLeading: chỉ first (ignore new until current done)

// Root saga:
function* rootSaga() {
  yield all([
    watchFetchUser(),
    watchFetchProducts(),
    watchSubmitOrder(),
  ]);
}

// TẠI SAO SAGA TESTABLE HƠN THUNK:
// Thunk test: phải mock API calls
// Saga test: chỉ check generator yields đúng effects
// (effects là plain objects, không thực sự run!)

test("fetchUserSaga", () => {
  const gen = fetchUserSaga({ payload: 1 });

  expect(gen.next().value).toEqual(put({ type: "user/fetchPending" }));
  expect(gen.next().value).toEqual(call(userApi.fetchById, 1));
  expect(gen.next(mockUser).value).toEqual(
    put({ type: "user/fetchFulfilled", payload: mockUser })
  );
});
// Không cần mock API! Chỉ check plain objects.

// SAGA vs THUNK:
// Thunk: đơn giản, phù hợp hầu hết cases, async/await familiar
// Saga: powerful (cancel, race, channel), testable, phức tạp hơn
// Dùng Saga khi: complex async flows, race conditions, cancellation needed
```

---

# 6. Redux Toolkit (RTK) — Modern Redux

## 6.1 Tại Sao RTK Ra Đời?

```
Redux "vanilla" có quá nhiều boilerplate:

Để add 1 feature (VD: fetch users):
  1. Define action type strings (string literals → typo-prone)
  2. Create action creators
  3. Create async thunk
  4. Write reducer với switch/case
  5. Handle loading/success/error states
  6. Setup immer for immutability
  7. Configure store with middleware

→ 100+ lines boilerplate cho 1 feature!

RTK giải quyết: opinionated, batteries-included Redux.
  ✅ createSlice: action + reducer trong 1
  ✅ createAsyncThunk: async pattern built-in
  ✅ Immer built-in: viết "mutating" code, Immer handle immutability
  ✅ configureStore: tự setup middleware (thunk, devtools)
```

## 6.2 createSlice — Action + Reducer Trong Một

```javascript
import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    total: 0,
    status: "idle",  // idle | loading | succeeded | failed
  },

  // reducers: define case reducers
  // RTK dùng Immer → có thể "mutate" state trực tiếp!
  reducers: {
    addItem(state, action) {
      // "Mutating" code! Nhưng thực ra Immer tạo new immutable state.
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        existing.quantity += action.payload.quantity;  // Immer handles this!
      } else {
        state.items.push(action.payload);  // "push" OK because Immer!
      }
      state.total = state.items.reduce(
        (sum, i) => sum + i.price * i.quantity, 0
      );
    },

    removeItem(state, action) {
      state.items = state.items.filter(i => i.id !== action.payload);
      state.total = state.items.reduce(
        (sum, i) => sum + i.price * i.quantity, 0
      );
    },

    clearCart(state) {
      state.items = [];
      state.total = 0;
    },
  },
});

// Auto-generated action creators:
export const { addItem, removeItem, clearCart } = cartSlice.actions;
// addItem({ id: 1, name: "...", price: 100 })
// → { type: "cart/addItem", payload: { id: 1, ... } }
// Name prefix = slice name ("cart") + "/" + reducer name ("addItem")

// Reducer to add to store:
export default cartSlice.reducer;

// Usage in component:
dispatch(addItem({ id: "prod_1", name: "Áo thun", price: 150000, quantity: 1 }));
dispatch(removeItem("prod_1"));
dispatch(clearCart());
```

## 6.3 Immer — Cơ Chế "Mutate But Immutable"

```
Immer dùng JavaScript Proxy để "intercept" mutations.

Khi reducer chạy trong Immer:
  1. Immer tạo "draft" (proxy) của state
  2. Reducer code MODIFY draft (tưởng như mutate)
  3. Immer track tất cả modifications
  4. Sau khi reducer return:
     → Immer tạo NEW immutable state từ original + modifications
     → Phần không thay đổi: shared references (structural sharing)
     → Phần thay đổi: new objects

STRUCTURAL SHARING:
  Original state:
  { user: {...}, cart: { items: [A, B, C], total: 300 } }

  After addItem:
  {
    user: {...}  ← SAME reference (unchanged)
    cart: {
      items: [A, B, C, D]  ← NEW array
      total: 400            ← NEW value
    }  ← NEW object
  }  ← NEW root object

  user is shared (not copied!) → memory efficient

Tại sao không dùng Immer trực tiếp (không có RTK)?
  Có thể dùng! RTK chỉ integrate sẵn cho convenience.
  Immer: import produce from "immer";
  const nextState = produce(state, draft => { draft.value++; });
```

## 6.4 createAsyncThunk — Async Pattern Chuẩn

```javascript
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// createAsyncThunk: tự generate 3 action types:
// "users/fetchAll/pending"
// "users/fetchAll/fulfilled"
// "users/fetchAll/rejected"

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",  // action type prefix
  async (params, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await usersApi.getAll(params);
      return response.data;  // → trở thành action.payload khi fulfilled
    } catch (error) {
      // rejectWithValue: trả error có structured data (không phải Error object)
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }
  },
  {
    // condition: không dispatch nếu đã loading
    condition: (_, { getState }) => {
      const { status } = getState().users;
      if (status === "loading") return false;
    },
  }
);

// Handle trong slice:
const usersSlice = createSlice({
  name: "users",
  initialState: {
    list: [],
    status: "idle",     // idle | loading | succeeded | failed
    error: null,
    selectedUser: null,
  },
  reducers: {
    selectUser(state, action) {
      state.selectedUser = action.payload;
    },
  },

  // extraReducers: handle actions từ createAsyncThunk
  extraReducers(builder) {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Unknown error";
      });
  },
});

// Usage:
dispatch(fetchUsers({ page: 1, status: "ACTIVE" }));

// In component:
const { list, status, error } = useSelector(state => state.users);
if (status === "loading") return <Spinner />;
if (status === "failed") return <Error message={error} />;
return <UserList users={list} />;
```

## 6.5 configureStore — Store Setup

```javascript
import { configureStore } from "@reduxjs/toolkit";

const store = configureStore({
  reducer: {
    cart: cartReducer,
    users: usersReducer,
    ui: uiReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Date objects in these action paths:
        ignoredActions: ["users/setFilter"],
        ignoredPaths: ["ui.lastUpdated"],
      },
    }).concat(loggerMiddleware, analyticsMiddleware),

  devTools: process.env.NODE_ENV !== "production",

  // Preloaded state (for SSR / hydration):
  preloadedState: window.__REDUX_STATE__,
});

// TypeScript: infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks:
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
```

---

# 7. RTK Query — Data Fetching

## 7.1 Vấn Đề RTK Query Giải Quyết

```
Với createAsyncThunk, mỗi API call cần:
  - action type (pending/fulfilled/rejected)
  - thunk function
  - state shape (loading, data, error)
  - extraReducers
  - selector

→ 40-60 lines per endpoint!

Nếu 20 API endpoints → 800-1200 lines boilerplate.

RTK Query: data fetching + caching layer tự động.
  ✅ Auto-generate hooks (useGetUsersQuery, useCreateUserMutation)
  ✅ Built-in caching (không re-fetch nếu data vẫn fresh)
  ✅ Automatic loading/error states
  ✅ Cache invalidation (update data khi mutation thành công)
  ✅ Background refetching, polling
  ✅ Optimistic updates
```

## 7.2 RTK Query Setup

```javascript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const usersApi = createApi({
  reducerPath: "usersApi",  // key trong Redux store
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/v1",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),

  // Cache time: data stays "fresh" for 60 seconds after last subscriber unmounts
  keepUnusedDataFor: 60,

  // Tag types cho cache invalidation:
  tagTypes: ["User", "Product", "Order"],

  endpoints: (builder) => ({
    // Query (GET):
    getUsers: builder.query({
      query: (params) => ({
        url: "/users",
        params,  // → /users?status=ACTIVE&page=0
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map(u => ({ type: "User", id: u.id })),
             { type: "User", id: "LIST" }]
          : [{ type: "User", id: "LIST" }],
    }),

    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    // Mutation (POST/PUT/DELETE):
    createUser: builder.mutation({
      query: (userData) => ({
        url: "/users",
        method: "POST",
        body: userData,
      }),
      // Invalidate "LIST" tag → getUsers re-fetches automatically!
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: data,
      }),
      // Invalidate specific user + list
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

// Auto-generated hooks:
export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} = usersApi;

// Add to store:
const store = configureStore({
  reducer: {
    [usersApi.reducerPath]: usersApi.reducer,
    // ...other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(usersApi.middleware),
});
```

## 7.3 Sử Dụng RTK Query Hooks

```javascript
function UserList() {
  const {
    data,           // response data (undefined khi loading/error)
    isLoading,      // true khi fetch lần đầu (no cached data)
    isFetching,     // true khi refetching (có thể có cached data)
    isSuccess,      // true khi fetch success
    isError,        // true khi fetch error
    error,          // error object
    refetch,        // manually refetch
  } = useGetUsersQuery(
    { status: "ACTIVE", page: 0 },  // query arguments
    {
      pollingInterval: 30000,  // refetch every 30s
      skip: !isAuthenticated,  // skip query if not authenticated
      refetchOnMountOrArgChange: true,  // refetch when component mounts
    }
  );

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage error={error} />;

  return <List items={data?.users} />;
}

function CreateUserForm() {
  const [createUser, { isLoading, isSuccess, error }] = useCreateUserMutation();

  const handleSubmit = async (formData) => {
    try {
      const result = await createUser(formData).unwrap();
      // .unwrap(): throw nếu mutation failed (error handling)
      console.log("Created:", result);
      // RTK Query tự động invalidate "LIST" tag → UserList re-fetches!
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {isLoading && <Spinner />}
      {isSuccess && <SuccessMessage />}
      {error && <ErrorMessage error={error} />}
      {/* form fields */}
    </form>
  );
}
```

---

# 8. Zustand — Triết Lý Khác Hoàn Toàn

## 8.1 Zustand Ra Đời Để Giải Quyết Gì?

```
Redux quá verbose với nhiều boilerplate.
Context API gây re-render toàn bộ tree khi state thay đổi.
MobX quá "magic" (observable, reactive).

Zustand (2019, Daishi Kato): "Bear necessities for state management"

Triết lý:
  1. Minimal API — vài functions là đủ
  2. No providers — không cần wrap app trong Provider
  3. Không bắt buộc theo pattern nào — flexible
  4. Granular subscriptions — chỉ re-render khi CHÍNH XÁC data bạn dùng thay đổi
  5. Outside React — có thể dùng state ngoài component

Zustand KHÔNG thay thế Redux. Chúng serve different use cases.
Zustand tốt cho: medium-sized apps, local/UI state, quick setup.
Redux tốt cho: large apps, complex logic, strong debugging needs.
```

## 8.2 Zustand Basics — API Tối Giản

```javascript
import { create } from "zustand";

// create: tạo store + hook cùng lúc
const useCartStore = create((set, get) => ({
  // STATE:
  items: [],
  total: 0,

  // ACTIONS (functions):
  addItem: (item) => {
    set((state) => {
      const existing = state.items.find(i => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
    // Tính lại total sau khi thêm:
    get().recalculateTotal();
  },

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter(i => i.id !== id),
    })),

  clearCart: () => set({ items: [], total: 0 }),

  recalculateTotal: () =>
    set((state) => ({
      total: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    })),
}));

// Usage — cực kỳ đơn giản:
function CartIcon() {
  // Chỉ subscribe đến items.length!
  // Component KHÔNG re-render khi total thay đổi (nếu không dùng total)
  const itemCount = useCartStore(state => state.items.length);
  return <div>Cart ({itemCount})</div>;
}

function AddToCartButton({ product }) {
  // Lấy action function, không subscribe state
  const addItem = useCartStore(state => state.addItem);
  // NOTE: addItem là stable reference — không gây re-render!

  return <button onClick={() => addItem(product)}>Add</button>;
}

// KHÔNG CẦN Provider! Store là module-level singleton.
```

## 8.3 `set` và `get` — Cơ Chế Cập Nhật

```javascript
const useStore = create((set, get) => ({
  count: 0,
  user: null,
  items: [],

  // set: CƠ BẢN — merge object vào state (shallow merge)
  simpleUpdate: () => set({ count: 1 }),
  // state = { count: 1, user: null, items: [] }
  // chỉ count thay đổi, user và items giữ nguyên reference!

  // set với function — access previous state:
  increment: () => set((state) => ({ count: state.count + 1 })),

  // set với replace: true — REPLACE toàn bộ state (không merge)
  resetEverything: () => set({}, true),
  // ⚠️ Dangerous! Xóa tất cả kể cả functions!
  // Dùng khi: reset to initial state (pass initialState)

  // get: access current state từ bên trong actions
  // (không thể dùng state trong closure trực tiếp — stale closure!)
  addAndLog: (item) => {
    set((state) => ({ items: [...state.items, item] }));
    // Sau khi set, dùng get() để access updated state:
    console.log("Total items:", get().items.length);
  },

  // Async action — không cần thunk, just async function!
  fetchUser: async (id) => {
    set({ loading: true });
    try {
      const user = await userApi.fetchById(id);
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

---

# 9. Zustand Cơ Chế Bên Trong

## 9.1 Store Implementation (Simplified)

```javascript
// Zustand core là ~100 lines. Đây là simplified version:

function createStore(createState) {
  let state;
  const listeners = new Set();  // Set (not array) for O(1) add/remove

  // setState: core của Zustand
  function setState(partial, replace) {
    const nextState = typeof partial === "function"
      ? partial(state)   // (state) => newPartialState
      : partial;         // plain object

    if (nextState !== state) {
      const previousState = state;
      state = replace
        ? nextState                       // full replace
        : Object.assign({}, state, nextState);  // shallow merge

      // Notify tất cả subscribers:
      listeners.forEach(listener => listener(state, previousState));
    }
  }

  function getState() { return state; }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);  // cleanup function
  }

  // Initialize state:
  state = createState(setState, getState, { setState, getState, subscribe });

  return { getState, setState, subscribe };
}

// React hook wrapper (simplified):
function useStore(store, selector) {
  const [, forceRender] = useReducer(c => c + 1, 0);

  const selectorRef = useRef(selector);
  const stateRef = useRef(store.getState());
  const selectedRef = useRef(selector(stateRef.current));

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      const selected = selectorRef.current(state);
      // KEY: chỉ re-render nếu selected value thực sự thay đổi!
      if (!Object.is(selected, selectedRef.current)) {
        selectedRef.current = selected;
        forceRender();  // trigger re-render
      }
    });
    return unsubscribe;
  }, [store]);

  return selectedRef.current;
}
```

## 9.2 Granular Subscriptions — Tại Sao Zustand Không Gây Re-render Thừa

```javascript
// Store có nhiều state:
const useStore = create(() => ({
  user: { name: "Khang", avatar: "..." },
  cart: { items: [], total: 0 },
  notifications: { count: 3, list: [] },
  theme: "dark",
}));

// Component A chỉ cần theme:
function ThemeToggle() {
  const theme = useStore(state => state.theme);
  // Subscribe chỉ đến state.theme
  // Khi cart.items thay đổi → theme vẫn === "dark" → NO re-render!
}

// Component B chỉ cần notification count:
function NotificationBell() {
  const count = useStore(state => state.notifications.count);
  // Khi user.name thay đổi → count vẫn === 3 → NO re-render!
}

// SO SÁNH VỚI CONTEXT:
// Context:
const StateContext = createContext();
function StateProvider({ children }) {
  const [state, setState] = useState({ user, cart, notifications, theme });
  return <StateContext.Provider value={{ state, setState }}>
    {children}
  </StateContext.Provider>;
}

// ThemeToggle dùng useContext(StateContext):
// Khi cart thay đổi → context value thay đổi → TẤT CẢ consumers re-render!
// Kể cả ThemeToggle, NotificationBell dù chúng không dùng cart!

// Zustand: O(n) re-renders chỉ cho components THỰC SỰ cần data đó thay đổi
// Context: O(all consumers) re-renders mỗi khi bất kỳ state nào thay đổi
```

## 9.3 Subscriptions Ngoài React

```javascript
// Zustand store có thể dùng NGOÀI component!

const store = useStore;  // the store itself

// Subscribe từ plain JS (không phải React):
const unsubscribe = store.subscribe(
  (state) => state.cart.items,  // selector
  (items) => {
    // Chỉ gọi khi items thay đổi!
    localStorage.setItem("cart", JSON.stringify(items));
  }
);

// Get state bất kỳ lúc nào:
const currentState = store.getState();

// Dispatch action từ outside React:
store.getState().addItem({ id: "1", name: "Product" });

// Use case: persist to localStorage
// Use case: WebSocket updates từ outside component tree
// Use case: integration với legacy code
```

---

# 10. Zustand Patterns — Nâng Cao

## 10.1 Slices Pattern — Tách Store Lớn

```javascript
// Với store lớn, tách thành slices:

// cartSlice.js
const createCartSlice = (set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
  })),
  clearCart: () => set({ items: [] }),
});

// userSlice.js
const createUserSlice = (set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// Combined store:
const useBoundStore = create((...args) => ({
  ...createCartSlice(...args),
  ...createUserSlice(...args),
}));

// Usage:
const user = useBoundStore(state => state.user);
const addItem = useBoundStore(state => state.addItem);
```

## 10.2 Middleware — persist, devtools, immer

```javascript
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const useCartStore = create(
  devtools(         // Redux DevTools integration!
    persist(        // auto-save to localStorage/sessionStorage
      immer(        // Immer for "mutating" updates
        (set, get) => ({
          items: [],

          addItem: (item) => set((state) => {
            // Immer: có thể mutate trực tiếp!
            const existing = state.items.find(i => i.id === item.id);
            if (existing) {
              existing.quantity += item.quantity;  // direct mutation OK!
            } else {
              state.items.push(item);
            }
          }),
        })
      ),
      {
        name: "cart-storage",    // localStorage key
        partialize: (state) =>   // chỉ persist items, không persist loading states
          ({ items: state.items }),

        // Custom storage (sessionStorage, cookie, etc.):
        storage: {
          getItem: (name) => sessionStorage.getItem(name),
          setItem: (name, value) => sessionStorage.setItem(name, value),
          removeItem: (name) => sessionStorage.removeItem(name),
        },
      }
    ),
    { name: "Cart Store" }  // devtools display name
  )
);
```

## 10.3 Async Actions — Patterns

```javascript
// Pattern 1: Inline async (simple)
const useStore = create((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await usersApi.getAll(params);
      set({ users: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));

// Pattern 2: Kết hợp với React Query (phổ biến!)
// Zustand cho CLIENT state (UI, selection, filters)
// React Query cho SERVER state (fetched data)
const useStore = create((set) => ({
  selectedUserId: null,
  filterStatus: "ACTIVE",
  sidebarOpen: false,

  selectUser: (id) => set({ selectedUserId: id }),
  setFilter: (status) => set({ filterStatus: status }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

// Component:
function UserManager() {
  const { filterStatus, setFilter } = useStore();
  
  // React Query handles server state (fetching, caching, refetching):
  const { data: users, isLoading } = useQuery({
    queryKey: ["users", filterStatus],
    queryFn: () => usersApi.getAll({ status: filterStatus }),
  });

  return <div>...</div>;
}

// Pattern 3: Computed / derived state trong selector (hiệu quả nhất)
const total = useCartStore(
  state => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
);
// Selector chạy mỗi re-render, nhưng chỉ trigger re-render khi RESULT thay đổi.
```

## 10.4 Shallow Equality — Tránh Re-render Không Cần Thiết

```javascript
import { shallow } from "zustand/shallow";

// VẤN ĐỀ: selector trả object mới mỗi lần
function UserCard() {
  const user = useStore(state => ({
    name: state.user.name,
    email: state.user.email,
  }));
  // → NEW object mỗi lần store thay đổi → re-render mỗi lần!
  // Dù state.user.name và state.user.email không thay đổi.
}

// FIX 1: Dùng shallow comparison
function UserCard() {
  const user = useStore(
    state => ({ name: state.user.name, email: state.user.email }),
    shallow  // compare { name, email } bằng shallow equality
    // Re-render chỉ khi name HOẶC email thực sự thay đổi
  );
}

// FIX 2: Select từng field riêng (recommended)
function UserCard() {
  const name = useStore(state => state.user.name);
  const email = useStore(state => state.user.email);
  // Primitives: strict equality works. No shallow needed.
  // Re-render chỉ khi name hoặc email thực sự thay đổi.
}

// FIX 3: useShallow hook (Zustand v5)
import { useShallow } from "zustand/react/shallow";
function UserCard() {
  const { name, email } = useStore(
    useShallow(state => ({ name: state.user.name, email: state.user.email }))
  );
}
```

---

# 11. Redux vs Zustand vs Context — Khi Nào Dùng Gì?

## 11.1 Decision Tree

```
State này là:

1. SERVER STATE? (data từ API: users, products, orders)
   → Dùng React Query / RTK Query (không phải Redux/Zustand!)
   → Họ handle: fetching, caching, deduplication, background refetch, loading/error states

2. CLIENT STATE nhỏ, LOCAL? (form validation, modal open/close, hover state)
   → Dùng useState / useReducer
   → Không cần global state management

3. CLIENT STATE cần SHARE giữa nhiều components?
   
   Số components nhỏ / cùng sub-tree?
   → Context API (đơn giản, built-in)
   
   NHƯNG data thay đổi thường xuyên?
   → KHÔNG dùng Context (re-render tất cả consumers)
   → Dùng Zustand
   
   App lớn, team lớn, cần debug tools, complex logic?
   → Redux Toolkit
   
   Cần async complex (race conditions, cancellation, complex flows)?
   → Redux + Redux Saga

4. UI STATE global? (theme, sidebar, modals, locale)
   → Zustand (simple, no boilerplate)

5. Form state?
   → React Hook Form (không phải Redux/Zustand!)
   → Redux Form → deprecated, tránh
```

## 11.2 So Sánh Chi Tiết

```
┌────────────────────┬─────────────────┬──────────────┬─────────────────┐
│                    │ Redux (RTK)      │ Zustand      │ Context API     │
├────────────────────┼─────────────────┼──────────────┼─────────────────┤
│ Bundle size        │ ~15KB           │ ~1KB         │ 0KB (built-in)  │
│ Boilerplate        │ Medium (RTK)    │ Minimal      │ Minimal         │
│ Learning curve     │ Steep           │ Easy         │ Easy            │
│ DevTools           │ Excellent       │ Good         │ Poor            │
│ Time-travel debug  │ ✅              │ Partial      │ ❌              │
│ Middleware         │ Rich (thunk,    │ Via          │ ❌              │
│                    │  saga, etc.)    │ middleware   │                 │
│ Performance        │ Good            │ Excellent    │ Poor (re-render │
│ (many updates)     │ (with selectors)│ (granular)   │  all consumers) │
│ Async handling     │ Built-in        │ Manual       │ Manual          │
│ Outside React      │ ✅              │ ✅           │ ❌              │
│ Server-side render │ Good (hydrate)  │ Good         │ Good            │
│ Team scale         │ Large teams     │ Any size     │ Small/medium    │
│ Predictability     │ Very high       │ High         │ Medium          │
└────────────────────┴─────────────────┴──────────────┴─────────────────┘
```

## 11.3 Khi Nào Context API Là Đủ

```javascript
// Context OK cho: data ít thay đổi, cần ở nhiều nơi
// Theme, locale, current user (đọc nhiều, ghi ít)

// BAD: thay đổi thường xuyên trong context
const CartContext = createContext();
function CartProvider({ children }) {
  const [items, setItems] = useState([]);  // thay đổi mỗi click!
  return (
    <CartContext.Provider value={{ items, setItems }}>
      {children}
    </CartContext.Provider>
  );
}
// Mỗi khi items thay đổi → TẤT CẢ components dùng CartContext re-render!
// Kể cả Header chỉ hiển thị item count!

// GOOD: context cho stable data
const ThemeContext = createContext();
const UserContext = createContext();  // user thay đổi ít (chỉ khi login/logout)

// OPTIMIZATION: split contexts
// Thay vì 1 big context → nhiều small contexts
// Component chỉ subscribe context mà nó cần
const ThemeContext = createContext();      // chỉ theme
const UserActionsContext = createContext(); // chỉ actions
const UserDataContext = createContext();   // chỉ user data
```

## 11.4 Kết Hợp Redux + React Query (Modern Pattern)

```javascript
// BEST PRACTICE 2024-2025:
// Redux/Zustand: chỉ cho CLIENT state (UI, navigation, selections)
// React Query / RTK Query: cho SERVER state (API data)

// Redux store chỉ có UI state:
const store = configureStore({
  reducer: {
    ui: uiReducer,       // sidebar, modals, theme
    auth: authReducer,   // token, user session info
  }
});
// KHÔNG có: products, orders, users (server state!)

// React Query cho server state:
const { data: products } = useQuery({
  queryKey: ["products", filters],
  queryFn: () => productsApi.getAll(filters),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});

// Lợi ích:
// Redux nhỏ gọn, dễ manage
// React Query handle caching tự động (không cần tự viết)
// Loading/error states tự động
// Background refetch, stale-while-revalidate
// Optimistic updates built-in
```

---

# 12. Selector & Derived State

## 12.1 Tại Sao Cần Selector?

```
Problem: Component cần computed data từ store.

// BAD: tính toán trong component
function OrderSummary() {
  const items = useSelector(state => state.cart.items);
  const discount = useSelector(state => state.cart.discount);

  // Tính trong component:
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;

  // VẤN ĐỀ:
  // 1. Logic tính toán trong UI component → vi phạm separation of concerns
  // 2. Nếu nhiều components cần cùng calculation → duplicate
  // 3. Mỗi re-render tính lại từ đầu → không memoized
}
```

## 12.2 Reselect — Memoized Selectors

```javascript
import { createSelector } from "@reduxjs/toolkit";  // re-exported từ reselect

// Input selectors (cheap, just select from state):
const selectItems = state => state.cart.items;
const selectDiscount = state => state.cart.discount;

// Memoized selector:
const selectCartSummary = createSelector(
  // Input selectors:
  [selectItems, selectDiscount],

  // Result function — chỉ chạy lại khi inputs thay đổi!
  (items, discount) => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountAmount = subtotal * discount;
    const total = subtotal - discountAmount;

    return {
      itemCount: items.length,
      subtotal,
      discountAmount,
      total,
    };
  }
);

// createSelector caching:
// Lần 1: items=[A,B], discount=0.1 → compute → cache {items, discount, result}
// Lần 2: items=[A,B], discount=0.1 → inputs SAME → return CACHED result (no recompute!)
// Lần 3: items=[A,B,C], discount=0.1 → items CHANGED → recompute → new cache
// Memoization key: (items, discount) tuple

// Usage:
function OrderSummary() {
  const { total, itemCount, discountAmount } = useSelector(selectCartSummary);
  // Chỉ re-render khi total, itemCount, hoặc discountAmount thực sự thay đổi.
}

// Parameterized selector (factory):
const makeSelectItemById = (id) => createSelector(
  state => state.cart.items,
  (items) => items.find(i => i.id === id)
);

function CartItem({ id }) {
  const selectItem = useMemo(() => makeSelectItemById(id), [id]);
  const item = useSelector(selectItem);
}
```

## 12.3 Derived State trong Zustand

```javascript
// Zustand: selector là plain function, dùng useMemo nếu expensive

const useCartStore = create((set) => ({
  items: [],
  discount: 0,
}));

// Simple derived (inline selector):
function CartTotal() {
  const total = useCartStore(state =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0) * (1 - state.discount)
  );
  // Chạy mỗi lần state thay đổi, nhưng chỉ re-render khi total thay đổi
}

// Nếu computation expensive, dùng useMemo + selector:
function ExpensiveCartSummary() {
  const items = useCartStore(state => state.items);
  const discount = useCartStore(state => state.discount);

  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { subtotal, total: subtotal * (1 - discount) };
  }, [items, discount]);  // chỉ tính lại khi items hoặc discount thay đổi

  return <div>{summary.total}</div>;
}
```

---

# 13. State Normalization

## 13.1 Vấn Đề Với Nested/Duplicated Data

```javascript
// BAD: deeply nested, duplicated data
{
  orders: [
    {
      id: 1,
      items: [
        { id: 10, product: { id: 100, name: "Áo", price: 150000 } },
        { id: 11, product: { id: 101, name: "Quần", price: 200000 } }
      ],
      user: { id: 1, name: "Khang", email: "khang@test.com" }
    },
    {
      id: 2,
      items: [
        { id: 12, product: { id: 100, name: "Áo", price: 150000 } }
        // Product 100 duplicated! If price changes, must update in 2 places!
      ],
      user: { id: 1, name: "Khang", email: "khang@test.com" }
      // User duplicated! If name changes, must update in 2 places!
    }
  ]
}

// Problems:
// 1. Update một entity → phải tìm và update tất cả nơi nó xuất hiện
// 2. Không biết bao nhiêu places cần update
// 3. Race conditions: 2 reducers update 2 copies → inconsistent
// 4. Deep equality expensive khi check changes
```

## 13.2 Normalized State — Database-like

```javascript
// GOOD: normalized state (như database tables)
{
  entities: {
    users: {
      byId: {
        1: { id: 1, name: "Khang", email: "khang@test.com" }
      },
      allIds: [1]
    },
    products: {
      byId: {
        100: { id: 100, name: "Áo", price: 150000 },
        101: { id: 101, name: "Quần", price: 200000 }
      },
      allIds: [100, 101]
    },
    orderItems: {
      byId: {
        10: { id: 10, orderId: 1, productId: 100, quantity: 1 },
        11: { id: 11, orderId: 1, productId: 101, quantity: 2 },
        12: { id: 12, orderId: 2, productId: 100, quantity: 1 }
      },
      allIds: [10, 11, 12]
    },
    orders: {
      byId: {
        1: { id: 1, userId: 1, itemIds: [10, 11], status: "DELIVERED" },
        2: { id: 2, userId: 1, itemIds: [12], status: "PENDING" }
      },
      allIds: [1, 2]
    }
  }
}

// Benefits:
// Update product price → update chỉ products.byId[100]
//   → tất cả orders instantly reflect new price (via reference)
// O(1) lookup: products.byId[id] thay vì O(n) array.find()
// No duplication → no inconsistency
```

## 13.3 RTK createEntityAdapter

```javascript
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

// createEntityAdapter: tự manage normalized state
const productsAdapter = createEntityAdapter({
  selectId: (product) => product.id,       // default
  sortComparer: (a, b) => a.name.localeCompare(b.name),  // sort
});

// State shape: { ids: [...], entities: { id: product } }
const productsSlice = createSlice({
  name: "products",
  initialState: productsAdapter.getInitialState({
    status: "idle",
    error: null,
  }),
  reducers: {
    productAdded: productsAdapter.addOne,          // add 1
    productsLoaded: productsAdapter.setAll,         // replace all
    productUpdated: productsAdapter.updateOne,      // update 1
    productRemoved: productsAdapter.removeOne,      // remove 1
  },
  extraReducers(builder) {
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      productsAdapter.setAll(state, action.payload);
      state.status = "succeeded";
    });
  },
});

// Auto-generated selectors:
const {
  selectAll: selectAllProducts,    // → [product, product, ...]
  selectById: selectProductById,   // (state, id) → product
  selectIds: selectProductIds,     // → [id, id, ...]
  selectTotal: selectProductTotal, // → count
} = productsAdapter.getSelectors(state => state.products);

// Usage:
const products = useSelector(selectAllProducts);
const product = useSelector(state => selectProductById(state, id));
```

---

# 14. Common Bugs & Anti-Patterns

## 14.1 Redux Anti-Patterns

```javascript
// ❌ 1. Mutating state directly
case "addItem":
  state.items.push(action.payload);   // MUTATION! breaks time-travel
  return state;                        // same reference → no re-render!
// ✅ Fix:
  return { ...state, items: [...state.items, action.payload] };

// ❌ 2. Storing non-serializable data
dispatch({ type: "setDate", payload: new Date() });
// Dates, functions, Maps, Sets không serializable
// → DevTools hiển thị sai, time-travel broken
// ✅ Fix: serialize trước khi store
dispatch({ type: "setDate", payload: new Date().toISOString() });

// ❌ 3. Quá nhiều state trong Redux
// Không phải tất cả state đều cần global!
// Form input values, hover states, modal open/close → local useState!
// ✅ Rule: "Is this state needed by multiple disconnected components?"
//         If no → useState

// ❌ 4. Selector không memoized, trả object mới
const selectData = state => ({        // New object every render!
  items: state.cart.items,
  total: state.cart.total,
});
useSelector(selectData);  // Re-render ALWAYS even if nothing changed
// ✅ Fix: createSelector hoặc tách thành 2 selectors

// ❌ 5. Dispatch trong render
function Component() {
  const dispatch = useDispatch();
  dispatch(someAction());  // Dispatch on every render → infinite loop!
  return <div />;
}
// ✅ Fix: dispatch trong useEffect hoặc event handlers

// ❌ 6. Quá nhiều slices nhỏ không cần thiết
// slice cho mỗi boolean flag → overhead
// ✅ Group related state vào 1 slice: uiSlice cho tất cả UI state
```

## 14.2 Zustand Anti-Patterns

```javascript
// ❌ 1. Subscribe toàn bộ store (không dùng selector)
const state = useStore();  // Subscribe toàn bộ! Re-render khi BẤT KỲ gì thay đổi!
// ✅ Fix:
const items = useStore(state => state.items);

// ❌ 2. Object selector không dùng shallow
const { name, email } = useStore(state => ({
  name: state.user.name,
  email: state.user.email
}));  // New object → re-render mỗi khi store thay đổi!
// ✅ Fix: dùng shallow hoặc select riêng lẻ
const name = useStore(state => state.user.name);
const email = useStore(state => state.user.email);

// ❌ 3. Stale closure trong actions
const useStore = create((set) => ({
  count: 0,
  // BAD: closure captures "count" at creation time!
  doubleCount: () => {
    const count = ??? // How to get current count?
    set({ count: count * 2 });
  },
}));

// ✅ Fix: dùng function form của set hoặc get()
const useStore = create((set, get) => ({
  count: 0,
  doubleCount: () => set(state => ({ count: state.count * 2 })),
  // OR:
  tripleCount: () => {
    const current = get().count;  // always fresh
    set({ count: current * 3 });
  },
}));

// ❌ 4. Quá nhiều stores nhỏ
// Store cho mỗi feature → khó coordinate, khó debug
// ✅ Guideline: 1 store per major domain (cart, auth, ui)

// ❌ 5. Side effects trong set()
set((state) => {
  fetch("/api/track");  // Side effect trong set! Don't!
  return { tracked: true };
});
// ✅ Fix: side effects trong actions riêng, không trong set()
const trackAction = async () => {
  await fetch("/api/track");
  set({ tracked: true });
};
```

## 14.3 Performance Checklist

```
REDUX:
  □ Selectors memoized với createSelector
  □ Không dispatch trong render cycle
  □ Normalize deeply nested data
  □ Sử dụng batch dispatch khi có nhiều updates liên quan
  □ Component chỉ select data nó thực sự cần
  □ Tránh trả object mới từ selector (dùng selectById thay vì filter)

ZUSTAND:
  □ Luôn dùng selector khi useStore()
  □ Shallow equality cho object selectors
  □ Primitive selectors khi có thể (string, number, boolean)
  □ useMemo cho expensive computations
  □ Tách lớn store thành slices
  □ Devtools middleware trong development
```

---

## 📎 Quick Reference

```
DATA FETCHING:        React Query / RTK Query  (server state)
GLOBAL UI STATE:      Zustand (simple) hoặc Redux (complex)
LOCAL COMPONENT STATE: useState / useReducer
FORM STATE:           React Hook Form

REDUX PATTERN:
  Action (type + payload)
    ↓ dispatch
  Middleware (thunk, saga)
    ↓
  Reducer (pure, immutable)
    ↓
  Store (single source of truth)
    ↓ notify
  useSelector (granular subscribe)
    ↓
  Component re-renders

ZUSTAND PATTERN:
  useStore(selector)  ←  component reads
  get state()         ←  action reads current
  set(partial)        ←  action updates
  listeners.forEach() ←  granular notify
  Object.is(prev, next) → re-render only if changed

WHEN TO RE-RENDER:
  Redux: Object.is(prevSelected, nextSelected)
  Zustand: Object.is(prevSelected, nextSelected)
  Context: always when provider value changes
  
ASYNC:
  Thunk: async function, dispatch multiple actions, simple
  Saga:  generators, declarative effects, complex flows, testable
  RTK Query: data fetching with auto caching, recommended for API calls
```

## 📎 Official Documentation Links

| Topic | Link |
|---|---|
| Redux Official Docs | <https://redux.js.org> |
| Redux Toolkit | <https://redux-toolkit.js.org> |
| RTK Query | <https://redux-toolkit.js.org/rtk-query/overview> |
| React-Redux (hooks) | <https://react-redux.js.org/api/hooks> |
| Reselect (createSelector) | <https://reselect.js.org> |
| Zustand | <https://docs.pmnd.rs/zustand> |
| Zustand Middleware | <https://docs.pmnd.rs/zustand/integrations/persisting-store-data> |
| Zustand GitHub | <https://github.com/pmndrs/zustand> |
| Redux DevTools Extension | <https://github.com/reduxjs/redux-devtools> |
| Immer | <https://immerjs.github.io/immer> |
