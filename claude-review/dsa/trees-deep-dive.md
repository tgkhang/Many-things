# 🌳 Tree Data Structures — Complete Deep Dive
>
> Binary Tree, BST, AVL, Red-Black, B-Tree, Segment Tree, Fenwick Tree, Heap

---

## 📚 Table of Contents

1. [Tree Fundamentals](#1-tree-fundamentals)
2. [Binary Tree](#2-binary-tree)
3. [Binary Search Tree (BST)](#3-binary-search-tree-bst)
4. [AVL Tree — Self-Balancing](#4-avl-tree--self-balancing)
5. [Red-Black Tree](#5-red-black-tree)
6. [B-Tree & B+ Tree](#6-b-tree--b-tree)
7. [Heap Tree](#7-heap-tree)
8. [Segment Tree](#8-segment-tree)
9. [Fenwick Tree (Binary Indexed Tree)](#9-fenwick-tree-binary-indexed-tree)
10. [Trie (Prefix Tree)](#10-trie-prefix-tree)
11. [Tree Traversals — All Patterns](#11-tree-traversals--all-patterns)
12. [Common Tree Problems](#12-common-tree-problems)

---

# 1. Tree Fundamentals

## 1.1 Terminology

```
         A         ← Root (no parent)
        / \
       B   C       ← Internal nodes (have children)
      / \   \
     D   E   F     ← Leaf nodes (no children)
        /
       G

Node A:
  - Parent: none (root)
  - Children: B, C
  - Siblings: none

Node B:
  - Parent: A
  - Children: D, E
  - Siblings: C (same parent)
  - Depth: 1 (edges from root)
  - Height: 2 (edges to farthest leaf)

Node G:
  - Parent: E
  - Children: none (leaf)
  - Depth: 3 (edges from root)
  - Height: 0

Tree properties:
  Height of tree = max depth of any node = 3
  Degree of node = number of children
  Size = total number of nodes = 7

Path: sequence of nodes from ancestor to descendant
Subtree: node + all its descendants (every node is root of its subtree)

For a tree with n nodes:
  - Exactly n-1 edges
  - Exactly one path between any two nodes
```

## 1.2 Tree Types

```
BINARY TREE: each node has at most 2 children (left, right)

FULL BINARY TREE: every node has 0 or 2 children (no node has exactly 1)
        1
       / \
      2   3
     / \
    4   5

COMPLETE BINARY TREE: all levels fully filled except last; last level filled left-to-right
        1
       / \
      2   3
     / \ /
    4  5 6
  ← Used in Heap implementation

PERFECT BINARY TREE: all internal nodes have 2 children; all leaves same level
        1
       / \
      2   3
     / \ / \
    4  5 6  7
  → n = 2^(h+1) - 1 nodes, height h = log₂(n+1) - 1

BALANCED BINARY TREE: |height(left) - height(right)| ≤ 1 for every node
  → Guarantees O(log n) operations

DEGENERATE (SKEWED) TREE: every node has only one child — basically a linked list
  → O(n) operations! (worst case for unbalanced BST)
        1
        \
         2
          \
           3
```

---

# 2. Binary Tree

## 2.1 Node Structure

```java
public class TreeNode<T> {
    public T val;
    public TreeNode<T> left, right;

    public TreeNode(T val) { this.val = val; }
    public TreeNode(T val, TreeNode<T> left, TreeNode<T> right) {
        this.val = val; this.left = left; this.right = right;
    }
}

// Convenience: Integer tree node (LeetCode style)
public class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val; this.left = left; this.right = right;
    }
}
```

## 2.2 Tree Properties

```java
// HEIGHT of tree (edges from root to farthest leaf)
int height(TreeNode root) {
    if (root == null) return -1;   // empty tree height = -1
    // (use 0 for node count instead of edge count)
    return 1 + Math.max(height(root.left), height(root.right));
}

// SIZE (total nodes)
int size(TreeNode root) {
    if (root == null) return 0;
    return 1 + size(root.left) + size(root.right);
}

// DIAMETER (longest path between any two nodes, may not pass through root)
int diameter(TreeNode root) {
    int[] maxDiam = {0};

    // Returns height of subtree, updates maxDiam as side effect
    calculateHeight(root, maxDiam);
    return maxDiam[0];
}
int calculateHeight(TreeNode node, int[] maxDiam) {
    if (node == null) return 0;
    int left  = calculateHeight(node.left,  maxDiam);
    int right = calculateHeight(node.right, maxDiam);
    maxDiam[0] = Math.max(maxDiam[0], left + right);  // path through this node
    return 1 + Math.max(left, right);
}

// IS BALANCED
boolean isBalanced(TreeNode root) {
    return checkHeight(root) != -1;
}
int checkHeight(TreeNode node) {
    if (node == null) return 0;
    int left = checkHeight(node.left);
    if (left == -1) return -1;  // unbalanced subtree
    int right = checkHeight(node.right);
    if (right == -1) return -1;
    if (Math.abs(left - right) > 1) return -1;  // current node unbalanced
    return 1 + Math.max(left, right);
}

// IS SYMMETRIC (mirror of itself)
boolean isSymmetric(TreeNode root) {
    return root == null || isMirror(root.left, root.right);
}
boolean isMirror(TreeNode left, TreeNode right) {
    if (left == null && right == null) return true;
    if (left == null || right == null) return false;
    return left.val == right.val
        && isMirror(left.left,  right.right)
        && isMirror(left.right, right.left);
}

// MAX PATH SUM (path between any two nodes)
int maxPathSum(TreeNode root) {
    int[] max = {Integer.MIN_VALUE};
    maxGain(root, max);
    return max[0];
}
int maxGain(TreeNode node, int[] max) {
    if (node == null) return 0;
    int left  = Math.max(0, maxGain(node.left,  max));  // ignore negative gain
    int right = Math.max(0, maxGain(node.right, max));
    max[0] = Math.max(max[0], node.val + left + right); // path through node
    return node.val + Math.max(left, right);             // return best single path
}

// LOWEST COMMON ANCESTOR (LCA)
TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left  = lca(root.left,  p, q);
    TreeNode right = lca(root.right, p, q);
    if (left != null && right != null) return root;  // p and q on different sides
    return left != null ? left : right;              // both on same side
}

// BUILD TREE FROM PREORDER + INORDER
TreeNode buildTree(int[] preorder, int[] inorder) {
    Map<Integer, Integer> inMap = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) inMap.put(inorder[i], i);
    return build(preorder, 0, preorder.length - 1,
                 inorder,  0, inorder.length  - 1, inMap);
}
int[] preIdx = {0};
TreeNode build(int[] pre, int preL, int preR,
               int[] in,  int inL,  int inR, Map<Integer,Integer> inMap) {
    if (preL > preR) return null;
    int rootVal = pre[preIdx[0]++];
    TreeNode root = new TreeNode(rootVal);
    int mid = inMap.get(rootVal);
    int leftSize = mid - inL;
    root.left  = build(pre, preL+1, preL+leftSize, in, inL,   mid-1, inMap);
    root.right = build(pre, preL+leftSize+1, preR, in, mid+1, inR,   inMap);
    return root;
}
```

---

# 3. Binary Search Tree (BST)

## 3.1 BST Property

```
BST invariant: for every node n:
  - ALL nodes in LEFT subtree have values < n.val
  - ALL nodes in RIGHT subtree have values > n.val
  - Both subtrees are also valid BSTs

        8
       / \
      3   10
     / \    \
    1   6    14
       / \   /
      4   7 13

In-order traversal of BST = SORTED sequence!
  → 1, 3, 4, 6, 7, 8, 10, 13, 14

Operations (BALANCED BST):
  Search:  O(log n)
  Insert:  O(log n)
  Delete:  O(log n)
  Min/Max: O(log n)
  Successor/Predecessor: O(log n)
  In-order: O(n)

UNBALANCED/SKEWED: all operations degrade to O(n)!
```

## 3.2 BST Operations

```java
class BST {
    private TreeNode root;

    // SEARCH
    TreeNode search(TreeNode node, int val) {
        if (node == null || node.val == val) return node;
        if (val < node.val) return search(node.left,  val);
        else                return search(node.right, val);
    }

    // INSERT
    TreeNode insert(TreeNode node, int val) {
        if (node == null) return new TreeNode(val);
        if      (val < node.val) node.left  = insert(node.left,  val);
        else if (val > node.val) node.right = insert(node.right, val);
        // val == node.val: duplicate, ignore or handle based on requirements
        return node;
    }

    // MIN and MAX
    TreeNode findMin(TreeNode node) {
        while (node.left != null) node = node.left;  // go left as far as possible
        return node;
    }
    TreeNode findMax(TreeNode node) {
        while (node.right != null) node = node.right;
        return node;
    }

    // DELETE — trickiest operation
    TreeNode delete(TreeNode node, int val) {
        if (node == null) return null;

        if (val < node.val) {
            node.left = delete(node.left, val);
        } else if (val > node.val) {
            node.right = delete(node.right, val);
        } else {
            // Node found! Three cases:

            // Case 1: Leaf node — just remove
            if (node.left == null && node.right == null) return null;

            // Case 2: One child — replace with child
            if (node.left  == null) return node.right;
            if (node.right == null) return node.left;

            // Case 3: Two children — replace with in-order successor
            // (or in-order predecessor — both work)
            TreeNode successor = findMin(node.right);    // smallest in right subtree
            node.val = successor.val;                    // copy successor value
            node.right = delete(node.right, successor.val); // delete successor
        }
        return node;
    }

    // VALIDATE BST
    boolean isValidBST(TreeNode root) {
        return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }
    boolean validate(TreeNode node, long min, long max) {
        if (node == null) return true;
        if (node.val <= min || node.val >= max) return false;
        return validate(node.left,  min,      node.val)
            && validate(node.right, node.val, max);
    }

    // KTH SMALLEST IN BST (in-order traversal)
    int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode curr = root;
        while (curr != null || !stack.isEmpty()) {
            while (curr != null) { stack.push(curr); curr = curr.left; }
            curr = stack.pop();
            if (--k == 0) return curr.val;
            curr = curr.right;
        }
        throw new IllegalArgumentException("k out of range");
    }

    // CONVERT SORTED ARRAY TO BALANCED BST
    TreeNode sortedArrayToBST(int[] nums) {
        return buildBST(nums, 0, nums.length - 1);
    }
    TreeNode buildBST(int[] nums, int lo, int hi) {
        if (lo > hi) return null;
        int mid = lo + (hi - lo) / 2;  // avoids integer overflow
        TreeNode node = new TreeNode(nums[mid]);
        node.left  = buildBST(nums, lo,    mid - 1);
        node.right = buildBST(nums, mid + 1, hi);
        return node;
    }

    // SUCCESSOR (next larger value)
    TreeNode successor(TreeNode root, TreeNode target) {
        if (target.right != null) return findMin(target.right);

        TreeNode successor = null;
        TreeNode curr = root;
        while (curr != null) {
            if (target.val < curr.val) {
                successor = curr;   // curr might be successor
                curr = curr.left;
            } else if (target.val > curr.val) {
                curr = curr.right;
            } else break;           // found target
        }
        return successor;
    }
}
```

---

# 4. AVL Tree — Self-Balancing

## 4.1 AVL Property

```
AVL Tree: BST where height difference of left and right subtrees
          is at most 1 for EVERY node.

Balance Factor (BF) = height(left) - height(right)
Valid BF: -1, 0, +1
Invalid: -2 or +2 → ROTATE to fix!

Why AVL?
  Unbalanced BST → O(n) operations in worst case
  AVL maintains O(log n) by keeping tree balanced after every insert/delete

ROTATIONS:
  Four cases depending on where imbalance occurs:

1. LEFT-LEFT case: new node inserted in LEFT subtree of LEFT child
   Solution: RIGHT rotation

         z (-2)                y
        / \                  /   \
       y   T4              x       z
      / \         →       / \     / \
     x   T3              T1  T2  T3  T4
    / \
   T1  T2

2. RIGHT-RIGHT case: new node in RIGHT subtree of RIGHT child
   Solution: LEFT rotation (mirror of above)

3. LEFT-RIGHT case: new node in RIGHT subtree of LEFT child
   Solution: LEFT rotation on child, then RIGHT rotation on node

4. RIGHT-LEFT case: new node in LEFT subtree of RIGHT child
   Solution: RIGHT rotation on child, then LEFT rotation on node

Height:  O(log n) guaranteed
Space:   O(n) (extra height field per node)
Insert:  O(log n) with at most 2 rotations
Delete:  O(log n) with O(log n) rotations
Search:  O(log n)

Used in: Java TreeMap / TreeSet use Red-Black Tree (similar guarantees)
```

```java
class AVLNode {
    int val, height;
    AVLNode left, right;
    AVLNode(int val) { this.val = val; this.height = 1; }
}

class AVLTree {
    private AVLNode root;

    private int height(AVLNode n)  { return n == null ? 0 : n.height; }
    private int balance(AVLNode n) { return n == null ? 0 : height(n.left) - height(n.right); }

    private void updateHeight(AVLNode n) {
        n.height = 1 + Math.max(height(n.left), height(n.right));
    }

    // RIGHT ROTATION (for Left-Left case)
    private AVLNode rotateRight(AVLNode z) {
        AVLNode y  = z.left;
        AVLNode T3 = y.right;

        y.right = z;    // rotation!
        z.left  = T3;

        updateHeight(z);  // z is now lower, update first
        updateHeight(y);
        return y;         // y is new root of this subtree
    }

    // LEFT ROTATION (for Right-Right case)
    private AVLNode rotateLeft(AVLNode z) {
        AVLNode y  = z.right;
        AVLNode T2 = y.left;

        y.left  = z;
        z.right = T2;

        updateHeight(z);
        updateHeight(y);
        return y;
    }

    // BALANCE — apply correct rotation based on balance factor
    private AVLNode balance(AVLNode node) {
        updateHeight(node);
        int bf = balance(node);

        // LEFT HEAVY
        if (bf > 1) {
            if (balance(node.left) < 0)                    // Left-Right case
                node.left = rotateLeft(node.left);         // → make Left-Left
            return rotateRight(node);                       // Left-Left case
        }
        // RIGHT HEAVY
        if (bf < -1) {
            if (balance(node.right) > 0)                   // Right-Left case
                node.right = rotateRight(node.right);      // → make Right-Right
            return rotateLeft(node);                        // Right-Right case
        }
        return node;  // balanced, no rotation needed
    }

    // INSERT
    public AVLNode insert(AVLNode node, int val) {
        if (node == null) return new AVLNode(val);

        if      (val < node.val) node.left  = insert(node.left,  val);
        else if (val > node.val) node.right = insert(node.right, val);
        else return node;  // duplicate

        return balance(node);  // re-balance after insertion
    }

    // DELETE
    public AVLNode delete(AVLNode node, int val) {
        if (node == null) return null;

        if      (val < node.val) node.left  = delete(node.left,  val);
        else if (val > node.val) node.right = delete(node.right, val);
        else {
            if (node.left == null)  return node.right;
            if (node.right == null) return node.left;
            // Two children: replace with min of right subtree
            AVLNode min = findMin(node.right);
            node.val   = min.val;
            node.right = delete(node.right, min.val);
        }
        return balance(node);  // re-balance after deletion
    }

    private AVLNode findMin(AVLNode n) {
        while (n.left != null) n = n.left;
        return n;
    }
}
```

---

# 5. Red-Black Tree

## 5.1 Red-Black Properties

```
Red-Black Tree: BST with extra color property on each node
                Self-balancing — slightly less strict than AVL

5 INVARIANTS (must always hold):
  1. Every node is RED or BLACK
  2. Root is BLACK
  3. Null leaves (NIL nodes) are BLACK
  4. If a node is RED, both children are BLACK
     (no two consecutive red nodes!)
  5. ALL paths from any node to its descendant NIL nodes
     have the SAME number of BLACK nodes (Black-Height)

These ensure:
  Height ≤ 2 × log₂(n+1)  → O(log n) guaranteed!

Operations:
  Search: O(log n)
  Insert: O(log n) — at most 2 rotations + recoloring
  Delete: O(log n) — at most 3 rotations

AVL vs Red-Black:
  AVL:  strictly balanced → faster SEARCH, more rotations on INSERT/DELETE
  R-B:  loosely balanced → faster INSERT/DELETE, slightly slower search
  
  Java uses Red-Black: TreeMap, TreeSet, HashMap (tree buckets)
  Linux scheduler, C++ STL map/set use Red-Black Trees

Why RB preferred:
  More efficient for frequent insertions/deletions
  Most real-world apps do more writes than reads on BST
```

## 5.2 Red-Black Operations (Conceptual)

```java
// Color constants
enum Color { RED, BLACK }

class RBNode {
    int val;
    Color color;
    RBNode left, right, parent;

    RBNode(int val) {
        this.val = val;
        this.color = Color.RED;  // New nodes always inserted as RED
    }
}

class RedBlackTree {
    private RBNode root;
    private final RBNode NIL;  // sentinel null node

    RedBlackTree() {
        NIL = new RBNode(0);
        NIL.color = Color.BLACK;  // NIL is always BLACK
        root = NIL;
    }

    // INSERT FIX-UP — restore RB properties after insertion
    private void insertFixUp(RBNode z) {
        // z is newly inserted RED node
        // Fix: z's parent might also be RED (violation of property 4)

        while (z.parent.color == Color.RED) {
            if (z.parent == z.parent.parent.left) {
                RBNode uncle = z.parent.parent.right;

                if (uncle.color == Color.RED) {
                    // Case 1: Uncle is RED → recolor
                    z.parent.color          = Color.BLACK;
                    uncle.color             = Color.BLACK;
                    z.parent.parent.color   = Color.RED;
                    z = z.parent.parent;   // move up

                } else {
                    if (z == z.parent.right) {
                        // Case 2: Uncle BLACK, z is right child → left rotate parent
                        z = z.parent;
                        rotateLeft(z);
                    }
                    // Case 3: Uncle BLACK, z is left child → right rotate grandparent
                    z.parent.color        = Color.BLACK;
                    z.parent.parent.color = Color.RED;
                    rotateRight(z.parent.parent);
                }
            } else {
                // Mirror cases (parent is right child)
                // ... symmetric ...
            }
        }
        root.color = Color.BLACK;  // root always BLACK
    }

    // ROTATIONS (same as AVL but also updates parent pointers)
    private void rotateLeft(RBNode x) {
        RBNode y = x.right;
        x.right = y.left;
        if (y.left != NIL) y.left.parent = x;
        y.parent = x.parent;
        if (x.parent == NIL) root = y;
        else if (x == x.parent.left) x.parent.left = y;
        else x.parent.right = y;
        y.left = x;
        x.parent = y;
    }
}
```

---

# 6. B-Tree & B+ Tree

## 6.1 B-Tree

```
B-Tree: self-balancing search tree for DISK/STORAGE systems
        Generalization of BST: each node can have MANY keys and children

Why B-Tree for databases?
  RAM access: nanoseconds
  Disk access: milliseconds (1000x slower!)
  B-Tree minimizes disk accesses by:
    - Large branching factor (many keys per node = fewer levels)
    - Each node = one disk page/block
    - More data fetched per I/O operation

B-Tree of ORDER m (max m children per node):
  - Each non-root node: ⌈m/2⌉ to m children
  - Each non-root node: ⌈m/2⌉-1 to m-1 keys
  - All leaves at same level
  - m = 100 to 1000 in practice (disk page fits ~1000 keys)

Example B-Tree of order 3 (2-3 tree):
  Each node: 1-2 keys, 2-3 children

          [30]
         /    \
      [10 20]  [40 50]
     /  |  \   /  |  \
   [5] [15][25][35][45][55]

Height: O(log_m n) — with m=1000, height=3 for 1 billion records!
Search: O(log n) but minimizes disk reads!
```

## 6.2 B+ Tree

```
B+ Tree (used in databases): enhancement of B-Tree

Key differences from B-Tree:
  ALL DATA stored in LEAF nodes only
  Internal nodes store only KEYS for routing
  Leaf nodes linked as a DOUBLY LINKED LIST

         [30]              ← Only keys (routing)
        /    \
    [10 20]  [40 50]       ← Only keys (routing)
    /  |  \   /  |  \
  [5][10][20][30][40][50]  ← Leaves: actual data + linked list
  ↕   ↕   ↕   ↕   ↕   ↕
  data data data...

Advantages over B-Tree:
  ✅ Range queries O(k + log n): find first, then follow linked list!
  ✅ Better sequential access (follow leaf links)
  ✅ More keys per internal node (no data pointers) → shallower tree
  ✅ All queries go to leaves → consistent O(log n)

Used by:
  MySQL InnoDB, PostgreSQL (B+ tree for all indexes)
  Almost every relational database!
  
Primary Key Index (clustered):
  Leaf nodes contain actual row data
  Only one per table

Secondary Index (non-clustered):
  Leaf nodes contain primary key, not actual data
  Lookup: find in secondary index → get PK → look up in primary index
```

---

# 7. Heap Tree

## 7.1 Binary Heap Deep Dive

```
Complete Binary Tree stored as ARRAY (index math eliminates need for pointers):
  parent(i)    = (i - 1) / 2
  leftChild(i) = 2 * i + 1
  rightChild(i)= 2 * i + 2

MIN-HEAP:           MAX-HEAP:
      1                   9
    /   \               /   \
   3     5             7     8
  / \   / \           / \   /
 7   4 6   8         1   4 5

Array: [1,3,5,7,4,6,8]   [9,7,8,1,4,5]

SIFT UP (used in insert):
  Add new element at end
  Compare with parent; if smaller (min-heap), swap
  Repeat until parent ≤ child or reach root

SIFT DOWN (used in extract/heapify):
  Remove root (min), replace with last element
  Compare with children; swap with smallest child if needed
  Repeat until children ≥ node or reach leaf

BUILD HEAP from array — O(n):
  Start from last non-leaf: n/2 - 1
  Sift down each node
  Why O(n) and not O(n log n)?
    Most nodes are near leaves (height 0)
    Only O(1) nodes at max height
    Sum: Σ(n/2^h × O(h)) = O(n)
```

```java
class BinaryHeap {
    private int[] data;
    private int size;

    BinaryHeap(int capacity) { data = new int[capacity]; }

    // BUILD HEAP from existing array O(n)
    BinaryHeap(int[] arr) {
        data = arr.clone();
        size = arr.length;
        for (int i = size / 2 - 1; i >= 0; i--)  // last non-leaf down to root
            siftDown(i);
    }

    public void insert(int val) {
        if (size == data.length) resize();
        data[size] = val;
        siftUp(size);
        size++;
    }

    public int peekMin() {
        if (size == 0) throw new NoSuchElementException();
        return data[0];
    }

    public int extractMin() {
        if (size == 0) throw new NoSuchElementException();
        int min = data[0];
        data[0] = data[--size];
        siftDown(0);
        return min;
    }

    // Change priority at index i
    public void decreaseKey(int i, int newVal) {
        data[i] = newVal;
        siftUp(i);
    }

    // Delete arbitrary element at index i
    public void delete(int i) {
        decreaseKey(i, Integer.MIN_VALUE);  // move to top
        extractMin();                        // remove from top
    }

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
            int left  = 2 * i + 1;
            int right = 2 * i + 2;
            if (left  < size && data[left]  < data[smallest]) smallest = left;
            if (right < size && data[right] < data[smallest]) smallest = right;
            if (smallest == i) break;
            swap(i, smallest);
            i = smallest;
        }
    }

    private void swap(int i, int j) {
        int t = data[i]; data[i] = data[j]; data[j] = t;
    }

    private void resize() {
        data = Arrays.copyOf(data, data.length * 2);
    }
}
```

## 7.2 Advanced Heap Applications

```java
// HEAP SORT — O(n log n), O(1) space, not stable
void heapSort(int[] arr) {
    int n = arr.length;

    // Build max-heap in-place
    for (int i = n/2 - 1; i >= 0; i--)
        maxSiftDown(arr, n, i);

    // Extract elements: swap max to end, shrink heap
    for (int i = n - 1; i > 0; i--) {
        swap(arr, 0, i);         // current max → sorted position
        maxSiftDown(arr, i, 0);  // restore heap on remaining n-1 elements
    }
}

void maxSiftDown(int[] arr, int n, int i) {
    int largest = i;
    int left = 2*i+1, right = 2*i+2;
    if (left  < n && arr[left]  > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;
    if (largest != i) {
        swap(arr, i, largest);
        maxSiftDown(arr, n, largest);
    }
}

// DIJKSTRA with Priority Queue
int[] dijkstra(int[][] graph, int src) {
    int n = graph.length;
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // {distance, node}
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
    pq.offer(new int[]{0, src});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];

        if (d > dist[u]) continue;  // outdated entry

        for (int v = 0; v < n; v++) {
            if (graph[u][v] != 0 && dist[u] + graph[u][v] < dist[v]) {
                dist[v] = dist[u] + graph[u][v];
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

---

# 8. Segment Tree

## 8.1 Overview

```
Segment Tree: answers RANGE QUERIES and handles POINT/RANGE UPDATES efficiently

Classic problems:
  Range Sum Query:    sum of arr[l..r]
  Range Min Query:    min of arr[l..r]
  Range Max Query:    max of arr[l..r]
  Range GCD Query
  + with updates!

Brute force: O(n) per query — too slow for many queries
Prefix sum:  O(1) query, O(n) update — bad if frequent updates
Segment tree: O(log n) both query AND update!

Structure: binary tree where each node stores info about a SEGMENT (range)
  Root: entire array [0, n-1]
  Left child: left half [0, mid]
  Right child: right half [mid+1, n-1]
  Leaves: single elements

For array of size n:
  Build: O(n)
  Query: O(log n)
  Update: O(log n)
  Space: O(4n) — safe to allocate 4× array size

Example for arr = [1, 3, 5, 7, 9, 11]:
                    [0..5]=36
                   /          \
           [0..2]=9          [3..5]=27
           /      \           /      \
       [0..1]=4  [2]=5   [3..4]=16  [5]=11
       /    \             /    \
    [0]=1  [1]=3       [3]=7  [4]=9
```

## 8.2 Segment Tree Implementation

```java
class SegmentTree {
    private int[] tree;   // tree array
    private int[] arr;    // original array
    private int n;

    SegmentTree(int[] arr) {
        this.arr = arr;
        this.n   = arr.length;
        this.tree = new int[4 * n];  // safe size
        build(0, 0, n - 1);
    }

    // BUILD — O(n)
    private void build(int node, int lo, int hi) {
        if (lo == hi) {
            tree[node] = arr[lo];  // leaf: single element
            return;
        }
        int mid = lo + (hi - lo) / 2;
        build(2*node+1, lo,    mid);  // left child
        build(2*node+2, mid+1, hi);   // right child
        tree[node] = tree[2*node+1] + tree[2*node+2];  // merge (sum here)
    }

    // RANGE QUERY — O(log n)
    public int query(int l, int r) {
        return query(0, 0, n-1, l, r);
    }

    private int query(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return 0;          // segment outside query range
        if (l <= lo && hi <= r) return tree[node]; // segment fully inside range
        int mid = lo + (hi - lo) / 2;
        int left  = query(2*node+1, lo,    mid, l, r);
        int right = query(2*node+2, mid+1, hi,  l, r);
        return left + right;                      // merge (sum here)
    }

    // POINT UPDATE — O(log n)
    public void update(int idx, int val) {
        update(0, 0, n-1, idx, val);
    }

    private void update(int node, int lo, int hi, int idx, int val) {
        if (lo == hi) {
            arr[idx]  = val;
            tree[node] = val;
            return;
        }
        int mid = lo + (hi - lo) / 2;
        if (idx <= mid) update(2*node+1, lo,    mid, idx, val);
        else            update(2*node+2, mid+1, hi,  idx, val);
        tree[node] = tree[2*node+1] + tree[2*node+2];  // re-merge
    }

    // RANGE UPDATE with LAZY PROPAGATION — O(log n) range updates
    private int[] lazy;  // pending updates

    SegmentTree(int[] arr, boolean withLazy) {
        this.arr  = arr;
        this.n    = arr.length;
        this.tree = new int[4 * n];
        this.lazy = new int[4 * n];
        build(0, 0, n - 1);
    }

    // Propagate lazy updates to children
    private void pushDown(int node, int lo, int hi) {
        if (lazy[node] != 0) {
            int mid = lo + (hi - lo) / 2;
            // Update left child
            tree[2*node+1] += lazy[node] * (mid - lo + 1);
            lazy[2*node+1] += lazy[node];
            // Update right child
            tree[2*node+2] += lazy[node] * (hi - mid);
            lazy[2*node+2] += lazy[node];
            lazy[node] = 0;  // clear this node's lazy
        }
    }

    // RANGE UPDATE — add val to all arr[l..r], O(log n)
    public void rangeUpdate(int l, int r, int val) {
        rangeUpdate(0, 0, n-1, l, r, val);
    }
    private void rangeUpdate(int node, int lo, int hi, int l, int r, int val) {
        if (r < lo || hi < l) return;
        if (l <= lo && hi <= r) {
            tree[node] += val * (hi - lo + 1);  // update this node's sum
            lazy[node] += val;                   // mark children lazy
            return;
        }
        pushDown(node, lo, hi);  // propagate before going deeper
        int mid = lo + (hi - lo) / 2;
        rangeUpdate(2*node+1, lo,    mid, l, r, val);
        rangeUpdate(2*node+2, mid+1, hi,  l, r, val);
        tree[node] = tree[2*node+1] + tree[2*node+2];
    }
}
```

---

# 9. Fenwick Tree (Binary Indexed Tree)

## 9.1 Overview

```
Fenwick Tree (BIT): simpler, more memory-efficient alternative for:
  - Prefix sum queries: O(log n)
  - Point updates:      O(log n)
  - Space:              O(n) (vs O(4n) for segment tree)

NOT as general as segment tree (harder to do range updates)
But: shorter code, better constants, sufficient for prefix queries

Key insight: each index i in BIT stores sum for a specific range
  determined by the lowest set bit of i

i = 6 = 110₂, lowest set bit = 2
→ BIT[6] stores sum of arr[5] + arr[6] (2 elements)

i = 4 = 100₂, lowest set bit = 4
→ BIT[4] stores sum of arr[1] + arr[2] + arr[3] + arr[4] (4 elements)

LOWBIT: i & (-i) = isolates lowest set bit
  6 = 110₂, -6 = ...11111010₂, 6 & (-6) = 000...010₂ = 2

Query prefix[1..i]: traverse parents by SUBTRACTING lowbit
Update index i: traverse ancestors by ADDING lowbit
```

```java
class FenwickTree {
    private int[] tree;
    private int n;

    FenwickTree(int n) {
        this.n = n;
        this.tree = new int[n + 1];  // 1-indexed!
    }

    FenwickTree(int[] arr) {
        this.n = arr.length;
        this.tree = new int[n + 1];
        for (int i = 0; i < n; i++) update(i + 1, arr[i]);
    }

    // UPDATE index i (1-indexed), add val
    public void update(int i, int val) {
        for (; i <= n; i += i & (-i))   // add lowbit to move to parent
            tree[i] += val;
    }

    // PREFIX SUM [1..i] (1-indexed)
    public int query(int i) {
        int sum = 0;
        for (; i > 0; i -= i & (-i))    // subtract lowbit to move to ancestor
            sum += tree[i];
        return sum;
    }

    // RANGE SUM [l..r] (1-indexed)
    public int rangeQuery(int l, int r) {
        return query(r) - query(l - 1);
    }

    // POINT UPDATE and RANGE QUERY pattern:
    // update(i, delta) + query(l, r) = classic use case
}

// 2D Fenwick Tree (for matrix queries)
class FenwickTree2D {
    private int[][] tree;
    private int rows, cols;

    FenwickTree2D(int rows, int cols) {
        this.rows = rows;
        this.cols = cols;
        tree = new int[rows + 1][cols + 1];
    }

    void update(int r, int c, int val) {
        for (int i = r; i <= rows; i += i & (-i))
            for (int j = c; j <= cols; j += j & (-j))
                tree[i][j] += val;
    }

    int query(int r, int c) {
        int sum = 0;
        for (int i = r; i > 0; i -= i & (-i))
            for (int j = c; j > 0; j -= j & (-j))
                sum += tree[i][j];
        return sum;
    }

    // Sum of rectangle [r1,c1] to [r2,c2] using inclusion-exclusion:
    int rangeQuery(int r1, int c1, int r2, int c2) {
        return query(r2, c2)
             - query(r1-1, c2)
             - query(r2, c1-1)
             + query(r1-1, c1-1);
    }
}
```

---

# 10. Trie (Prefix Tree)

## 10.1 Trie Deep Dive

```
Trie: each path from root represents a string prefix
  Characters on edges (or nodes, depending on implementation)
  isEnd flag marks end of a complete word

Time: O(m) for all ops (m = string length)
Space: O(ALPHABET × n × m) worst case
  Better with HashMap children (sparse alphabet)

Advantages:
  Faster than HashMap for prefix queries
  No hash collision
  Alphabetical ordering natural

Applications:
  Autocomplete / Typeahead
  Spell checker
  IP routing (longest prefix match)
  Phone books, dictionaries
  Word search puzzles
  DNA sequence analysis
```

```java
class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEnd = false;
    int count = 0;      // count of words passing through this node
    String word = null; // optional: store word at end node
}

class Trie {
    private final TrieNode root = new TrieNode();

    // INSERT O(m)
    public void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            curr.count++;  // count of words with this prefix
            curr = curr.children.computeIfAbsent(c, k -> new TrieNode());
        }
        curr.isEnd = true;
        curr.word = word;
        curr.count++;
    }

    // SEARCH exact word O(m)
    public boolean search(String word) {
        TrieNode node = traverse(word);
        return node != null && node.isEnd;
    }

    // PREFIX CHECK O(m)
    public boolean startsWith(String prefix) {
        return traverse(prefix) != null;
    }

    // COUNT WORDS WITH PREFIX O(m)
    public int countWithPrefix(String prefix) {
        TrieNode node = traverse(prefix);
        return node == null ? 0 : node.count;
    }

    private TrieNode traverse(String prefix) {
        TrieNode curr = root;
        for (char c : prefix.toCharArray()) {
            curr = curr.children.get(c);
            if (curr == null) return null;
        }
        return curr;
    }

    // AUTOCOMPLETE — find all words with given prefix
    public List<String> autocomplete(String prefix, int limit) {
        List<String> results = new ArrayList<>();
        TrieNode startNode = traverse(prefix);
        if (startNode != null)
            dfsCollect(startNode, new StringBuilder(prefix), results, limit);
        return results;
    }

    private void dfsCollect(TrieNode node, StringBuilder current,
                             List<String> results, int limit) {
        if (results.size() >= limit) return;
        if (node.isEnd) results.add(current.toString());
        for (Map.Entry<Character, TrieNode> e : node.children.entrySet()) {
            current.append(e.getKey());
            dfsCollect(e.getValue(), current, results, limit);
            current.deleteCharAt(current.length() - 1);  // backtrack
        }
    }

    // DELETE O(m)
    public void delete(String word) {
        delete(root, word, 0);
    }
    private boolean delete(TrieNode node, String word, int idx) {
        if (idx == word.length()) {
            if (!node.isEnd) return false;
            node.isEnd = false;
            node.count--;
            return node.children.isEmpty();  // safe to delete if no children
        }
        char c = word.charAt(idx);
        TrieNode child = node.children.get(c);
        if (child == null) return false;
        node.count--;
        boolean shouldDelete = delete(child, word, idx + 1);
        if (shouldDelete) node.children.remove(c);
        return !node.isEnd && node.children.isEmpty();
    }

    // WORD SEARCH in 2D grid (DFS + Trie)
    public List<String> findWords(char[][] board, String[] words) {
        Trie trie = new Trie();
        for (String w : words) trie.insert(w);

        Set<String> result = new HashSet<>();
        int m = board.length, n = board[0].length;

        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                dfsBoard(board, i, j, trie.root, result);

        return new ArrayList<>(result);
    }

    private void dfsBoard(char[][] board, int i, int j, TrieNode node, Set<String> result) {
        if (i < 0 || i >= board.length || j < 0 || j >= board[0].length) return;
        char c = board[i][j];
        if (c == '#' || !node.children.containsKey(c)) return;

        TrieNode next = node.children.get(c);
        if (next.word != null) result.add(next.word);

        board[i][j] = '#';  // mark visited
        int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
        for (int[] d : dirs)
            dfsBoard(board, i+d[0], j+d[1], next, result);
        board[i][j] = c;    // restore
    }
}
```

---

# 11. Tree Traversals — All Patterns

## 11.1 DFS Traversals

```java
// IN-ORDER: left → root → right
// BST → sorted order!
void inOrder(TreeNode root) {
    if (root == null) return;
    inOrder(root.left);
    visit(root.val);    // process BETWEEN children
    inOrder(root.right);
}

// PRE-ORDER: root → left → right
// Creates copy of tree, prefix notation, DFS
void preOrder(TreeNode root) {
    if (root == null) return;
    visit(root.val);    // process BEFORE children
    preOrder(root.left);
    preOrder(root.right);
}

// POST-ORDER: left → right → root
// Deletes tree, postfix notation, calculate directory sizes
void postOrder(TreeNode root) {
    if (root == null) return;
    postOrder(root.left);
    postOrder(root.right);
    visit(root.val);    // process AFTER children
}

// ITERATIVE IN-ORDER — interview favorite!
List<Integer> inOrderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {      // go left as far as possible
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();         // process
        result.add(curr.val);
        curr = curr.right;          // go right
    }
    return result;
}

// ITERATIVE PRE-ORDER
List<Integer> preOrderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);        // process BEFORE pushing children
        if (node.right != null) stack.push(node.right);  // right first!
        if (node.left  != null) stack.push(node.left);   // left processed first
    }
    return result;
}

// ITERATIVE POST-ORDER — two stacks approach
List<Integer> postOrderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;
    Deque<TreeNode> s1 = new ArrayDeque<>(), s2 = new ArrayDeque<>();
    s1.push(root);

    while (!s1.isEmpty()) {
        TreeNode node = s1.pop();
        s2.push(node);                       // collect in reverse order
        if (node.left  != null) s1.push(node.left);
        if (node.right != null) s1.push(node.right);
    }
    while (!s2.isEmpty()) result.add(s2.pop().val);
    return result;
}
```

## 11.2 BFS — Level-Order

```java
// LEVEL-ORDER (BFS) — process level by level
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();         // number of nodes at this level
        List<Integer> level = new ArrayList<>();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left  != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}

// ZIGZAG LEVEL ORDER (alternate left-right, right-left)
List<List<Integer>> zigzagLevelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    boolean leftToRight = true;

    while (!queue.isEmpty()) {
        int size = queue.size();
        LinkedList<Integer> level = new LinkedList<>();

        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            if (leftToRight) level.addLast(node.val);
            else             level.addFirst(node.val);  // reverse!
            if (node.left  != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
        leftToRight = !leftToRight;
    }
    return result;
}

// RIGHT SIDE VIEW — rightmost node at each level
List<Integer> rightSideView(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            if (i == size - 1) result.add(node.val);  // last node at this level
            if (node.left  != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }
    return result;
}
```

## 11.3 Morris Traversal (O(1) Space!)

```java
// Morris In-Order: traverse tree without stack or recursion
// Temporarily modifies tree structure (restores after)
// O(n) time, O(1) space

List<Integer> morrisInOrder(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    TreeNode curr = root;

    while (curr != null) {
        if (curr.left == null) {
            result.add(curr.val);  // no left subtree, visit and go right
            curr = curr.right;
        } else {
            // Find in-order predecessor (rightmost node in left subtree)
            TreeNode prev = curr.left;
            while (prev.right != null && prev.right != curr)
                prev = prev.right;

            if (prev.right == null) {
                // First visit: create thread back to curr
                prev.right = curr;  // temporary link!
                curr = curr.left;
            } else {
                // Second visit: thread exists, remove it
                prev.right = null;  // restore
                result.add(curr.val);
                curr = curr.right;
            }
        }
    }
    return result;
}
```

---

# 12. Common Tree Problems

## 12.1 Path Problems

```java
// ALL ROOT-TO-LEAF PATHS
List<String> binaryTreePaths(TreeNode root) {
    List<String> result = new ArrayList<>();
    if (root != null) dfs(root, "", result);
    return result;
}
void dfs(TreeNode node, String path, List<String> result) {
    if (node.left == null && node.right == null) {
        result.add(path + node.val);
        return;
    }
    if (node.left  != null) dfs(node.left,  path + node.val + "->", result);
    if (node.right != null) dfs(node.right, path + node.val + "->", result);
}

// PATH SUM — does root-to-leaf path sum to target?
boolean hasPathSum(TreeNode root, int target) {
    if (root == null) return false;
    if (root.left == null && root.right == null) return root.val == target;
    return hasPathSum(root.left,  target - root.val)
        || hasPathSum(root.right, target - root.val);
}

// ALL PATH SUMS equaling target
List<List<Integer>> pathSum(TreeNode root, int target) {
    List<List<Integer>> result = new ArrayList<>();
    dfsPath(root, target, new ArrayList<>(), result);
    return result;
}
void dfsPath(TreeNode node, int remain, List<Integer> path, List<List<Integer>> result) {
    if (node == null) return;
    path.add(node.val);
    if (node.left == null && node.right == null && remain == node.val)
        result.add(new ArrayList<>(path));
    dfsPath(node.left,  remain - node.val, path, result);
    dfsPath(node.right, remain - node.val, path, result);
    path.remove(path.size() - 1);  // backtrack!
}

// COUNT PATHS (any start, any end, not necessarily root-to-leaf)
int pathSumCount(TreeNode root, int target) {
    Map<Long, Integer> prefixSums = new HashMap<>();
    prefixSums.put(0L, 1);
    return dfsCount(root, 0, target, prefixSums);
}
int dfsCount(TreeNode node, long currSum, int target, Map<Long, Integer> map) {
    if (node == null) return 0;
    currSum += node.val;
    int count = map.getOrDefault(currSum - target, 0);
    map.merge(currSum, 1, Integer::sum);
    count += dfsCount(node.left,  currSum, target, map);
    count += dfsCount(node.right, currSum, target, map);
    map.merge(currSum, -1, Integer::sum);  // backtrack
    return count;
}
```

## 12.2 Serialization

```java
// SERIALIZE / DESERIALIZE BINARY TREE
class Codec {
    // Pre-order with null markers
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        serializeDFS(root, sb);
        return sb.toString();
    }

    private void serializeDFS(TreeNode node, StringBuilder sb) {
        if (node == null) { sb.append("null,"); return; }
        sb.append(node.val).append(',');
        serializeDFS(node.left,  sb);
        serializeDFS(node.right, sb);
    }

    public TreeNode deserialize(String data) {
        Queue<String> queue = new ArrayDeque<>(Arrays.asList(data.split(",")));
        return deserializeDFS(queue);
    }

    private TreeNode deserializeDFS(Queue<String> queue) {
        String val = queue.poll();
        if ("null".equals(val)) return null;
        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left  = deserializeDFS(queue);
        node.right = deserializeDFS(queue);
        return node;
    }
}
```

## 12.3 BST Problems

```java
// INORDER SUCCESSOR IN BST
TreeNode inorderSuccessor(TreeNode root, TreeNode p) {
    TreeNode successor = null;
    TreeNode curr = root;
    while (curr != null) {
        if (p.val < curr.val) {
            successor = curr;    // curr could be successor
            curr = curr.left;    // look for smaller candidates
        } else {
            curr = curr.right;   // p.val >= curr.val, go right
        }
    }
    return successor;
}

// RECOVER BST — two nodes accidentally swapped
TreeNode first, second, prev;
void recoverTree(TreeNode root) {
    first = second = prev = null;
    inOrderFind(root);
    // Swap back
    int tmp = first.val; first.val = second.val; second.val = tmp;
}
void inOrderFind(TreeNode node) {
    if (node == null) return;
    inOrderFind(node.left);
    if (prev != null && prev.val > node.val) {
        if (first == null) first = prev;  // first wrong node
        second = node;                     // second wrong node (update each time)
    }
    prev = node;
    inOrderFind(node.right);
}

// CONVERT BST TO SORTED DOUBLY LINKED LIST
TreeNode head, curr;
TreeNode treeToDoublyList(TreeNode root) {
    if (root == null) return null;
    inOrderConvert(root);
    head.left = curr;  // connect head and tail
    curr.right = head;
    return head;
}
void inOrderConvert(TreeNode node) {
    if (node == null) return;
    inOrderConvert(node.left);
    if (curr == null) {
        head = node;  // first node
    } else {
        curr.right = node;
        node.left  = curr;
    }
    curr = node;
    inOrderConvert(node.right);
}
```

## 12.4 Complexity Reference

```
Tree Type            Search      Insert     Delete    Space
─────────────────────────────────────────────────────────────────────
Binary Tree (worst)  O(n)        O(n)       O(n)      O(n)
BST (balanced)       O(log n)    O(log n)   O(log n)  O(n)
BST (unbalanced)     O(n)        O(n)       O(n)      O(n)
AVL Tree             O(log n)    O(log n)   O(log n)  O(n)
Red-Black Tree       O(log n)    O(log n)   O(log n)  O(n)
B-Tree (order m)     O(log_m n)  O(log n)   O(log n)  O(n)
Heap (min/max)       O(n)        O(log n)   O(log n)  O(n)
Heap (peek)          O(1)        -          -          -
Trie                 O(m)        O(m)       O(m)       O(nm)
Segment Tree         O(log n)    O(log n)   -          O(4n)
Fenwick Tree         O(log n)    O(log n)   -          O(n)

m = string length (Trie), m = order (B-Tree)
```

---

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| TreeMap (Red-Black) | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/TreeMap.html> |
| PriorityQueue (Heap) | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/PriorityQueue.html> |
| Visualgo Trees | <https://visualgo.net/en/bst> |
| CP Algorithms | <https://cp-algorithms.com/data_structures/segment_tree.html> |
| Fenwick Tree Tutorial | <https://cp-algorithms.com/data_structures/fenwick.html> |
| B-Tree Visualization | <https://www.cs.usfca.edu/~galles/visualization/BTree.html> |
| Red-Black Tree | <https://www.cs.usfca.edu/~galles/visualization/RedBlack.html> |
| AVL Tree | <https://www.cs.usfca.edu/~galles/visualization/AVLtree.html> |
