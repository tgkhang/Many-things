# 📦 Java Collections Framework — Complete Deep Dive
>
> Hierarchy, ArrayList, LinkedList, HashMap, TreeMap, HashSet, Queue, Deque, Internals

---

## 📚 Table of Contents

1. [Collections Hierarchy — Full Tree](#1-collections-hierarchy--full-tree)
2. [Iterable & Collection Interface](#2-iterable--collection-interface)
3. [List — ArrayList & LinkedList](#3-list--arraylist--linkedlist)
4. [Set — HashSet, LinkedHashSet, TreeSet](#4-set--hashset-linkedhashset-treeset)
5. [Queue & Deque](#5-queue--deque)
6. [Map — HashMap, LinkedHashMap, TreeMap](#6-map--hashmap-linkedhashmap-treemap)
7. [Concurrent Collections](#7-concurrent-collections)
8. [Utility Classes — Collections & Arrays](#8-utility-classes--collections--arrays)
9. [Choosing the Right Collection](#9-choosing-the-right-collection)
10. [Interview Deep Dives](#10-interview-deep-dives)

---

# 1. Collections Hierarchy — Full Tree

## 1.1 Full Inheritance Diagram

```
java.lang.Iterable<E>                         ← ROOT of all collections
    └── java.util.Collection<E>               ← base for List, Set, Queue
            ├── java.util.List<E>             ← ordered, allows duplicates
            │       ├── ArrayList<E>
            │       ├── LinkedList<E>         (also implements Deque!)
            │       ├── Vector<E>             (legacy, synchronized)
            │       │       └── Stack<E>      (legacy, use Deque instead)
            │       └── CopyOnWriteArrayList<E> (concurrent)
            │
            ├── java.util.Set<E>              ← no duplicates
            │       ├── HashSet<E>
            │       │       └── LinkedHashSet<E>
            │       ├── TreeSet<E>            (implements NavigableSet)
            │       ├── EnumSet<E>            (for enum types, BitSet internally)
            │       └── CopyOnWriteArraySet<E> (concurrent)
            │
            └── java.util.Queue<E>            ← FIFO, head/tail operations
                    ├── PriorityQueue<E>
                    ├── ArrayDeque<E>         (implements Deque too)
                    ├── LinkedList<E>         (implements Deque too)
                    └── java.util.concurrent.*
                            ├── LinkedBlockingQueue<E>
                            ├── ArrayBlockingQueue<E>
                            ├── PriorityBlockingQueue<E>
                            ├── ConcurrentLinkedQueue<E>
                            └── SynchronousQueue<E>

java.util.Deque<E>  extends Queue<E>          ← double-ended queue
        ├── ArrayDeque<E>
        ├── LinkedList<E>
        └── LinkedBlockingDeque<E>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

java.util.Map<K,V>                            ← key-value pairs (NOT Collection!)
        ├── HashMap<K,V>
        │       └── LinkedHashMap<K,V>
        ├── TreeMap<K,V>                       (implements NavigableMap)
        ├── Hashtable<K,V>                     (legacy, synchronized)
        │       └── Properties                 (extends Hashtable<Object,Object>)
        ├── EnumMap<K extends Enum<K>, V>
        ├── IdentityHashMap<K,V>
        ├── WeakHashMap<K,V>
        └── java.util.concurrent.*
                ├── ConcurrentHashMap<K,V>
                ├── ConcurrentSkipListMap<K,V>
                └── ConcurrentSkipListSet<E>   (Set backed by skip list)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

java.util.SortedSet<E>  extends Set<E>
    └── NavigableSet<E> extends SortedSet<E>
            └── TreeSet<E>
            └── ConcurrentSkipListSet<E>

java.util.SortedMap<K,V>  extends Map<K,V>
    └── NavigableMap<K,V> extends SortedMap<K,V>
            └── TreeMap<K,V>
            └── ConcurrentSkipListMap<K,V>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARRAYS (not in Collections hierarchy but related):
  int[], String[], Object[] etc.   ← primitive/object arrays
  Arrays utility class             ← Arrays.sort(), Arrays.binarySearch()
  Arrays.asList()                  ← array → fixed-size List
  List.of(), Set.of(), Map.of()   ← immutable factory methods (Java 9+)
```

## 1.2 Key Interfaces Summary

```
INTERFACE          ORDERED?  DUPLICATES?  SORTED?  NULL KEY?  NULL VALUES?
────────────────────────────────────────────────────────────────────────────
List               Yes        Yes          No       Yes        Yes
Set                No         No           No       One null   N/A
SortedSet          Yes        No           Yes      No         N/A
Queue              Yes(FIFO)  Yes          No       Varies     Yes
Deque              Yes        Yes          No       Varies     Yes

HashMap            No         N/A          No       One null   Yes (multiple)
LinkedHashMap      Yes(insert) N/A         No       One null   Yes
TreeMap            Yes(sorted) N/A         Yes      No         Yes
Hashtable          No         N/A          No       No         No
ConcurrentHashMap  No         N/A          No       No         No
```

---

# 2. Iterable & Collection Interface

## 2.1 Iterable\<E\>

```java
// ROOT of all collections — enables for-each loop!
public interface Iterable<T> {
    Iterator<T> iterator();              // must implement!
    default void forEach(Consumer<? super T> action) { ... }  // Java 8
    default Spliterator<T> spliterator() { ... }              // Java 8 (for streams)
}

// ITERATOR INTERFACE:
public interface Iterator<E> {
    boolean hasNext();   // is there a next element?
    E next();            // return next, advance cursor
    default void remove(); // remove last returned element (optional)
    default void forEachRemaining(Consumer<? super E> action); // Java 8
}

// USING ITERATOR:
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String s = it.next();
    if (s.equals("b")) {
        it.remove();  // SAFE removal during iteration! (unlike list.remove())
    }
}
// list is now ["a", "c"]

// for-each uses iterator internally:
for (String s : list) { }  // equivalent to using Iterator

// ListIterator (bidirectional, for List only):
ListIterator<String> lit = list.listIterator();
while (lit.hasNext()) {
    String s = lit.next();
    lit.set(s.toUpperCase());   // replace current element
    lit.add("NEW");             // add after current
}
while (lit.hasPrevious()) {
    System.out.println(lit.previous());  // traverse backwards!
}
```

## 2.2 Collection\<E\> Interface

```java
// COLLECTION = root interface for List, Set, Queue
public interface Collection<E> extends Iterable<E> {
    // Size:
    int size();
    boolean isEmpty();

    // Contains:
    boolean contains(Object o);              // uses equals()!
    boolean containsAll(Collection<?> c);

    // Add:
    boolean add(E e);                        // returns true if collection changed
    boolean addAll(Collection<? extends E> c);

    // Remove:
    boolean remove(Object o);               // removes FIRST occurrence
    boolean removeAll(Collection<?> c);     // remove all in c
    boolean retainAll(Collection<?> c);     // keep only elements in c (intersection)
    void    clear();

    // Convert:
    Object[] toArray();
    <T> T[] toArray(T[] a);
    default <T> T[] toArray(IntFunction<T[]> generator); // Java 11+: toArray(String[]::new)

    // Stream:
    default Stream<E> stream();
    default Stream<E> parallelStream();

    // Java 8+:
    default boolean removeIf(Predicate<? super E> filter);
    default void    forEach(Consumer<? super E> action);
    default Spliterator<E> spliterator();
}

// COMMON USAGE:
Collection<String> col = new ArrayList<>();
col.add("a");
col.add("b");
col.add("c");
col.addAll(List.of("d", "e"));

col.contains("b");       // true
col.containsAll(List.of("a", "b")); // true
col.removeIf(s -> s.compareTo("c") > 0);  // remove "d", "e"
// col = ["a", "b", "c"]

String[] arr = col.toArray(String[]::new);  // Java 11+ clean syntax
```

---

# 3. List — ArrayList & LinkedList

## 3.1 List Interface

```java
public interface List<E> extends Collection<E> {
    // Index-based access:
    E get(int index);
    E set(int index, E element);     // replace, returns old element
    void add(int index, E element);  // insert (shifts right)
    E remove(int index);             // remove by index, returns old
    int indexOf(Object o);           // first occurrence (-1 if not found)
    int lastIndexOf(Object o);       // last occurrence

    // Sub-list:
    List<E> subList(int fromIndex, int toIndex);  // VIEW (backed by original!)
    
    // Sort:
    default void sort(Comparator<? super E> c);  // in-place sort

    // List-specific iteration:
    ListIterator<E> listIterator();
    ListIterator<E> listIterator(int index);
}

// FACTORY METHODS (Java 9+):
List<String> immutable = List.of("a", "b", "c");   // IMMUTABLE!
// immutable.add("d");  // UnsupportedOperationException!

List<String> mutable = new ArrayList<>(List.of("a","b","c")); // mutable copy

// Arrays.asList: fixed-size (can set but not add/remove!):
List<String> fixed = Arrays.asList("a", "b", "c");
fixed.set(0, "X");    // OK
// fixed.add("d");    // UnsupportedOperationException!
// fixed.remove(0);   // UnsupportedOperationException!
```

## 3.2 ArrayList — Internal Mechanics

```java
// ARRAYLIST = dynamic array (resizable array)
// Backed by Object[] array internally

// INTERNAL STRUCTURE:
class ArrayList<E> {
    private Object[] elementData;   // the backing array
    private int size;               // number of elements (not array length!)
    
    // Default initial capacity = 10:
    public ArrayList() {
        this.elementData = new Object[10];  // initial capacity
    }
    
    // Initial capacity hint:
    public ArrayList(int initialCapacity) {
        this.elementData = new Object[initialCapacity];
    }
}

// HOW RESIZING WORKS:
// When size == elementData.length (array full):
//   newCapacity = oldCapacity + (oldCapacity >> 1)  = 1.5x growth
//   Example: 10 → 15 → 22 → 33 → 49 → ...
//   Arrays.copyOf(elementData, newCapacity)  ← copies to new array
// This is O(n) amortized insertion → each element costs O(1) amortized

// COMPLEXITY:
// get(index):          O(1)     random access by index (direct array lookup)
// set(index, element): O(1)
// add(element):        O(1)     amortized (O(n) when resize needed)
// add(index, element): O(n)     must shift elements right
// remove(index):       O(n)     must shift elements left
// remove(Object o):    O(n)     scan + shift
// contains(Object o):  O(n)     linear scan (uses equals())
// size():              O(1)

// WHEN TO USE ARRAYLIST:
// ✅ Random access by index (get/set) — very fast
// ✅ Iteration (cache-friendly memory layout)
// ✅ Adding to END (amortized O(1))
// ❌ Frequent insert/delete in MIDDLE (O(n) shifts)
// ❌ Frequent insert/delete at FRONT (O(n) shifts)

// USAGE:
List<String> list = new ArrayList<>();

// Pre-size to avoid resizing (performance optimization):
List<String> preSized = new ArrayList<>(1000);  // capacity 1000, size 0

list.add("hello");
list.add("world");
list.add(0, "first");         // insert at index 0 (shifts others)
list.set(1, "HELLO");         // replace index 1
list.get(0);                  // "first"
list.remove(0);               // removes by index, returns "first"
list.remove("world");         // removes by value (first occurrence)
list.indexOf("HELLO");        // 0
list.contains("HELLO");       // true
list.size();                  // 1

// SUBLIST (VIEW — changes reflect in original!):
List<String> numbers = new ArrayList<>(List.of("a","b","c","d","e"));
List<String> sub = numbers.subList(1, 4);  // ["b","c","d"] — view!
sub.clear();                               // clears b,c,d from 'numbers' too!
// numbers = ["a", "e"]

// SORT:
List<Integer> nums = new ArrayList<>(List.of(3, 1, 4, 1, 5, 9, 2));
Collections.sort(nums);                         // ascending natural order
nums.sort(Comparator.reverseOrder());           // descending
nums.sort(Comparator.comparingInt(n -> n % 3)); // by n%3

// CONVERT:
// List → Array:
String[] arr2 = list.toArray(String[]::new);  // Java 11+
String[] arr3 = list.toArray(new String[0]);  // classic

// Array → List (mutable):
String[] source = {"x", "y", "z"};
List<String> fromArray = new ArrayList<>(Arrays.asList(source));

// TRIMMING capacity (free unused memory):
((ArrayList<String>) list).trimToSize();  // capacity → size
((ArrayList<String>) list).ensureCapacity(500);  // pre-allocate
```

## 3.3 LinkedList — Internal Mechanics

```java
// LINKEDLIST = doubly-linked list
// Each node has: element, prev pointer, next pointer

// INTERNAL STRUCTURE:
class LinkedList<E> {
    private Node<E> first;  // head node
    private Node<E> last;   // tail node
    private int size;
    
    private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;
    }
}

// NODE CHAIN:
// null ← [first|prev=null,next→] ↔ [node2] ↔ ... ↔ [last|prev←,next=null] → null

// COMPLEXITY:
// get(index):          O(n)   must traverse from head or tail (no random access!)
//                             (optimized: starts from closest end: index < size/2 → from head)
// add(element):        O(1)   add to TAIL (just update last pointer)
// add(0, element):     O(1)   add to HEAD (just update first pointer)
// add(index, element): O(n)   traverse to index, then O(1) insert
// remove(0):           O(1)   remove HEAD
// remove(size-1):      O(1)   remove TAIL
// remove(index):       O(n)   traverse + O(1) remove
// remove(Object o):    O(n)   scan
// contains(Object o):  O(n)   scan

// LINKEDLIST IMPLEMENTS BOTH List AND Deque:
LinkedList<String> ll = new LinkedList<>();

// As List:
ll.add("b");
ll.add(0, "a");    // O(1)! insert at head
ll.add("c");
ll.get(1);          // "b" — O(n), traverses from head

// As Deque (double-ended queue):
ll.addFirst("FIRST");    // O(1) — add to head
ll.addLast("LAST");      // O(1) — add to tail
ll.removeFirst();        // O(1) — remove head
ll.removeLast();         // O(1) — remove tail
ll.peekFirst();          // O(1) — look at head (no remove)
ll.peekLast();           // O(1) — look at tail

// As Stack (LIFO):
ll.push("item");         // push to front (addFirst)
ll.pop();                // remove from front (removeFirst)
ll.peek();               // look at front (peekFirst)

// WHEN TO USE LINKEDLIST:
// ✅ Frequent insert/delete at HEAD or TAIL — O(1)
// ✅ Implementing stack or queue
// ✅ Frequent insert/delete in middle WHILE ITERATING (with ListIterator)
// ❌ Random access (get by index) — O(n), slow
// ❌ Memory-sensitive — each node = object + 2 pointer overhead
// ❌ Cache unfriendly (scattered memory vs ArrayList's contiguous)

// ARRAYLIST vs LINKEDLIST (practical truth):
// ArrayList almost ALWAYS faster in practice due to:
//   CPU cache efficiency (contiguous memory)
//   Random access O(1)
//   Even insert in middle can be faster due to cache effects
// Use LinkedList ONLY when:
//   Frequent addFirst/removeFirst operations (like a queue)
//   Using as Deque specifically
```

## 3.4 ArrayList vs LinkedList Decision

```
OPERATION          ArrayList    LinkedList    Winner
──────────────────────────────────────────────────────
get(index)         O(1)         O(n)          ArrayList ✅
set(index, e)      O(1)         O(n)          ArrayList ✅
add(end)           O(1)amort    O(1)          Tie (ArrayList often faster due to cache)
add(front)         O(n)         O(1)          LinkedList ✅
add(middle)        O(n)         O(n)*         Tie (LinkedList need traversal too)
remove(end)        O(1)         O(1)          Tie
remove(front)      O(n)         O(1)          LinkedList ✅
remove(middle)     O(n)         O(n)*         Tie
iterate            O(n)         O(n)          ArrayList ✅ (cache)
memory             compact      per-node+16B  ArrayList ✅
contains(o)        O(n)         O(n)          Tie

*LinkedList find node = O(n), but removal itself = O(1)

RULE OF THUMB:
  Default choice:             ArrayList (better cache behavior, simpler)
  Need fast front ops:        ArrayDeque (NOT LinkedList, even faster!)
  Need Deque/Stack/Queue:     ArrayDeque
  Need List + Deque:          LinkedList (but think if you really need this)
```

---

# 4. Set — HashSet, LinkedHashSet, TreeSet

## 4.1 HashSet — Internal Mechanics

```java
// HASHSET = HashMap internally!
// Elements stored as KEYS in HashMap with dummy value

// INTERNAL:
class HashSet<E> {
    private HashMap<E, Object> map;
    private static final Object PRESENT = new Object();  // dummy value
    
    public boolean add(E e) {
        return map.put(e, PRESENT) == null;  // uses HashMap!
    }
}

// REQUIREMENTS:
// Objects stored in HashSet MUST correctly implement:
//   equals()    — two "equal" objects should be the same element
//   hashCode()  — equal objects MUST have same hashCode!
//   Contract: a.equals(b) → a.hashCode() == b.hashCode()

// COMPLEXITY:
// add(e):        O(1) average, O(n) worst case (all same bucket)
// remove(o):     O(1) average
// contains(o):   O(1) average
// size():        O(1)
// iteration:     O(n + capacity)  ← iterates ALL buckets including empty ones!

// KEY PROPERTY: NO GUARANTEED ORDER (random-looking order!)
Set<String> set = new HashSet<>();
set.add("banana");
set.add("apple");
set.add("cherry");
set.add("apple");   // duplicate! silently ignored
System.out.println(set);  // [banana, cherry, apple] or any order!
set.contains("apple");    // true — O(1)!

// ITERATION ORDER: not guaranteed (don't rely on it!)
for (String s : set) { }  // any order!

// NULL ALLOWED: one null element permitted
set.add(null);  // OK

// WHEN TO USE HASHSET:
// ✅ Fast contains check (O(1))
// ✅ Eliminating duplicates
// ✅ Set operations (union, intersection, difference)
// ❌ Need sorted order → use TreeSet
// ❌ Need insertion order → use LinkedHashSet
// ❌ Need index access → use List
```

## 4.2 LinkedHashSet

```java
// LINKEDHASHSET = HashSet + doubly-linked list maintaining INSERTION ORDER
// Backed by LinkedHashMap

LinkedHashSet<String> lhs = new LinkedHashSet<>();
lhs.add("banana");
lhs.add("apple");
lhs.add("cherry");
lhs.add("apple");  // duplicate ignored, order NOT updated!
System.out.println(lhs);  // [banana, apple, cherry] — INSERTION ORDER preserved!

// COMPLEXITY: same as HashSet O(1) average
// MEMORY: slightly more than HashSet (linked list overhead)

// WHEN TO USE:
// ✅ Need deduplication + preserve insertion order
// ✅ Cache-like sets (LRU cache needs ordered set)
// ✅ Iteration in predictable order
```

## 4.3 TreeSet — Internal Mechanics

```java
// TREESET = Red-Black Tree (self-balancing BST) internally
// Backed by TreeMap
// Elements are ALWAYS SORTED!

// REQUIRES: elements must be Comparable OR Comparator provided
TreeSet<Integer> intSet = new TreeSet<>();
intSet.add(5);
intSet.add(1);
intSet.add(3);
intSet.add(2);
intSet.add(4);
System.out.println(intSet);  // [1, 2, 3, 4, 5] — SORTED!

// CUSTOM ORDER with Comparator:
TreeSet<String> byLength = new TreeSet<>(Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()));
byLength.add("banana");
byLength.add("fig");
byLength.add("apple");
byLength.add("kiwi");
System.out.println(byLength);  // [fig, kiwi, apple, banana] (by length, then alpha)

// COMPLEXITY: O(log n) for all operations (balanced BST height)
// add, remove, contains: O(log n)

// NAVIGABLESET OPERATIONS (TreeSet implements NavigableSet):
TreeSet<Integer> ts = new TreeSet<>(Set.of(1, 5, 10, 15, 20, 25));

ts.first();         // 1   (smallest)
ts.last();          // 25  (largest)
ts.floor(12);       // 10  (largest element ≤ 12)
ts.ceiling(12);     // 15  (smallest element ≥ 12)
ts.lower(10);       // 5   (strictly less than 10)
ts.higher(10);      // 15  (strictly greater than 10)
ts.pollFirst();     // 1   (remove and return smallest)
ts.pollLast();      // 25  (remove and return largest)

// RANGE VIEWS (backed by original TreeSet!):
NavigableSet<Integer> headSet = ts.headSet(10, true);    // [1,5,10] (≤ 10)
NavigableSet<Integer> tailSet = ts.tailSet(10, false);   // [15,20] (> 10)
NavigableSet<Integer> subSet  = ts.subSet(5, true, 15, false); // [5,10] (5≤x<15)

// DESCENDING:
NavigableSet<Integer> desc = ts.descendingSet();  // reversed view [25,20,15,10,5]

// NULL: NOT allowed in TreeSet! (can't compare null)

// WHEN TO USE TREESET:
// ✅ Need sorted iteration
// ✅ Range queries (floor, ceiling, headSet, tailSet)
// ✅ Min/max operations
// ❌ Just need fast contains/add → use HashSet (O(1) vs O(log n))
```

## 4.4 EnumSet

```java
// ENUMSET: set for ENUM types — internally uses bit manipulation!
// Each enum constant = one bit in a long (or long[]) 
// EXTREMELY fast and compact!

enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

EnumSet<Day> weekdays = EnumSet.of(Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI);
EnumSet<Day> weekend  = EnumSet.of(Day.SAT, Day.SUN);
EnumSet<Day> all      = EnumSet.allOf(Day.class);
EnumSet<Day> none     = EnumSet.noneOf(Day.class);
EnumSet<Day> workDays = EnumSet.range(Day.MON, Day.FRI);  // MON to FRI

weekdays.contains(Day.MON);    // true — O(1) bit check!
weekdays.add(Day.SAT);         // add Saturday
weekdays.remove(Day.FRI);      // remove Friday

// COMPLEMENT:
EnumSet<Day> complement = EnumSet.complementOf(weekdays);  // days NOT in weekdays

// WHY SO FAST: bit manipulation
// EnumSet of 64 or fewer constants → stored in ONE long!
// contains() = bit check: (bits & (1L << ordinal)) != 0
// add() = set bit
// remove() = clear bit
// Extremely cache-friendly!

// ALWAYS prefer EnumSet over HashSet for enum types!
```

---

# 5. Queue & Deque

## 5.1 Queue Interface

```java
// QUEUE = FIFO (First In, First Out)
// Two categories of methods:
//   Throws exception:  add(), remove(), element()
//   Returns special:   offer(), poll(), peek()

public interface Queue<E> extends Collection<E> {
    // Insert:
    boolean add(E e);       // throws IllegalStateException if capacity exceeded
    boolean offer(E e);     // returns false if capacity exceeded (SAFER!)
    
    // Remove head:
    E remove();             // throws NoSuchElementException if empty
    E poll();               // returns null if empty (SAFER!)
    
    // Inspect head (without removing):
    E element();            // throws NoSuchElementException if empty
    E peek();               // returns null if empty (SAFER!)
}

// RULE: prefer offer/poll/peek (return special values over throwing exceptions)
```

## 5.2 ArrayDeque — The Recommended Choice

```java
// ARRAYDEQUE = resizable circular array
// Implements BOTH Queue AND Deque AND can be used as STACK
// RECOMMENDED over LinkedList for Queue/Stack use cases!

// WHY BETTER THAN LINKEDLIST:
// - No node overhead (no prev/next pointers per element)
// - Contiguous memory (cache friendly!)
// - Faster in practice for most Queue/Stack operations

// INTERNAL: circular array with head/tail indices
// When head == tail (after removing all) → empty
// Resizes when full (doubles capacity)

Deque<String> deque = new ArrayDeque<>();

// ── AS QUEUE (FIFO) ──
deque.offer("first");   // add to TAIL
deque.offer("second");
deque.offer("third");
deque.poll();           // "first" — remove from HEAD
deque.peek();           // "second" — look at head
deque.size();           // 2

// ── AS STACK (LIFO) ──
Deque<String> stack = new ArrayDeque<>();
stack.push("first");    // addFirst — add to HEAD
stack.push("second");   // addFirst
stack.push("third");    // addFirst
stack.pop();            // "third" — removeFirst
stack.peek();           // "second" — peekFirst

// ── AS DEQUE (both ends) ──
ArrayDeque<Integer> d = new ArrayDeque<>();
d.addFirst(1);          // [1]
d.addLast(2);           // [1, 2]
d.addFirst(0);          // [0, 1, 2]
d.addLast(3);           // [0, 1, 2, 3]

d.peekFirst();   // 0
d.peekLast();    // 3
d.pollFirst();   // 0 — removes [1, 2, 3]
d.pollLast();    // 3 — removes [1, 2]

// COMPLEXITY: O(1) for all head/tail operations (amortized)
// ITERATION: front to back by default

// WHEN TO USE ARRAYDEQUE:
// ✅ Stack (use instead of legacy Stack class!)
// ✅ Queue (use instead of LinkedList!)
// ✅ Double-ended queue (deque operations)
// ❌ Thread-safe needs → use LinkedBlockingDeque
// ❌ NULL elements (ArrayDeque doesn't allow null!)
```

## 5.3 PriorityQueue

```java
// PRIORITYQUEUE = min-heap by default (smallest element first)
// NOT a sorted list — only guarantees head is min/max
// Elements dequeued by PRIORITY, not insertion order

// DEFAULT: natural ordering (min-heap)
PriorityQueue<Integer> minPQ = new PriorityQueue<>();
minPQ.offer(5);
minPQ.offer(1);
minPQ.offer(3);
minPQ.peek();     // 1 (smallest on top!)
minPQ.poll();     // 1 (removes and returns smallest)
minPQ.poll();     // 3
minPQ.poll();     // 5

// MAX-HEAP: reverse order comparator
PriorityQueue<Integer> maxPQ = new PriorityQueue<>(Comparator.reverseOrder());
maxPQ.offer(5);
maxPQ.offer(1);
maxPQ.offer(3);
maxPQ.poll();     // 5 (largest first!)

// CUSTOM PRIORITY:
PriorityQueue<Task> taskQueue = new PriorityQueue<>(
    Comparator.comparingInt(Task::getPriority).reversed()  // higher priority number first
);
taskQueue.offer(new Task("low", 1));
taskQueue.offer(new Task("critical", 10));
taskQueue.offer(new Task("high", 5));
taskQueue.poll();  // Task("critical", 10)

// COMPLEXITY:
// offer (insert):   O(log n) — bubble up in heap
// poll (remove):    O(log n) — sift down in heap
// peek (inspect):   O(1)     — head always min/max
// contains:         O(n)     — linear scan (NO heap index)
// remove(Object):   O(n)     — find + O(log n) remove
// iteration order:  NOT sorted! Only head is guaranteed

// INTERNAL: binary heap stored in array
// Parent of node i: (i-1)/2
// Children of node i: 2i+1, 2i+2

// USE CASES:
// Dijkstra's shortest path
// A* algorithm
// Task scheduling by priority
// K largest/smallest elements
// Merge K sorted lists

// K largest elements using MIN-heap:
public List<Integer> kLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>(k);
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) {
            minHeap.poll();  // remove smallest, keep k largest
        }
    }
    return new ArrayList<>(minHeap);
}
```

---

# 6. Map — HashMap, LinkedHashMap, TreeMap

## 6.1 HashMap — Deep Internals

```java
// HASHMAP = hash table (array of buckets + linked list/tree per bucket)
// Key-value pairs, keys must be unique
// NOT ordered!

// INTERNAL STRUCTURE (Java 8+):
// Node<K,V>[] table   ← array of buckets (default capacity 16)
// Each bucket: null OR linked list of nodes OR Red-Black tree (when > 8 nodes)

class Node<K,V> {
    final int hash;    // cached hash of key
    final K key;
    V value;
    Node<K,V> next;    // linked list in bucket
}

// PUT ALGORITHM:
// 1. Compute hash: hash = key.hashCode(), then spread bits
//    spread: hash ^ (hash >>> 16)  [mixes high/low bits to reduce collisions]
// 2. bucket index: (capacity - 1) & hash  [equivalent to hash % capacity, faster]
// 3. If bucket empty: create new Node
// 4. If bucket has nodes: check each for same key (hashCode + equals)
//    - Found: update value
//    - Not found: add to list/tree
// 5. If bucket chain > TREEIFY_THRESHOLD (8): convert to Red-Black tree O(log n)!
// 6. If size > capacity * loadFactor: RESIZE (double capacity, rehash all)

// DEFAULT VALUES:
// initialCapacity = 16     (should be power of 2!)
// loadFactor = 0.75        (resize when 75% full)
// TREEIFY_THRESHOLD = 8    (list → tree when 8 nodes in bucket)
// UNTREEIFY_THRESHOLD = 6  (tree → list when below 6)
// MIN_TREEIFY_CAPACITY = 64 (only treeify if table size >= 64)

// COMPLEXITY:
// get:        O(1) average, O(n) worst (all keys hash to same bucket! bad hashCode)
// put:        O(1) average
// remove:     O(1) average
// containsKey: O(1) average
// With Java 8 tree bins: O(log n) worst case (vs O(n) before)

// NULL KEY: ONE null key allowed (stored in bucket 0)
// NULL VALUES: allowed (multiple)

Map<String, Integer> map = new HashMap<>();
map.put("apple", 1);
map.put("banana", 2);
map.put("cherry", 3);
map.put("apple", 99);   // update — returns old value 1
map.put(null, 0);       // null key OK

map.get("banana");        // 2
map.get("missing");       // null (not in map)
map.getOrDefault("x", -1); // -1 (default if missing)

map.containsKey("apple");    // true
map.containsValue(99);       // true (linear scan!)

// ITERATION:
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + " → " + entry.getValue());
}
map.forEach((k, v) -> System.out.println(k + " → " + v));  // Java 8
map.keySet().stream().forEach(System.out::println);

// ATOMIC OPERATIONS:
map.putIfAbsent("apple", 100);  // only puts if key absent (apple exists, ignored!)
map.putIfAbsent("new", 42);     // puts "new"→42

// compute:
map.compute("apple", (k, v) -> v == null ? 1 : v + 1);     // increment or init
map.computeIfAbsent("missing", k -> k.length());            // compute only if absent
map.computeIfPresent("apple", (k, v) -> v * 2);             // compute only if present

// merge: combine existing value with new value
map.merge("apple", 1, Integer::sum);  // apple = 99+1 = 100
map.merge("new2", 5, Integer::sum);   // new2 = 5 (key absent, just put 5)

// replace:
map.replace("apple", 100, 200);  // CAS: only replace if current value == 100

// REMOVE WITH VALUE (only remove if matches):
map.remove("apple", 200);   // removes if apple's value == 200

// INITIALIZING WITH DATA:
Map<String, Integer> initial = new HashMap<>(Map.of("a", 1, "b", 2));  // Java 9+
Map<String, Integer> fromEntries = Map.ofEntries(
    Map.entry("x", 10),
    Map.entry("y", 20)
);

// HASHMAP SIZING TIPS:
// Pre-size to avoid rehashing (performance!):
int expectedSize = 1000;
Map<String, Object> optimized = new HashMap<>(
    (int)(expectedSize / 0.75) + 1  // capacity to hold expectedSize without resize
);
// Or: Guava Maps.newHashMapWithExpectedSize(expectedSize)
```

## 6.2 LinkedHashMap

```java
// LINKEDHASHMAP = HashMap + doubly-linked list
// Maintains INSERTION ORDER (or ACCESS ORDER for LRU cache!)

LinkedHashMap<String, Integer> lhm = new LinkedHashMap<>();
lhm.put("banana", 2);
lhm.put("apple", 1);
lhm.put("cherry", 3);
System.out.println(lhm);  // {banana=2, apple=1, cherry=3} — INSERTION ORDER!

// ACCESS ORDER (for LRU Cache!):
LinkedHashMap<String, Integer> accessOrder = new LinkedHashMap<>(
    16,     // initial capacity
    0.75f,  // load factor
    true    // accessOrder=true (false=insertion order, true=access order!)
);
accessOrder.put("a", 1);
accessOrder.put("b", 2);
accessOrder.put("c", 3);
accessOrder.get("a");       // access "a" → moves to TAIL
System.out.println(accessOrder);  // {b=2, c=3, a=1} — "a" moved to end!

// LRU CACHE using LinkedHashMap:
int capacity = 3;
LinkedHashMap<String, Integer> lruCache = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, Integer> eldest) {
        return size() > capacity;  // remove oldest when over capacity!
    }
};
lruCache.put("a", 1);
lruCache.put("b", 2);
lruCache.put("c", 3);
lruCache.get("a");      // access "a" → moves to most recent
lruCache.put("d", 4);   // inserts "d" → evicts "b" (least recently used!)
// lruCache = {c=3, a=1, d=4}

// COMPLEXITY: same as HashMap O(1) average (with linked list overhead)
```

## 6.3 TreeMap — NavigableMap

```java
// TREEMAP = Red-Black Tree
// Keys are ALWAYS SORTED
// Backed by same structure as TreeSet but stores key-value pairs

TreeMap<String, Integer> treeMap = new TreeMap<>();
treeMap.put("banana", 2);
treeMap.put("apple", 1);
treeMap.put("cherry", 3);
treeMap.put("date", 4);
System.out.println(treeMap);  // {apple=1, banana=2, cherry=3, date=4} — SORTED by key!

// CUSTOM COMPARATOR:
TreeMap<String, Integer> byLength = new TreeMap<>(
    Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder())
);

// COMPLEXITY: O(log n) for all operations

// NAVIGABLEMAP OPERATIONS:
TreeMap<Integer, String> tm = new TreeMap<>();
tm.put(1, "one"); tm.put(3, "three"); tm.put(5, "five"); tm.put(7, "seven");

tm.firstKey();              // 1 (smallest key)
tm.lastKey();               // 7 (largest key)
tm.floorKey(4);             // 3 (largest key ≤ 4)
tm.ceilingKey(4);           // 5 (smallest key ≥ 4)
tm.lowerKey(5);             // 3 (strictly < 5)
tm.higherKey(5);            // 7 (strictly > 5)

tm.firstEntry();            // {1=one}
tm.lastEntry();             // {7=seven}
tm.floorEntry(4);           // {3=three}

tm.pollFirstEntry();        // removes & returns {1=one}
tm.pollLastEntry();         // removes & returns {7=seven}

// RANGE VIEWS (backed by original):
SortedMap<Integer,String> head = tm.headMap(5);       // keys < 5
SortedMap<Integer,String> tail = tm.tailMap(3);       // keys >= 3
SortedMap<Integer,String> sub  = tm.subMap(2, 6);     // 2 <= key < 6
NavigableMap<Integer,String> headInc = tm.headMap(5, true);  // keys <= 5 (inclusive)

// DESCENDING:
NavigableMap<Integer,String> desc = tm.descendingMap();  // reversed order view

// WHEN TO USE TREEMAP:
// ✅ Sorted iteration of keys
// ✅ Range queries on keys
// ✅ First/last/floor/ceiling key lookups
// ❌ Just need fast key lookup → HashMap (O(1) vs O(log n))

// TREEMAP vs HASHMAP:
// HashMap:  O(1) get/put,  no order
// TreeMap:  O(log n) get/put, sorted order
```

## 6.4 Special Maps

```java
// ── ENUMMAP: for enum keys — backed by array! ──
enum Status { PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED }

EnumMap<Status, List<Order>> ordersByStatus = new EnumMap<>(Status.class);
ordersByStatus.put(Status.PENDING, new ArrayList<>());
ordersByStatus.put(Status.CONFIRMED, new ArrayList<>());
// Keys stored in enum ordinal order!
// get/put: O(1) — direct array index!
// No null keys allowed

// ── IDENTITYHASHMAP: uses == not equals() for keys ──
IdentityHashMap<String, Integer> idMap = new IdentityHashMap<>();
String s1 = new String("key");
String s2 = new String("key");  // different object, same content
idMap.put(s1, 1);
idMap.put(s2, 2);
idMap.size();   // 2! (s1 != s2 by reference, even though s1.equals(s2))
// Normal HashMap: size=1 (s1.equals(s2) → same key, overwritten)
// Use case: object graph serialization, cache keys by identity

// ── WEAKHASHMAP: keys held by weak references ──
WeakHashMap<Key, Value> weakMap = new WeakHashMap<>();
Key key = new Key("mykey");
weakMap.put(key, new Value("data"));
key = null;  // remove strong reference
System.gc();  // suggest GC
// After GC: entry may be removed from weakMap!
// Use case: cache where GC can reclaim keys when no other refs

// ── PROPERTIES (extends Hashtable) ──
Properties props = new Properties();
props.setProperty("db.host", "localhost");
props.setProperty("db.port", "5432");
props.getProperty("db.host");           // "localhost"
props.getProperty("db.name", "mydb");   // "mydb" (default if not set)

// Load from file:
props.load(new FileInputStream("app.properties"));
props.load(getClass().getResourceAsStream("/config.properties"));
// Store to file:
props.store(new FileOutputStream("output.properties"), "Comment");
```

---

# 7. Concurrent Collections

## 7.1 Thread-Safe Options

```java
// NEVER use HashMap/ArrayList/HashSet in multi-threaded code without sync!
// Instead: use concurrent collections

// ── CONCURRENTHASHMAP ──
// Java 8+: CAS + synchronized on individual NODES (not segments!)
// Much better than Collections.synchronizedMap()!
ConcurrentHashMap<String, Integer> conMap = new ConcurrentHashMap<>();

// Atomic operations (guaranteed atomic):
conMap.put("key", 1);
conMap.putIfAbsent("key", 2);           // only if absent
conMap.computeIfAbsent("key", k -> 1);  // compute if absent
conMap.merge("key", 1, Integer::sum);   // atomic increment!
conMap.compute("count", (k, v) -> v == null ? 1 : v + 1);

// DOES NOT ALLOW: null keys or null values!
// conMap.put(null, 1);  // NullPointerException!

// Concurrent iteration (weakly consistent — may not see all changes):
for (Map.Entry<String, Integer> e : conMap.entrySet()) {
    System.out.println(e);  // no ConcurrentModificationException!
}

// ── COPYONWRITEARRAYLIST ──
// Every write operation creates FULL COPY of array!
// Reads: no locking (reads snapshot)
// Write: O(n) — entire array copied
CopyOnWriteArrayList<String> cowList = new CopyOnWriteArrayList<>();
cowList.add("a");
cowList.add("b");

// Thread-safe iteration (iterates SNAPSHOT):
for (String s : cowList) {
    // cowList.add("c");  // allowed! modifies next snapshot, not current
}

// Use: read-heavy, write-rare (event listeners, config)

// ── CONCURRENTLINKEDQUEUE ──
// Lock-free, non-blocking FIFO
ConcurrentLinkedQueue<String> queue = new ConcurrentLinkedQueue<>();
queue.offer("task1");
queue.poll();   // thread-safe

// ── BLOCKING QUEUES ──
// For producer-consumer pattern!
BlockingQueue<String> blockingQ = new LinkedBlockingQueue<>(1000);  // capacity 1000

// Producer:
blockingQ.put("item");         // BLOCKS if full!
blockingQ.offer("item", 5, TimeUnit.SECONDS);  // wait 5s, return false if still full

// Consumer:
String item = blockingQ.take();           // BLOCKS if empty!
String item2 = blockingQ.poll(5, SECONDS); // wait 5s, return null if empty

// ArrayBlockingQueue: fixed-size, fair option
BlockingQueue<Task> bq = new ArrayBlockingQueue<>(100, true);  // fair=true FIFO ordering

// PriorityBlockingQueue: blocking + priority ordering
BlockingQueue<Task> pbq = new PriorityBlockingQueue<>();  // unbounded!

// SynchronousQueue: no capacity! rendezvous point (put blocks until take)
BlockingQueue<String> syncQ = new SynchronousQueue<>();
// Producer.put() blocks until Consumer.take() (and vice versa)
// Perfect for direct handoff between threads

// LinkedBlockingDeque: blocking double-ended queue
BlockingDeque<String> deque2 = new LinkedBlockingDeque<>(100);
deque2.putFirst("high-priority");
deque2.putLast("normal");

// ── CONCURRENTSKIPLISTMAP / SET ──
// Concurrent sorted map/set (thread-safe TreeMap/TreeSet)
ConcurrentNavigableMap<String, Integer> skipMap = new ConcurrentSkipListMap<>();
ConcurrentNavigableSet<String> skipSet = new ConcurrentSkipListSet<>();
// O(log n) operations, highly concurrent (multiple lock levels)
```

---

# 8. Utility Classes — Collections & Arrays

## 8.1 Collections Utility Class

```java
// java.util.Collections — static utility methods for collections

List<Integer> list = new ArrayList<>(List.of(3, 1, 4, 1, 5, 9, 2, 6));

// ── SORT ──
Collections.sort(list);                              // ascending natural order [1,1,2,3,4,5,6,9]
Collections.sort(list, Comparator.reverseOrder());   // descending [9,6,5,4,3,2,1,1]

// ── SEARCH ──
Collections.sort(list);  // MUST be sorted first!
int idx = Collections.binarySearch(list, 5);  // O(log n) index of 5 (or negative if not found)

// ── MIN / MAX ──
Collections.min(list);  // 1
Collections.max(list);  // 9
Collections.min(list, Comparator.comparing(String::length));  // min by custom comparator

// ── REVERSE ──
Collections.reverse(list);  // in-place reverse

// ── SHUFFLE ──
Collections.shuffle(list);          // random shuffle
Collections.shuffle(list, new Random(42));  // seeded (reproducible)

// ── FILL & COPY ──
Collections.fill(list, 0);          // fill all with 0
List<Integer> dest = new ArrayList<>(Collections.nCopies(10, null));  // size 10, all null
Collections.copy(dest, list);  // copy list into dest (dest.size >= list.size required!)

// ── FREQUENCY & DISJOINT ──
Collections.frequency(list, 1);   // count of 1 in list
Collections.disjoint(list1, list2); // true if NO common elements

// ── ROTATE & SWAP ──
Collections.rotate(list, 2);       // rotate right by 2: [8,9,1,2,3,4,5,6,7] → [6,7,8,9,1,2,3,4,5]
Collections.swap(list, 0, list.size()-1);  // swap first and last

// ── UNMODIFIABLE WRAPPERS ──
List<String>   unmodList = Collections.unmodifiableList(mutableList);
Set<String>    unmodSet  = Collections.unmodifiableSet(mutableSet);
Map<String,Integer> unmodMap = Collections.unmodifiableMap(mutableMap);
// Modifications throw UnsupportedOperationException!
// Better (Java 9+): List.of(), Set.of(), Map.of() — truly immutable!

// ── SYNCHRONIZED WRAPPERS (for legacy code) ──
List<String> syncList = Collections.synchronizedList(new ArrayList<>());
Map<String, Integer> syncMap = Collections.synchronizedMap(new HashMap<>());
// Iteration STILL needs external sync:
synchronized(syncList) {
    for (String s : syncList) { }  // synchronized block during iteration!
}
// Better: use ConcurrentHashMap, CopyOnWriteArrayList instead

// ── SINGLETON & EMPTY ──
List<String> single = Collections.singletonList("only");  // immutable, 1 element
Set<String> emptySet = Collections.emptySet();            // immutable empty
Map<String,Integer> emptyMap = Collections.emptyMap();
// Better (Java 9+): List.of("only"), Set.of(), Map.of()

// ── ADDALL ──
Collections.addAll(list, 1, 2, 3, 4, 5);  // add varargs to collection
```

## 8.2 Arrays Utility Class

```java
// java.util.Arrays — static utility methods for arrays

int[] arr = {5, 2, 8, 1, 9, 3};

// ── SORT ──
Arrays.sort(arr);                    // in-place sort — O(n log n) (Dual-Pivot QuickSort)
int[] sortedCopy = arr.clone();
Arrays.sort(arr, 2, 5);             // sort subarray [from, to) only

// Object arrays — uses TimSort (stable!):
String[] words = {"banana", "apple", "cherry"};
Arrays.sort(words);
Arrays.sort(words, Comparator.comparingInt(String::length));

// ── BINARY SEARCH (array must be sorted!) ──
int idx2 = Arrays.binarySearch(arr, 5);   // index of 5, or -(insertionPoint)-1 if not found

// ── COPY ──
int[] copy = Arrays.copyOf(arr, arr.length);       // copy whole array
int[] range = Arrays.copyOfRange(arr, 1, 4);       // copy [1,4) subarray
// Arrays.copyOf: new array of given length (truncates or pads with 0/null)

// ── FILL ──
Arrays.fill(arr, 0);                  // fill all with 0
Arrays.fill(arr, 2, 5, 99);          // fill [2,5) with 99

// ── EQUALS & DEEP EQUALS ──
Arrays.equals(arr1, arr2);            // element-wise equals (1D only)
Arrays.deepEquals(matrix1, matrix2);  // for multi-dimensional arrays

// ── TOSTRING ──
System.out.println(Arrays.toString(arr));         // "[1, 2, 3, 4, 5]"
System.out.println(Arrays.deepToString(matrix));  // "[[1, 2], [3, 4]]"

// ── STREAM ──
IntStream stream = Arrays.stream(arr);           // int[] → IntStream
Stream<String> strStream = Arrays.stream(words); // String[] → Stream<String>
Arrays.stream(arr, 1, 4);                        // subarray stream

// ── ASLIST (FIXED SIZE!) ──
List<String> list2 = Arrays.asList("a", "b", "c");  // fixed-size List!
// Can set, can't add/remove!

// ── PARALLEL SORT (Java 8+) ──
Arrays.parallelSort(largeArr);  // multi-threaded sort for large arrays!
// Uses fork/join framework — faster than sort() for arrays > ~1000 elements

// ── MISMATCH ──
int mismatch = Arrays.mismatch(arr1, arr2);  // index of first diff, or -1 if equal
```

---

# 9. Choosing the Right Collection

## 9.1 Decision Matrix

```
NEED                           RECOMMENDATION          WHY
──────────────────────────────────────────────────────────────────────────────
Ordered list, random access    ArrayList               O(1) get by index
Ordered list, front/back ops   ArrayDeque              O(1) both ends
Ordered list, iteration        ArrayList               Cache friendly
Unique elements, fast lookup   HashSet                 O(1) contains
Unique elements, ordered       TreeSet                 O(log n) sorted
Unique elements, insert order  LinkedHashSet           Insertion order + O(1)
Key-value, fast lookup         HashMap                 O(1) get/put
Key-value, sorted keys         TreeMap                 O(log n) range queries
Key-value, insertion order     LinkedHashMap           Ordered iteration
Enum keys                      EnumMap                 O(1) array-backed
Enum elements                  EnumSet                 Bit manipulation
Stack (LIFO)                   ArrayDeque.push/pop     Not legacy Stack!
Queue (FIFO)                   ArrayDeque.offer/poll   Not LinkedList!
Priority queue                 PriorityQueue           O(log n) min/max
Thread-safe map                ConcurrentHashMap       No locking reads
Thread-safe list (read-heavy)  CopyOnWriteArrayList    No lock on reads
Producer-consumer queue        LinkedBlockingQueue     Blocking put/take
Sorted concurrent map          ConcurrentSkipListMap   Thread-safe TreeMap
LRU Cache                      LinkedHashMap(accessOrder) removeEldestEntry
No nulls, known enum types     EnumMap/EnumSet         Type-safe, fast
```

## 9.2 Memory Usage

```
Collection              Overhead per element (approximate)
────────────────────────────────────────────────────────
ArrayList               Object reference (8 bytes)
                        + array itself (24 bytes header + 8 per slot)

LinkedList              Node object: 24 bytes header
                        + 8 (element ref) + 8 (next) + 8 (prev) = 48 bytes/element!

HashSet/HashMap         ~48-64 bytes per entry
                        (Node: hash + key + value + next = 4 fields)

TreeSet/TreeMap         ~48 bytes per entry
                        (TreeNode: hash + key + value + left + right + parent + color)

ArrayDeque              ~8 bytes per element (like ArrayList)

EnumSet (RegularEnumSet) ONE long (8 bytes total for ≤ 64 enums!)
EnumMap                  One array slot per enum constant

PRACTICAL IMPACT (1 million integers):
  int[] (primitives):          4 MB
  Integer[] (boxed):           ~16 MB (4 bytes int + 12 header per Integer)
  ArrayList<Integer>:          ~20 MB (array + Integer boxing)
  LinkedList<Integer>:         ~56 MB (LinkedList nodes + Integer boxing)
```

---

# 10. Interview Deep Dives

## 10.1 HashMap Internals — Most Asked

```java
// Q: How does HashMap handle collision?
// A: Chaining! Each bucket is a linked list (Java 8+: tree when > 8 nodes)

// Q: Why initial capacity should be power of 2?
// A: bucket index = hash & (capacity-1)  (bitwise AND, fast!)
//    Only works correctly when capacity is power of 2!
//    2^4=16: hash & 15 = hash & 0b1111 → perfect distribution
//    Non-power-of-2: some buckets never used → waste + collision

// Q: What is load factor? Default = 0.75 — why?
// A: resize when size > capacity * loadFactor
//    0.75 = balance between memory (higher = more elements before resize = less memory)
//                          and performance (lower = fewer collisions = faster lookup)

// Q: What happens during HashMap resize?
// A: 1. New array of 2x capacity created
//    2. ALL entries rehashed and inserted into new array (O(n)!)
//    3. Old array GC'd
//    → This is expensive! Pre-size to avoid!

// Q: equals() and hashCode() contract for HashMap?
// A: If a.equals(b) then a.hashCode() == b.hashCode()
//    (reverse not required: different hashCode → can still be equal? No, but different hash → definitely not equal)
//    Breaking contract → bugs:
class BadKey {
    int id;
    @Override
    public boolean equals(Object o) { return ((BadKey)o).id == this.id; }
    // Missing hashCode! Uses default (memory address) → different hashCode for equal objects!
}
Map<BadKey, String> map2 = new HashMap<>();
BadKey k1 = new BadKey(1);
BadKey k2 = new BadKey(1);
map2.put(k1, "hello");
map2.get(k2);  // null! (k1.equals(k2) but different hashCode → different bucket)

// Q: HashMap vs Hashtable?
// HashMap:   not synchronized, null key/value allowed, fast
// Hashtable: synchronized (every method), no null keys/values, legacy (don't use!)
// Use ConcurrentHashMap for thread safety, not Hashtable!

// Q: HashMap vs ConcurrentHashMap?
// HashMap: not thread-safe (race condition on put, infinite loop in Java 7!)
// ConcurrentHashMap: thread-safe, O(1) reads without locks, O(1) writes with node-level locks

// ── EQUALS & HASHCODE CORRECT IMPLEMENTATION ──
public class Person implements Comparable<Person> {
    private final String name;
    private final int age;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;          // same reference
        if (!(o instanceof Person)) return false;  // type check
        Person p = (Person) o;
        return age == p.age && Objects.equals(name, p.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);  // consistent with equals!
    }

    @Override
    public int compareTo(Person other) {
        return Comparator.comparing(Person::getName)
                         .thenComparingInt(Person::getAge)
                         .compare(this, other);
    }
}

// Lombok shortcut:
@EqualsAndHashCode
@Data
class PersonLombok {
    private String name;
    private int age;
}
```

## 10.2 Classic Interview Questions

```java
// Q: ArrayList vs LinkedList for adding 1M elements in middle?
// A: Both O(n) for each middle insert, but ArrayList faster in practice
//    ArrayList: shift array elements (cache-friendly memory copy)
//    LinkedList: traverse to find position, then O(1) insert (slow traversal + cache miss)

// Q: How to make a thread-safe counter using Collections?
// A: Collections.synchronizedList() wraps, but better: AtomicInteger or ConcurrentHashMap

// Q: Detect duplicates in array efficiently?
Set<Integer> seen = new HashSet<>();
int[] arr3 = {1, 2, 3, 2, 4};
for (int n : arr3) {
    if (!seen.add(n)) {  // add returns false if already present!
        System.out.println("Duplicate: " + n);
    }
}

// Q: Find intersection of two lists?
List<Integer> a2 = List.of(1, 2, 3, 4, 5);
List<Integer> b2 = List.of(3, 4, 5, 6, 7);
Set<Integer> setA = new HashSet<>(a2);
List<Integer> intersection = b2.stream()
    .filter(setA::contains)
    .collect(Collectors.toList());  // [3, 4, 5]

// Q: Count frequency of elements?
int[] nums = {1,2,2,3,3,3,4};
Map<Integer, Long> freq = Arrays.stream(nums)
    .boxed()
    .collect(Collectors.groupingBy(n -> n, Collectors.counting()));
// {1=1, 2=2, 3=3, 4=1}

// Q: Group objects by field?
List<Person> people = getPeople();
Map<String, List<Person>> byCity = people.stream()
    .collect(Collectors.groupingBy(Person::getCity));

// Q: Flatten nested lists?
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4), List.of(5));
List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList());  // [1,2,3,4,5]

// Q: Remove duplicates while preserving order?
List<String> dupes = new ArrayList<>(List.of("a","b","a","c","b","d"));
List<String> deduped = new ArrayList<>(new LinkedHashSet<>(dupes));  // preserves order!
// or:
List<String> deduped2 = dupes.stream().distinct().collect(Collectors.toList());

// Q: Sort Map by value?
Map<String, Integer> scores = Map.of("Alice", 95, "Bob", 87, "Charlie", 92);
List<Map.Entry<String, Integer>> sorted2 = new ArrayList<>(scores.entrySet());
sorted2.sort(Map.Entry.comparingByValue(Comparator.reverseOrder()));
// [Alice=95, Charlie=92, Bob=87]

// Or using streams:
scores.entrySet().stream()
    .sorted(Map.Entry.<String,Integer>comparingByValue().reversed())
    .forEach(e -> System.out.println(e.getKey() + ": " + e.getValue()));

// Q: Implement Stack using Queue (classic)?
class StackUsingQueues<T> {
    private final Deque<T> deque = new ArrayDeque<>();
    
    public void push(T item) { deque.addFirst(item); }
    public T pop()           { return deque.removeFirst(); }
    public T peek()          { return deque.peekFirst(); }
    public boolean isEmpty() { return deque.isEmpty(); }
}

// Q: Implement LRU Cache?
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    
    LRUCache(int capacity) {
        super(16, 0.75f, true);  // accessOrder=true!
        this.capacity = capacity;
    }
    
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;  // evict LRU when over capacity
    }
}
```

---

# 11. Data Structures Theory — Tại Sao Độ Phức Tạp Như Vậy?

## 11.1 Big-O — Đọc Complexity Đúng Cách

```
BIG-O = cách đo tốc độ thuật toán khi input tăng lên
  "Khi có n phần tử, mất bao nhiêu bước?"

O(1)        — Constant:    1 bước dù n = 1 hay n = 1,000,000,000
O(log n)    — Logarithmic: tăng rất chậm (n=1M → chỉ ~20 bước!)
O(n)        — Linear:      tỉ lệ thuận với n (n=1M → 1M bước)
O(n log n)  — Quasilinear: hơi tệ hơn O(n) (dùng bởi sort)
O(n²)       — Quadratic:   tệ (n=1000 → 1M bước, n=10000 → 100M bước!)

So sánh thực tế (n = 1,000,000 phần tử):
┌─────────────┬───────────────────────────┬─────────────────────┐
│  Complexity │  Number of operations     │  At 1M ops/sec      │
├─────────────┼───────────────────────────┼─────────────────────┤
│  O(1)       │  1                        │  instant            │
│  O(log n)   │  ~20                      │  instant            │
│  O(n)       │  1,000,000                │  1 second           │
│  O(n log n) │  ~20,000,000              │  20 seconds         │
│  O(n²)      │  1,000,000,000,000        │  11 days!           │
└─────────────┴───────────────────────────┴─────────────────────┘

AMORTIZED O(1) — "trung bình O(1), thỉnh thoảng đắt":
  ArrayList.add() phần lớn thời gian là O(1)
  Khi array đầy → resize O(n) → nhưng hiếm khi xảy ra
  Phân phối chi phí resize ra n lần add → mỗi add = O(1) amortized

  Minh họa (capacity = 4):
  add("a") → O(1) [1 bước]
  add("b") → O(1) [1 bước]
  add("c") → O(1) [1 bước]
  add("d") → O(1) [1 bước, array đầy]
  add("e") → O(n) [RESIZE! copy 4 phần tử + 1 add = 5 bước]
  Tổng: 5 add = 9 bước = 9/5 ≈ 2 bước/add → O(1) amortized!

WORST CASE vs AVERAGE CASE:
  HashMap.get() — average O(1), worst O(n)
  Average: hash phân tán đều → mỗi bucket có 1-2 phần tử → O(1)
  Worst:   hashCode() tệ → mọi key vào cùng bucket → linked list O(n)
  Thực tế: với hashCode() tốt → luôn gần O(1)
```

---

## 11.2 Array — Nền Tảng Của ArrayList

```
ARRAY = dải ô nhớ liên tiếp (contiguous memory)
  Kích thước cố định, mỗi phần tử chiếm cùng số byte
  Được lưu kề nhau trong RAM

  Memory layout (int[] arr = {10, 20, 30, 40, 50}):
  Address: [1000][1004][1008][1012][1016]
  Value:   [ 10 ][ 20 ][ 30 ][ 40 ][ 50 ]
            arr[0] arr[1] arr[2] arr[3] arr[4]

  (int = 4 bytes → địa chỉ tăng 4 mỗi phần tử)

TẠI SAO get(index) = O(1)?
  arr[i] = *(baseAddress + i * elementSize)
  arr[2] = *(1000 + 2 * 4) = *(1008) = 30
  Đây là PHÉP TÍNH SỐ HỌC đơn giản → luôn 1 bước!
  Không cần duyệt từ đầu → O(1) dù n bao nhiêu

TẠI SAO insert/delete ở giữa = O(n)?
  Insert tại index 2 (thêm 15):
  TRƯỚC: [10][20][30][40][50]
  Cần shift tất cả từ index 2 trở đi sang phải:
    arr[4] = arr[3] = 40
    arr[3] = arr[2] = 30
    arr[2] = 15  ← mới
  SAU:  [10][20][15][30][40][50]
  Số bước shift = n - index → trung bình n/2 → O(n)

  Delete tại index 1 (xóa 20):
  TRƯỚC: [10][20][30][40][50]
  Shift ngược lại:
    arr[1] = arr[2] = 30
    arr[2] = arr[3] = 40
    arr[3] = arr[4] = 50
    arr[4] = null
  SAU:  [10][30][40][50][_]
  Tương tự → O(n)

TẠI SAO ArrayList NHANH DÙ O(n)?
  Shift là memory copy (System.arraycopy) — rất hiệu quả:
  - CPU cache friendly: dữ liệu liền kề → cache line hit
  - Hardware memory copy instruction (SIMD)
  - Thực tế: shift 1000 int = vài micro-giây!
  
  LinkedList phải duyệt node-by-node → cache miss mỗi bước
  → ArrayList thường THỰC TẾ nhanh hơn LinkedList dù O complexity giống nhau

ARRAYLIST RESIZE — Amortized Analysis:
  capacity = 10 (default)
  add #11 → newCapacity = 10 + (10 >> 1) = 10 + 5 = 15
  add #16 → newCapacity = 15 + (15 >> 1) = 15 + 7 = 22
  add #23 → newCapacity = 22 + 11 = 33
  Tăng 1.5x mỗi lần resize

  Tại sao 1.5x (không 2x)?
  Java dùng 1.5x (thực ra thường là xấp xỉ):
    2x growth: lãng phí nhiều bộ nhớ hơn (C++ vector dùng 2x)
    1.5x growth: cân bằng bộ nhớ và số lần resize
    1.1x growth: ít lãng phí nhưng resize quá thường

  Chi phí amortized với 1.5x growth:
  Tổng chi phí copy cho n elements:
    n + n/1.5 + n/1.5² + ... ≈ 3n (geometric series)
  → 3n copy cho n inserts → amortized O(1) per insert!
```

---

## 11.3 Doubly-Linked List — Nền Tảng Của LinkedList

```
DOUBLY-LINKED LIST = chuỗi các Node kết nối bằng con trỏ
  Mỗi Node là object riêng lẻ, KHÔNG liền kề trong memory

  Node structure:
  ┌──────────────────────────────────┐
  │  prev │  element  │  next        │
  │  ptr  │  (data)   │  ptr         │
  └──────────────────────────────────┘
  (ptr = pointer/reference đến Node khác)

  LinkedList("a","b","c","d"):
  null ← [prev|"a"|next] ↔ [prev|"b"|next] ↔ [prev|"c"|next] ↔ [prev|"d"|next] → null
         ↑ first                                                         ↑ last

  LinkedList giữ 2 tham chiếu:
    Node first = node "a"
    Node last  = node "d"

TẠI SAO add(end) = O(1)?
  addLast("e"):
    newNode = new Node(prev=last, "e", next=null)
    last.next = newNode   // kết nối cuối cũ với mới
    last = newNode        // cập nhật tail
  Chỉ 3 bước dù list có 1M phần tử!
  Vì chúng ta giữ direct reference đến "last"

TẠI SAO addFirst = O(1)?
  addFirst("Z"):
    newNode = new Node(prev=null, "Z", next=first)
    first.prev = newNode
    first = newNode
  Tương tự, chỉ 3 bước — giữ direct reference đến "first"

TẠI SAO get(index) = O(n)?
  get(index=3) trên list 1000 phần tử:
    Java LinkedList tối ưu: nếu index < size/2 → duyệt từ first
                             nếu index ≥ size/2 → duyệt từ last
    get(3) → first.next.next.next → 3 bước
    get(499) → duyệt 499 bước từ đầu!
  
  KHÔNG CÓ CÔNG THỨC: không thể nhảy đến node thứ k
  Phải đi qua từng node một (follow the pointers)
  Average case: n/2 bước → O(n)

TẠI SAO insert ở giữa (biết node) = O(1)?
  Nếu đã có reference đến node trước vị trí cần insert:
    prev = nodeAtIndex3
    next = prev.next
    newNode.prev = prev
    newNode.next = next
    prev.next = newNode
    next.prev = newNode
  Chỉ cập nhật 4 con trỏ → O(1)!

  Nhưng để tìm node đó: phải duyệt O(n)
  Vậy: add(index) = O(n) tìm vị trí + O(1) insert = O(n) overall

NODE OVERHEAD — Tại sao LinkedList tốn nhiều bộ nhớ?
  Mỗi node là 1 Java object:
    Object header:  12 bytes (JVM overhead cho mỗi object)
    prev reference:  8 bytes (64-bit JVM pointer)
    next reference:  8 bytes
    element ref:     8 bytes
    ─────────────────────────
    Total:          36 bytes (rounded to 40 bytes for alignment)

  Còn element tự nó (e.g., Integer):
    Object header:   12 bytes
    int value:        4 bytes
    ─────────────────────────
    Total:           16 bytes

  → Mỗi Integer trong LinkedList tốn ~56 bytes
  → Mỗi Integer trong ArrayList tốn ~16 bytes (chỉ object, no Node wrapper)
  → LinkedList tốn ~3.5x bộ nhớ hơn ArrayList!

CPU CACHE — Tại sao LinkedList chậm trong thực tế?
  Cache line = 64 bytes (CPU đọc 64 bytes cùng lúc từ RAM vào cache)
  
  ArrayList: [ptr][ptr][ptr][ptr][ptr][ptr][ptr][ptr]  ← 8 refs/cache line
    Duyệt list: mỗi 8 phần tử = 1 cache miss
    Cache hit rate: rất cao

  LinkedList: Node A ở address 1000, Node B ở address 50000, Node C ở address 200...
    Các node KHÔNG liền kề! Mỗi node ở địa chỉ ngẫu nhiên trong heap
    Duyệt list: mỗi node = cache miss (data chưa trong cache)
    Cache miss = 100-1000 cycles penalty!

  Ví dụ thực tế: duyệt 1M phần tử
    ArrayList: ~5ms (cache-friendly)
    LinkedList: ~100ms (cache-unfriendly) → 20x chậm hơn!
```

---

## 11.4 Hash Table — Nền Tảng Của HashMap & HashSet

```
HASH TABLE = array of buckets, mỗi bucket chứa linked list (hoặc tree)
  Ý tưởng: biến key → số nguyên (hash) → dùng làm array index

BƯỚC 1: Hash Function
  key.hashCode() → integer (có thể âm, rất lớn)
  
  Ví dụ: "khang".hashCode() → 1234567890
  
  Java HashMap: spread hash để giảm collision
  hash = key.hashCode()
  hash = hash ^ (hash >>> 16)  // XOR với phần cao
  // Tại sao? hashCode() có thể yếu ở bits thấp
  // Trộn bits cao vào bits thấp → phân bố đều hơn

BƯỚC 2: Bucket Index
  index = hash & (capacity - 1)
  
  capacity = 16 = 0b10000
  capacity - 1 = 15 = 0b01111
  hash & 15 → chỉ giữ 4 bits thấp → index từ 0-15
  
  TẠI SAO capacity phải là lũy thừa của 2?
  capacity = 16: index = hash & 15  (bit AND, cực nhanh!)
  capacity = 10: index = hash % 10  (modulo, chậm hơn ~3x)
  
  Bonus: & (capacity-1) khi capacity là 2^n luôn phân bố đều hơn % cho arbitrary capacity

BƯỚC 3: Chèn/Tìm vào Bucket
  table[index] = linked list (hoặc null)
  
  Bucket structure (Java 8+):
  table[3] → Node("alice", 25) → Node("charlie", 35) → null
  (hai key khác nhau hash vào cùng bucket = collision)

  TẠI SAO put/get = O(1) average?
  Nếu load factor tốt (≤ 0.75), trung bình mỗi bucket có ~1 node
  → Tìm trong bucket: duyệt ~1-2 node → O(1)

  TẠI SAO worst case O(n)?
  hashCode() tệ → TẤT CẢ keys hash vào cùng bucket
  Ví dụ: class BadHash { public int hashCode() { return 42; } }
  → table[42 % capacity] = linked list với tất cả n phần tử
  → get = duyệt n phần tử = O(n)

BƯỚC 4: Java 8 Treeification (khi bucket quá dài)
  Mặc định: bucket là linked list (đơn giản, ít overhead)
  Nếu bucket.size() > TREEIFY_THRESHOLD (= 8):
    Convert linked list → Red-Black Tree trong bucket đó!
    Tìm trong bucket: O(n) → O(log n) (tệ nhất)
  Nếu bucket.size() < UNTREEIFY_THRESHOLD (= 6) sau delete:
    Convert tree → linked list trở lại

  Tại sao threshold = 8?
  Xác suất bucket có > 8 phần tử với hashCode() tốt và load factor 0.75:
  ≈ e^(-0.75) * 0.75^8 / 8! ≈ 0.000006 → cực kỳ hiếm!
  Chỉ treeify khi có vấn đề nghiêm trọng với hashCode()

BƯỚC 5: Resize (khi HashMap quá đầy)
  threshold = capacity * loadFactor = 16 * 0.75 = 12
  Khi size > 12 → resize!
  
  Resize process:
    newCapacity = oldCapacity * 2 = 32
    newTable = new Node[32]
    Rehash mọi entry: newIndex = hash & (newCapacity - 1)
    Di chuyển tất cả nodes sang vị trí mới
  
  Tại sao nhân đôi?
  Phần lớn entries: index cao hoặc thấp (1 bit phân biệt)
  hashCode bit thêm vào = 0 → giữ nguyên index
  hashCode bit thêm vào = 1 → index + oldCapacity
  Rất hiệu quả, ít random access!
  
  Cost: O(n) để rehash n entries
  Amortized: mỗi entry được rehash ít hơn 2 lần tổng cộng → O(1) amortized per put

LOAD FACTOR 0.75 — Tại sao?
  Too low (0.25): ít collision, nhiều wasted space, resize thường
  Too high (0.99): nhiều collision, O(1) bị ảnh hưởng
  0.75: điểm cân bằng giữa performance và memory
  
  Xác suất collision với Poisson distribution (λ = 0.75):
  P(0 elements) = 0.472  (47% buckets empty — OK)
  P(1 element)  = 0.354  (35% buckets có 1 node — perfect)
  P(2 elements) = 0.133  (13% buckets có 2 nodes — acceptable)
  P(>8 elements)= 0.000006  (basically never)

HASHSET = HashMap với dummy value
  Internally:
  HashSet<String> → HashMap<String, Object>
  Object PRESENT = new Object();  // same dummy object cho mọi entries
  
  add("hello"):     map.put("hello", PRESENT)
  contains("hello"): map.containsKey("hello")
  remove("hello"):  map.remove("hello")
  
  Vì HashMap.containsKey = O(1) → HashSet.contains = O(1) ✓
```

---

## 11.5 Red-Black Tree — Nền Tảng Của TreeMap & TreeSet

```
TẠI SAO CẦN BALANCED BST?
  Binary Search Tree (BST) thông thường:
    Insert theo thứ tự 1,2,3,4,5:
    1
     \
      2
       \
        3
         \
          4
           \
            5
    Degenerates to linked list! → get = O(n)!

  Cần: tree luôn BALANCED (height ≈ log n)
  Balanced BST → height = O(log n) → tất cả ops = O(log n)

RED-BLACK TREE PROPERTIES (5 rules bắt buộc):
  1. Mỗi node có màu: ĐỎ hoặc ĐEN
  2. Root luôn ĐEN
  3. Null (leaf) nodes là ĐEN
  4. Nút ĐỎ không có con ĐỎ (no two red nodes adjacent!)
  5. Mọi path từ node đến null: cùng số nút ĐEN (black-height)

  Những rules này ĐẢM BẢO:
  longest path ≤ 2 × shortest path
  → height ≤ 2 * log₂(n+1) → O(log n)!

VISUAL EXAMPLE (TreeSet với {1,3,5,7,9,11,13}):
                    7(B)
                   /    \
               3(R)      11(R)
              /   \      /    \
           1(B)  5(B)  9(B)  13(B)

  Height = 3 (với 7 nodes, log₂(7) ≈ 2.8 ✓)
  Black-height = 2 (mỗi path từ root đến null có 2 black nodes)

TẠI SAO OPERATIONS = O(log n)?

  CONTAINS/GET:
    Duyệt từ root xuống, mỗi bước so sánh:
      < root.key → đi trái (loại bỏ nửa phải của tree)
      > root.key → đi phải (loại bỏ nửa trái của tree)
      = root.key → tìm thấy!
    Mỗi bước loại bỏ ~½ số nodes còn lại → binary search!
    Height = O(log n) → at most O(log n) bước

  PUT/INSERT:
    1. BST insert: O(log n) để tìm vị trí
    2. New node màu ĐỎ (ít vi phạm black-height rule)
    3. Fix violations: rotations + recoloring → O(log n) fixes
    At most 2 rotations per insert → O(1) rotations, O(log n) total

  DELETE:
    1. BST delete: O(log n)
    2. Fix violations: tối đa 3 rotations → O(log n)

ROTATIONS (cách re-balance):
  Right rotation at node X:
       X              Y
      / \            / \
     Y   C    →    A     X
    / \                 / \
   A   B               B   C
  (Y becomes new root of subtree)

  Left rotation = mirror của right rotation
  Rotations: O(1) (chỉ cập nhật pointers)
  → Rotation không thay đổi BST property
  → Nhưng có thể fix Red-Black violations

TREESET vs TREEMAP:
  TreeMap: Red-Black tree với (Key, Value) pairs
  TreeSet: TreeMap với dummy PRESENT value (giống HashSet/HashMap)
  → TreeSet.add(x) = treeMap.put(x, PRESENT)
  → TreeSet.contains(x) = treeMap.containsKey(x)
  Both: O(log n) tất cả operations

TẠI SAO TREESET/TREEMAP KHÔNG ALLOW NULL KEY?
  Khi insert, cần COMPARE key với existing keys (BST property)
  null.compareTo(anything) → NullPointerException!
  → Java chọn throw NullPointerException sớm hơn
  (Nhưng value trong TreeMap có thể null — không cần compare value)

SORTED ITERATION = O(n) (in-order traversal):
  In-order traversal của BST: left → root → right = sorted order!
  for (String key : treeMap.keySet()) { }  // O(n) in sorted order
  Rất hiệu quả vì chỉ visit mỗi node 1 lần
```

---

## 11.6 Binary Heap — Nền Tảng Của PriorityQueue

```
BINARY HEAP = complete binary tree with heap property
  Complete: mọi level đầy, level cuối fill từ trái sang phải
  Min-heap property: parent ≤ children (root = minimum!)
  Max-heap: parent ≥ children (root = maximum)

VISUAL (min-heap, PriorityQueue với {1,3,5,7,9,11,13}):
                    1          ← root = MINIMUM!
                  /   \
                3       5
               / \     / \
              7   9  11   13

ARRAY REPRESENTATION (heap stored in array — không cần Node objects!):
  Index:  [0] [1] [2] [3] [4] [5]  [6]
  Value:   1   3   5   7   9   11   13
  
  Parent của node i:   (i-1) / 2
  Left child của i:    2*i + 1
  Right child của i:   2*i + 2
  
  Ví dụ: node tại index 1 (value=3)
    Parent: (1-1)/2 = 0 → value=1 ✓ (1 ≤ 3, heap property OK)
    Left:   2*1+1 = 3   → value=7 ✓ (3 ≤ 7, heap property OK)
    Right:  2*1+2 = 4   → value=9 ✓ (3 ≤ 9, heap property OK)

TẠI SAO peek() = O(1)?
  Minimum LUÔN ở root (index 0)!
  peek() = return array[0]
  Không cần search → O(1)

TẠI SAO offer(x) = O(log n)?  — "Sift Up"
  Thêm 2 vào heap trên:
  
  Step 1: Add to end of array (next available position)
    [0][1][2][3][4] [5] [6][7]
     1  3  5  7  9   11  13  2  ← 2 added at index 7
  
  Step 2: "Sift up" (bubble up): swap với parent nếu vi phạm heap property
    Index 7 (value=2), parent = (7-1)/2 = 3 (value=7)
    2 < 7 → swap!
    [0][1][2] [3][4][5] [6][7]
     1  3  5   2  9  11  13  7
    
    Index 3 (value=2), parent = (3-1)/2 = 1 (value=3)
    2 < 3 → swap!
    [0] [1][2][3][4][5][6][7]
     1   2  5  3  9  11 13  7
    
    Index 1 (value=2), parent = 0 (value=1)
    2 ≥ 1 → STOP! Heap property restored.
  
  Số swaps tối đa = height của tree = log₂(n)
  → offer() = O(log n)

TẠI SAO poll() = O(log n)?  — "Sift Down"
  Remove minimum (root):
  
  Step 1: Swap root với last element, remove last
    root = array[last] = 13 (giả sử)
    Remove element tại cuối
    [1][2][3][4][5][6]
    13  2  5  3  9  11
  
  Step 2: "Sift down": swap với smaller child nếu vi phạm
    Index 0 (value=13), children: index 1 (=2), index 2 (=5)
    min child = index 1 (=2)
    13 > 2 → swap!
    [1][13][5][3][9][11]
     wait, should be [2][13][5][3][9][11]
    
    Index 1 (value=13), children: index 3 (=3), index 4 (=9)
    min child = index 3 (=3)
    13 > 3 → swap!
    [2][3][5][13][9][11]
    
    Index 3 (value=13): no children (leaf) → STOP!
  
  Số swaps tối đa = height = log₂(n)
  → poll() = O(log n)

TẠI SAO contains(x) = O(n)?
  Heap KHÔNG duy trì BST property (không sorted left-right)
  → Không thể binary search
  → Phải linear scan toàn bộ array
  → O(n)

TẠI SAO HEAPIFY (build heap từ array) = O(n) (không phải O(n log n))?
  Nếu insert từng phần tử: n × O(log n) = O(n log n)
  Nhưng: bottom-up heapify = O(n)!
  
  Sift down từ node cuối cùng có con lên root:
  Leaf nodes (n/2 nodes): no work
  Level n/4 nodes: max 1 swap each
  Level n/8 nodes: max 2 swaps each
  ...
  Root (1 node): max log n swaps
  
  Total = Σ = n/4×1 + n/8×2 + n/16×3 + ... ≤ 2n → O(n)!
  PriorityQueue(collection) constructor dùng heapify → O(n)
```

---

## 11.7 Circular Array — Nền Tảng Của ArrayDeque

```
CIRCULAR ARRAY (Ring Buffer) = array thông thường nhưng head/tail wrap around
  Cho phép add/remove CẠNH ĐẦU VÀ CUỐI cả hai đều O(1)!

VẤẤN ĐỀ VỚI ARRAY THÔNG THƯỜNG:
  [10][20][30][40][_][_][_][_]  (capacity=8, size=4)
  removeFirst() = remove index 0:
    Phải shift tất cả: [20][30][40][_][_][_][_][_] → O(n)!
  
  OR: track head index (không shift):
    head=0: [10][20][30][40]
    removeFirst(): head=1: [_][20][30][40]
    removeFirst(): head=2: [_][_][30][40]
    addLast(50): tail=4: [_][_][30][40][50]
    Bây giờ head=2, sẽ phí nhiều slot đầu nếu thêm nữa...

CIRCULAR ARRAY SOLUTION:
  Dùng 2 indices: head và tail
  Khi tail chạm cuối array → WRAP AROUND về đầu!
  
  Capacity = 8 (array), head = 0, tail = 0 (empty)
  
  addLast(10): array[tail]=10, tail=(tail+1)%8=1
  addLast(20): array[tail]=20, tail=2
  addLast(30): array[tail]=30, tail=3
  State: [10][20][30][_][_][_][_][_], head=0, tail=3
  
  removeFirst(): val=array[head]=10, head=(head+1)%8=1
  removeFirst(): val=array[head]=20, head=2
  State: [_][_][30][_][_][_][_][_], head=2, tail=3
  
  addLast(40,50,60,70,80): tail wraps around!
  addLast(40): tail=4
  addLast(50): tail=5
  addLast(60): tail=6
  addLast(70): tail=7
  addLast(80): tail=(7+1)%8=0 → wrap!
  State: [80][_][30][40][50][60][70][_], head=2, tail=1 ← tail BEHIND head!
  
  Size = (tail - head + capacity) % capacity = (1-2+8)%8 = 7

TẠI SAO addFirst/addLast/removeFirst/removeLast = O(1)?
  addFirst(x):    head = (head - 1 + capacity) % capacity; array[head] = x
  addLast(x):     array[tail] = x; tail = (tail + 1) % capacity
  removeFirst():  val = array[head]; head = (head + 1) % capacity
  removeLast():   tail = (tail - 1 + capacity) % capacity; val = array[tail]
  
  TẤT CẢ là modulo arithmetic + array index → O(1)!
  Không cần shift, không cần duyệt

TẠI SAO ARRAYDEQUE TỐT HƠN LINKEDLIST?
  
  Memory:
    ArrayDeque:  1 array + 2 integers (head, tail) = compact!
    LinkedList:  1 Node object (40 bytes) per element = expensive!
  
  Cache:
    ArrayDeque:  contiguous memory → cache friendly
    LinkedList:  scattered nodes → cache miss per operation
  
  Operations:
    ArrayDeque:  addFirst/addLast/removeFirst/removeLast all O(1)
    LinkedList:  same O(1) at ends, BUT slower in practice (cache miss)
  
  When LinkedList wins?
    Technically: never for queue/deque use cases
    ArrayDeque is ALWAYS preferred (except when you need null elements)
    LinkedList cannot have null elements? False: it CAN
    ArrayDeque CANNOT have null elements (null used as sentinel)

ARRAYDEQUE RESIZE:
  When full (size == capacity): double capacity
  Allocate new array, copy elements maintaining head→tail order
  Cost: O(n) per resize, amortized O(1) per operation
```

---

## 11.8 Bit Vector — Nền Tảng Của EnumSet

```
BIT VECTOR = dùng từng bit trong một số nguyên để đại diện cho phần tử

Enum với 7 constants:
  enum Day { MON(0), TUE(1), WED(2), THU(3), FRI(4), SAT(5), SUN(6) }
  Mỗi constant có ordinal (vị trí trong enum, bắt đầu từ 0)

EnumSet nội bộ:
  long bits = 0L;  // 64 bits = có thể chứa 64 enum constants!
  
  Bit i = 1 → enum constant với ordinal i CÓ trong set
  Bit i = 0 → không có

BIỂU DIỄN:
  EnumSet.of(MON, WED, FRI):
  bits = 0b0000...0000010101
                       ↑↑↑
                       │││
                       ││└── bit 0 = MON (set!)
                       │└─── bit 1 = TUE (not set)
                       └──── bit 2 = WED (set!)
  
  Cũng có FRI (bit 4 = 1):
  bits = 0b010101 = 21 (decimal)

ADD OPERATION:
  add(MON):  bits |= (1L << MON.ordinal()) = bits | (1L << 0) = bits | 1
  add(WED):  bits |= (1L << 2) = bits | 4
  add(FRI):  bits |= (1L << 4) = bits | 16
  → Chỉ 1 bit-OR instruction → O(1)!

CONTAINS OPERATION:
  contains(WED): return (bits & (1L << 2)) != 0
                = (bits & 4) != 0
  → Chỉ 1 bit-AND instruction → O(1)!

REMOVE OPERATION:
  remove(WED): bits &= ~(1L << 2) = bits & ~4
  → 1 NOT + 1 AND → O(1)!

SET OPERATIONS (Union, Intersection, Difference) = O(1)!
  union:        a.bits | b.bits    (bitwise OR)
  intersection: a.bits & b.bits    (bitwise AND)
  difference:   a.bits & ~b.bits   (AND NOT)
  complement:   ~bits & fullMask   (NOT + mask for enum range)
  
  Ví dụ:
  weekdays = {MON,TUE,WED,THU,FRI} = 0b0011111
  weekend  = {SAT,SUN}             = 0b1100000
  union    = 0b1111111 = allDays   → 1 CPU instruction!
  
  Đây là lý do EnumSet.complementOf() cực nhanh — chỉ là bit NOT!

TẠI SAO NHANH HƠN HASHSET?
  HashSet<Day>.contains(WED):
    1. WED.hashCode() → hash computation
    2. bucket_index = hash & (capacity-1)
    3. Access bucket array
    4. Duyệt linked list trong bucket
    → Multiple steps, cache misses possible
  
  EnumSet.contains(WED):
    1. (bits & (1L << WED.ordinal())) != 0
    → 1 instruction, no memory lookup, no cache miss!

REGULAR vs JUMBO ENUMSET:
  ≤ 64 enum constants: RegularEnumSet (1 long = 8 bytes total!)
  > 64 enum constants: JumboEnumSet   (long[] array)
  
  RegularEnumSet là common case — Java auto-selects via EnumSet.of()/noneOf()
```

---

## 11.9 Skip List — Nền Tảng Của ConcurrentSkipListMap/Set

```
SKIP LIST = linked list với nhiều "express lanes" để skip qua phần tử
  Probabilistic data structure: không deterministic như Red-Black Tree
  Nhưng concurrent-friendly hơn (ít locking cần thiết)

STRUCTURE:
  Level 3: 1 ─────────────────────────────────── 9 → null
  Level 2: 1 ──────── 4 ──────── 7 ────── 9 → null
  Level 1: 1 ─── 2 ── 4 ─── 6 ── 7 ─── 8 ─ 9 → null
  Level 0: 1 - 2 - 3 - 4 - 5 - 6 - 7 - 8 - 9 → null (base list)

  Mỗi phần tử có thể xuất hiện ở nhiều levels
  Probability: level i → level i+1 = 50% (coin flip)

SEARCH for 6:
  Start ở level cao nhất (3): 1 → 9 (terlalu besar!) → xuống level 2
  Level 2: 1 → 4 → 7 (terlalu besar!) → xuống level 1
  Level 1: 4 → 6 (found!) → access base list → done!
  
  Bước: 1 + 1 + 1 + 1 = 4 bước thay vì 6 bước (linear search)

COMPLEXITY:
  Expected O(log n) cho search/insert/delete (với probability 50%)
  Worst case O(n) (nếu tất cả "coin flips" tệ — rất hiếm)

TẠI SAO DÙNG CHO CONCURRENT?
  Red-Black Tree: rotation operations lock nhiều nodes
  Skip List: insert/delete chỉ cần cập nhật pointers tại một vài nodes
  → Fine-grained locking hoặc CAS (compare-and-swap) dễ hơn
  
  ConcurrentSkipListMap dùng non-blocking CAS operations
  → Multiple threads can read/write với minimal blocking
  → TreeMap trong concurrent context cần lock toàn bộ structure

TRADE-OFFS vs Red-Black Tree:
  Skip List:
    ✅ Simpler to implement
    ✅ Better concurrent performance
    ✅ Range queries efficient
    ❌ O(log n) expected (not guaranteed)
    ❌ More memory (multiple levels per node)
  
  Red-Black Tree:
    ✅ O(log n) guaranteed
    ✅ Less memory per node
    ❌ Complex rotation logic
    ❌ Hard to make lock-free
```

---

## 11.10 Complexity Summary — Tất Cả Collections

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIST IMPLEMENTATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  │ get(i) │add(end)│add(mid)│remove(i)│ iterate │ contains
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
ArrayList         │  O(1)  │O(1)*   │  O(n)  │  O(n)   │  O(n)  │  O(n)
                  │direct  │amortize│ shift  │  shift  │ cache✓  │ scan
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
LinkedList        │  O(n)  │  O(1)  │  O(n)† │  O(n)   │  O(n)  │  O(n)
                  │traverse│update  │find+ptr│find+ptr │ cache✗  │ scan
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
CopyOnWrite       │  O(1)  │  O(n)  │  O(n)  │  O(n)   │  O(n)  │  O(n)
ArrayList         │direct  │copy all│copy all│copy all │ snapshot│ scan
─────────────────────────────────────────────────────────────────────────────
* amortized O(1): thỉnh thoảng O(n) khi resize
† O(n) tìm vị trí + O(1) insert = O(n) overall

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SET IMPLEMENTATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  │   add  │ remove │contains│ iterate │  Sorted │ Structure
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
HashSet           │ O(1)*  │  O(1)* │  O(1)* │O(n+cap) │   No    │ Hash Table
                  │hash+put│hash+rm │ hash   │ scan all│         │ Array+List
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
LinkedHashSet     │ O(1)*  │  O(1)* │  O(1)* │  O(n)   │Insert   │ Hash Table
                  │hash+put│hash+rm │ hash   │ LL order│ Order   │ + LinkedList
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
TreeSet           │O(log n)│O(log n)│O(log n)│  O(n)   │  Yes    │ Red-Black
                  │RB tree │RB tree │ BST    │ in-order│         │ Tree
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
EnumSet           │  O(1)  │  O(1)  │  O(1)  │  O(n)   │ Enum    │ Bit Vector
                  │bit-OR  │bit-AND │bit-AND │ bit scan│ Order   │ (1 long!)
─────────────────────────────────────────────────────────────────────────────
* average case; worst O(n) with terrible hashCode()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAP IMPLEMENTATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  │   get  │   put  │ remove │containsK│ iterate │ Structure
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
HashMap           │ O(1)*  │  O(1)* │  O(1)* │  O(1)*  │O(n+cap) │ Hash Table
                  │hash    │hash    │ hash   │ hash    │ scan all│Array+List/Tree
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
LinkedHashMap     │ O(1)*  │  O(1)* │  O(1)* │  O(1)*  │  O(n)   │ Hash Table
                  │hash    │hash    │ hash   │ hash    │LL order │ + LinkedList
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
TreeMap           │O(log n)│O(log n)│O(log n)│O(log n) │  O(n)   │ Red-Black
                  │BST     │RB tree │RB tree │ BST     │ in-order│ Tree
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
EnumMap           │  O(1)  │  O(1)  │  O(1)  │  O(1)   │  O(n)   │ Array
                  │arr[ord]│arr[ord]│arr[ord]│arr[ord] │ in enum │ (ord-indexed)
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
ConcurrentHashMap │ O(1)*  │  O(1)* │  O(1)* │  O(1)*  │  O(n)   │ Hash Table
                  │no-lock │CAS/lock│CAS/lock│ no-lock │ weak    │ (striped)
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
ConcurrentSkip    │O(log n)│O(log n)│O(log n)│O(log n) │  O(n)   │ Skip List
ListMap           │skip    │skip    │ skip   │ skip    │ sorted  │ (lock-free)
─────────────────────────────────────────────────────────────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUEUE / DEQUE IMPLEMENTATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  │offer(e)│ poll() │ peek() │addFirst │removeLst│ Structure
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
ArrayDeque        │ O(1)*  │  O(1)  │  O(1)  │  O(1)*  │  O(1)   │ Circular
                  │amortize│head ptr│array[0]│amortize │tail ptr │ Array
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
PriorityQueue     │O(log n)│O(log n)│  O(1)  │   N/A   │   N/A   │ Binary
(min-heap)        │sift-up │sift-dn │root[0] │         │         │ Heap (Array)
──────────────────┼────────┼────────┼────────┼─────────┼─────────┼──────────
LinkedBlockingQ   │  O(1)  │  O(1)  │  O(1)  │  O(1)   │  O(1)   │ Doubly
                  │+lock   │+lock   │head ptr│+lock    │+lock    │ Linked List
─────────────────────────────────────────────────────────────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNDERLYING DATA STRUCTURES — TÓM TẮT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Collection           │ Underlying Structure        │ Tại sao chọn
─────────────────────┼─────────────────────────────┼──────────────────────
ArrayList            │ Object[] (dynamic array)    │ O(1) random access
LinkedList           │ Doubly-linked list nodes    │ O(1) head/tail ops
HashSet              │ HashMap<E, PRESENT>         │ Reuse HashMap code
LinkedHashSet        │ LinkedHashMap<E, PRESENT>   │ Reuse LinkedHashMap
TreeSet              │ TreeMap<E, PRESENT>         │ Reuse TreeMap code
EnumSet              │ long bitmask (1 or array)   │ Bit ops = O(1)
ArrayDeque           │ Object[] circular buffer    │ O(1) both ends, compact
PriorityQueue        │ Object[] binary min-heap    │ O(1) min access
HashMap              │ Node[]  (hash table)        │ O(1) avg key ops
LinkedHashMap        │ HashMap + doubly-linked list│ Order + O(1) ops
TreeMap              │ Red-Black Tree (Entry nodes)│ O(log n) sorted ops
EnumMap              │ Object[] indexed by ordinal │ Array lookup O(1)
ConcurrentHashMap    │ Node[] with CAS + locks     │ Lock-free reads
ConcurrentSkipList   │ Skip list with CAS          │ Lock-free sorted ops
─────────────────────────────────────────────────────────────────────────────
```

---

## 11.11 Tại Sao LinkedHashMap/LinkedHashSet Vẫn O(1)?

```
LINKED HASHMAP = HashMap + doubly-linked list (threaded through all entries)

HashMap bucket structure (như thường):
  table[0] → Entry(key=d) → null
  table[3] → Entry(key=a) → Entry(key=c) → null
  table[7] → Entry(key=b) → null

THÊM: mỗi Entry có thêm 2 pointers:
  Entry.before = Entry trước trong linked list
  Entry.after  = Entry sau trong linked list

Linked list (insertion order):
  header ↔ Entry(a) ↔ Entry(b) ↔ Entry(c) ↔ Entry(d) ↔ header (circular!)

TẠI SAO O(1) VẪN MAINTAINED?
  get(key): hash → bucket → tìm trong bucket  [không touch linked list]
  put(key,val): hash → bucket → insert        [thêm entry vào ĐẦU linked list]
  remove(key): hash → bucket → xóa           [update 2 pointers trước/sau]
  
  Linked list chỉ được UPDATE, không được SEARCH!
  Iteration traverses linked list (không scan all buckets):
    forEach: start từ header.after, follow .after pointers
    → duyệt theo insertion order → O(n) với n = actual entries!
  
  So sánh HashMap iteration:
    Scan ALL capacity slots (thường capacity >> size)
    Ví dụ: 100 entries, capacity=256 → scan 256 slots, nhiều null
    LinkedHashMap iteration: scan ĐÚNG 100 entries qua linked list!

MEMORY OVERHEAD:
  Mỗi LinkedHashMap Entry thêm 2 pointers:
    before: 8 bytes
    after:  8 bytes
  → 16 bytes/entry thêm so với HashMap
  Đây là trade-off: thêm 16 bytes/entry để có insertion order

ACCESS-ORDER MODE (cho LRU Cache):
  LinkedHashMap(16, 0.75f, accessOrder=true)
  
  Mỗi khi get(key) hay put(key):
    Move entry đến cuối linked list (most recently used = tail)
  
  Iteration: least recently used ở HEAD, most recently used ở TAIL
  removeEldestEntry() kiểm tra HEAD (oldest) → evict khi quá capacity
  
  TẠI SAO O(1)?
    get(key): O(1) hash lookup + O(1) move-to-tail (update 4 pointers)
    put(key): O(1) hash put + O(1) move-to-tail
    "Move to tail" = cập nhật 4 pointers → O(1)!
```

---

```
HIERARCHY:
  Iterable → Collection → {List, Set, Queue}
  Map (NOT in Collection hierarchy!)
  List implementations:  ArrayList, LinkedList, Vector(legacy)
  Set implementations:   HashSet, LinkedHashSet, TreeSet, EnumSet
  Queue/Deque:           ArrayDeque, PriorityQueue, LinkedList
  Map implementations:   HashMap, LinkedHashMap, TreeMap, EnumMap

LIST:
  ArrayList:     O(1) get/add-end, O(n) insert-middle. Default choice.
  LinkedList:    O(1) add/remove at ends, O(n) get. Use as Deque only.

SET:
  HashSet:       O(1) add/remove/contains. No order.
  LinkedHashSet: O(1) operations. Insertion order preserved.
  TreeSet:       O(log n) operations. Always sorted. NavigableSet.
  EnumSet:       O(1) bit operations. For enum types ONLY.

MAP:
  HashMap:       O(1) get/put. No order. Null keys/values OK.
  LinkedHashMap: O(1) get/put. Insertion or access order.
  TreeMap:       O(log n) get/put. Sorted keys. NavigableMap.
  EnumMap:       O(1) array-indexed. Enum keys only.
  ConcurrentHashMap: Thread-safe, no nulls. Use over Hashtable!

QUEUE/DEQUE:
  ArrayDeque:    O(1) both ends. Use as Stack/Queue (better than Stack/LinkedList!)
  PriorityQueue: O(log n) poll/offer. Min-heap by default.
  LinkedBlockingQueue: Thread-safe, blocking put/take for prod-consumer.

THREAD-SAFE:
  ConcurrentHashMap:     HashMap replacement
  CopyOnWriteArrayList:  ArrayList replacement (read-heavy)
  LinkedBlockingQueue:   Queue for producer-consumer
  Collections.synchronized*: wraps, but iteration needs external sync

KEY RULES:
  equals() + hashCode() must be consistent!
  TreeSet/TreeMap: elements must be Comparable OR provide Comparator
  Pre-size HashMap/ArrayList for known sizes (avoid rehashing/resizing)
  Prefer ArrayDeque over Stack (legacy) for stack operations
  Prefer ArrayDeque over LinkedList for queue operations
  Use EnumSet/EnumMap for enum types — fastest!
  List.of(), Set.of(), Map.of() → immutable, no null (Java 9+)
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Java Collections Framework | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/package-summary.html> |
| ArrayList | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/ArrayList.html> |
| LinkedList | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/LinkedList.html> |
| HashMap | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/HashMap.html> |
| TreeMap | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/TreeMap.html> |
| ConcurrentHashMap | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html> |
| Collections (utility) | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Collections.html> |
| Arrays (utility) | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Arrays.html> |
| Collections Tutorial | <https://docs.oracle.com/javase/tutorial/collections/index.html> |
