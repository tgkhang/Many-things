# 📦 Data Structures — Complete Review
> Array, LinkedList, Stack, Queue, HashMap, Heap, Graph và khi nào dùng cái gì

---

## 📚 Table of Contents

1. [Big O Notation Review](#1-big-o-notation-review)
2. [Array & Dynamic Array](#2-array--dynamic-array)
3. [Linked List](#3-linked-list)
4. [Stack](#4-stack)
5. [Queue & Deque](#5-queue--deque)
6. [Hash Table](#6-hash-table)
7. [Heap / Priority Queue](#7-heap--priority-queue)
8. [Graph](#8-graph)
9. [Trie](#9-trie)
10. [Disjoint Set (Union-Find)](#10-disjoint-set-union-find)
11. [Data Structure Selection Guide](#11-data-structure-selection-guide)

---

# 1. Big O Notation Review

## 1.1 Complexity Classes

```
O(1)       Constant   : array access, hash lookup, push/pop stack
O(log n)   Logarithmic: binary search, BST ops, heap ops
O(n)       Linear     : linear search, traversal, copy
O(n log n) Linearithmic: efficient sorting (merge, heap, quick avg)
O(n²)      Quadratic  : bubble/insertion/selection sort, nested loops
O(2ⁿ)      Exponential: subset generation, naive recursion
O(n!)      Factorial  : permutations, traveling salesman brute force

Best → Worst: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)

Practical limits (operations per second ≈ 10⁸):
  n = 10⁶: O(n) and O(n log n) OK
  n = 10⁴: O(n²) barely OK
  n = 20:  O(2ⁿ) OK
  n = 12:  O(n!) OK
```

## 1.2 Space Complexity

```
O(1)  : in-place algorithms (no extra space proportional to n)
O(n)  : storing copy of input, recursion depth n
O(n²) : 2D DP table

Amortized complexity:
  ArrayList.add() is O(1) amortized, O(n) worst case
  (occasional resize is O(n) but spread over n operations = O(1) each)
```

---

# 2. Array & Dynamic Array

## 2.1 Static Array

```
Memory layout: contiguous block of fixed-size elements
Index i → base_address + i × element_size (O(1) access!)

┌────┬────┬────┬────┬────┐
│ 10 │ 20 │ 30 │ 40 │ 50 │  int[5]
└────┴────┴────┴────┴────┘
  [0]  [1]  [2]  [3]  [4]

Strengths:
  ✅ O(1) random access by index
  ✅ Cache-friendly (contiguous memory)
  ✅ Simple, low overhead

Weaknesses:
  ❌ Fixed size (must know size upfront)
  ❌ O(n) insert/delete in middle (shift elements)
  ❌ Expensive resize (allocate new, copy all)

Operations:
  Access:  O(1)   arr[i]
  Search:  O(n)   linear scan (unsorted)
           O(log n) binary search (sorted)
  Insert:  O(1)   at end (if space)
           O(n)   at beginning or middle (shift)
  Delete:  O(n)   shift elements to fill gap
  Update:  O(1)   arr[i] = value
```

## 2.2 Dynamic Array (ArrayList / vector)

```java
// Internal: static array + size + capacity
// Resize strategy: when full, allocate 2x capacity, copy all elements

// Java ArrayList internals:
Object[] elementData;  // backing array
int size;              // actual elements
// default initial capacity = 10

// Amortized O(1) add:
// n adds → occasional O(n) resize
// Total work: n + n/2 + n/4 + ... = 2n = O(n)
// Per operation: O(n)/n = O(1) amortized

ArrayList<Integer> list = new ArrayList<>(initialCapacity);
list.add(42);             // O(1) amortized
list.add(0, 99);          // O(n) — shifts all elements right
list.get(3);              // O(1)
list.remove(2);           // O(n) — shifts elements left
list.indexOf(42);         // O(n) — linear search
list.contains(42);        // O(n)
list.set(1, 100);         // O(1)
Collections.sort(list);   // O(n log n)
Collections.binarySearch(list, 42); // O(log n) — must be sorted!

// When to use ArrayList vs LinkedList:
// ArrayList: random access, more reads, end insertions
// LinkedList: frequent inserts/deletes at front/middle (with iterator)
//             but LinkedList rarely wins in practice due to cache misses!

// 2D Array:
int[][] matrix = new int[rows][cols];
matrix[r][c] = val;  // O(1)

// Jagged array:
int[][] jagged = new int[3][];
jagged[0] = new int[5];
jagged[1] = new int[2];
jagged[2] = new int[8];
```

## 2.3 Key Array Algorithms

```java
// Two Pointer Technique
int[] sortedArr = {-3, -1, 0, 2, 4, 7};
int target = 6;
int left = 0, right = sortedArr.length - 1;
while (left < right) {
    int sum = sortedArr[left] + sortedArr[right];
    if (sum == target) { found(left, right); break; }
    else if (sum < target) left++;
    else right--;
}

// Sliding Window
int[] arr = {2, 1, 5, 1, 3, 2};
int k = 3;  // window size
int windowSum = 0, maxSum = 0;
for (int i = 0; i < k; i++) windowSum += arr[i];
maxSum = windowSum;
for (int i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];  // add new, remove old
    maxSum = Math.max(maxSum, windowSum);
}

// Prefix Sum (range sum queries in O(1) after O(n) preprocessing)
int[] prefix = new int[arr.length + 1];
for (int i = 0; i < arr.length; i++)
    prefix[i + 1] = prefix[i] + arr[i];
// Range sum [l, r]: prefix[r+1] - prefix[l]  ← O(1)!
```

---

# 3. Linked List

## 3.1 Singly Linked List

```
Node: [data | next →]

Head → [1|→] → [2|→] → [3|→] → [4|null]

Strengths:
  ✅ O(1) insert/delete at HEAD (just pointer change)
  ✅ Dynamic size (no resize needed)
  ✅ Memory allocated on demand

Weaknesses:
  ❌ O(n) access by index (must traverse)
  ❌ Cache-unfriendly (nodes scattered in memory)
  ❌ Extra memory for pointers
  ❌ No random access

Operations:
  Prepend:      O(1) — new node → head
  Append:       O(n) — traverse to tail (or O(1) with tail pointer)
  Insert middle: O(n) to find position + O(1) to insert
  Delete head:  O(1)
  Delete middle: O(n) to find + O(1) to delete
  Search:       O(n)
  Access by idx: O(n)
```

```java
class Node<T> {
    T data;
    Node<T> next;
    Node(T data) { this.data = data; }
}

class SinglyLinkedList<T> {
    private Node<T> head;
    private int size;

    // O(1) - prepend
    public void addFirst(T data) {
        Node<T> node = new Node<>(data);
        node.next = head;
        head = node;
        size++;
    }

    // O(n) - append (O(1) with tail pointer)
    public void addLast(T data) {
        Node<T> node = new Node<>(data);
        if (head == null) { head = node; size++; return; }
        Node<T> curr = head;
        while (curr.next != null) curr = curr.next;
        curr.next = node;
        size++;
    }

    // O(1) - delete head
    public T removeFirst() {
        if (head == null) throw new NoSuchElementException();
        T data = head.data;
        head = head.next;
        size--;
        return data;
    }

    // REVERSE — classic interview question
    public void reverse() {
        Node<T> prev = null, curr = head, next;
        while (curr != null) {
            next = curr.next;  // save next
            curr.next = prev;  // reverse pointer
            prev = curr;       // advance prev
            curr = next;       // advance curr
        }
        head = prev;
    }

    // DETECT CYCLE — Floyd's Algorithm
    public boolean hasCycle() {
        Node<T> slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;  // cycle detected
        }
        return false;
    }

    // FIND MIDDLE — two pointer
    public Node<T> findMiddle() {
        Node<T> slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;  // slow is at middle when fast reaches end
    }

    // MERGE TWO SORTED LISTS
    public static <T extends Comparable<T>> Node<T> mergeSorted(Node<T> l1, Node<T> l2) {
        Node<T> dummy = new Node<>(null);
        Node<T> curr = dummy;
        while (l1 != null && l2 != null) {
            if (l1.data.compareTo(l2.data) <= 0) { curr.next = l1; l1 = l1.next; }
            else                                   { curr.next = l2; l2 = l2.next; }
            curr = curr.next;
        }
        curr.next = (l1 != null) ? l1 : l2;
        return dummy.next;
    }
}
```

## 3.2 Doubly Linked List

```
Node: [← prev | data | next →]

null ← [1|→] ↔ [2|→] ↔ [3|→] ↔ [4|null]
Head ↑                           ↑ Tail

Strengths over Singly:
  ✅ O(1) insert/delete at BOTH ends
  ✅ Can traverse backwards
  ✅ O(1) delete if you have node reference

Java: java.util.LinkedList is Doubly Linked List
  Deque operations: addFirst, addLast, removeFirst, removeLast all O(1)
```

```java
// Java LinkedList as Doubly Linked List:
LinkedList<Integer> dll = new LinkedList<>();
dll.addFirst(1);   // O(1) — head
dll.addLast(2);    // O(1) — tail
dll.removeFirst(); // O(1) — head
dll.removeLast();  // O(1) — tail
dll.get(2);        // O(n) — traverse to index!

// LRU Cache uses Doubly Linked List + HashMap:
class LRUCache {
    private final int capacity;
    private final Map<Integer, Integer> map = new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
            return size() > capacity;  // auto-evict LRU when full
        }
    };

    public LRUCache(int capacity) { this.capacity = capacity; }
    public int get(int key) { return map.getOrDefault(key, -1); }
    public void put(int key, int value) { map.put(key, value); }
}
```

---

# 4. Stack

## 4.1 Stack Internals

```
LIFO: Last In, First Out

push(A), push(B), push(C):
TOP → [C]
      [B]
      [A]
pop() → C
TOP → [B]
      [A]

Operations — ALL O(1):
  push(x): add to top
  pop():   remove from top
  peek():  view top without removing
  isEmpty(): check if empty
  size():    number of elements

Implementations:
  Array-based: fast, cache-friendly, fixed or dynamic size
  LinkedList-based: dynamic, pointer overhead

Applications:
  Function call stack (OS/JVM)
  Undo/Redo
  Browser history (back button)
  Expression evaluation (infix → postfix)
  Balanced parentheses checking
  DFS (Depth-First Search)
  Monotonic stack problems
```

```java
// Java — use Deque as Stack (ArrayDeque is best)
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);      // add to front (top)
stack.push(2);
stack.push(3);
stack.pop();        // removes 3 (top)
stack.peek();       // views 2 (top) without removing
stack.isEmpty();

// CLASSIC: Balanced Parentheses
boolean isBalanced(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') {
            stack.push(c);
        } else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (c == ')' && top != '(') return false;
            if (c == ']' && top != '[') return false;
            if (c == '}' && top != '{') return false;
        }
    }
    return stack.isEmpty();
}

// MONOTONIC STACK — next greater element
int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();  // stores INDICES

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            result[stack.pop()] = arr[i];  // arr[i] is next greater for stack.top
        }
        stack.push(i);
    }
    return result;
}
// arr = [4, 5, 2, 10, 8]
// result = [5, 10, 10, -1, -1]
```

---

# 5. Queue & Deque

## 5.1 Queue

```
FIFO: First In, First Out

enqueue(A), enqueue(B), enqueue(C):
FRONT → [A][B][C] ← REAR

dequeue() → A
FRONT → [B][C] ← REAR

Operations — O(1):
  enqueue / offer: add to rear
  dequeue / poll:  remove from front
  peek / front:    view front without removing

Applications:
  Process scheduling (OS)
  BFS (Breadth-First Search)
  Message queues (Kafka, RabbitMQ conceptually)
  Rate limiting
  Print spooler
  Level-order tree traversal
```

```java
// Java Queue implementations:
Queue<Integer> queue = new LinkedList<>();   // general purpose
Queue<Integer> queue = new ArrayDeque<>();   // faster (no null, preferred!)

queue.offer(1);    // add to rear (returns false if full, doesn't throw)
queue.add(2);      // add to rear (throws if full)
queue.poll();      // remove from front (returns null if empty)
queue.remove();    // remove from front (throws if empty)
queue.peek();      // view front (returns null if empty)
queue.element();   // view front (throws if empty)

// BFS Template:
void bfs(int start, int[][] graph) {
    Queue<Integer> queue = new ArrayDeque<>();
    boolean[] visited = new boolean[graph.length];
    queue.offer(start);
    visited[start] = true;

    while (!queue.isEmpty()) {
        int node = queue.poll();
        System.out.println("Visit: " + node);

        for (int neighbor : graph[node]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(neighbor);
            }
        }
    }
}

// CIRCULAR QUEUE (fixed size, space-efficient):
class CircularQueue {
    private int[] data;
    private int head, tail, size, capacity;

    CircularQueue(int capacity) {
        this.capacity = capacity;
        data = new int[capacity];
    }

    void enqueue(int val) {
        if (isFull()) throw new IllegalStateException();
        data[tail] = val;
        tail = (tail + 1) % capacity;  // wrap around!
        size++;
    }

    int dequeue() {
        if (isEmpty()) throw new NoSuchElementException();
        int val = data[head];
        head = (head + 1) % capacity;  // wrap around!
        size--;
        return val;
    }

    boolean isFull()  { return size == capacity; }
    boolean isEmpty() { return size == 0; }
}
```

## 5.2 Deque (Double-Ended Queue)

```java
// Deque: add/remove from BOTH ends in O(1)
// Most versatile linear data structure!

Deque<Integer> deque = new ArrayDeque<>();

// Add to front:
deque.offerFirst(1);   // or addFirst, push

// Add to back:
deque.offerLast(2);    // or addLast, add, offer

// Remove from front:
deque.pollFirst();     // or removeFirst, pop, poll, remove

// Remove from back:
deque.pollLast();      // or removeLast

// Peek at ends:
deque.peekFirst();     // or peek, getFirst, element
deque.peekLast();      // or getLast

// USE AS STACK: push + pop (both from front)
// USE AS QUEUE: offerLast + pollFirst

// SLIDING WINDOW MAXIMUM — monotonic deque
int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // stores indices

    for (int i = 0; i < n; i++) {
        // Remove indices outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1)
            deque.pollFirst();

        // Remove smaller elements (they'll never be max)
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i])
            deque.pollLast();

        deque.offerLast(i);

        if (i >= k - 1)
            result[i - k + 1] = nums[deque.peekFirst()];
    }
    return result;
}
```

## 5.3 Priority Queue (Heap-based)

```java
// Elements dequeued in priority order (smallest first by default)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
minHeap.poll();   // 1 (smallest)
minHeap.peek();   // 3 (next smallest, not removed)

// Custom comparator:
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]); // sort by first element
PriorityQueue<String> byLength = new PriorityQueue<>(Comparator.comparingInt(String::length));

// K-th Largest Element:
int kthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) minHeap.poll();  // keep only k largest
    }
    return minHeap.peek();  // top of min-heap = k-th largest
}

// Top K frequent elements:
List<Integer> topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);

    PriorityQueue<Integer> minHeap = new PriorityQueue<>(
        Comparator.comparingInt(freq::get));

    for (int key : freq.keySet()) {
        minHeap.offer(key);
        if (minHeap.size() > k) minHeap.poll();
    }
    return new ArrayList<>(minHeap);
}
```

---

# 6. Hash Table

## 6.1 How HashMap Works Internally

```
Hash Table = array of buckets + hash function

PUT(key, value):
  1. hash = hashCode(key)
  2. index = hash & (capacity - 1)   // faster than modulo
  3. If bucket empty → store (key, value) there
  4. If collision → chain (LinkedList) or probe (open addressing)

COLLISION RESOLUTION:
  Separate Chaining (Java HashMap):
    Each bucket → linked list of entries
    Java 8+: if chain length > 8 → convert to Red-Black Tree (O(log n) worst)

  Open Addressing (Python dict, .NET Dictionary):
    If slot taken → probe next slot (linear, quadratic, or double hashing)
    Better cache performance (no pointer chasing)

LOAD FACTOR = n / capacity (default 0.75 in Java)
  When exceeded → resize: double capacity + rehash all entries

Time Complexity:
  Average: O(1) for get, put, remove
  Worst:   O(n) if all keys hash to same bucket (bad hash function!)
  Java 8+ worst: O(log n) per bucket (tree nodes)

Space: O(n) plus overhead per entry (key, value, hash, next pointer)
```

```java
// ── HashMap — most common ──
Map<String, Integer> map = new HashMap<>();
map.put("a", 1);
map.get("a");              // 1
map.getOrDefault("b", 0);  // 0 (key not present)
map.containsKey("a");      // true
map.containsValue(1);      // true, O(n)!
map.remove("a");
map.size();

// Compute patterns (atomic operations):
map.computeIfAbsent("key", k -> new ArrayList<>());
map.computeIfPresent("key", (k, v) -> v + 1);
map.compute("key", (k, v) -> v == null ? 1 : v + 1);
map.merge("key", 1, Integer::sum);  // add 1 to existing or set 1 if absent

// Iteration:
map.forEach((k, v) -> System.out.println(k + "=" + v));
for (Map.Entry<String, Integer> e : map.entrySet()) { ... }
map.keySet().stream().sorted().forEach(...);

// Frequency count pattern:
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray())
    freq.merge(c, 1, Integer::sum);
// or: freq.compute(c, (k, v) -> v == null ? 1 : v + 1);

// Group by pattern:
Map<Integer, List<String>> byLength = new HashMap<>();
for (String word : words)
    byLength.computeIfAbsent(word.length(), k -> new ArrayList<>()).add(word);
// or: Collectors.groupingBy(String::length)

// ── LinkedHashMap — insertion order ──
Map<String, Integer> ordered = new LinkedHashMap<>();
// Iteration order = insertion order

// LRU Cache using LinkedHashMap:
new LinkedHashMap<>(16, 0.75f, true) {  // accessOrder = true
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > MAX_SIZE;
    }
}

// ── TreeMap — sorted by key ──
TreeMap<String, Integer> sorted = new TreeMap<>();
sorted.firstKey();         // smallest key
sorted.lastKey();          // largest key
sorted.floorKey("cat");    // largest key <= "cat"
sorted.ceilingKey("cat");  // smallest key >= "cat"
sorted.headMap("cat");     // keys strictly < "cat"
sorted.tailMap("cat");     // keys >= "cat"
sorted.subMap("b", "d");   // keys in ["b", "d")

// ── HashSet ──
Set<String> set = new HashSet<>();
set.add("apple");
set.contains("apple");   // O(1)
set.remove("apple");     // O(1)

// Set operations:
Set<Integer> a = new HashSet<>(Set.of(1, 2, 3, 4));
Set<Integer> b = new HashSet<>(Set.of(3, 4, 5, 6));
a.retainAll(b);   // intersection: {3, 4}
a.addAll(b);      // union
a.removeAll(b);   // difference
```

## 6.2 Common HashMap Patterns

```java
// TWO SUM — classic O(n) with HashMap
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();  // value → index
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement))
            return new int[]{seen.get(complement), i};
        seen.put(nums[i], i);
    }
    throw new IllegalArgumentException("No solution");
}

// ANAGRAM CHECK — frequency map
boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] freq = new int[26];
    for (int i = 0; i < s.length(); i++) {
        freq[s.charAt(i) - 'a']++;
        freq[t.charAt(i) - 'a']--;
    }
    for (int f : freq) if (f != 0) return false;
    return true;
}

// SUBARRAY SUM EQUALS K — prefix sum + map
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);  // empty prefix
    int count = 0, sum = 0;
    for (int num : nums) {
        sum += num;
        count += prefixCount.getOrDefault(sum - k, 0);
        prefixCount.merge(sum, 1, Integer::sum);
    }
    return count;
}
```

---

# 7. Heap / Priority Queue

## 7.1 Heap Properties

```
BINARY HEAP: complete binary tree stored as array

MIN-HEAP: parent ≤ children (root = minimum)
MAX-HEAP: parent ≥ children (root = maximum)

Array representation:
  parent(i)      = (i-1) / 2
  leftChild(i)   = 2*i + 1
  rightChild(i)  = 2*i + 2

Min-Heap example:
        1
      /   \
     3     5
    / \   / \
   7   4  6   8

Array: [1, 3, 5, 7, 4, 6, 8]
         0  1  2  3  4  5  6

Operations:
  peek (min/max): O(1)  — just return root
  insert:         O(log n) — add at end, sift up
  extractMin/Max: O(log n) — remove root, put last at root, sift down
  buildHeap:      O(n)  — heapify from bottom up (surprising!)
  delete at i:    O(log n)
  changeKey:      O(log n)
```

```java
// Manual Min-Heap implementation:
class MinHeap {
    private int[] data;
    private int size;

    MinHeap(int capacity) { data = new int[capacity]; }

    void insert(int val) {
        data[size] = val;
        siftUp(size);
        size++;
    }

    int extractMin() {
        int min = data[0];
        data[0] = data[--size];  // move last to root
        siftDown(0);
        return min;
    }

    int peek() { return data[0]; }

    private void siftUp(int i) {
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (data[parent] <= data[i]) break;
            swap(i, parent);
            i = parent;
        }
    }

    private void siftDown(int i) {
        while (true) {
            int smallest = i;
            int left = 2 * i + 1, right = 2 * i + 2;
            if (left < size  && data[left]  < data[smallest]) smallest = left;
            if (right < size && data[right] < data[smallest]) smallest = right;
            if (smallest == i) break;
            swap(i, smallest);
            i = smallest;
        }
    }

    private void swap(int i, int j) {
        int tmp = data[i]; data[i] = data[j]; data[j] = tmp;
    }
}

// Heap Sort:
void heapSort(int[] arr) {
    int n = arr.length;
    // Build max-heap: start from last non-leaf, sift down
    for (int i = n/2 - 1; i >= 0; i--)
        siftDown(arr, n, i);
    // Extract elements one by one
    for (int i = n - 1; i > 0; i--) {
        swap(arr, 0, i);       // move current max to end
        siftDown(arr, i, 0);   // restore heap property
    }
}
```

## 7.2 Common Heap Patterns

```java
// K-th SMALLEST in sorted matrix
int kthSmallest(int[][] matrix, int k) {
    int n = matrix.length;
    PriorityQueue<int[]> minHeap = new PriorityQueue<>((a, b) -> a[0] - b[0]);

    for (int i = 0; i < n; i++)
        minHeap.offer(new int[]{matrix[i][0], i, 0});  // {val, row, col}

    for (int i = 0; i < k - 1; i++) {
        int[] curr = minHeap.poll();
        int row = curr[1], col = curr[2];
        if (col + 1 < n)
            minHeap.offer(new int[]{matrix[row][col+1], row, col+1});
    }
    return minHeap.peek()[0];
}

// MEDIAN MAINTENANCE using two heaps
class MedianFinder {
    PriorityQueue<Integer> lower = new PriorityQueue<>(Comparator.reverseOrder()); // max-heap
    PriorityQueue<Integer> upper = new PriorityQueue<>();                           // min-heap
    // lower: smaller half, upper: larger half
    // |lower| == |upper| or |lower| == |upper| + 1

    public void addNum(int num) {
        lower.offer(num);
        upper.offer(lower.poll());           // balance
        if (upper.size() > lower.size())
            lower.offer(upper.poll());       // keep lower >= upper in size
    }

    public double findMedian() {
        if (lower.size() > upper.size()) return lower.peek();
        return (lower.peek() + upper.peek()) / 2.0;
    }
}

// MERGE K SORTED LISTS
ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>(
        Comparator.comparingInt(n -> n.val));

    for (ListNode head : lists)
        if (head != null) heap.offer(head);

    ListNode dummy = new ListNode(0), curr = dummy;
    while (!heap.isEmpty()) {
        ListNode node = heap.poll();
        curr.next = node;
        curr = curr.next;
        if (node.next != null) heap.offer(node.next);
    }
    return dummy.next;
}
```

---

# 8. Graph

## 8.1 Graph Representations

```
Graph G = (V, E)
  V = vertices (nodes)
  E = edges (connections)

Types:
  Directed vs Undirected
  Weighted vs Unweighted
  Cyclic vs Acyclic (DAG = Directed Acyclic Graph)
  Connected vs Disconnected

ADJACENCY MATRIX — 2D array
  matrix[u][v] = 1 if edge u→v, else 0
  Space: O(V²)
  Check edge: O(1)
  Find neighbors: O(V)
  Best for: dense graphs, quick edge lookup

ADJACENCY LIST — array of lists
  adj[u] = list of neighbors of u
  Space: O(V + E)
  Check edge: O(degree(u))
  Find neighbors: O(degree(u))
  Best for: sparse graphs (most real-world graphs!)
```

```java
// Adjacency List (most common):
int V = 5;
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

// Add edge (undirected):
adj.get(0).add(1); adj.get(1).add(0);
adj.get(0).add(4); adj.get(4).add(0);
adj.get(1).add(2); adj.get(2).add(1);

// Weighted graph:
List<List<int[]>> wAdj = new ArrayList<>();  // [neighbor, weight]
wAdj.get(0).add(new int[]{1, 5});  // edge 0→1 with weight 5

// ── BFS ──
void bfs(List<List<Integer>> adj, int start) {
    boolean[] visited = new boolean[adj.size()];
    Queue<Integer> queue = new ArrayDeque<>();
    visited[start] = true;
    queue.offer(start);

    while (!queue.isEmpty()) {
        int u = queue.poll();
        System.out.print(u + " ");
        for (int v : adj.get(u)) {
            if (!visited[v]) {
                visited[v] = true;
                queue.offer(v);
            }
        }
    }
}

// ── DFS (recursive) ──
void dfs(List<List<Integer>> adj, boolean[] visited, int u) {
    visited[u] = true;
    System.out.print(u + " ");
    for (int v : adj.get(u))
        if (!visited[v]) dfs(adj, visited, v);
}

// ── DFS (iterative with stack) ──
void dfsIterative(List<List<Integer>> adj, int start) {
    boolean[] visited = new boolean[adj.size()];
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);

    while (!stack.isEmpty()) {
        int u = stack.pop();
        if (visited[u]) continue;
        visited[u] = true;
        System.out.print(u + " ");
        for (int v : adj.get(u))
            if (!visited[v]) stack.push(v);
    }
}

// ── DETECT CYCLE (undirected) ──
boolean hasCycle(List<List<Integer>> adj, int V) {
    boolean[] visited = new boolean[V];
    for (int i = 0; i < V; i++)
        if (!visited[i] && dfsHasCycle(adj, visited, i, -1)) return true;
    return false;
}
boolean dfsHasCycle(List<List<Integer>> adj, boolean[] vis, int u, int parent) {
    vis[u] = true;
    for (int v : adj.get(u)) {
        if (!vis[v]) { if (dfsHasCycle(adj, vis, v, u)) return true; }
        else if (v != parent) return true;  // back edge!
    }
    return false;
}

// ── TOPOLOGICAL SORT (for DAGs) ──
List<Integer> topoSort(List<List<Integer>> adj, int V) {
    int[] inDegree = new int[V];
    for (int u = 0; u < V; u++)
        for (int v : adj.get(u)) inDegree[v]++;

    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < V; i++) if (inDegree[i] == 0) queue.offer(i);

    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int u = queue.poll();
        order.add(u);
        for (int v : adj.get(u))
            if (--inDegree[v] == 0) queue.offer(v);
    }
    return order.size() == V ? order : Collections.emptyList(); // empty = cycle!
}

// ── DIJKSTRA — shortest path (non-negative weights) ──
int[] dijkstra(List<List<int[]>> adj, int src, int V) {
    int[] dist = new int[V];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
    pq.offer(new int[]{0, src});  // {distance, node}

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];
        if (d > dist[u]) continue;  // stale entry

        for (int[] edge : adj.get(u)) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

---

# 9. Trie

## 9.1 Trie (Prefix Tree)

```
Trie: tree for storing strings, characters on edges
Each node represents a prefix; root = empty string

Insert "cat", "can", "car", "dog":

      root
     /    \
    c      d
    |      |
    a      o
  / | \    |
 t  n  r   g
(*)(*) (*)  (*)   (* = end of word marker)

Operations:
  insert:  O(m) where m = string length
  search:  O(m)
  prefix:  O(m) check if any word starts with prefix

Space: O(ALPHABET_SIZE × N × M) worst case
  N = number of words, M = max word length, ALPHABET = 26

Best for:
  Autocomplete, typeahead suggestions
  Spell checking
  IP routing tables
  Word search in dictionary
  Prefix matching
```

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEndOfWord = false;
}

class Trie {
    private final TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null)
                curr.children[idx] = new TrieNode();
            curr = curr.children[idx];
        }
        curr.isEndOfWord = true;
    }

    boolean search(String word) {
        TrieNode node = getNode(word);
        return node != null && node.isEndOfWord;
    }

    boolean startsWith(String prefix) {
        return getNode(prefix) != null;
    }

    private TrieNode getNode(String prefix) {
        TrieNode curr = root;
        for (char c : prefix.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) return null;
            curr = curr.children[idx];
        }
        return curr;
    }

    // Autocomplete: return all words with given prefix
    List<String> autocomplete(String prefix) {
        List<String> results = new ArrayList<>();
        TrieNode node = getNode(prefix);
        if (node != null) dfs(node, new StringBuilder(prefix), results);
        return results;
    }

    private void dfs(TrieNode node, StringBuilder current, List<String> results) {
        if (node.isEndOfWord) results.add(current.toString());
        for (int i = 0; i < 26; i++) {
            if (node.children[i] != null) {
                current.append((char)('a' + i));
                dfs(node.children[i], current, results);
                current.deleteCharAt(current.length() - 1);  // backtrack
            }
        }
    }
}
```

---

# 10. Disjoint Set (Union-Find)

## 10.1 Union-Find Structure

```
Tracks connectivity in a graph:
  "Are nodes A and B in the same connected component?"
  "How many connected components exist?"

Operations (near O(1) with optimizations):
  find(x): which component does x belong to?
  union(x, y): merge x's and y's components

Optimizations:
  Path Compression: flatten tree during find
  Union by Rank: attach smaller tree under larger

Applications:
  Detect cycles in undirected graph
  Minimum Spanning Tree (Kruskal's algorithm)
  Network connectivity
  Image segmentation (connected pixels)
  Social network clustering
```

```java
class UnionFind {
    private int[] parent, rank;
    private int components;

    UnionFind(int n) {
        parent = new int[n];
        rank   = new int[n];
        components = n;
        for (int i = 0; i < n; i++) parent[i] = i;  // each is its own parent
    }

    // Find with PATH COMPRESSION (makes tree flat)
    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);  // compress: point directly to root
        return parent[x];
    }

    // Union by RANK
    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;  // already same component (cycle!)

        if      (rank[px] < rank[py]) parent[px] = py;
        else if (rank[px] > rank[py]) parent[py] = px;
        else { parent[py] = px; rank[px]++; }

        components--;
        return true;
    }

    boolean connected(int x, int y) { return find(x) == find(y); }
    int getComponents() { return components; }
}

// Usage — detect cycle in undirected graph:
boolean hasCycle(int V, int[][] edges) {
    UnionFind uf = new UnionFind(V);
    for (int[] edge : edges) {
        if (!uf.union(edge[0], edge[1]))  // already connected = cycle!
            return true;
    }
    return false;
}

// Number of connected components:
int countComponents(int n, int[][] edges) {
    UnionFind uf = new UnionFind(n);
    for (int[] e : edges) uf.union(e[0], e[1]);
    return uf.getComponents();
}
```

---

# 11. Data Structure Selection Guide

## 11.1 By Operation Complexity

```
Operation          Best DS                Time
──────────────────────────────────────────────────────────────────
Access by index    Array / ArrayList      O(1)
Access by key      HashMap                O(1) avg
Search sorted      Array (binary search)  O(log n)
Search unsorted    Any                    O(n)
Insert front       LinkedList, Deque      O(1)
Insert back        ArrayList, Deque       O(1) amortized
Insert middle      LinkedList*            O(1) with iterator
Delete front       LinkedList, Deque      O(1)
Find min/max       Heap                   O(1)
Extract min/max    Heap                   O(log n)
Order by priority  PriorityQueue          O(log n) insert
Prefix search      Trie                   O(m) where m=word len
Range queries      TreeMap/TreeSet        O(log n)
Connectivity       Union-Find             O(α(n)) ≈ O(1)
Neighbor lookup    Adjacency List         O(degree)
Detect membership  HashSet                O(1) avg
Count frequency    HashMap                O(1) avg
Sorted order       TreeSet/TreeMap        O(log n)

*LinkedList middle insert: O(n) to find + O(1) to insert
```

## 11.2 Decision Tree

```
What's my primary need?

KEY-VALUE LOOKUP?
  → Need ordering? TreeMap O(log n)
  → Need insertion order? LinkedHashMap O(1)
  → Just fast lookup? HashMap O(1)

UNIQUE SET MEMBERSHIP?
  → Need ordering? TreeSet O(log n)
  → Just fast check? HashSet O(1)

SEQUENCE OF ELEMENTS?
  → Frequent random access? ArrayList
  → Frequent front insert/delete? ArrayDeque / LinkedList
  → LIFO (stack)? Deque.push/pop
  → FIFO (queue)? Deque.offer/poll

FIND MIN/MAX EFFICIENTLY?
  → Extract min/max repeatedly? PriorityQueue (Heap)
  → Just peek at min/max? PriorityQueue.peek O(1)

STRING PREFIX OPERATIONS?
  → Autocomplete, prefix search? Trie

GRAPH / CONNECTIVITY?
  → Shortest path? Dijkstra (weighted) / BFS (unweighted)
  → Connected components? Union-Find
  → Topological order? Kahn's (BFS) or DFS
  → Minimum spanning tree? Kruskal (Union-Find) / Prim

HIERARCHY / RECURSIVE STRUCTURE?
  → Search, insert, delete sorted? BST / Balanced BST
  → Sorted with range queries? TreeMap
  → See Tree Deep Dive file!
```

## 11.3 Java Collections Hierarchy

```
Collection
├── List
│   ├── ArrayList       ← random access, dynamic array
│   ├── LinkedList      ← front/back ops, implements Deque too
│   └── CopyOnWriteArrayList ← thread-safe reads
├── Set
│   ├── HashSet         ← O(1) ops, no order
│   ├── LinkedHashSet   ← insertion order
│   ├── TreeSet         ← sorted (NavigableSet)
│   └── EnumSet         ← bit vector, fastest for enums
└── Queue
    ├── LinkedList      ← general purpose queue
    ├── ArrayDeque      ← faster than LinkedList for most ops
    ├── PriorityQueue   ← min-heap
    └── BlockingQueue (concurrent)

Map (not extends Collection)
├── HashMap             ← O(1) ops, no order
├── LinkedHashMap       ← insertion/access order
├── TreeMap             ← sorted keys (NavigableMap)
├── EnumMap             ← keys are enum values
└── ConcurrentHashMap   ← thread-safe, high performance

Concurrent:
  CopyOnWriteArrayList  ← thread-safe reads
  ConcurrentHashMap     ← thread-safe map
  ArrayBlockingQueue    ← bounded blocking queue
  LinkedBlockingQueue   ← optionally bounded
  ConcurrentLinkedQueue ← non-blocking queue
```

---

## 📎 Complexity Cheatsheet

```
Data Structure    Access   Search   Insert   Delete   Space
─────────────────────────────────────────────────────────────
Array             O(1)     O(n)     O(n)     O(n)     O(n)
Dynamic Array     O(1)     O(n)     O(1)*    O(n)     O(n)
Singly LinkedList O(n)     O(n)     O(1)**   O(1)**   O(n)
Doubly LinkedList O(n)     O(n)     O(1)     O(1)     O(n)
Stack             O(n)     O(n)     O(1)     O(1)     O(n)
Queue             O(n)     O(n)     O(1)     O(1)     O(n)
HashMap           -        O(1)avg  O(1)avg  O(1)avg  O(n)
TreeMap           -        O(log n) O(log n) O(log n) O(n)
Min/Max Heap      O(1)peak O(n)     O(log n) O(log n) O(n)
Trie              -        O(m)     O(m)     O(m)     O(n·m)
Union-Find        -        O(α(n))  O(α(n))  -        O(n)

* = amortized
** = at known position (with pointer)
m = string/key length
α = inverse Ackermann, effectively O(1)
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Java Collections Framework | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Collection.html |
| ArrayList | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/ArrayList.html |
| LinkedList | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/LinkedList.html |
| HashMap | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/HashMap.html |
| TreeMap | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/TreeMap.html |
| PriorityQueue | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/PriorityQueue.html |
| ArrayDeque | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/ArrayDeque.html |
| Big-O Cheatsheet | https://www.bigocheatsheet.com/ |
| Visualgo (visualizations) | https://visualgo.net/ |
