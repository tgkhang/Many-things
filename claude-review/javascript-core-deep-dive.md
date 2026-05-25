# 🟨 JavaScript Core — Complete Deep Dive
>
> Closure, Hoisting, Prototype Chain, `this`, Event Loop, Execution Context

---

## 📚 Table of Contents

1. [Execution Context & Call Stack](#1-execution-context--call-stack)
2. [Hoisting — Cơ Chế Chi Tiết](#2-hoisting--cơ-chế-chi-tiết)
3. [Scope & Scope Chain](#3-scope--scope-chain)
4. [Closure — Tận Gốc](#4-closure--tận-gốc)
5. [Prototype Chain & Inheritance](#5-prototype-chain--inheritance)
6. [`this` — Quy Tắc Binding](#6-this--quy-tắc-binding)
7. [Event Loop — Cơ Chế Async](#7-event-loop--cơ-chế-async)
8. [Promises & Async/Await](#8-promises--asyncawait)
9. [Memory Management & Garbage Collection](#9-memory-management--garbage-collection)
10. [Coercion & Equality](#10-coercion--equality)
11. [ES6+ Core Features](#11-es6-core-features)
12. [Common Gotchas & Tricky Questions](#12-common-gotchas--tricky-questions)

---

# 1. Execution Context & Call Stack

## 1.1 Execution Context là gì?

```
EXECUTION CONTEXT (EC) = môi trường mà JavaScript code được thực thi
  Mỗi lần một function được gọi → một EC mới được tạo ra

3 LOẠI EXECUTION CONTEXT:
  1. Global Execution Context (GEC)
     - Tạo khi JS engine bắt đầu chạy
     - Tạo: global object (window trong browser, global trong Node)
     - Tạo: "this" = global object (ở top level)
     - Chỉ có 1 GEC trong toàn bộ chương trình
  
  2. Function Execution Context (FEC)
     - Tạo mỗi khi function được INVOKE (gọi)
     - Có riêng: scope, arguments, this binding
     - Nhiều FEC có thể tồn tại cùng lúc
  
  3. Eval Execution Context
     - Tạo bởi eval() function (tránh dùng!)

MỖI EC CÓ 2 PHASES:
  PHASE 1 — CREATION PHASE (Memory Allocation):
    - Tạo scope chain
    - Tạo variable object:
        • var declarations → hoisted, initialized to undefined
        • function declarations → hoisted, initialized to full function
        • let/const → hoisted nhưng NOT initialized (TDZ!)
    - Xác định "this" binding
  
  PHASE 2 — EXECUTION PHASE (Code runs):
    - Thực thi code line by line
    - Assign values to variables
    - Execute function calls → new EC created

EC COMPONENTS:
  {
    variableEnvironment: { a: undefined, b: fn },  // var + function declarations
    lexicalEnvironment: { ... },                    // let, const, current scope
    thisBinding: <determined by how function called>
  }
```

## 1.2 Call Stack

```javascript
// CALL STACK = stack of execution contexts (LIFO)
// Tracks WHERE we are in program execution

function greet(name) {
    return `Hello, ${name}!`;          // (3) greet EC on top
}

function processUser(user) {
    const greeting = greet(user.name); // (2) greet pushed onto stack
    console.log(greeting);             // (4) greet EC popped
}                                      // (5) processUser EC popped

processUser({ name: "Khang" });        // (1) processUser EC pushed

// CALL STACK STATE OVER TIME:
// ┌─────────────────┐
// │   greet EC      │  ← top (currently executing)
// │ processUser EC  │
// │ Global EC       │  ← bottom (always there)
// └─────────────────┘
//
// When greet returns → greet EC popped:
// ┌─────────────────┐
// │ processUser EC  │  ← top
// │ Global EC       │  ← bottom
// └─────────────────┘

// ── STACK OVERFLOW ──
function infinite() {
    infinite();  // recursion with no base case
}
infinite();  // Uncaught RangeError: Maximum call stack size exceeded
// Stack fills up → crash!

// ── CALL STACK is SYNCHRONOUS ──
// Only ONE thing runs at a time!
// Async operations (setTimeout, fetch) are NOT on the call stack
// → They go through the Event Loop (see section 7)

// ── SEEING THE CALL STACK ──
function a() { b(); }
function b() { c(); }
function c() { console.trace(); }  // prints stack trace!
a();
// console.trace output:
// c @ script.js:3
// b @ script.js:2
// a @ script.js:1
// (anonymous) @ script.js:4
```

---

# 2. Hoisting — Cơ Chế Chi Tiết

## 2.1 Hoisting là gì?

```
HOISTING = JS engine moves declarations to the top of their scope
           BEFORE code executes (during Creation Phase)

THỰC CHẤT:
  JS engine SCANS code before running
  Memory allocated for declarations in Creation Phase
  → Variables and functions "appear" to be at top of scope

NHƯNG: only DECLARATIONS are hoisted, not INITIALIZATIONS!
  var x = 5;  →  declaration (var x) hoisted, initialization (= 5) NOT
```

## 2.2 var Hoisting

```javascript
// ── VAR HOISTING ──
console.log(name);  // undefined (NOT ReferenceError!)
var name = "Khang";
console.log(name);  // "Khang"

// JS sees this as:
var name;           // hoisted to top (undefined)
console.log(name);  // undefined
name = "Khang";     // assignment stays here
console.log(name);  // "Khang"

// ── var is function-scoped ──
function demo() {
    console.log(x);  // undefined (hoisted within function)
    if (true) {
        var x = 10;  // var: function-scoped, NOT block-scoped!
    }
    console.log(x);  // 10 (accessible outside if block!)
}

// var leaks out of blocks:
for (var i = 0; i < 3; i++) { }
console.log(i);  // 3 (var leaked out of for block!)

// Classic bug:
for (var j = 0; j < 3; j++) {
    setTimeout(() => console.log(j), 100);  // prints 3, 3, 3 (not 0, 1, 2!)
}
// var j is shared across all iterations (one variable)
// By the time setTimeout fires, loop done, j = 3

// Fix with let:
for (let j = 0; j < 3; j++) {
    setTimeout(() => console.log(j), 100);  // prints 0, 1, 2 ✓
}
// let creates new binding per iteration!
```

## 2.3 Function Hoisting

```javascript
// ── FUNCTION DECLARATION: fully hoisted (declaration + body) ──
console.log(sayHello("Khang"));  // "Hello, Khang!" — works! before declaration!

function sayHello(name) {        // function DECLARATION
    return `Hello, ${name}!`;
}

// JS moves entire function to top:
// function sayHello(...) { return ... }  ← hoisted FIRST
// console.log(sayHello("Khang"))         ← then runs

// ── FUNCTION EXPRESSION: NOT fully hoisted ──
console.log(greet);       // undefined (var hoisted, but value not yet)
console.log(greet("x")); // TypeError: greet is not a function!

var greet = function(name) {  // function EXPRESSION (assigned to var)
    return `Hi, ${name}!`;
};

console.log(greet("Khang"));  // "Hi, Khang!" — works after assignment

// ── ARROW FUNCTION: same as function expression ──
console.log(arrow);   // undefined
// console.log(arrow()); // TypeError!

var arrow = () => "hello";

// ── FUNCTION DECLARATION vs EXPRESSION ──
// Declaration: function keyword at start of statement
function decl() {}          // DECLARATION — hoisted fully

// Expression: function as part of expression (assigned, passed as arg, etc.)
const expr = function() {};  // EXPRESSION — NOT hoisted
const arrow2 = () => {};     // ARROW EXPRESSION — NOT hoisted

// WHY THIS MATTERS:
// Can call function declarations before they appear in code
// Cannot call function expressions before their assignment
```

## 2.4 let & const — TDZ (Temporal Dead Zone)

```javascript
// let and const are HOISTED (technically)
// But NOT initialized → accessing before declaration = ReferenceError
// This zone of "hoisted but uninitialized" = TEMPORAL DEAD ZONE (TDZ)

// TDZ EXAMPLE:
console.log(x);  // ReferenceError: Cannot access 'x' before initialization
let x = 5;
// x IS hoisted (JS knows it exists), but uninitialized
// Accessing in TDZ = ReferenceError (better than var's silent undefined!)

// TDZ explained:
{
    // TDZ for x starts here (x hoisted but uninitialized)
    console.log(typeof x);  // ReferenceError! (even typeof!)
    // ↑ Note: typeof undeclaredVar = "undefined" (no error)
    //         typeof TDZ var = ReferenceError (different!)
    
    let x = "hello";  // ← TDZ ends here (x initialized)
    console.log(x);   // "hello"
}

// CONST: same as let but must be initialized at declaration
const PI;        // SyntaxError: Missing initializer in const declaration
const PI = 3.14; // OK
PI = 3;          // TypeError: Assignment to constant variable

// CONST with objects: reference is constant, object itself is mutable!
const user = { name: "Khang" };
user.name = "Updated";    // ✓ OK! mutating object
user.age = 21;            // ✓ OK! adding property
user = {};                // ✗ TypeError! reassigning reference

// ── HOISTING SUMMARY ──
// var:       hoisted, initialized to undefined, function-scoped
// let/const: hoisted, NOT initialized (TDZ), block-scoped
// function declaration: hoisted fully (declaration + body)
// function expression: var hoisted (undefined), body NOT hoisted
```

---

# 3. Scope & Scope Chain

## 3.1 Scope Types

```javascript
// SCOPE = where a variable is accessible

// 1. GLOBAL SCOPE: accessible everywhere
var globalVar = "I'm global";
let globalLet = "Also global (but no window property)";

// 2. FUNCTION SCOPE: var inside function, only accessible inside
function outer() {
    var functionVar = "only in outer()";
    console.log(functionVar);  // OK
}
// console.log(functionVar);  // ReferenceError!

// 3. BLOCK SCOPE (let/const only): inside {} block
{
    let blockLet = "block scoped";
    const blockConst = "also block scoped";
    var blockVar = "NOT block scoped (leaks out!)";
}
// console.log(blockLet);    // ReferenceError
// console.log(blockConst);  // ReferenceError
console.log(blockVar);       // OK (var leaks!)

// 4. MODULE SCOPE (ES6 modules): file-level, not global
// In module files: top-level vars are module-scoped (not window)
// export to share, import to use

// ── SCOPE CHAIN ──
const globalVal = "global";

function outer2() {
    const outerVal = "outer";
    
    function middle() {
        const middleVal = "middle";
        
        function inner() {
            const innerVal = "inner";
            // Can access ALL surrounding scopes:
            console.log(innerVal);   // "inner"    ← own scope
            console.log(middleVal);  // "middle"   ← middle scope
            console.log(outerVal);   // "outer"    ← outer scope
            console.log(globalVal);  // "global"   ← global scope
        }
        inner();
    }
    middle();
}

// SCOPE CHAIN LOOKUP:
// inner() looks for 'outerVal':
// 1. own scope → not found
// 2. middle scope → not found
// 3. outer2 scope → FOUND! "outer"
// Lookup stops at first match (shadowing!)

// ── VARIABLE SHADOWING ──
const shadow = "global";

function shadowDemo() {
    const shadow = "local";    // shadows global 'shadow'
    console.log(shadow);       // "local" (local shadows global)
}

shadowDemo();
console.log(shadow);           // "global" (unaffected)

// let/var shadowing with same name:
let x = "outer";
{
    let x = "inner";           // shadows outer x
    console.log(x);            // "inner"
}
console.log(x);                // "outer"
```

---

# 4. Closure — Tận Gốc

## 4.1 Closure là gì?

```
CLOSURE = function + its lexical environment (scope at definition time)
  A function "closes over" variables from its surrounding scope
  Even when the outer function has returned, inner function still has
  access to outer function's variables!

WHY "CLOSES OVER":
  When function created → it captures reference to its scope chain
  Even if outer function execution ends (EC popped from call stack),
  the scope data is KEPT IN MEMORY because closure holds reference to it!

CLOSURE = function + backpack of references to surrounding scope
```

## 4.2 Closure Examples

```javascript
// ── BASIC CLOSURE ──
function outer3() {
    let count = 0;              // outer variable

    function increment() {      // inner function
        count++;                // accesses outer's 'count'!
        return count;
    }

    return increment;           // return the inner function
}

const counter = outer3();       // outer3() finished, but count NOT garbage collected!
console.log(counter());  // 1   // inner function still has access to count!
console.log(counter());  // 2
console.log(counter());  // 3

// count is NOT accessible from outside:
// console.log(count);  // ReferenceError (private!)

// ── TWO SEPARATE CLOSURES = TWO SEPARATE ENVIRONMENTS ──
const counter1 = outer3();
const counter2 = outer3();

counter1();  // 1
counter1();  // 2
counter2();  // 1 ← independent! Each closure has its OWN count
counter1();  // 3 ← counter1 unaffected by counter2

// ── PRACTICAL CLOSURE: FACTORY FUNCTION ──
function createMultiplier(factor) {
    return (number) => number * factor;  // captures 'factor'
}

const double = createMultiplier(2);    // factor = 2 captured
const triple = createMultiplier(3);    // factor = 3 captured

double(5);   // 10
triple(5);   // 15
double(10);  // 20

// ── CLOSURE: MODULE PATTERN (data privacy) ──
function createBankAccount(initialBalance) {
    let balance = initialBalance;  // PRIVATE variable!

    return {
        deposit(amount) {
            if (amount <= 0) throw new Error("Amount must be positive");
            balance += amount;
            return balance;
        },
        withdraw(amount) {
            if (amount > balance) throw new Error("Insufficient funds");
            balance -= amount;
            return balance;
        },
        getBalance() {
            return balance;         // read-only access to private state
        }
    };
}

const account = createBankAccount(1000);
account.deposit(500);   // 1500
account.withdraw(200);  // 1300
account.getBalance();   // 1300
// account.balance;     // undefined! balance is private

// ── CLOSURE: MEMOIZATION ──
function memoize(fn) {
    const cache = {};  // captured in closure!
    return function(...args) {
        const key = JSON.stringify(args);
        if (key in cache) {
            console.log("Cache hit!");
            return cache[key];
        }
        cache[key] = fn.apply(this, args);
        return cache[key];
    };
}

function expensiveCalc(n) {
    // Simulate expensive computation
    return n * n;
}

const memoCalc = memoize(expensiveCalc);
memoCalc(5);  // computes: 25
memoCalc(5);  // "Cache hit!" → 25 (from cache)
memoCalc(6);  // computes: 36

// ── CLOSURE: PARTIAL APPLICATION ──
function multiply(a, b) { return a * b; }

function partial(fn, ...presetArgs) {
    return function(...laterArgs) {
        return fn(...presetArgs, ...laterArgs);  // captures presetArgs!
    };
}

const multiplyBy5 = partial(multiply, 5);  // presetArgs = [5]
multiplyBy5(3);   // 15 → multiply(5, 3)
multiplyBy5(10);  // 50 → multiply(5, 10)

// ── CLOSURE: ONCE (run only once) ──
function once(fn) {
    let called = false;
    let result;
    return function(...args) {
        if (!called) {
            called = true;              // captures 'called'
            result = fn.apply(this, args);
        }
        return result;
    };
}

const initializeApp = once(() => {
    console.log("App initialized!");
    return "initialized";
});
initializeApp();  // "App initialized!"
initializeApp();  // (nothing happens, returns "initialized")
initializeApp();  // (nothing happens, returns "initialized")
```

## 4.3 Closure Gotchas

```javascript
// ── CLASSIC CLOSURE BUG: var in loop ──
const funcs = [];
for (var i = 0; i < 3; i++) {
    funcs.push(() => console.log(i));  // captures 'i' by REFERENCE
}
funcs[0]();  // 3 ← NOT 0! (i was reassigned by loop)
funcs[1]();  // 3
funcs[2]();  // 3
// All closures share the SAME 'i' variable (var is function-scoped)
// When funcs execute, loop already done, i = 3

// ── FIX 1: let (block scope per iteration) ──
const funcs2 = [];
for (let i = 0; i < 3; i++) {      // let creates NEW binding each iteration!
    funcs2.push(() => console.log(i));  // captures DIFFERENT i each time
}
funcs2[0]();  // 0 ✓
funcs2[1]();  // 1 ✓
funcs2[2]();  // 2 ✓

// ── FIX 2: IIFE (Immediately Invoked Function Expression) ──
const funcs3 = [];
for (var i = 0; i < 3; i++) {
    funcs3.push(
        ((capturedI) => () => console.log(capturedI))(i)
        // IIFE captures i as capturedI (parameter, new binding!)
    );
}
funcs3[0]();  // 0 ✓
funcs3[1]();  // 1 ✓
funcs3[2]();  // 2 ✓

// ── CLOSURE MEMORY LEAK ──
// Closures keep referenced variables ALIVE in memory
// Even when outer function finished
// Can leak if:
// 1. Closure stored in long-lived variable
// 2. Closure captures large objects

function createLeak() {
    const HUGE_DATA = new Array(1000000).fill("data");  // 1MB+
    return function() {
        return HUGE_DATA[0];  // closure keeps HUGE_DATA alive!
    };
}

const leaked = createLeak();  // HUGE_DATA stays in memory as long as 'leaked' exists
// Fix: assign null when done
// leaked = null;  // GC can now collect HUGE_DATA
```

---

# 5. Prototype Chain & Inheritance

## 5.1 Prototype Fundamentals

```javascript
// EVERY JS object has [[Prototype]] (hidden internal property)
// [[Prototype]] points to another object (its "prototype")
// This forms the PROTOTYPE CHAIN

// PROPERTY LOOKUP:
// 1. Look on the object itself
// 2. If not found → look on [[Prototype]]
// 3. If not found → look on [[Prototype]]'s [[Prototype]]
// 4. Continues until null (top of chain)
// → null [[Prototype]] = Object.prototype's prototype

// ── __proto__ vs prototype ──
// __proto__ (getter/setter): access [[Prototype]] on an INSTANCE
// .prototype: property on CONSTRUCTOR FUNCTIONS (not instances)
//   Constructor.prototype = the object that will be [[Prototype]] of instances

const animal = {
    speak() { return `${this.name} makes a noise.`; }
};

const dog = Object.create(animal);  // dog's [[Prototype]] = animal
dog.name = "Rex";

dog.speak();    // "Rex makes a noise."
// Lookup: 'speak' not on dog → found on animal (prototype)

dog.__proto__ === animal;  // true
Object.getPrototypeOf(dog) === animal;  // true (preferred over __proto__)

// PROTOTYPE CHAIN:
// dog → animal → Object.prototype → null
Object.getPrototypeOf(animal) === Object.prototype;  // true
Object.getPrototypeOf(Object.prototype) === null;    // true (chain ends!)
```

## 5.2 Constructor Functions & new

```javascript
// CONSTRUCTOR FUNCTION (pre-ES6 "classes"):
function Person(name, age) {
    this.name = name;  // set on the NEW object
    this.age = age;
}

// Add methods to prototype (shared by all instances!):
Person.prototype.greet = function() {
    return `Hi, I'm ${this.name}, age ${this.age}`;
};

Person.prototype.isAdult = function() {
    return this.age >= 18;
};

// WHAT 'new' DOES (4 steps):
// 1. Creates empty object: {}
// 2. Sets [[Prototype]]: obj.__proto__ = Person.prototype
// 3. Runs constructor with 'this' = new object: Person.call(obj, name, age)
// 4. Returns the object (unless constructor explicitly returns an object)

const person1 = new Person("Khang", 21);
const person2 = new Person("Alice", 25);

person1.greet();     // "Hi, I'm Khang, age 21"
person2.isAdult();   // true

// Methods are SHARED (not duplicated per instance!):
person1.greet === person2.greet;  // true (same function on prototype!)

// PROTOTYPE CHAIN for person1:
// person1 → Person.prototype → Object.prototype → null

// INSTANCEOF:
person1 instanceof Person;  // true
person1 instanceof Object;  // true (Person.prototype chain → Object.prototype)

// ── MANUAL SIMULATION OF 'new' ──
function myNew(Constructor, ...args) {
    const obj = Object.create(Constructor.prototype);  // step 1 + 2
    const result = Constructor.apply(obj, args);        // step 3
    return result instanceof Object ? result : obj;    // step 4
}
const p = myNew(Person, "Manual", 30);
p.greet();  // "Hi, I'm Manual, age 30"
```

## 5.3 Prototype Chain Inheritance

```javascript
// ── PROTOTYPAL INHERITANCE ──
function Animal(name) {
    this.name = name;
}
Animal.prototype.eat = function() {
    return `${this.name} eats.`;
};
Animal.prototype.toString = function() {
    return `Animal(${this.name})`;
};

function Dog(name, breed) {
    Animal.call(this, name);  // call parent constructor (inherit own properties!)
    this.breed = breed;
}

// SET UP PROTOTYPE CHAIN:
Dog.prototype = Object.create(Animal.prototype);  // Dog.prototype.__proto__ = Animal.prototype
Dog.prototype.constructor = Dog;                   // fix constructor reference!
// Without this: Dog.prototype.constructor === Animal (wrong!)

Dog.prototype.bark = function() {
    return `${this.name} says Woof!`;
};

const dog2 = new Dog("Rex", "Labrador");
dog2.eat();     // "Rex eats." (inherited from Animal.prototype!)
dog2.bark();    // "Rex says Woof!" (own method)
dog2.toString();// "Animal(Rex)" (inherited)

// PROTOTYPE CHAIN:
// dog2 → Dog.prototype → Animal.prototype → Object.prototype → null

dog2 instanceof Dog;    // true
dog2 instanceof Animal; // true
dog2 instanceof Object; // true

// ── ES6 CLASS (syntactic sugar over prototype!) ──
class Animal2 {
    constructor(name) {
        this.name = name;
    }
    eat() { return `${this.name} eats.`; }      // on Animal2.prototype
    toString() { return `Animal(${this.name})`; }
}

class Dog2 extends Animal2 {
    constructor(name, breed) {
        super(name);       // calls Animal2 constructor (MUST call before 'this'!)
        this.breed = breed;
    }
    bark() { return `${this.name} says Woof!`; }  // on Dog2.prototype
    eat() {
        return super.eat() + " Yum!";  // super.method() = parent's method
    }
}

const dog3 = new Dog2("Buddy", "Poodle");
dog3.eat();   // "Buddy eats. Yum!" (overridden + super)
dog3.bark();  // "Buddy says Woof!"

// ES6 Class IS prototype chain under the hood:
Object.getPrototypeOf(dog3) === Dog2.prototype;        // true
Object.getPrototypeOf(Dog2.prototype) === Animal2.prototype; // true
```

## 5.4 Object.create, hasOwnProperty, Property Descriptors

```javascript
// ── OBJECT.CREATE ──
const personProto = {
    greet() { return `Hi, I'm ${this.name}`; },
    toString() { return `Person(${this.name})`; }
};

const person3 = Object.create(personProto);  // create with specific prototype
person3.name = "Khang";
person3.greet();  // "Hi, I'm Khang"

// Object.create(null): no prototype at all!
const pureDict = Object.create(null);  // no toString, no hasOwnProperty, etc.
pureDict.key = "value";
// Safe as a dictionary — no prototype pollution risk!

// ── HASOWNPROPERTY ──
person3.hasOwnProperty("name");   // true (own property)
person3.hasOwnProperty("greet");  // false (on prototype, not own)

// for...in iterates OWN + inherited enumerable properties:
for (const key in person3) {
    console.log(key);  // "name", "greet", "toString"
}
// Filter to own only:
for (const key in person3) {
    if (person3.hasOwnProperty(key)) console.log(key);  // "name" only
}
// Better: Object.keys() (own enumerable only):
Object.keys(person3);  // ["name"]

// ── PROPERTY DESCRIPTOR ──
const obj = {};
Object.defineProperty(obj, "readOnly", {
    value: 42,
    writable: false,     // can't change value
    enumerable: true,    // shows in for...in and Object.keys()
    configurable: false  // can't delete or redefine
});
obj.readOnly = 100;     // silently fails (or TypeError in strict mode!)
obj.readOnly;           // 42

// GETTER / SETTER:
const person4 = {
    _firstName: "Nguyen",
    _lastName: "Khang",
    get fullName() {
        return `${this._firstName} ${this._lastName}`;
    },
    set fullName(name) {
        [this._firstName, this._lastName] = name.split(" ");
    }
};

person4.fullName;           // "Nguyen Khang"
person4.fullName = "Tran Van A";
person4._firstName;         // "Tran"
person4._lastName;          // "Van A"
```

---

# 6. `this` — Quy Tắc Binding

## 6.1 this Binding Rules

```
'this' = reference to the EXECUTION CONTEXT
  NOT determined by where function is DEFINED
  Determined by HOW function is CALLED (mostly!)

4 BINDING RULES (in priority order):
  1. new binding           (highest)
  2. Explicit binding      (call, apply, bind)
  3. Implicit binding      (method call: obj.method())
  4. Default binding       (lowest: bare function call)

SPECIAL CASES:
  Arrow functions: no own 'this', inherit from lexical scope
  Event listeners: 'this' = element that triggered event
  Class: 'this' = instance
```

## 6.2 The 4 Binding Rules

```javascript
// ── RULE 4: DEFAULT BINDING (bare function call) ──
function showThis() {
    console.log(this);
}
showThis();
// Non-strict: this = global object (window/global)
// Strict mode ('use strict'): this = undefined

"use strict";
function strictThis() {
    console.log(this);  // undefined!
}
strictThis();

// ── RULE 3: IMPLICIT BINDING (method call) ──
const user = {
    name: "Khang",
    greet() {
        console.log(this.name);  // this = user (the object before the dot!)
    }
};
user.greet();  // "Khang" (this = user)

// IMPLICIT BINDING LOST:
const greetFn = user.greet;  // extracting method from object
greetFn();  // undefined! (this = global / undefined in strict)
// No object before the dot → default binding!

// Also lost in callbacks:
setTimeout(user.greet, 100);  // undefined! (setTimeout calls as bare function)

// And in nested functions:
const obj = {
    name: "Object",
    outer() {
        console.log(this.name);  // "Object" (implicit binding)
        function inner() {
            console.log(this.name);  // undefined! (inner is bare function call)
        }
        inner();
    }
};

// ── RULE 2: EXPLICIT BINDING (call, apply, bind) ──
function greet2(greeting, punctuation) {
    return `${greeting}, ${this.name}${punctuation}`;
}

const person5 = { name: "Khang" };

// .call(thisArg, arg1, arg2, ...): call immediately, args individually
greet2.call(person5, "Hello", "!");    // "Hello, Khang!"

// .apply(thisArg, [args]): call immediately, args as array
greet2.apply(person5, ["Hello", "!"]); // "Hello, Khang!"

// .bind(thisArg): returns NEW function with 'this' permanently bound
const greetKhang = greet2.bind(person5);
greetKhang("Hi", ".");  // "Hi, Khang."
greetKhang("Hey", "?"); // "Hey, Khang?"

// BIND with partial application:
const greetKhangHello = greet2.bind(person5, "Hello");
greetKhangHello("!");  // "Hello, Khang!"

// FIXING LOST BINDING:
const fixedGreet = user.greet.bind(user);  // permanently bind to user
setTimeout(fixedGreet, 100);  // "Khang" ✓

// ── RULE 1: NEW BINDING ──
function Car(make, model) {
    this.make = make;   // 'this' = newly created object
    this.model = model;
}
const car = new Car("Toyota", "Camry");
car.make;   // "Toyota" (this was the new object)

// new binding overrides EVERYTHING:
const boundCar = Car.bind({ make: "Forced" });
const actualCar = new boundCar("Honda", "Civic");
actualCar.make;  // "Honda" (new overrides even bind!)

// ── PRIORITY DEMO ──
function bindTest() { console.log(this.x); }
const obj2 = { x: 2, bindTest };
const forcedThis = { x: 3 };

obj2.bindTest();                      // 2 (implicit)
obj2.bindTest.call(forcedThis);       // 3 (explicit beats implicit)
const bound = obj2.bindTest.bind(forcedThis);
new bound();                          // undefined! (new beats bind)
```

## 6.3 Arrow Functions & this

```javascript
// ARROW FUNCTIONS: NO OWN 'this'
// 'this' comes from LEXICAL SCOPE (surrounding function at definition time)
// NOT from how the arrow function is called!

const user2 = {
    name: "Khang",
    greetArrow: () => {
        console.log(this.name);  // WRONG! 'this' from lexical scope = global!
    },                           // Arrow function at object literal level → this = global
    greetRegular() {
        const arrow = () => {
            console.log(this.name);  // CORRECT! 'this' from greetRegular's scope = user2
        };
        arrow();  // calling arrow function as bare function
    }
};

user2.greetArrow();   // undefined (this = global, no 'name' on global)
user2.greetRegular(); // "Khang" ✓ (arrow captures 'this' from greetRegular)

// FIXING THE IMPLICIT BINDING LOST PROBLEM:
const obj3 = {
    name: "Object",
    outer2() {
        console.log(this.name);  // "Object"
        const inner = () => {
            console.log(this.name);  // "Object" ✓ arrow captures outer2's 'this'!
        };
        inner();
    }
};
obj3.outer2();  // "Object", "Object" ✓

// ARROW IN CALLBACKS:
function Timer() {
    this.count = 0;

    // BAD: regular function loses 'this'
    // setInterval(function() { this.count++; }, 1000);  // this = global!

    // GOOD: arrow captures Timer's 'this'
    setInterval(() => {
        this.count++;  // 'this' = Timer instance ✓
        console.log(this.count);
    }, 1000);
}

// CANNOT BIND/CALL/APPLY ARROW FUNCTION'S 'THIS':
const arrowFn = () => console.log(this);
arrowFn.call({ x: 1 });   // still global 'this' (can't change arrow's this!)
arrowFn.bind({ x: 1 })(); // still global 'this'

// ARROW FUNCTIONS WRONG USE: as object methods
const badObj = {
    name: "Bad",
    greet: () => `Hi, ${this.name}`  // ← 'this' is lexical (global), NOT badObj!
};
badObj.greet();  // "Hi, " (this.name = undefined)

// RULE: use regular functions for object methods, arrows for callbacks/nested
```

## 6.4 this in Classes

```javascript
// CLASS: 'this' = instance (new keyword sets it up)
class Counter {
    constructor() {
        this.count = 0;
    }

    increment() {
        this.count++;
    }

    // METHOD BINDING ISSUE IN CLASSES:
    // When method used as callback, 'this' binding lost:
    startAutoIncrement() {
        // BAD:
        // setInterval(this.increment, 1000);  // 'this' lost!

        // GOOD option 1: arrow function wrapper
        setInterval(() => this.increment(), 1000);  // arrow captures class 'this'

        // GOOD option 2: bind in constructor
        setInterval(this.boundIncrement, 1000);
    }
}

class Counter2 {
    constructor() {
        this.count = 0;
        this.increment = this.increment.bind(this);  // bind in constructor!
    }

    increment() {
        this.count++;
    }
}

// CLASS FIELD ARROW FUNCTION (modern, babel/TS):
class Counter3 {
    count = 0;

    // Arrow as class field: 'this' always bound to instance!
    increment = () => {
        this.count++;         // 'this' = instance, always!
    };
}

const c3 = new Counter3();
const fn = c3.increment;  // extract method
fn();                      // works! (arrow captures instance 'this')
c3.count;                  // 1 ✓
```

---

# 7. Event Loop — Cơ Chế Async

## 7.1 JS Runtime Architecture

```
JAVASCRIPT = single-threaded (one call stack, one operation at a time)
So how does async work?

JS RUNTIME (browser/Node.js):
  ┌─────────────────────────────────────────────────────────────────┐
  │                    JS ENGINE (V8)                               │
  │  ┌─────────────────┐   ┌─────────────────────────────────────┐ │
  │  │   HEAP          │   │           CALL STACK                │ │
  │  │ (memory alloc)  │   │  ┌─────────────────────────────┐   │ │
  │  │                 │   │  │  getCurrentUser()            │   │ │
  │  │                 │   │  │  fetchOrders()               │   │ │
  │  │                 │   │  │  main()                      │   │ │
  │  │                 │   │  └─────────────────────────────┘   │ │
  │  └─────────────────┘   └─────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────────────┘
  
  ┌─────────────────────────────────────────────────────────────────┐
  │               WEB APIs / Node APIs (C++ powered)                │
  │  setTimeout, fetch, XMLHttpRequest, DOM events, fs, etc.        │
  └─────────────────────────────────────────────────────────────────┘
  
  ┌────────────────────────────┐   ┌──────────────────────────────┐
  │     MICROTASK QUEUE        │   │      MACROTASK QUEUE         │
  │  (high priority)           │   │   (low priority)             │
  │  Promise callbacks         │   │   setTimeout callbacks       │
  │  queueMicrotask()          │   │   setInterval callbacks      │
  │  MutationObserver          │   │   I/O callbacks              │
  │  process.nextTick (Node)   │   │   UI rendering               │
  └────────────────────────────┘   └──────────────────────────────┘
  
  ┌─────────────────────────────────────────────────────────────────┐
  │                       EVENT LOOP                                │
  │  Checks: is call stack empty?                                   │
  │  If yes: dequeue from queues and push to call stack            │
  │  Priority: MICROTASK first, then MACROTASK                     │
  └─────────────────────────────────────────────────────────────────┘
```

## 7.2 Event Loop Step by Step

```javascript
// ── EVENT LOOP ALGORITHM ──
// 1. Execute all synchronous code (call stack drains)
// 2. Process ALL microtasks (until microtask queue empty)
// 3. Process ONE macrotask (one callback from macrotask queue)
// 4. Process ALL microtasks again (that were queued during step 3)
// 5. Render (browser only)
// 6. Go to step 2

// ── MACROTASKS (Task Queue): ──
//   setTimeout(fn, delay)   — callback after at least 'delay' ms
//   setInterval(fn, delay)  — repeat callback every 'delay' ms
//   setImmediate(fn)        — Node.js only (before I/O callbacks)
//   I/O operations          — file read, network request callbacks
//   HTML parsing, UI events — click, scroll, etc.

// ── MICROTASKS (Microtask Queue): ──
//   Promise.then/.catch/.finally callbacks
//   queueMicrotask(fn)
//   MutationObserver callbacks (DOM changes)
//   process.nextTick(fn) — Node.js (before other microtasks!)

// ── EXECUTION ORDER EXAMPLE ──
console.log("1: sync start");

setTimeout(() => console.log("2: setTimeout"), 0);   // macrotask

Promise.resolve()
    .then(() => console.log("3: promise.then"))       // microtask
    .then(() => console.log("4: promise.then 2"));    // microtask

queueMicrotask(() => console.log("5: queueMicrotask")); // microtask

console.log("6: sync end");

// OUTPUT ORDER:
// 1: sync start         ← synchronous
// 6: sync end           ← synchronous
// 3: promise.then       ← microtask (before macrotask!)
// 5: queueMicrotask     ← microtask
// 4: promise.then 2     ← microtask (chained from #3)
// 2: setTimeout         ← macrotask (last, even though delay=0!)

// WHY: setTimeout(fn, 0) doesn't mean "immediately"!
// It means "as soon as the call stack is empty AND no microtasks"

// ── MORE COMPLEX EXAMPLE ──
console.log("A");

setTimeout(() => {
    console.log("B");         // macrotask
    Promise.resolve()
        .then(() => console.log("C"));  // microtask queued DURING macrotask
}, 0);

Promise.resolve()
    .then(() => {
        console.log("D");     // microtask 1
        setTimeout(() => console.log("E"), 0);  // macrotask queued from microtask
    })
    .then(() => console.log("F"));  // microtask 2 (chained from D)

console.log("G");

// OUTPUT: A, G, D, F, B, C, E
// Breakdown:
// Sync: A, G
// Microtask queue: [D then handler]
//   D runs → queues setTimeout(E) → then F queued
// Microtask queue: [F then handler]
//   F runs
// Macrotask queue: [setTimeout(B), setTimeout(E)]
//   B runs → queues Promise(C)
//   Microtask: C runs
//   E runs
```

## 7.3 setTimeout & setInterval Internals

```javascript
// ── SETTIMEOUT MECHANICS ──
console.log("start");

setTimeout(() => console.log("timeout 500"), 500);
setTimeout(() => console.log("timeout 0"), 0);
setTimeout(() => console.log("timeout 100"), 100);

console.log("end");

// Output: start, end, timeout 0, timeout 100, timeout 500
// setTimeout(fn, 0): "as soon as possible after current sync code"
// NOT immediate execution!

// ── MINIMUM DELAY ──
// Browser specification: minimum 4ms delay in nested timeouts!
function nestedTimeout(depth) {
    if (depth === 0) return;
    setTimeout(() => {
        console.log(depth);
        nestedTimeout(depth - 1);
    }, 0);
}
// After 5 levels: browser enforces min 4ms (spec says so)

// ── SETTIMEOUT DOESN'T GUARANTEE EXACT TIMING ──
setTimeout(() => console.log("should be 100ms"), 100);
// Heavy sync work:
const start = Date.now();
while (Date.now() - start < 500) {} // block for 500ms!
// The callback runs AFTER 500ms (when call stack clears), not at 100ms!

// ── SETINTERVAL DRIFT ──
setInterval(() => {
    // If this takes 200ms and interval is 100ms:
    // Callbacks can "stack up"!
}, 100);

// Better: setTimeout loop (self-scheduling):
function repeat(fn, delay) {
    function run() {
        fn();
        setTimeout(run, delay);  // schedule AFTER fn completes
    }
    setTimeout(run, delay);
}

// ── CLEARINTERVAL / CLEARTIMEOUT ──
const id = setTimeout(() => console.log("won't run"), 1000);
clearTimeout(id);   // cancel before it fires!

const intervalId = setInterval(() => {
    console.log("tick");
    if (condition) clearInterval(intervalId);  // stop interval
}, 1000);
```

---

# 8. Promises & Async/Await

## 8.1 Promise Internals

```javascript
// PROMISE: object representing eventual completion/failure of async operation
// States: PENDING → FULFILLED or REJECTED (terminal, immutable)

// ── CREATING PROMISES ──
const promise = new Promise((resolve, reject) => {
    // executor runs SYNCHRONOUSLY!
    console.log("executor runs now");
    
    setTimeout(() => {
        const success = Math.random() > 0.5;
        if (success) {
            resolve("Success value");   // fulfill with value
        } else {
            reject(new Error("Failed")); // reject with reason
        }
    }, 1000);
});

// ── CONSUMING PROMISES ──
promise
    .then(value => {
        console.log("Fulfilled:", value);
        return "next value";     // return value for chaining
    })
    .then(value => {
        console.log("Chained:", value);  // receives "next value"
    })
    .catch(error => {
        console.error("Rejected:", error.message);
        // catch handles ANY rejection in the chain above it
        return "recovery value";  // can recover from error!
    })
    .finally(() => {
        console.log("Always runs (success or failure)");
        // NOTE: finally doesn't receive value, and can't change it!
    });

// ── PROMISE CHAINING ──
// Each .then/.catch returns a NEW promise!
// Allows chaining (each step gets previous result)

fetchUser(1)                                    // Promise<User>
    .then(user => fetchOrders(user.id))         // Promise<Order[]>
    .then(orders => orders.filter(o => o.active)) // Promise<Order[]>
    .then(orders => orders.map(formatOrder))    // Promise<OrderDTO[]>
    .then(dtos => saveToCache(dtos))            // Promise<void>
    .catch(error => handleError(error));        // catches any error above

// ── PROMISE COMBINATORS ──

// Promise.all: all must succeed (fail fast)
Promise.all([fetchUser(1), fetchOrders(1), fetchPreferences(1)])
    .then(([user, orders, prefs]) => {
        // All three resolved! destructure results
    })
    .catch(err => {
        // ANY one rejects → entire Promise.all rejects immediately!
    });

// Promise.allSettled: wait for all (success AND failure)
Promise.allSettled([fetchA(), fetchB(), fetchC()])
    .then(results => {
        results.forEach(result => {
            if (result.status === "fulfilled") console.log(result.value);
            if (result.status === "rejected")  console.log(result.reason);
        });
    });
// Never rejects! Always resolves with array of {status, value/reason}

// Promise.race: first one to settle (wins — success or failure)
Promise.race([
    fetch("https://server1.com/data"),
    fetch("https://server2.com/data"),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
])
.then(result => console.log("Fastest:", result))
.catch(err => console.error("Race error or timeout:", err));

// Promise.any: first SUCCESS wins (ignores rejections)
Promise.any([fetchFromA(), fetchFromB(), fetchFromC()])
    .then(firstSuccess => console.log("First success:", firstSuccess))
    .catch(aggregateError => console.error("ALL failed:", aggregateError.errors));
// AggregateError if ALL reject
```

## 8.2 Async/Await

```javascript
// ASYNC/AWAIT = syntactic sugar over Promises (ES2017)
// Makes async code look/behave like synchronous

async function fetchUserData(userId) {
    // async function ALWAYS returns a Promise
    // await PAUSES execution inside async function until promise settles
    
    try {
        const user = await fetchUser(userId);     // wait for promise
        const orders = await fetchOrders(user.id); // wait for promise
        const enriched = await enrichOrders(orders);
        return enriched;  // wraps in Promise.resolve(enriched)
    } catch (error) {
        // Catches ALL rejections from any await above!
        console.error("Failed:", error);
        throw error;  // re-throw to propagate
    }
}

// ── ASYNC/AWAIT IS PROMISE UNDER THE HOOD ──
// This:
async function getUser() {
    const user = await fetchUser(1);
    return user.name;
}

// Is equivalent to:
function getUser2() {
    return fetchUser(1).then(user => user.name);
}

// ── PARALLEL EXECUTION WITH ASYNC/AWAIT ──
// BAD (sequential — waits for each before starting next):
async function sequential() {
    const user    = await fetchUser(1);     // wait 200ms
    const orders  = await fetchOrders(1);  // wait 300ms AFTER user
    const profile = await fetchProfile(1); // wait 100ms AFTER orders
    // Total: 600ms!
}

// GOOD (parallel — start all at once):
async function parallel() {
    const [user, orders, profile] = await Promise.all([
        fetchUser(1),     // all start simultaneously!
        fetchOrders(1),
        fetchProfile(1)
    ]);
    // Total: max(200, 300, 100) = 300ms!
}

// ALSO GOOD: start promises, await later
async function parallel2() {
    const userPromise    = fetchUser(1);    // start all immediately
    const ordersPromise  = fetchOrders(1);  // all running in parallel
    const profilePromise = fetchProfile(1);

    const user    = await userPromise;    // now wait
    const orders  = await ordersPromise;
    const profile = await profilePromise;
}

// ── AWAIT IN LOOPS ──
// BAD: sequential (each request waits for previous)
async function processSequential(ids) {
    for (const id of ids) {
        const user = await fetchUser(id);  // sequential!
        await processUser(user);
    }
}

// GOOD: parallel
async function processParallel(ids) {
    await Promise.all(ids.map(async id => {  // async in map!
        const user = await fetchUser(id);
        await processUser(user);
    }));
}

// ── ERROR HANDLING PATTERNS ──
// Pattern 1: try-catch (clearest)
async function withTryCatch() {
    try {
        const data = await fetchData();
        return process(data);
    } catch (e) {
        handleError(e);
        return null;
    }
}

// Pattern 2: .catch on await (for specific errors)
async function withCatch() {
    const data = await fetchData().catch(e => {
        log.warn("fetch failed, using default");
        return defaultData;  // fallback value
    });
    return process(data);
}

// Pattern 3: awaiting with default (nullish coalescing)
const data = await fetchData().catch(() => null);
if (!data) return handleMissing();
```

---

# 9. Memory Management & Garbage Collection

## 9.1 How GC Works in JS

```javascript
// GARBAGE COLLECTION: automatically frees memory of unreachable objects
// Algorithm: REACHABILITY

// An object is reachable if accessible from:
//   - Global variables
//   - Call stack (local variables in executing functions)
//   - Closures (captured variables)
//   - Anything reachable from any of the above (transitively)

// GC ALGORITHM (Mark-and-Sweep):
// 1. Start from "roots" (global, stack)
// 2. Mark all reachable objects
// 3. Sweep (free) all unmarked objects

// ── MEMORY LEAK PATTERNS ──

// LEAK 1: Forgotten global variables
function createLeak2() {
    leakedVar = "I forgot 'let'!";  // accidental global!
    // Use 'use strict' to prevent!
}

// LEAK 2: Closures holding large objects
function outer4() {
    const LARGE = new Array(1000000).fill("data");  // 8MB
    return () => LARGE[0];  // closure keeps LARGE alive!
}
const hold = outer4();
// hold = null;  // release closure → LARGE can be GC'd

// LEAK 3: Event listeners not removed
function setupComponent(element) {
    const handler = () => console.log("click");
    element.addEventListener("click", handler);
    // If component removed but listener not → both stay in memory!
    
    // Return cleanup:
    return () => element.removeEventListener("click", handler);
}
const cleanup = setupComponent(el);
// When done: cleanup();  // remove listener!

// LEAK 4: Detached DOM nodes
let detachedNode;
function createDetached() {
    const el = document.createElement("div");
    document.body.appendChild(el);
    detachedNode = el;           // hold reference
    document.body.removeChild(el); // removed from DOM
    // But el still referenced by detachedNode → NOT GC'd!
}

// LEAK 5: setInterval not cleared
function startInterval() {
    const data = fetchData();
    setInterval(() => {
        // data captured in closure — stays alive forever!
        process(data);
    }, 1000);
    // If never cleared, data (and interval) lives forever
}

// ── WEAKREF & WEAKMAP ──
// WeakMap: keys are weakly referenced (can be GC'd if no other refs)
const weakMap = new WeakMap();
let obj4 = { name: "test" };
weakMap.set(obj4, "metadata");
obj4 = null;  // obj4 can now be GC'd, WeakMap entry also GC'd!
// Perfect for: caching associated data without preventing GC

// WeakSet: weakly referenced values
const visitedNodes = new WeakSet();
visitedNodes.add(domNode);  // won't prevent GC of domNode
```

---

# 10. Coercion & Equality

## 10.1 Type Coercion

```javascript
// IMPLICIT COERCION: JS automatically converts types
// Explicit coercion: Number(), String(), Boolean()

// ── STRING COERCION (+) ──
1 + "2"       // "12" (number coerced to string!)
"3" - 1       // 2   (string coerced to number for subtraction)
"3" * "4"     // 12  (both coerced to number)
true + true   // 2   (booleans coerced to 1)
false + 1     // 1
null + 1      // 1   (null → 0)
undefined + 1 // NaN (undefined → NaN)

// + with object: calls .valueOf() or .toString()
{} + []       // "[object Object]" (tricky!)
[] + []       // ""
[] + {}       // "[object Object]"

// ── BOOLEAN COERCION ──
// FALSY values (only 8):
// false, 0, -0, 0n (BigInt), "", '', ``, null, undefined, NaN
// EVERYTHING ELSE is truthy!

Boolean(0);         // false
Boolean("");        // false
Boolean(null);      // false
Boolean(undefined); // false
Boolean(NaN);       // false

Boolean("0");       // true  (non-empty string!)
Boolean([]);        // true  (empty array is truthy!)
Boolean({});        // true  (empty object is truthy!)
Boolean(function(){}); // true

if ([]) console.log("truthy!");  // "truthy!" ← empty array is truthy!
if ({}) console.log("truthy!");  // "truthy!" ← empty object is truthy!

// ── == (LOOSE EQUALITY) ──
// Type coercion happens!
1 == "1"       // true  (string → number)
0 == false     // true  (false → 0)
0 == ""        // true  (both → 0)
null == undefined // true  (special rule)
null == 0      // false (null only == null or undefined)
NaN == NaN     // false (NaN ≠ itself! Use Number.isNaN())
[] == false    // true  ([] → "" → 0, false → 0)
[] == ![]      // true  (![] = false, then [] == false → true)

// ABSTRACT EQUALITY ALGORITHM (simplified):
// 1. Same type → strict compare (===)
// 2. null == undefined → true (only case)
// 3. Number vs String → String to Number
// 4. Boolean vs anything → Boolean to Number first
// 5. Object vs primitive → Object to primitive (valueOf/toString)

// ── === (STRICT EQUALITY) ──
// NO type coercion!
1 === "1"      // false (different types!)
0 === false    // false
null === undefined // false
NaN === NaN    // false (still! Use Number.isNaN() or Object.is())

// Object.is() (even stricter):
Object.is(NaN, NaN);  // true  (NaN === itself in Object.is)
Object.is(0, -0);     // false (0 !== -0 in Object.is)
0 === -0;             // true  (=== doesn't distinguish!)

// ── CHECKING FOR NULL/UNDEFINED ──
value == null   // true for BOTH null AND undefined (loose equality special rule)
value === null  // true for null ONLY

// Nullish coalescing (??) — only null/undefined (not falsy!):
const val = value ?? "default";  // "default" only if value is null/undefined
// vs:
const val2 = value || "default";  // "default" for ANY falsy value (0, "", false too!)

// Optional chaining (?.):
user?.address?.city   // undefined instead of TypeError if user or address is null
user?.greet?.()       // undefined instead of TypeError if greet doesn't exist
arr?.[0]              // undefined instead of TypeError if arr is null
```

---

# 11. ES6+ Core Features

## 11.1 Destructuring

```javascript
// ── ARRAY DESTRUCTURING ──
const [first, second, , fourth] = [1, 2, 3, 4];
// first=1, second=2, fourth=4 (third skipped!)

// Rest:
const [head, ...tail] = [1, 2, 3, 4];
// head=1, tail=[2,3,4]

// Default values:
const [a = 10, b = 20] = [1];
// a=1, b=20 (uses default when undefined)

// Swap:
let x2 = 1, y = 2;
[x2, y] = [y, x2];  // x2=2, y=1

// ── OBJECT DESTRUCTURING ──
const { name, age } = { name: "Khang", age: 21, role: "dev" };
// name="Khang", age=21

// Rename:
const { name: userName, age: userAge } = user;
// userName = user.name, userAge = user.age

// Default values:
const { name: n2 = "Anonymous", role = "user" } = { name: "Khang" };
// n2="Khang", role="user" (default)

// Nested:
const { address: { city, zip } } = { address: { city: "HCMC", zip: "70000" } };

// In function parameters:
function processUser({ name, age, role = "user" }) {
    return `${name} (${age}) is a ${role}`;
}

// ── SPREAD & REST ──
// Spread: expand iterable
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];  // [1, 2, 3, 4, 5]

const obj5 = { a: 1, b: 2 };
const obj6 = { ...obj5, c: 3, a: 99 };  // {a:99, b:2, c:3} (later wins!)

// Shallow clone:
const cloned = [...arr1];       // array clone
const clonedObj = { ...obj5 };  // object clone (SHALLOW!)

// Rest: collect remaining into array
function sum(first2, ...rest) {
    return rest.reduce((acc, n) => acc + n, first2);
}
sum(1, 2, 3, 4);  // 10

// ── TEMPLATE LITERALS ──
const name2 = "Khang";
const greeting = `Hello, ${name2}! 
Today is ${new Date().toLocaleDateString()}.`;
// Multi-line, expressions interpolated!

// Tagged templates:
function highlight(strings, ...values) {
    return strings.reduce((result, str, i) =>
        result + str + (values[i] ? `<b>${values[i]}</b>` : ""), "");
}
const price = 100;
highlight`Total: ${price} USD`;  // "Total: <b>100</b> USD"
```

## 11.2 Symbol, Map, Set, WeakRef

```javascript
// ── SYMBOL: unique, immutable primitive ──
const id1 = Symbol("id");
const id2 = Symbol("id");
id1 === id2;   // false! Each Symbol is unique!
id1.toString();  // "Symbol(id)"
id1.description; // "id"

// Use: unique property keys (no collision!)
const USER_ID = Symbol("userId");
user[USER_ID] = 123;  // won't clash with any string key

// Symbol.iterator: make objects iterable
class Range {
    constructor(start, end) { this.start = start; this.end = end; }
    
    [Symbol.iterator]() {  // using Symbol.iterator!
        let current = this.start;
        const end = this.end;
        return {
            next() {
                return current <= end
                    ? { value: current++, done: false }
                    : { value: undefined, done: true };
            }
        };
    }
}

for (const n of new Range(1, 5)) console.log(n);  // 1,2,3,4,5
const arr = [...new Range(1, 5)];  // [1,2,3,4,5]

// ── MAP vs OBJECT ──
// Map: any type as key, ordered, iterable, .size property
const map = new Map();
map.set("string", 1);
map.set(42, "number key!");
map.set(obj5, "object key!");  // objects as keys!
map.get(42);     // "number key!"
map.size;        // 3
map.has("string"); // true

// Iteration:
for (const [key, value] of map) console.log(key, value);
[...map.entries()]  // [[key,val], ...]
[...map.keys()]
[...map.values()]

// From array:
const map2 = new Map([["a", 1], ["b", 2]]);

// ── SET vs ARRAY ──
// Set: unique values, fast lookup, iterable
const set = new Set([1, 2, 3, 2, 1]);  // {1, 2, 3} (auto-dedup!)
set.add(4);
set.has(2);    // true
set.size;      // 4
set.delete(2);

// Set operations:
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

// Union:
const union = new Set([...a, ...b]);      // {1,2,3,4,5,6}
// Intersection:
const inter = new Set([...a].filter(x => b.has(x)));  // {3,4}
// Difference:
const diff  = new Set([...a].filter(x => !b.has(x))); // {1,2}

// Fast dedup array:
const unique = [...new Set([1,2,2,3,3,3])];  // [1,2,3]
```

---

# 12. Common Gotchas & Tricky Questions

## 12.1 JavaScript Gotchas

```javascript
// ── GOTCHA 1: typeof null === "object" ──
typeof null;          // "object" ← BUG in JS (never fixed for backward compat)
typeof undefined;     // "undefined"
typeof [];            // "object" (array IS an object!)
typeof {};            // "object"
typeof function(){};  // "function"

// Correct null check:
value === null;        // exact null check
value == null;         // null OR undefined

// Correct array check:
Array.isArray([]);     // true ✓
[] instanceof Array;   // true ✓

// ── GOTCHA 2: NaN !== NaN ──
NaN === NaN;           // false (only value not equal to itself!)
NaN == NaN;            // false

// Correct NaN check:
Number.isNaN(NaN);     // true ✓
Number.isNaN("hello"); // false ✓ (unlike global isNaN which coerces!)
isNaN("hello");        // true ← BAD! ("hello" coerced to NaN first)

// ── GOTCHA 3: 0.1 + 0.2 ≠ 0.3 ──
0.1 + 0.2 === 0.3;    // false! (floating point precision)
0.1 + 0.2;            // 0.30000000000000004

// Fix:
Math.abs((0.1 + 0.2) - 0.3) < Number.EPSILON;  // true ✓
// Or: use integers (store cents not dollars)
// Or: toFixed() for display

// ── GOTCHA 4: IMPLICIT RETURN IN ARROW ──
const fn1 = () => { value: 1 };  // returns undefined! ({ } = block, not object!)
const fn2 = () => ({ value: 1 }); // returns {value:1} ✓ (wrap object in parens!)

// ── GOTCHA 5: ARGUMENTS vs REST ──
function regular() {
    console.log(arguments);  // [1, 2, 3] (array-like, NOT real array)
    // arguments.filter   → TypeError (not an array!)
    // [...arguments]     → real array
}
regular(1, 2, 3);

const arrow3 = () => {
    console.log(arguments);  // ReferenceError! Arrow has NO 'arguments'
};
// Use rest params instead:
const arrowRest = (...args) => console.log(args);  // [1,2,3] (real array!)

// ── GOTCHA 6: OBJECT SHORTHAND METHOD vs ARROW ──
const counter4 = {
    count: 0,
    // Regular method — can use 'this':
    increment() { this.count++; },           // 'this' = counter4
    // Arrow — 'this' from lexical scope (global!):
    decrement: () => { this.count--; }       // WRONG! 'this' = global
};

// ── GOTCHA 7: PRIMITIVE vs OBJECT WRAPPERS ──
const str1 = "hello";           // primitive string
const str2 = new String("hello"); // String OBJECT (wrapper)
typeof str1; // "string"
typeof str2; // "object"
str1 == str2;   // true (coercion)
str1 === str2;  // false (different types!)
// Never use: new Number(), new Boolean(), new String() — confusing!

// Primitives have auto-wrapping:
"hello".toUpperCase();  // string literal auto-wrapped in String object!
(42).toFixed(2);        // number auto-wrapped in Number object!
// Auto-wrapper created temporarily, method called, wrapper discarded

// ── GOTCHA 8: OBJECT REFERENCE VS VALUE ──
const a2 = { x: 1 };
const b2 = a2;           // b2 points to SAME object!
b2.x = 99;
console.log(a2.x);       // 99 (both reference same object!)

const c = { x: 1 };
const d = { ...c };      // shallow clone (new object!)
d.x = 99;
console.log(c.x);        // 1 (c unaffected)

// Deep equality of objects:
{ a: 1 } === { a: 1 };  // false (different references!)
JSON.stringify({ a: 1 }) === JSON.stringify({ a: 1 });  // true (but fragile)

// ── GOTCHA 9: ASYNC/AWAIT IN forEach ──
// forEach doesn't await async callbacks!
const process = async (item) => await doSomething(item);

// BAD: forEach doesn't wait!
items.forEach(async item => {
    await process(item);  // fires but forEach doesn't await!
});
console.log("This runs before any item is processed!");

// GOOD: for...of with await
for (const item of items) {
    await process(item);  // properly awaited!
}

// GOOD: parallel with Promise.all
await Promise.all(items.map(async item => process(item)));

// ── GOTCHA 10: VARIABLE DECLARED WITH SAME NAME ──
let x3 = 1;
{
    console.log(x3);  // ReferenceError! (TDZ — let is hoisted but not initialized)
    let x3 = 2;       // inner x3 shadows outer x3
}
// Despite outer x3=1, inner let x3 is in TDZ before its declaration!
```

## 12.2 Classic Interview Questions

```javascript
// ── Q1: What is the output? ──
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 0);
}
// Answer: 3, 3, 3
// Reason: var is function-scoped, all closures share same i, loop finishes before setTimeout fires

// ── Q2: What does this output? ──
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
// Answer: 1, 4, 3, 2
// Reason: sync(1,4) → microtask(3) → macrotask(2)

// ── Q3: this binding ──
const obj7 = {
    x: 10,
    getX() { return this.x; }
};
const fn3 = obj7.getX;
console.log(fn3());     // undefined (this = global, no x on global)
console.log(obj7.getX()); // 10 (this = obj7)

// ── Q4: Closure ──
function makeAdder(x) {
    return function(y) {
        return x + y;
    };
}
const add5 = makeAdder(5);
const add10 = makeAdder(10);
add5(3);   // 8
add10(3);  // 13
add5(10);  // 15

// ── Q5: Prototype ──
function Animal3(name) { this.name = name; }
Animal3.prototype.speak = function() { return `${this.name} speaks`; };

const cat = new Animal3("Cat");
Animal3.prototype.speak = function() { return `${this.name} NEW speak`; }; // MODIFIED
cat.speak();  // "Cat NEW speak" (method lookup is dynamic — checks prototype at call time!)

// ── Q6: Event loop ──
async function main() {
    console.log("A");
    await Promise.resolve();
    console.log("B");
    await Promise.resolve();
    console.log("C");
}
main();
console.log("D");
// Answer: A, D, B, C
// A: sync in main
// await: main yields to event loop
// D: sync after main()
// B: microtask resumes main
// C: microtask resumes main again

// ── Q7: Tricky closure ──
function createFunctions() {
    const funcs = [];
    for (let i = 0; i < 3; i++) {  // let!
        funcs.push(function() { return i; });
    }
    return funcs;
}
const funcs4 = createFunctions();
funcs4[0](); // 0
funcs4[1](); // 1
funcs4[2](); // 2
// let creates new binding each iteration!
```

---

## 📎 JavaScript Core Quick Reference

```
EXECUTION CONTEXT:
  Creation Phase: hoist vars (undefined), functions (full), let/const (TDZ)
  Execution Phase: assign values, run code

HOISTING:
  var:      declaration hoisted, initialized to undefined
  let/const: hoisted, NOT initialized → TDZ (access = ReferenceError)
  function declaration: fully hoisted (can call before)
  function expression: only var part hoisted (undefined until assigned)

CLOSURE:
  Function + captured lexical scope
  Variables of outer function stay alive as long as inner function exists
  Use for: data privacy, factories, memoization, partial application
  Watch: memory leaks, var-in-loop bug

PROTOTYPE CHAIN:
  obj → Constructor.prototype → Object.prototype → null
  Property lookup: own → [[Prototype]] → ... → null
  new: create obj, set proto, run constructor, return obj
  instanceof: checks Constructor.prototype in prototype chain

THIS BINDING (priority):
  1. new:      this = new object
  2. explicit: call/apply/bind sets this explicitly
  3. implicit: obj.method() → this = obj
  4. default:  bare call → global (non-strict) or undefined (strict)
  Arrow: no own this → inherits from lexical scope

EVENT LOOP:
  Call Stack (sync) → Microtasks (Promise.then, queueMicrotask) → Macrotasks (setTimeout, I/O)
  Microtasks ALWAYS run before next macrotask!
  setTimeout(fn,0) ≠ immediate — runs AFTER all sync + microtasks!

COERCION:
  == does type coercion, === does not
  Falsy: false, 0, -0, 0n, "", null, undefined, NaN
  null == undefined (true), null !== 0, null !== false
  NaN !== NaN → use Number.isNaN()

CLOSURE GOTCHAS:
  var in loop → all closures share same variable → 3,3,3 not 0,1,2
  Fix: let (block-scoped per iteration) or IIFE

ASYNC GOTCHAS:
  await in forEach → doesn't wait → use for...of or Promise.all
  Promise.all → fail fast on any rejection
  Promise.allSettled → wait for all (no fail fast)
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| MDN JavaScript Guide | <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide> |
| Closures (MDN) | <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures> |
| Prototype Chain (MDN) | <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain> |
| this (MDN) | <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this> |
| Event Loop (MDN) | <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop> |
| Promise (MDN) | <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise> |
| Hoisting (MDN) | <https://developer.mozilla.org/en-US/docs/Glossary/Hoisting> |
| JS Visualizer (Event Loop) | <https://www.jsv9000.app/> |
| Jake Archibald: Tasks, microtasks | <https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/> |
| You Don't Know JS | <https://github.com/getify/You-Dont-Know-JS> |
