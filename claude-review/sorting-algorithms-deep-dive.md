# 🔢 Sorting Algorithms — Complete Deep Dive
> Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix, Tim Sort

---

## 📚 Table of Contents

1. [Sorting Fundamentals](#1-sorting-fundamentals)
2. [Bubble Sort](#2-bubble-sort)
3. [Selection Sort](#3-selection-sort)
4. [Insertion Sort](#4-insertion-sort)
5. [Merge Sort](#5-merge-sort)
6. [Quick Sort](#6-quick-sort)
7. [Heap Sort](#7-heap-sort)
8. [Counting Sort](#8-counting-sort)
9. [Radix Sort](#9-radix-sort)
10. [Bucket Sort](#10-bucket-sort)
11. [Tim Sort](#11-tim-sort)
12. [Shell Sort](#12-shell-sort)
13. [Comparison Table & Selection Guide](#13-comparison-table--selection-guide)
14. [Sorting in Practice](#14-sorting-in-practice)

---

# 1. Sorting Fundamentals

## 1.1 Key Properties

```
STABLE sorting: equal elements maintain their original relative order
  Before: [(A,3), (B,1), (C,3), (D,1)]  (sorted by number)
  Stable:  [(B,1), (D,1), (A,3), (C,3)]  ← B before D (original order)
  Unstable:[(D,1), (B,1), (C,3), (A,3)]  ← B/D, A/C order not guaranteed

Matters when: sorting objects by one key, then by another (multi-key sort)
  Sort employees by department THEN by salary within department

IN-PLACE: uses O(1) extra space (modifies array in-place)
ADAPTIVE: faster for nearly-sorted data
ONLINE: can sort stream, process elements one at a time
COMPARISON-BASED: determines order by comparing elements (O(n log n) lower bound!)
NON-COMPARISON: uses distribution/counting (can beat O(n log n)!)

Lower bound for comparison-based sorting:
  Decision tree: n! possible orderings of n elements
  Tree height ≥ log₂(n!) ≈ n log n (Stirling's approximation)
  → Any comparison sort MUST do Ω(n log n) comparisons in worst case!
```

## 1.2 Complexity Overview

```
Algorithm      Best       Avg        Worst      Space   Stable
─────────────────────────────────────────────────────────────────
Bubble         O(n)       O(n²)      O(n²)      O(1)    Yes
Selection      O(n²)      O(n²)      O(n²)      O(1)    No
Insertion      O(n)       O(n²)      O(n²)      O(1)    Yes
Merge          O(n log n) O(n log n) O(n log n) O(n)    Yes
Quick          O(n log n) O(n log n) O(n²)      O(log n)No*
Heap           O(n log n) O(n log n) O(n log n) O(1)    No
Counting       O(n+k)     O(n+k)     O(n+k)     O(k)    Yes
Radix          O(nk)      O(nk)      O(nk)      O(n+k)  Yes
Bucket         O(n+k)     O(n+k)     O(n²)      O(n)    Yes
Tim Sort       O(n)       O(n log n) O(n log n) O(n)    Yes
Shell          O(n log n) O(n^1.3)   O(n²)      O(1)    No

*Quick sort can be made stable, but usually isn't in practice
k = range of values (Counting/Radix), buckets (Bucket)
```

---

# 2. Bubble Sort

## 2.1 How It Works

```
Repeatedly swap ADJACENT elements if out of order
"Bubbles" largest element to end each pass

Pass 1: [5, 3, 8, 4, 2]
  Compare 5,3 → swap: [3, 5, 8, 4, 2]
  Compare 5,8 → ok:   [3, 5, 8, 4, 2]
  Compare 8,4 → swap: [3, 5, 4, 8, 2]
  Compare 8,2 → swap: [3, 5, 4, 2, 8]  ← 8 is in place

Pass 2: [3, 5, 4, 2, |8]
  Compare 3,5 → ok
  Compare 5,4 → swap: [3, 4, 5, 2, |8]
  Compare 5,2 → swap: [3, 4, 2, 5, |8]  ← 5 in place

... continues until sorted
```

```java
void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;  // optimization: detect already sorted

        for (int j = 0; j < n - 1 - i; j++) {  // n-1-i: last i elements sorted
            if (arr[j] > arr[j + 1]) {
                swap(arr, j, j + 1);
                swapped = true;
            }
        }
        if (!swapped) break;  // no swaps → already sorted! O(n) best case
    }
}

void swap(int[] arr, int i, int j) {
    int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
}

// Analysis:
// Comparisons: n(n-1)/2 worst case → O(n²)
// Swaps:       O(n²) worst case
// Best case:   O(n) if already sorted (with swapped flag)
// Stable:      YES — only swaps adjacent elements when strictly >
// Use for:     Almost never in practice (insertion sort always better)
//              Teaching purposes only
```

---

# 3. Selection Sort

## 3.1 How It Works

```
Find minimum of unsorted portion, place at front

[5, 3, 8, 4, 2]
  Find min in [0..4] = 2 at index 4 → swap with index 0
  [2, 3, 8, 4, 5]

  Find min in [1..4] = 3 at index 1 → swap with index 1 (no change)
  [2, 3, 8, 4, 5]

  Find min in [2..4] = 4 at index 3 → swap with index 2
  [2, 3, 4, 8, 5]

  Find min in [3..4] = 5 at index 4 → swap with index 3
  [2, 3, 4, 5, 8]  ← sorted!
```

```java
void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        swap(arr, i, minIdx);
    }
}

// Analysis:
// Comparisons: ALWAYS n(n-1)/2 → O(n²) even if sorted!
// Swaps:       n-1 swaps exactly (unlike bubble which can be O(n²))
// Stable:      NO — long-range swap can change relative order
//              Example: [2a, 2b, 1] → after swap: [1, 2b, 2a]
// Adaptive:    NO — always O(n²)
// Use for:     When write count matters (flash memory — minimizes swaps)
//              Very small arrays
```

---

# 4. Insertion Sort

## 4.1 How It Works

```
Build sorted portion one element at a time
Each new element "inserted" into correct position in sorted portion

Like sorting playing cards in hand!

[5, 3, 8, 4, 2]
  i=1: key=3, shift 5 right → [_, 5, 8, 4, 2], insert 3: [3, 5, 8, 4, 2]
  i=2: key=8, 5<8 → no shift: [3, 5, 8, 4, 2]
  i=3: key=4, shift 8,5 right → [3, _, _, 8, 2], insert 4: [3, 4, 5, 8, 2]
  i=4: key=2, shift 8,5,4,3 right, insert 2: [2, 3, 4, 5, 8]
```

```java
void insertionSort(int[] arr) {
    int n = arr.length;
    for (int i = 1; i < n; i++) {
        int key = arr[i];   // element to insert
        int j = i - 1;

        // Shift elements greater than key to the right
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;   // insert at correct position
    }
}

// BINARY INSERTION SORT — use binary search to find position
// Reduces comparisons to O(n log n) but swaps still O(n²)
void binaryInsertionSort(int[] arr) {
    int n = arr.length;
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int pos = binarySearchPosition(arr, key, 0, i - 1);

        // Shift right to make room
        int j = i;
        while (j > pos) { arr[j] = arr[j - 1]; j--; }
        arr[pos] = key;
    }
}
int binarySearchPosition(int[] arr, int key, int lo, int hi) {
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] > key) hi = mid - 1;
        else                lo = mid + 1;
    }
    return lo;
}

// Analysis:
// Best case:  O(n)   — already sorted (each element only compared once)
// Worst case: O(n²)  — reverse sorted (max shifts each time)
// Average:    O(n²)
// Stable:     YES (shifts don't change equal elements' order)
// Adaptive:   YES — O(n) for nearly sorted data
// Online:     YES — can sort stream (process one at a time)
// Use for:    Small arrays (< 20 elements) — fast in practice due to low overhead
//             Nearly sorted arrays — very fast!
//             Used as base case in TimSort and IntroSort
```

---

# 5. Merge Sort

## 5.1 How It Works

```
DIVIDE AND CONQUER:
  Divide array into two halves
  Recursively sort each half
  MERGE the two sorted halves

[5, 3, 8, 4, 2, 7, 1, 6]
        /         \
  [5, 3, 8, 4]  [2, 7, 1, 6]
    /    \          /    \
 [5, 3] [8, 4]  [2, 7] [1, 6]
  / \    / \     / \    / \
[5][3] [8][4] [2][7] [1][6]

Merge phase (bottom up):
[3,5] [4,8] [2,7] [1,6]
  [3,4,5,8]     [1,2,6,7]
    [1,2,3,4,5,6,7,8]

MERGE two sorted arrays:
[1, 3, 5, 7] + [2, 4, 6, 8]
  Compare fronts: 1<2, take 1: [1]
  Compare: 3>2, take 2: [1,2]
  Compare: 3<4, take 3: [1,2,3]
  Compare: 5>4, take 4: [1,2,3,4]
  Compare: 5<6, take 5: [1,2,3,4,5]
  Compare: 7>6, take 6: [1,2,3,4,5,6]
  Compare: 7<8, take 7: [1,2,3,4,5,6,7]
  Remaining: take 8:  [1,2,3,4,5,6,7,8]
```

```java
void mergeSort(int[] arr, int lo, int hi) {
    if (lo >= hi) return;  // base case: 0 or 1 elements

    int mid = lo + (hi - lo) / 2;    // avoid overflow! (not (lo+hi)/2)
    mergeSort(arr, lo, mid);          // sort left half
    mergeSort(arr, mid + 1, hi);      // sort right half
    merge(arr, lo, mid, hi);          // merge sorted halves
}

void merge(int[] arr, int lo, int mid, int hi) {
    // Create temp arrays for left and right halves
    int[] left  = Arrays.copyOfRange(arr, lo,    mid + 1);
    int[] right = Arrays.copyOfRange(arr, mid+1, hi + 1);

    int i = 0, j = 0, k = lo;

    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) arr[k++] = left[i++];  // <= for stability!
        else                     arr[k++] = right[j++];
    }
    while (i < left.length)  arr[k++] = left[i++];
    while (j < right.length) arr[k++] = right[j++];
}

// OPTIMIZED: allocate temp array once (not per merge call)
void mergeSortOptimized(int[] arr) {
    int[] temp = new int[arr.length];
    mergeSortHelper(arr, temp, 0, arr.length - 1);
}
void mergeSortHelper(int[] arr, int[] temp, int lo, int hi) {
    if (lo >= hi) return;
    if (hi - lo <= 10) { insertionSort(arr, lo, hi); return; }  // small: use insertion!
    int mid = lo + (hi - lo) / 2;
    mergeSortHelper(arr, temp, lo,    mid);
    mergeSortHelper(arr, temp, mid+1, hi);
    if (arr[mid] <= arr[mid+1]) return;  // already in order! skip merge
    mergeWithTemp(arr, temp, lo, mid, hi);
}

void mergeWithTemp(int[] arr, int[] temp, int lo, int mid, int hi) {
    System.arraycopy(arr, lo, temp, lo, hi - lo + 1);  // copy to temp
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if      (i > mid)          arr[k] = temp[j++];
        else if (j > hi)           arr[k] = temp[i++];
        else if (temp[i] <= temp[j]) arr[k] = temp[i++];
        else                       arr[k] = temp[j++];
    }
}

// BOTTOM-UP MERGE SORT (iterative, no recursion stack)
void mergeSortBottomUp(int[] arr) {
    int n = arr.length;
    int[] temp = new int[n];

    for (int size = 1; size < n; size *= 2) {        // merge size: 1,2,4,8...
        for (int lo = 0; lo < n - size; lo += size * 2) {
            int mid = lo + size - 1;
            int hi  = Math.min(lo + size * 2 - 1, n - 1);
            mergeWithTemp(arr, temp, lo, mid, hi);
        }
    }
}

// MERGE SORT FOR LINKED LIST (no extra space needed!)
ListNode mergeSortList(ListNode head) {
    if (head == null || head.next == null) return head;

    // Find middle (slow/fast pointer)
    ListNode slow = head, fast = head.next;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    ListNode mid = slow.next;
    slow.next = null;  // split list

    ListNode left  = mergeSortList(head);
    ListNode right = mergeSortList(mid);
    return mergeLists(left, right);
}

ListNode mergeLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0), curr = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }
        else                   { curr.next = l2; l2 = l2.next; }
        curr = curr.next;
    }
    curr.next = l1 != null ? l1 : l2;
    return dummy.next;
}

// Analysis:
// Time:    O(n log n) ALL cases (best, average, worst) — guaranteed!
// Space:   O(n) for temp array + O(log n) recursion stack
// Stable:  YES — careful with <= in merge
// Adaptive: NO — always does same work
// Use for: When stable sort needed, linked lists, external sorting (huge files)
//          Most reliable O(n log n) guarantee
```

---

# 6. Quick Sort

## 6.1 How It Works

```
DIVIDE AND CONQUER around a PIVOT element:
  Choose pivot
  PARTITION: elements < pivot to left, elements > pivot to right
  Recursively sort left and right partitions

[5, 3, 8, 4, 2, 7, 1, 6]
  Pivot = 5 (last element strategy)

  Partition:
  i = -1 (boundary of smaller elements)
  j scans from 0 to n-2:
    arr[0]=5 is not < pivot(6)... wait, pivot = last element

  Using pivot = 6 (last):
  [5, 3, 8, 4, 2, 7, 1, |6]
    5<6: swap(arr[0], arr[0]): [5, 3, 8, 4, 2, 7, 1 | 6]  i=0
    3<6: swap(arr[1], arr[1]): [5, 3, 8, 4, 2, 7, 1 | 6]  i=1
    8>6: no swap                                         i=1
    4<6: swap(arr[2],arr[3]):  [5, 3, 4, 8, 2, 7, 1 | 6]  i=2
    2<6: swap(arr[3],arr[4]):  [5, 3, 4, 2, 8, 7, 1 | 6]  i=3
    7>6: no swap               i=3
    1<6: swap(arr[4],arr[6]):  [5, 3, 4, 2, 1, 7, 8 | 6]  i=4
    Place pivot: swap(arr[5], arr[7]):
    [5, 3, 4, 2, 1, 6, 8, 7]
              LEFT↑  ↑pivot↑ RIGHT
  
  Recursively sort [5,3,4,2,1] and [8,7]
```

```java
void quickSort(int[] arr, int lo, int hi) {
    if (lo >= hi) return;

    int pivotIdx = partition(arr, lo, hi);
    quickSort(arr, lo, pivotIdx - 1);   // sort left of pivot
    quickSort(arr, pivotIdx + 1, hi);   // sort right of pivot
}

// LOMUTO PARTITION — simpler, slightly less efficient
int partitionLomuto(int[] arr, int lo, int hi) {
    int pivot = arr[hi];   // choose last element as pivot
    int i = lo - 1;        // boundary: arr[lo..i] < pivot

    for (int j = lo; j < hi; j++) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr, i, j);
        }
    }
    swap(arr, i + 1, hi);  // place pivot in correct position
    return i + 1;           // return pivot's final index
}

// HOARE PARTITION — original, more efficient (3x fewer swaps)
int partitionHoare(int[] arr, int lo, int hi) {
    int pivot = arr[lo + (hi - lo) / 2];  // middle element as pivot
    int i = lo - 1, j = hi + 1;

    while (true) {
        do { i++; } while (arr[i] < pivot);
        do { j--; } while (arr[j] > pivot);
        if (i >= j) return j;
        swap(arr, i, j);
    }
}

// ── PIVOT STRATEGIES ──

// 1. Last element — O(n²) on sorted input!
int pivot = arr[hi];

// 2. First element — O(n²) on sorted/reverse sorted!
int pivot = arr[lo];

// 3. Random pivot — expected O(n log n), avoids adversarial input
int randomPivot(int[] arr, int lo, int hi) {
    int idx = lo + (int)(Math.random() * (hi - lo + 1));
    swap(arr, idx, hi);           // move pivot to end for Lomuto
    return partitionLomuto(arr, lo, hi);
}

// 4. Median of Three — good pivot, prevents O(n²) in common cases
int medianOfThree(int[] arr, int lo, int hi) {
    int mid = lo + (hi - lo) / 2;
    // Sort lo, mid, hi to find median
    if (arr[lo] > arr[mid]) swap(arr, lo, mid);
    if (arr[lo] > arr[hi])  swap(arr, lo, hi);
    if (arr[mid] > arr[hi]) swap(arr, mid, hi);
    // arr[lo] ≤ arr[mid] ≤ arr[hi], median = arr[mid]
    swap(arr, mid, hi - 1);       // place median at hi-1
    return arr[hi - 1];
}

// ── THREE-WAY PARTITION (Dutch National Flag) ──
// Handles DUPLICATES efficiently!
// Partition into: < pivot | == pivot | > pivot
void threeWayQuickSort(int[] arr, int lo, int hi) {
    if (lo >= hi) return;

    int lt = lo, gt = hi, i = lo;
    int pivot = arr[lo];

    while (i <= gt) {
        if      (arr[i] < pivot) swap(arr, lt++, i++);
        else if (arr[i] > pivot) swap(arr, i,   gt--);
        else                     i++;
    }
    // arr[lo..lt-1] < pivot
    // arr[lt..gt]   = pivot (all in place!)
    // arr[gt+1..hi] > pivot

    threeWayQuickSort(arr, lo,    lt - 1);
    threeWayQuickSort(arr, gt + 1, hi);
}

// ── TAIL RECURSION OPTIMIZATION ──
// Prevents O(n) stack depth in worst case
void quickSortTailOpt(int[] arr, int lo, int hi) {
    while (lo < hi) {
        int p = partition(arr, lo, hi);
        if (p - lo < hi - p) {
            quickSortTailOpt(arr, lo, p - 1);  // recurse on smaller
            lo = p + 1;                          // iterate on larger
        } else {
            quickSortTailOpt(arr, p + 1, hi);  // recurse on smaller
            hi = p - 1;                          // iterate on larger
        }
    }
    // Worst case stack: O(log n) instead of O(n)
}

// ── QUICK SELECT — find k-th smallest in O(n) average ──
int quickSelect(int[] arr, int lo, int hi, int k) {
    if (lo == hi) return arr[lo];

    int p = partition(arr, lo, hi);

    if (k == p)        return arr[p];
    else if (k < p)    return quickSelect(arr, lo,    p - 1, k);
    else               return quickSelect(arr, p + 1, hi,    k);
}

// k-th smallest in entire array (0-indexed):
int kthSmallest(int[] arr, int k) {
    return quickSelect(arr.clone(), 0, arr.length - 1, k);
}

// Analysis:
// Best/Avg: O(n log n) — balanced partitions
// Worst:    O(n²) — already sorted + bad pivot (last element)
// Space:    O(log n) recursion stack (avg), O(n) worst
// Stable:   NO
// Adaptive: Somewhat — three-way partition excels with duplicates
// In practice: FASTEST in practice due to cache efficiency!
//              Small constant factor compared to merge sort
// Use for:  General-purpose sorting, when average performance > guaranteed
```

---

# 7. Heap Sort

## 7.1 How It Works

```
Two phases:
  1. BUILD MAX-HEAP: rearrange array into max-heap
  2. EXTRACT: repeatedly extract max, place at end

Input: [5, 3, 8, 4, 2]

Phase 1 — Build max-heap (from last non-leaf, sift down):
  Start at index n/2-1 = 1
  Sift down index 1: [3,4] — 4>3, swap: [5, 4, 8, 3, 2]
  Sift down index 0: [8] — 8>5, swap: [8, 4, 5, 3, 2]
  Max-heap: [8, 4, 5, 3, 2]
  
          8
        /   \
       4     5
      / \
     3   2

Phase 2 — Extract:
  Swap arr[0] with arr[4]: [2, 4, 5, 3, |8]
  Sift down: [5, 4, 2, 3, |8]
  
  Swap arr[0] with arr[3]: [3, 4, 2, |5, 8]
  Sift down: [4, 3, 2, |5, 8]
  
  Swap arr[0] with arr[2]: [2, 3, |4, 5, 8]
  Sift down: [3, 2, |4, 5, 8]
  
  Swap arr[0] with arr[1]: [2, |3, 4, 5, 8]
  
  Final: [2, 3, 4, 5, 8] ✓
```

```java
void heapSort(int[] arr) {
    int n = arr.length;

    // Phase 1: Build max-heap
    // Start from last non-leaf node: n/2 - 1
    for (int i = n / 2 - 1; i >= 0; i--)
        maxHeapify(arr, n, i);

    // Phase 2: Extract elements one by one
    for (int i = n - 1; i > 0; i--) {
        swap(arr, 0, i);        // move current max to sorted portion
        maxHeapify(arr, i, 0);  // heapify reduced heap
    }
}

void maxHeapify(int[] arr, int heapSize, int i) {
    int largest = i;
    int left  = 2 * i + 1;
    int right = 2 * i + 2;

    if (left  < heapSize && arr[left]  > arr[largest]) largest = left;
    if (right < heapSize && arr[right] > arr[largest]) largest = right;

    if (largest != i) {
        swap(arr, i, largest);
        maxHeapify(arr, heapSize, largest);  // recursively heapify affected
    }
}

// Analysis:
// Time:  O(n log n) ALL cases — guaranteed!
// Space: O(1) — in-place! (advantage over merge sort)
// Stable: NO — distant swaps can change equal elements' order
// Adaptive: NO
// Cache: POOR — non-sequential memory access pattern
//        (why it's often slower than quicksort in practice despite same big-O)
// Use for: When guaranteed O(n log n) + O(1) space needed
//           Part of IntroSort (fallback when quicksort depth exceeds threshold)
```

---

# 8. Counting Sort

## 8.1 How It Works

```
NON-COMPARISON SORT — works for integers in known range [0, k]
Count occurrences, then rebuild array

Input: [4, 2, 2, 8, 3, 3, 1]  k=8

Step 1 — Count occurrences:
  count = [0, 1, 2, 2, 1, 0, 0, 0, 1]
  idx:      0  1  2  3  4  5  6  7  8
  (count[i] = number of elements equal to i)

Step 2 — Cumulative count (prefix sum):
  count = [0, 1, 3, 5, 6, 6, 6, 6, 7]
  (count[i] = number of elements ≤ i = starting output position)

Step 3 — Build output (stable, go right to left):
  Process arr[6]=1: output[count[1]-1=0] = 1; count[1]-- = 0
  Process arr[5]=3: output[count[3]-1=4] = 3; count[3]-- = 4
  Process arr[4]=3: output[count[3]-1=3] = 3; count[3]-- = 3
  ... etc
  Output: [1, 2, 2, 3, 3, 4, 8]
```

```java
int[] countingSort(int[] arr) {
    int n = arr.length;
    if (n == 0) return arr;

    int max = Arrays.stream(arr).max().getAsInt();
    int min = Arrays.stream(arr).min().getAsInt();
    int range = max - min + 1;

    int[] count  = new int[range];
    int[] output = new int[n];

    // Count occurrences
    for (int num : arr) count[num - min]++;

    // Prefix sum (cumulative)
    for (int i = 1; i < range; i++) count[i] += count[i - 1];

    // Build output (right to left for stability)
    for (int i = n - 1; i >= 0; i--) {
        output[--count[arr[i] - min]] = arr[i];
    }

    return output;
}

// SIMPLE COUNTING SORT for non-negative integers:
void countingSortSimple(int[] arr) {
    int max = Arrays.stream(arr).max().getAsInt();
    int[] count = new int[max + 1];

    for (int num : arr) count[num]++;

    int idx = 0;
    for (int i = 0; i <= max; i++)
        while (count[i]-- > 0)
            arr[idx++] = i;
}

// Analysis:
// Time:  O(n + k) where k = range of values
// Space: O(n + k)
// Stable: YES (with careful implementation)
// Best when: k = O(n), i.e., range is small
// Worst when: k >> n (range much larger than count)
// Use for: Integers in small range, radix sort's subroutine
//           Sorting grades (0-100), ages, ASCII characters
```

---

# 9. Radix Sort

## 9.1 How It Works

```
Sort digit by digit, from LEAST significant to MOST significant
Uses Counting Sort as stable subroutine for each digit

Input: [329, 457, 657, 839, 436, 720, 355]

Sort by ones digit:
  720, 355, 436, 457, 657, 329, 839
  ↑0  ↑5   ↑6   ↑7  ↑7   ↑9  ↑9

Sort by tens digit:
  720, 329, 436, 839, 355, 457, 657
  ↑2   ↑2   ↑3   ↑3  ↑5   ↑5  ↑5

Sort by hundreds digit:
  329, 355, 436, 457, 657, 720, 839
  ↑3   ↑3   ↑4   ↑4  ↑6   ↑7  ↑8

Result: [329, 355, 436, 457, 657, 720, 839] ✓

WHY LSD (Least Significant Digit) works:
  Each stable sort preserves order of previous sort
  When we sort hundreds, equal-hundreds items keep their tens order
  → Final result is correctly sorted by all digits
```

```java
void radixSort(int[] arr) {
    int max = Arrays.stream(arr).max().getAsInt();

    // Sort by each digit position (1s, 10s, 100s, ...)
    for (int exp = 1; max / exp > 0; exp *= 10) {
        countSortByDigit(arr, exp);
    }
}

void countSortByDigit(int[] arr, int exp) {
    int n = arr.length;
    int[] output = new int[n];
    int[] count  = new int[10];  // digits 0-9

    // Count occurrences of each digit
    for (int num : arr)
        count[(num / exp) % 10]++;

    // Cumulative count
    for (int i = 1; i < 10; i++)
        count[i] += count[i - 1];

    // Build output (right to left for stability)
    for (int i = n - 1; i >= 0; i--) {
        int digit = (arr[i] / exp) % 10;
        output[--count[digit]] = arr[i];
    }

    System.arraycopy(output, 0, arr, 0, n);
}

// RADIX SORT FOR STRINGS (by character position)
void radixSortStrings(String[] arr, int maxLen) {
    // Sort by each character position, from right to left
    for (int pos = maxLen - 1; pos >= 0; pos--) {
        stableCountSortByChar(arr, pos);
    }
}

// MSD RADIX SORT (Most Significant Digit first)
// Good for strings, doesn't need fixed length
void msdRadixSort(String[] arr, int lo, int hi, int d) {
    if (hi <= lo || d > maxLength) return;

    int[] count = new int[27];  // 0='end', 1-26='a'-'z'
    for (int i = lo; i <= hi; i++)
        count[charAt(arr[i], d) + 1]++;

    // Make cumulative
    for (int r = 0; r < 26; r++)
        count[r + 1] += count[r];

    String[] aux = new String[hi - lo + 1];
    for (int i = lo; i <= hi; i++)
        aux[count[charAt(arr[i], d)]++] = arr[i];

    System.arraycopy(aux, 0, arr, lo, hi - lo + 1);

    // Recursively sort each bucket
    for (int r = 0; r < 26; r++)
        msdRadixSort(arr, lo + count[r], lo + count[r+1] - 1, d + 1);
}

// Analysis:
// Time:  O(nk) where k = number of digits
//        For 32-bit integers: k = log_b(max) = 32/b (b=radix, usually 10 or 256)
//        With radix 256: k=4 passes, O(4n) = O(n)
// Space: O(n + k)
// Stable: YES
// Limitation: integers or fixed-format strings
// Use for: Large volumes of integers/strings, parallel sorting
```

---

# 10. Bucket Sort

## 10.1 How It Works

```
Distribute elements into buckets, sort each bucket, concatenate

Best for: uniformly distributed floating point in [0, 1)
Or: integers in known range

Input: [0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12]
n = 8 buckets (each covers range of 1/n = 0.125)

Distribute into buckets:
  Bucket 0 [0.0, 0.125): [0.12]
  Bucket 1 [0.125, 0.25): [0.17, 0.21]
  Bucket 2 [0.25, 0.375): [0.26]
  Bucket 3 [0.375, 0.5):  [0.39]
  Bucket 4 [0.5, 0.625):  []
  Bucket 5 [0.625, 0.75): []
  Bucket 6 [0.75, 0.875): [0.78, 0.72]
  Bucket 7 [0.875, 1.0):  [0.94]

Sort each bucket (insertion sort — small buckets!):
  Bucket 1: [0.17, 0.21]
  Bucket 6: [0.72, 0.78]

Concatenate:
  [0.12, 0.17, 0.21, 0.26, 0.39, 0.72, 0.78, 0.94]
```

```java
void bucketSort(double[] arr) {
    int n = arr.length;
    if (n <= 0) return;

    List<Double>[] buckets = new List[n];
    for (int i = 0; i < n; i++) buckets[i] = new ArrayList<>();

    // Distribute into buckets
    for (double val : arr) {
        int bucketIdx = (int)(val * n);  // assumes [0, 1)
        if (bucketIdx == n) bucketIdx--;  // edge case: val = 1.0
        buckets[bucketIdx].add(val);
    }

    // Sort each bucket and concatenate
    int idx = 0;
    for (List<Double> bucket : buckets) {
        Collections.sort(bucket);         // insertion sort for small buckets
        for (double val : bucket) arr[idx++] = val;
    }
}

// For arbitrary range [min, max]:
void bucketSortGeneral(int[] arr, int numBuckets) {
    int min = Integer.MAX_VALUE, max = Integer.MIN_VALUE;
    for (int x : arr) { min = Math.min(min, x); max = Math.max(max, x); }

    double range = (max - min + 1.0) / numBuckets;
    List<Integer>[] buckets = new List[numBuckets];
    for (int i = 0; i < numBuckets; i++) buckets[i] = new ArrayList<>();

    for (int x : arr)
        buckets[(int)((x - min) / range)].add(x);

    int idx = 0;
    for (List<Integer> bucket : buckets) {
        Collections.sort(bucket);
        for (int x : bucket) arr[idx++] = x;
    }
}

// Analysis:
// Best/Avg: O(n + k) assuming uniform distribution
// Worst: O(n²) if all elements in one bucket
// Space: O(n + k)
// Stable: YES (if stable sort used within buckets)
// Use for: Floating point numbers, uniform distribution
```

---

# 11. Tim Sort

## 11.1 How It Works

```
Tim Sort = Merge Sort + Insertion Sort (hybrid)
Used by: Java Arrays.sort() for objects, Python sorted(), Android

Key ideas:
  1. Find or create RUNS (sorted subsequences, min length 32-64)
     Natural runs: already sorted sequences in data
     If run too short: extend with insertion sort
     
  2. MERGE runs using merge sort
     Merge sizes chosen to minimize comparisons
     Power of 2 rule for stable merging

WHY hybrid works:
  Insertion sort: O(n²) theoretical, but FASTEST for small/nearly-sorted arrays
                  Excellent cache performance, low overhead
  Merge sort:     O(n log n) guaranteed
  Tim sort:       Best of both worlds!

GALLOPING MODE:
  When merging, if one run is consistently winning many comparisons:
  → Switch to binary/exponential search to skip ahead faster
  → Reduces comparisons for highly structured data

Real performance:
  Best: O(n) — already sorted or reverse sorted
  Average: O(n log n)
  Worst: O(n log n) — guaranteed
  Space: O(n)
  Stable: YES
```

```java
// Simplified Tim Sort implementation
class TimSort {
    private static final int MIN_MERGE = 32;

    public static void sort(int[] arr) {
        int n = arr.length;
        // Sort individual runs with insertion sort
        for (int i = 0; i < n; i += MIN_MERGE) {
            insertionSort(arr, i, Math.min(i + MIN_MERGE - 1, n - 1));
        }

        // Merge runs
        for (int size = MIN_MERGE; size < n; size *= 2) {
            for (int lo = 0; lo < n; lo += size * 2) {
                int mid = lo + size - 1;
                int hi  = Math.min(lo + size * 2 - 1, n - 1);
                if (mid < hi) merge(arr, lo, mid, hi);
            }
        }
    }

    private static void insertionSort(int[] arr, int lo, int hi) {
        for (int i = lo + 1; i <= hi; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= lo && arr[j] > key) { arr[j + 1] = arr[j]; j--; }
            arr[j + 1] = key;
        }
    }

    private static void merge(int[] arr, int lo, int mid, int hi) {
        int[] left  = Arrays.copyOfRange(arr, lo,    mid + 1);
        int[] right = Arrays.copyOfRange(arr, mid+1, hi + 1);
        int i = 0, j = 0, k = lo;
        while (i < left.length && j < right.length)
            arr[k++] = (left[i] <= right[j]) ? left[i++] : right[j++];
        while (i < left.length)  arr[k++] = left[i++];
        while (j < right.length) arr[k++] = right[j++];
    }
}
```

---

# 12. Shell Sort

## 12.1 How It Works

```
Generalization of insertion sort
Sort elements far apart first (reduces inversions quickly)
Then reduce gap, eventually gap=1 (regular insertion sort)

Input: [8, 3, 7, 1, 6, 4, 5, 2]
Gap = 4: compare elements 4 apart
  Compare arr[0]=8 with arr[4]=6: swap → [6, 3, 7, 1, 8, 4, 5, 2]
  Compare arr[1]=3 with arr[5]=4: ok
  Compare arr[2]=7 with arr[6]=5: swap → [6, 3, 5, 1, 8, 4, 7, 2]
  Compare arr[3]=1 with arr[7]=2: ok

Gap = 2:
  ... sorts elements 2 apart ...

Gap = 1 (insertion sort):
  Array nearly sorted → few operations needed!

Gap sequences (affect performance):
  Original Shell: n/2, n/4, ..., 1         O(n²) worst
  Hibbard: 1, 3, 7, 15, 31... (2^k-1)      O(n^1.5) worst
  Sedgewick: 1, 5, 19, 41, 109...           O(n^1.33) practical
  Ciura: 1, 4, 10, 23, 57, 132, 301, 701   best in practice
```

```java
void shellSort(int[] arr) {
    int n = arr.length;

    // Ciura gap sequence (best known in practice)
    int[] gaps = {701, 301, 132, 57, 23, 10, 4, 1};

    for (int gap : gaps) {
        if (gap >= n) continue;

        // Gapped insertion sort
        for (int i = gap; i < n; i++) {
            int temp = arr[i];
            int j = i;
            while (j >= gap && arr[j - gap] > temp) {
                arr[j] = arr[j - gap];
                j -= gap;
            }
            arr[j] = temp;
        }
    }
}

// Analysis:
// Time: depends on gap sequence
//       O(n log² n) with Hibbard or Sedgewick gaps
// Space: O(1) — in-place
// Stable: NO (gaps jump over elements)
// Adaptive: YES — fast on nearly sorted
// Use for: Medium-sized arrays, embedded systems (no recursion needed)
```

---

# 13. Comparison Table & Selection Guide

## 13.1 Full Comparison

```
                 Time Complexity              Space  Stable  Adaptive  In-place
Algorithm       Best       Avg       Worst
────────────────────────────────────────────────────────────────────────────────
Bubble          O(n)       O(n²)     O(n²)    O(1)   ✅      ✅        ✅
Selection       O(n²)      O(n²)     O(n²)    O(1)   ❌      ❌        ✅
Insertion       O(n)       O(n²)     O(n²)    O(1)   ✅      ✅        ✅
Shell           O(n log n) O(n^1.3)  O(n²)    O(1)   ❌      ✅        ✅
Merge           O(n log n) O(n log n)O(n log n)O(n)  ✅      ❌        ❌
Quick           O(n log n) O(n log n)O(n²)    O(log n)❌     ✅(3-way) ✅
Heap            O(n log n) O(n log n)O(n log n)O(1)  ❌      ❌        ✅
Tim Sort        O(n)       O(n log n)O(n log n)O(n)  ✅      ✅        ❌
Counting        O(n+k)     O(n+k)    O(n+k)   O(k)   ✅      ❌        ❌
Radix           O(nk)      O(nk)     O(nk)    O(n+k) ✅      ❌        ❌
Bucket          O(n+k)     O(n+k)    O(n²)    O(n)   ✅      ❌        ❌
────────────────────────────────────────────────────────────────────────────────
```

## 13.2 When to Use What

```
SMALL ARRAYS (n < 20):
  → Insertion Sort — low overhead, cache-friendly, fast in practice

NEARLY SORTED DATA:
  → Insertion Sort or Tim Sort — O(n) best case
  → Avoid: Quick Sort (many swaps) or Heap Sort (poor locality)

GENERAL PURPOSE (large n):
  → Quick Sort (fastest average, cache friendly)
  → Tim Sort (if stability needed or real-world data with patterns)

MUST BE O(n log n) WORST CASE:
  → Merge Sort (stable, predictable)
  → Heap Sort (in-place + O(n log n) guaranteed)
  → Avoid: Quick Sort (O(n²) worst case)

STABILITY REQUIRED (multi-key sort, preserve original order for equals):
  → Merge Sort, Tim Sort, Insertion Sort, Counting Sort
  → Avoid: Quick Sort, Heap Sort, Shell Sort

O(1) EXTRA SPACE:
  → Heap Sort (O(n log n) + O(1) space)
  → Insertion/Selection/Bubble Sort (simpler but O(n²))

INTEGER/SMALL RANGE VALUES:
  → Counting Sort (O(n + k))
  → Radix Sort (O(nk))

FLOATING POINT UNIFORM DISTRIBUTION:
  → Bucket Sort (O(n) average)

LINKED LIST:
  → Merge Sort (natural for linked lists, O(1) extra space with lists)
  → Avoid: Quick Sort, Heap Sort (need random access)

PARALLEL SORTING:
  → Merge Sort (naturally parallel — divide and conquer)
  → Radix Sort (each pass can be parallelized)

EXTERNAL SORTING (data too large for RAM):
  → Merge Sort — merge sorted runs from disk
  → k-way merge: merge k sorted files simultaneously

INTERVIEW / COMPETITION:
  → Quick Sort (fast, good to know)
  → Merge Sort (stable, guaranteed)
  → Counting/Radix (for specific constraints)
```

---

# 14. Sorting in Practice

## 14.1 Java Sort Internals

```java
// Arrays.sort() — uses DIFFERENT algorithms based on type!

// PRIMITIVE ARRAYS (int[], double[], etc.):
//   → Dual-Pivot Quicksort (Vladimir Yaroslavskiy, 2009)
//   → Better than classic quicksort: ~20% faster empirically
//   → Falls back to insertion sort for small arrays (< 47)
//   → Falls back to heapsort to avoid O(n²) worst case
//   → NOT STABLE (primitives have no identity, so stability doesn't matter)
Arrays.sort(intArray);         // Dual-Pivot QuickSort
Arrays.sort(intArray, 2, 8);  // sort range [2, 8)

// OBJECT ARRAYS (Integer[], String[], Object[]):
//   → Tim Sort (Java 7+)
//   → STABLE — required for objects (equal objects keep original order)
//   → Uses natural ordering (Comparable) or provided Comparator
Arrays.sort(objectArray);
Arrays.sort(objectArray, comparator);

// PARALLEL SORT (Java 8+):
//   → Fork/Join framework splits array into segments, sorts in parallel
//   → Merges sorted segments
//   → Faster for large arrays on multi-core
Arrays.parallelSort(largeIntArray);  // ~4x faster on 4 cores for large n

// Collections.sort() and List.sort():
//   → Tim Sort always (Object-based, stability required)
Collections.sort(list);
list.sort(comparator);
list.sort(Comparator.comparing(User::getName)
           .thenComparingInt(User::getAge)
           .reversed());

// Stream sorted():
list.stream()
    .sorted(Comparator.comparing(User::getName))
    .collect(Collectors.toList());

// Custom Comparator best practices:
// ❌ subtraction trick — can overflow for large numbers!
list.sort((a, b) -> a.getAge() - b.getAge());

// ✅ Use Integer.compare:
list.sort((a, b) -> Integer.compare(a.getAge(), b.getAge()));

// ✅ Use Comparator factory methods:
list.sort(Comparator.comparingInt(User::getAge));
list.sort(Comparator.comparingInt(User::getAge).reversed());
list.sort(Comparator.comparing(User::getDept)
           .thenComparingInt(User::getSalary));
```

## 14.2 Sorting Edge Cases

```java
// HANDLE NULL values:
list.sort(Comparator.nullsFirst(Comparator.comparing(User::getName)));
list.sort(Comparator.nullsLast(Comparator.naturalOrder()));

// CASE-INSENSITIVE STRING SORT:
list.sort(String.CASE_INSENSITIVE_ORDER);
list.sort(Comparator.comparing(String::toLowerCase));

// SORT BY MULTIPLE CRITERIA:
list.sort(
    Comparator.comparingInt(Employee::getDepartmentId)
              .thenComparingDouble(Employee::getSalary).reversed()
              .thenComparing(Employee::getLastName)
);

// REVERSE SORT:
list.sort(Collections.reverseOrder());
list.sort(Comparator.reverseOrder());
list.sort(Comparator.comparingInt(User::getAge).reversed());

// SORT ARRAY OF ARRAYS:
int[][] intervals = {{1,3},{0,2},{2,4},{3,5}};
Arrays.sort(intervals, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);

// STABLE SORT TRICK — counting sort by field then stable sort by another:
// Sort objects: first by name (stable sort), then by age
// Result: for same age, names stay sorted
list.sort(Comparator.comparing(User::getName));   // first sort
list.sort(Comparator.comparingInt(User::getAge)); // stable → names stay sorted within same age
```

## 14.3 Algorithms for Specific Problems

```java
// SORT COLORS / DUTCH NATIONAL FLAG (3-way partition)
// [2, 0, 2, 1, 1, 0] → [0, 0, 1, 1, 2, 2]
void sortColors(int[] nums) {
    int lo = 0, mid = 0, hi = nums.length - 1;
    while (mid <= hi) {
        switch (nums[mid]) {
            case 0: swap(nums, lo++, mid++); break;
            case 1: mid++; break;
            case 2: swap(nums, mid, hi--); break;
        }
    }
}

// MERGE INTERVALS — sort by start, then merge overlapping
int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    LinkedList<int[]> result = new LinkedList<>();

    for (int[] interval : intervals) {
        if (result.isEmpty() || result.getLast()[1] < interval[0]) {
            result.add(interval);
        } else {
            result.getLast()[1] = Math.max(result.getLast()[1], interval[1]);
        }
    }
    return result.toArray(new int[0][]);
}

// SORT CHARACTERS BY FREQUENCY
String frequencySort(String s) {
    Map<Character, Integer> freq = new HashMap<>();
    for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);

    // Sort by frequency descending
    List<Character> chars = new ArrayList<>(freq.keySet());
    chars.sort((a, b) -> freq.get(b) - freq.get(a));

    StringBuilder sb = new StringBuilder();
    for (char c : chars)
        sb.append(String.valueOf(c).repeat(freq.get(c)));
    return sb.toString();
}

// COUNT INVERSIONS (merge sort based)
long countInversions(int[] arr) {
    return mergeCountInversions(arr, 0, arr.length - 1);
}
long mergeCountInversions(int[] arr, int lo, int hi) {
    if (lo >= hi) return 0;
    int mid = lo + (hi - lo) / 2;
    long count = mergeCountInversions(arr, lo,    mid)
               + mergeCountInversions(arr, mid+1, hi);
    // Count inversions during merge
    int[] temp = new int[hi - lo + 1];
    int i = lo, j = mid + 1, k = 0;
    while (i <= mid && j <= hi) {
        if (arr[i] <= arr[j]) temp[k++] = arr[i++];
        else {
            count += (mid - i + 1);  // all remaining left elements form inversion with arr[j]
            temp[k++] = arr[j++];
        }
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= hi)  temp[k++] = arr[j++];
    System.arraycopy(temp, 0, arr, lo, hi - lo + 1);
    return count;
}
```

---

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Arrays.sort() (Java) | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Arrays.html#sort(int[]) |
| Collections.sort() | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Collections.html#sort(java.util.List) |
| Comparator | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Comparator.html |
| Dual-Pivot QuickSort | https://arxiv.org/abs/1503.04020 |
| Tim Sort Paper | https://svn.python.org/projects/python/trunk/Objects/listsort.txt |
| Visualgo Sorting | https://visualgo.net/en/sorting |
| Sorting Algorithm Animations | https://www.toptal.com/developers/sorting-algorithms |
| Big-O Cheatsheet | https://www.bigocheatsheet.com/ |
| CP Algorithms - Sorting | https://cp-algorithms.com/algebra/sorting.html |
