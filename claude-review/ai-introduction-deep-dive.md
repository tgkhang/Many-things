# 🤖 Introduction to AI — Complete Deep Dive
> Search, Heuristics, Machine Learning, Deep Learning, Reinforcement Learning, Decision Trees

---

## 📚 Table of Contents

1. [AI Fundamentals](#1-ai-fundamentals)
2. [Search Algorithms](#2-search-algorithms)
3. [Informed Search — Heuristics & A*](#3-informed-search--heuristics--a)
4. [Adversarial Search — Minimax & Alpha-Beta](#4-adversarial-search--minimax--alpha-beta)
5. [Machine Learning Fundamentals](#5-machine-learning-fundamentals)
6. [Decision Trees](#6-decision-trees)
7. [Classical ML Algorithms](#7-classical-ml-algorithms)
8. [Deep Learning](#8-deep-learning)
9. [Convolutional Neural Networks (CNN)](#9-convolutional-neural-networks-cnn)
10. [Recurrent Neural Networks (RNN, LSTM)](#10-recurrent-neural-networks-rnn-lstm)
11. [Transformers & Attention](#11-transformers--attention)
12. [Reinforcement Learning](#12-reinforcement-learning)
13. [Evaluation Metrics](#13-evaluation-metrics)
14. [AI Ethics & Practical Concepts](#14-ai-ethics--practical-concepts)

---

# 1. AI Fundamentals

## 1.1 What is AI?

```
Artificial Intelligence = systems that perceive their environment
                          and take actions to maximize chance of achieving goals

LEVELS of AI:
  Narrow AI (ANI):    solves specific tasks (chess, image recognition, translation)
                      ALL current AI systems are Narrow AI
  
  General AI (AGI):   human-level intelligence across any domain
                      Does NOT exist yet (active research area)
  
  Super AI (ASI):     exceeds human intelligence in all areas
                      Hypothetical, science fiction

HISTORY milestones:
  1950  Alan Turing proposes "Turing Test"
  1956  Dartmouth conference — "Artificial Intelligence" coined
  1959  Arthur Samuel coins "Machine Learning"
  1986  Backpropagation rediscovered (Rumelhart, Hinton, Williams)
  1997  Deep Blue beats Kasparov (chess)
  2006  Hinton: Deep Belief Networks — deep learning era begins
  2011  IBM Watson wins Jeopardy!
  2012  AlexNet wins ImageNet — deep learning dominates vision
  2014  GANs proposed (Goodfellow)
  2016  AlphaGo beats Lee Sedol (Go)
  2017  Transformer architecture proposed ("Attention is All You Need")
  2020  GPT-3 (175B parameters) — LLM era
  2022  ChatGPT — AI goes mainstream
  2024  GPT-4, Gemini, Claude — multimodal frontier models
```

## 1.2 Types of AI by Approach

```
KNOWLEDGE-BASED (Symbolic AI / GOFAI):
  Hand-coded rules and logic
  Expert systems: IF patient has fever AND cough → DIAGNOSE flu
  ✅ Explainable, precise in narrow domains
  ❌ Brittle, can't handle uncertainty, doesn't learn

SEARCH-BASED:
  Define states, actions, goals → search for solution path
  Chess, puzzle solving, route planning
  ✅ Optimal solutions possible
  ❌ Exponential search spaces

MACHINE LEARNING:
  Learn patterns from data rather than explicit programming
  ✅ Handles complexity, uncertainty
  ❌ Black box, needs lots of data

PROBABILISTIC:
  Bayesian reasoning, handle uncertainty mathematically
  Spam filters, medical diagnosis

EVOLUTIONARY:
  Genetic algorithms, simulate natural selection
  Optimization problems

CONNECTIONIST (Neural Networks / Deep Learning):
  Inspired by biological neurons
  ✅ State of the art in vision, language, games
  ❌ Needs massive data, computationally expensive, less interpretable

HYBRID:
  AlphaGo = Monte Carlo Tree Search + Deep Learning
  Modern systems combine multiple approaches
```

## 1.3 Intelligent Agent Model

```
        ┌───────────────────────────────────┐
        │          AGENT                    │
        │                                   │
Percepts│  ┌──────────┐    ┌────────────┐  │Actions
───────▶│  │ Sensors  │───▶│  Decision  │──│───────▶
        │  └──────────┘    │  Making    │  │
        │                  │  (Policy)  │  │
        │                  └─────┬──────┘  │
        │                        │         │
        │                  ┌─────▼──────┐  │
        │                  │ Knowledge  │  │
        │                  │   Base     │  │
        │                  └────────────┘  │
        └───────────────────────────────────┘
                 ↕  (acts on)
        ┌───────────────────────────────────┐
        │         ENVIRONMENT               │
        └───────────────────────────────────┘

PEAS framework for defining an agent:
  P — Performance measure: how do we judge success?
  E — Environment: what world does it operate in?
  A — Actuators: how does it act on the world?
  S — Sensors: how does it perceive the world?

Example: Self-driving car
  P: Safe driving, arrive fast, obey laws, passenger comfort
  E: Roads, traffic, weather, pedestrians
  A: Steering, accelerate, brake, horn
  S: Cameras, LiDAR, GPS, speedometer

Environment properties:
  Observable vs Partially observable (can agent see everything?)
  Deterministic vs Stochastic (same action → same result?)
  Episodic vs Sequential (past actions affect future?)
  Static vs Dynamic (environment changes while thinking?)
  Discrete vs Continuous (finite vs infinite states/actions?)
  Single-agent vs Multi-agent (alone or with other agents?)
```

---

# 2. Search Algorithms

## 2.1 Problem Formulation

```
Search problem defined by:
  STATE SPACE: all possible states
  INITIAL STATE: starting state
  GOAL STATE(S): target state(s)
  ACTIONS: transitions between states
  TRANSITION MODEL: result(state, action) → new_state
  PATH COST: cost of a sequence of actions

Romania map example:
  States: cities
  Initial: Arad
  Goal: Bucharest
  Actions: drive to adjacent city
  Cost: distance in km

8-Puzzle:
  States: 9! / 2 = 181,440 reachable states
  Initial: any scrambled board
  Goal: [1,2,3,4,5,6,7,8,_]
  Actions: slide tile into blank
  Cost: number of moves

NODE in search tree:
  state, parent, action, path_cost, depth
  (different from states! multiple nodes can represent same state)

SEARCH STRATEGIES differ in:
  Completeness: guaranteed to find solution if exists?
  Optimality: guaranteed to find BEST solution?
  Time complexity: how many nodes expanded?
  Space complexity: how much memory needed?
```

## 2.2 Uninformed (Blind) Search

```java
// ── BFS (Breadth-First Search) ──
// Explores all nodes at depth d before depth d+1
// Uses QUEUE (FIFO)

void bfs(State initial, Predicate<State> isGoal) {
    Queue<State> frontier = new ArrayDeque<>();
    Set<State> explored = new HashSet<>();
    Map<State, State> parent = new HashMap<>();

    frontier.offer(initial);
    explored.add(initial);

    while (!frontier.isEmpty()) {
        State current = frontier.poll();

        if (isGoal.test(current)) {
            reconstructPath(current, parent);
            return;
        }

        for (State neighbor : current.getNeighbors()) {
            if (!explored.contains(neighbor)) {
                explored.add(neighbor);
                parent.put(neighbor, current);
                frontier.offer(neighbor);
            }
        }
    }
}

// BFS Properties:
//   Complete:   YES (if branching factor b is finite)
//   Optimal:    YES (for unit step costs — finds shallowest goal)
//   Time:       O(b^d) — b=branching factor, d=depth of solution
//   Space:      O(b^d) — must store all frontier nodes
//   Problem:    Memory! b=10, d=10 → 10^10 nodes


// ── DFS (Depth-First Search) ──
// Explores deepest path first
// Uses STACK (LIFO) — or recursion (implicit stack)

void dfs(State current, Set<State> explored) {
    explored.add(current);
    if (isGoal(current)) { foundSolution(); return; }

    for (State neighbor : current.getNeighbors()) {
        if (!explored.contains(neighbor)) {
            dfs(neighbor, explored);
        }
    }
}

// DFS Properties:
//   Complete:   NO (may get stuck in infinite loop without cycle checking)
//               YES with cycle checking + finite state space
//   Optimal:    NO (finds any solution, not shallowest)
//   Time:       O(b^m) — m=max depth (may be >> d)
//   Space:      O(b*m) — only current path + siblings stored — MUCH less than BFS!
//   Use when:   Space is limited, solution is deep, any solution OK

// ── UNIFORM COST SEARCH (UCS) ──
// Dijkstra applied to search — expands lowest cost first
// Uses PRIORITY QUEUE ordered by path cost

void ucs(State initial) {
    PriorityQueue<Node> frontier = new PriorityQueue<>(
        Comparator.comparingDouble(n -> n.pathCost));
    Set<State> explored = new HashSet<>();

    frontier.offer(new Node(initial, 0));

    while (!frontier.isEmpty()) {
        Node node = frontier.poll();

        if (isGoal(node.state)) { return; }
        if (explored.contains(node.state)) continue;
        explored.add(node.state);

        for (Action action : node.state.getActions()) {
            State next = result(node.state, action);
            double cost = node.pathCost + stepCost(node.state, action);
            frontier.offer(new Node(next, cost));
        }
    }
}

// UCS Properties:
//   Complete: YES (if costs > 0)
//   Optimal:  YES — always finds minimum cost path
//   Time/Space: O(b^(C*/ε)) — C*=optimal cost, ε=min step cost

// ── ITERATIVE DEEPENING DFS (IDDFS) ──
// Run DFS with increasing depth limits
// Best of BFS (completeness, optimality) + DFS (space)!

void iddfs(State initial) {
    for (int depth = 0; ; depth++) {
        Set<State> result = depthLimitedSearch(initial, depth);
        if (result != null) return;  // found!
    }
}

Set<State> depthLimitedSearch(State state, int limit) {
    if (isGoal(state)) return Set.of(state);
    if (limit == 0) return null;  // cutoff

    for (State next : state.getNeighbors()) {
        Set<State> result = depthLimitedSearch(next, limit - 1);
        if (result != null) return result;
    }
    return null;
}

// IDDFS Properties:
//   Complete:  YES
//   Optimal:   YES (unit step costs)
//   Time:      O(b^d) — same as BFS
//   Space:     O(b*d) — same as DFS!
//   Overhead:  Nodes at depth d generated once, d-1 twice... → only ~11% more than BFS
//   PREFERRED: for large state spaces when solution depth unknown
```

## 2.3 Search Comparison

```
Strategy      Complete  Optimal  Time      Space
──────────────────────────────────────────────────────────────
BFS           YES*      YES**    O(b^d)    O(b^d)   ← memory hog
DFS           NO***     NO       O(b^m)    O(b*m)   ← gets lost
UCS           YES*      YES      O(b^C*/ε) O(b^C*/ε)
DLS           NO        NO       O(b^l)    O(b*l)   l=depth limit
IDDFS         YES*      YES**    O(b^d)    O(b*d)   ← BEST uninformed

* = if b is finite
** = if step costs are equal
*** = YES with cycle checking + finite state space
b = branching factor, d = solution depth, m = max depth
```

---

# 3. Informed Search — Heuristics & A*

## 3.1 Heuristic Functions

```
HEURISTIC h(n): estimated cost from node n to goal
  h(n) = 0 if n is goal state

ADMISSIBLE heuristic: NEVER OVERESTIMATES actual cost
  h(n) ≤ h*(n)  for all n
  (h* = true cost to goal)
  
  Why matters: admissible → A* is OPTIMAL
  
  Example (Romania map, goal=Bucharest):
    h(Arad) = 366 (straight-line distance)
    Actual road distance: 418 km
    366 ≤ 418 ✅ admissible!

CONSISTENT (monotone) heuristic:
  h(n) ≤ c(n, a, n') + h(n')
  (heuristic estimate ≤ step cost + estimate from successor)
  Like triangle inequality!
  Consistent → Admissible (but not vice versa)
  Consistent → A* never revisits a node

EXAMPLES of good heuristics:
  8-Puzzle:
    h1 = number of misplaced tiles         (admissible: each tile needs ≥ 1 move)
    h2 = Manhattan distance                 (admissible, MORE INFORMED than h1)
    h2 dominates h1: h2(n) ≥ h1(n) always → h2 expands fewer nodes!
  
  Routing:
    Straight-line distance (Euclidean)      (admissible: can't go faster than straight line)
  
  Maze:
    Manhattan distance to exit              (admissible if no diagonal moves)
    Euclidean distance                      (admissible if diagonal moves allowed)

DOMINANT heuristic: h2 dominates h1 if h2(n) ≥ h1(n) for all n
  → h2 gives more information → A* expands fewer nodes
  → Always prefer more informed admissible heuristic
  
RELAXED PROBLEMS: derive heuristic by relaxing constraints
  8-Puzzle: "tiles can move anywhere" → h = misplaced tiles
  8-Puzzle: "tiles can move to adjacent cells freely" → Manhattan distance
  Admissibility guaranteed: relaxed problem easier → h ≤ actual cost
```

## 3.2 Greedy Best-First Search

```java
// Expand node with lowest h(n) — closest to goal by estimate
// Like a GPS that only looks at remaining distance, ignores how far came

// Uses PRIORITY QUEUE ordered by h(n)
void greedyBestFirst(State initial) {
    PriorityQueue<Node> frontier = new PriorityQueue<>(
        Comparator.comparingDouble(n -> heuristic(n.state)));

    frontier.offer(new Node(initial));

    while (!frontier.isEmpty()) {
        Node node = frontier.poll();
        if (isGoal(node.state)) return;

        for (State next : node.state.getNeighbors()) {
            frontier.offer(new Node(next, node));
        }
    }
}

// Properties:
//   Complete: NO — can get trapped in loops
//   Optimal:  NO — ignores cost already paid, just follows "smell" of goal
//   Fast in practice but not reliable
//   Example fail: takes a "close" but expensive route
```

## 3.3 A* Search

```java
// f(n) = g(n) + h(n)
// g(n) = actual cost from start to n (already paid)
// h(n) = heuristic estimate from n to goal (to be paid)
// f(n) = estimated total path cost through n

// A* balances: "how far have I come?" + "how far to go?"
// With admissible h: finds OPTIMAL solution!

void astar(State initial, State goal) {
    PriorityQueue<Node> open = new PriorityQueue<>(
        Comparator.comparingDouble(n -> n.f));
    Map<State, Double> gScore = new HashMap<>();
    Map<State, Node>   cameFrom = new HashMap<>();

    gScore.put(initial, 0.0);
    open.offer(new Node(initial, 0.0, heuristic(initial, goal)));

    while (!open.isEmpty()) {
        Node current = open.poll();

        if (current.state.equals(goal)) {
            reconstructPath(current, cameFrom);
            return;
        }

        for (Edge edge : current.state.getEdges()) {
            double tentativeG = gScore.get(current.state) + edge.cost;

            if (tentativeG < gScore.getOrDefault(edge.to, Double.MAX_VALUE)) {
                gScore.put(edge.to, tentativeG);
                double f = tentativeG + heuristic(edge.to, goal);
                cameFrom.put(edge.to, current);
                open.offer(new Node(edge.to, tentativeG, f));
            }
        }
    }
}

// Reconstruct path from goal to start
void reconstructPath(Node goal, Map<State, Node> cameFrom) {
    List<State> path = new ArrayList<>();
    Node curr = goal;
    while (curr != null) {
        path.add(curr.state);
        curr = cameFrom.get(curr.state);
    }
    Collections.reverse(path);
    System.out.println("Path: " + path);
}

// A* OPTIMALITY PROOF (sketch):
// If h is admissible, when A* selects a goal node to expand:
// f(goal) = g(goal) (since h(goal) = 0)
// Any path in open set has f ≥ f(goal) (since f is non-decreasing with consistent h)
// → current path IS optimal!

// A* COMPARISON WITH BFS AND DIJKSTRA:
// BFS:      h(n) = 0 (no heuristic) → same as UCS
// Dijkstra: same as UCS (h = 0)
// A*:       admissible h(n) → expands fewer nodes than Dijkstra!
// Greedy:   f(n) = h(n) (ignores g) → fast but not optimal
```

## 3.4 A* Variants

```
IDA* (Iterative Deepening A*):
  Space-efficient A* — like IDDFS for A*
  Threshold = f limit, increase threshold each iteration
  Space: O(d) — only current path stored!
  Used: when memory is tight (IDA* for 15-puzzle)

RBFS (Recursive Best-First Search):
  Remembers best alternative path found
  Can switch between paths efficiently

Weighted A* (WA*):
  f(n) = g(n) + w*h(n) where w > 1
  Finds w-suboptimal solution (cost ≤ w × optimal cost)
  Faster than A* (more heuristic bias)
  Trade-off: speed vs optimality guarantee

Bidirectional A*:
  Search simultaneously from start AND goal
  Meet in middle
  Can reduce search space from O(b^d) to O(b^(d/2))!

LRTA* (Learning Real-Time A*):
  Agent moves, updates heuristic as it learns
  Good for unknown environments

APPLICATION: Google Maps routing
  Uses A* variant with multiple heuristics
  Bidirectional search, contraction hierarchies
  Processes millions of nodes in milliseconds
```

---

# 4. Adversarial Search — Minimax & Alpha-Beta

## 4.1 Game Theory Basics

```
ZERO-SUM GAME: one player's gain = other's loss
  Chess, Tic-Tac-Toe, Go, Checkers
  MAX player tries to maximize score
  MIN player tries to minimize score

GAME FORMULATION:
  State: board configuration
  Initial: starting board
  To-move(s): which player's turn
  Actions(s): legal moves
  Result(s, a): new board after move a
  Terminal-test(s): is game over?
  Utility(s, p): payoff for player p in terminal state s

PERFECT PLAY:
  Both players play optimally
  MINIMAX value: best achievable utility with perfect play
```

## 4.2 Minimax Algorithm

```java
// MAX player picks move with highest minimax value
// MIN player picks move with lowest minimax value
// Recursive: evaluate all positions to terminal states

int minimax(State state, boolean isMaximizing) {
    if (isTerminal(state)) return utility(state);

    if (isMaximizing) {
        int maxEval = Integer.MIN_VALUE;
        for (State child : getChildren(state)) {
            int eval = minimax(child, false);
            maxEval = Math.max(maxEval, eval);
        }
        return maxEval;
    } else {
        int minEval = Integer.MAX_VALUE;
        for (State child : getChildren(state)) {
            int eval = minimax(child, true);
            minEval = Math.min(minEval, eval);
        }
        return minEval;
    }
}

// With depth limit (practical games):
int minimax(State state, int depth, boolean isMax) {
    if (depth == 0 || isTerminal(state))
        return evaluate(state);  // heuristic evaluation function

    if (isMax) {
        int best = Integer.MIN_VALUE;
        for (State child : getChildren(state)) {
            best = Math.max(best, minimax(child, depth - 1, false));
        }
        return best;
    } else {
        int best = Integer.MAX_VALUE;
        for (State child : getChildren(state)) {
            best = Math.min(best, minimax(child, depth - 1, true));
        }
        return best;
    }
}

// EVALUATION FUNCTION for chess (heuristic):
int evaluate(State board) {
    // Material balance:
    int score = 0;
    score += 900 * (numQueens(MAX)  - numQueens(MIN));
    score += 500 * (numRooks(MAX)   - numRooks(MIN));
    score += 300 * (numBishops(MAX) - numBishops(MIN));
    score += 300 * (numKnights(MAX) - numKnights(MIN));
    score += 100 * (numPawns(MAX)   - numPawns(MIN));
    // + positional bonuses, king safety, pawn structure...
    return score;
}

// Complexity:
// Perfect minimax: O(b^m) time and O(b*m) space
// Chess: b≈35, m≈100 → 35^100 ≈ 10^154 nodes
// Completely impossible without pruning!
```

## 4.3 Alpha-Beta Pruning

```
Alpha-Beta cuts off branches that can't affect outcome
NEVER changes the minimax result — just finds it FASTER

α (alpha): best value MAX player can guarantee so far
β (beta):  best value MIN player can guarantee so far

PRUNING rules:
  At MAX node: if α ≥ β → prune (MIN will never reach this node)
  At MIN node: if β ≤ α → prune (MAX will never reach this node)

Visual example:
         MAX
        / | \
       3  12  8
      /  \
     MIN  MIN
    / \   / \
   3   5  2  9    ← explore left: MIN chooses 3, so MAX knows ≥ 3
              
              MAX picks 3 from left node
              Now examining middle node (MIN node):
                First child = 12 → MIN ≤ 12
                But MAX already has 3 from left
                Second child... wait, 12 > 3 already
                Continue...
              
  Once we know middle node ≥ 12 and MAX already has ≥ 3
  → Max's choice: max(3, middle_node, right_node)
  → Need to fully evaluate to get exact answer here
  → But can prune elsewhere!
```

```java
int alphaBeta(State state, int depth, int alpha, int beta, boolean isMax) {
    if (depth == 0 || isTerminal(state))
        return evaluate(state);

    if (isMax) {
        int maxEval = Integer.MIN_VALUE;
        for (State child : getChildren(state)) {
            int eval = alphaBeta(child, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, eval);
            alpha   = Math.max(alpha, eval);

            if (beta <= alpha) break;  // ← BETA CUT-OFF (prune!)
            // MIN player won't choose this path — value already too high for MIN
        }
        return maxEval;

    } else {
        int minEval = Integer.MAX_VALUE;
        for (State child : getChildren(state)) {
            int eval = alphaBeta(child, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, eval);
            beta    = Math.min(beta, eval);

            if (beta <= alpha) break;  // ← ALPHA CUT-OFF (prune!)
            // MAX player won't choose this path — value already too low for MAX
        }
        return minEval;
    }
}

// Initial call:
int bestMove = alphaBeta(root, depth, Integer.MIN_VALUE, Integer.MAX_VALUE, true);

// EFFICIENCY:
// Best case (perfect move ordering): O(b^(m/2)) — can search TWICE as deep!
// Average case (random ordering):    O(b^(3m/4))
// Worst case (reverse ordering):     O(b^m) — no pruning

// MOVE ORDERING IMPROVEMENTS:
// Good ordering → more pruning → deeper search
// Techniques:
//   Killer heuristic: try moves that caused cutoffs recently
//   History heuristic: try moves that were good historically
//   MVV-LVA: capture most valuable piece with least valuable attacker
//   Transposition table: cache already-evaluated positions
//   Iterative deepening + use previous result to order moves
```

## 4.4 Beyond Minimax

```
EXPECTIMAX:
  For games with CHANCE elements (dice, card draws)
  Add CHANCE nodes: take expected value (not max/min)
  
  def expectimax(state, depth, isMax):
      if terminal: return utility(state)
      if isMax:    return max of children
      if isMin:    return min of children
      if isChance: return weighted average of children (by probability)
  
  Used: Backgammon, poker (partially), many video games

MONTE CARLO TREE SEARCH (MCTS):
  Used by AlphaGo, AlphaZero (combined with deep learning)
  Four steps per iteration:
  1. SELECTION:   traverse tree using UCB1 formula
  2. EXPANSION:   add one new node
  3. SIMULATION:  random playout to terminal state (rollout)
  4. BACKPROP:    update win/visit counts up the tree
  
  UCB1 formula: vi + C × √(ln(N)/ni)
    vi = value (win rate) of node i
    N = total visits to parent
    ni = visits to node i
    C = exploration constant (~√2)
  
  Balances exploration vs exploitation!
  
  No domain knowledge needed (just random rollouts)
  With neural network guidance (AlphaGo): superhuman!
```

---

# 5. Machine Learning Fundamentals

## 5.1 The Learning Problem

```
MACHINE LEARNING: program improves performance P on task T
                  with experience E
                  (Tom Mitchell's definition, 1997)

TYPES of learning:
  SUPERVISED:    labeled examples (x, y) → learn f: x → y
  UNSUPERVISED:  unlabeled data x → find structure/patterns
  REINFORCEMENT: agent learns from rewards/penalties

SUPERVISED LEARNING tasks:
  REGRESSION:     output is continuous (predict house price, temperature)
  CLASSIFICATION: output is category (spam/not-spam, disease/healthy)

ML PIPELINE:
  Raw Data → Preprocessing → Feature Engineering → Model Training
  → Evaluation → Hyperparameter Tuning → Deployment → Monitoring

THE FUNDAMENTAL CHALLENGE:
  We want to minimize ERROR on UNSEEN DATA (generalization)
  Not just on training data (memorization = overfitting)

BIAS-VARIANCE TRADEOFF:
  Total Error = Bias² + Variance + Irreducible Noise

  HIGH BIAS (underfitting):
    Model too simple → misses patterns in data
    High training error AND high test error
    Fix: more complex model, more features, less regularization
  
  HIGH VARIANCE (overfitting):
    Model too complex → memorizes noise
    Low training error BUT high test error
    Fix: more data, simpler model, regularization, dropout

        Error
          │
          │    ╲         /
    Test  │     ╲       /  ← test error (U-shaped)
          │      ╲     /
          │       ╲   /
    Train │        ╲_/     ← training error
          │
          └────────────────── Model Complexity
              Under   Over
              fit     fit
```

## 5.2 Data Splits & Cross-Validation

```python
# TRAIN / VALIDATION / TEST SPLIT
# Training set:   fit model parameters (weights)
# Validation set: tune hyperparameters, model selection
# Test set:       final unbiased evaluation (NEVER touch until end!)
# Rule of thumb: 70/15/15 or 60/20/20 or 80/10/10

from sklearn.model_selection import train_test_split

X_train, X_temp,  y_train, y_temp  = train_test_split(X, y, test_size=0.3)
X_val,   X_test,  y_val,   y_test  = train_test_split(X_temp, y_temp, test_size=0.5)

# K-FOLD CROSS-VALIDATION
# More reliable estimate of generalization performance
# Each fold is used as validation once
# Final metric = average over k folds

from sklearn.model_selection import cross_val_score, KFold

kf = KFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=kf, scoring='accuracy')
print(f"CV Accuracy: {scores.mean():.3f} ± {scores.std():.3f}")

# STRATIFIED K-FOLD: preserves class distribution in each fold
from sklearn.model_selection import StratifiedKFold
skf = StratifiedKFold(n_splits=5)

# LEAVE-ONE-OUT (LOO): k = n, expensive, use for small datasets
from sklearn.model_selection import LeaveOneOut
loo = LeaveOneOut()
```

## 5.3 Feature Engineering & Preprocessing

```python
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.impute import SimpleImputer

# HANDLE MISSING VALUES
imputer = SimpleImputer(strategy='mean')     # or 'median', 'most_frequent'
X_imputed = imputer.fit_transform(X)

# FEATURE SCALING — critical for distance-based models!
# Standard Scaler: mean=0, std=1 (z-score normalization)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)  # fit on train only!
X_test_scaled = scaler.transform(X_test)  # use same scaler!

# Min-Max Scaler: [0, 1] range
minmax = MinMaxScaler()
X_normalized = minmax.fit_transform(X)

# CATEGORICAL ENCODING
# Label Encoding: ordinal (bad, medium, good → 0, 1, 2)
le = LabelEncoder()
y = le.fit_transform(['cat', 'dog', 'cat', 'bird'])  # → [1, 2, 1, 0]

# One-Hot Encoding: nominal (no order)
# city: [NYC, LA, SF] → [1,0,0], [0,1,0], [0,0,1]
from sklearn.preprocessing import OneHotEncoder
ohe = OneHotEncoder(sparse=False)
X_encoded = ohe.fit_transform(X[['city']])

# FEATURE SELECTION
from sklearn.feature_selection import SelectKBest, chi2, RFE
selector = SelectKBest(chi2, k=10)  # keep top 10 features
X_selected = selector.fit_transform(X, y)

# DIMENSIONALITY REDUCTION
from sklearn.decomposition import PCA
pca = PCA(n_components=0.95)  # keep 95% variance
X_reduced = pca.fit_transform(X_scaled)
print(f"Reduced from {X.shape[1]} to {X_reduced.shape[1]} features")
```

---

# 6. Decision Trees

## 6.1 How Decision Trees Work

```
Decision Tree: tree structure where each internal node tests a feature,
               each branch represents outcome, each leaf gives prediction

Example: Should I play tennis today?
         
              Outlook?
            /    |    \
         Sunny  Overcast  Rain
          |       |        |
        Humidity? Yes!   Wind?
        /    \           /   \
      High  Normal    Strong Weak
       |       |        |     |
      No!     Yes!     No!   Yes!

BUILDING A TREE — which feature to split on?
  We want splits that best SEPARATE classes
  Metrics: Information Gain, Gini Impurity, Gain Ratio

ENTROPY (information theory):
  H(S) = -Σ pᵢ × log₂(pᵢ)
  pᵢ = proportion of class i in set S
  
  Pure set (all same class): H = 0 bits (no uncertainty)
  Perfectly mixed (50/50):   H = 1 bit (maximum uncertainty)
  3 equal classes:           H = log₂(3) ≈ 1.58 bits
  
  Example: {9 positive, 5 negative} (14 total)
  H = -(9/14)log₂(9/14) - (5/14)log₂(5/14)
    = -0.643×(-0.637) - 0.357×(-1.485)
    = 0.940 bits

INFORMATION GAIN (ID3 algorithm):
  IG(S, A) = H(S) - Σ (|Sv|/|S|) × H(Sv)
             where Sv = subset of S where feature A = v
  
  Choose feature with HIGHEST information gain
  
  Example: Humidity (High/Normal) vs Outlook
  IG(S, Humidity) = H(S) - [7/14 × H(S_High) + 7/14 × H(S_Normal)]
                  = 0.940 - [7/14 × H(3+,4-) + 7/14 × H(6+,1-)]
                  = 0.940 - [0.5 × 0.985 + 0.5 × 0.592]
                  = 0.940 - 0.789
                  = 0.151 bits

GINI IMPURITY (CART algorithm — used by sklearn):
  Gini(S) = 1 - Σ pᵢ²
  
  Pure node: Gini = 0
  50/50 binary: Gini = 1 - (0.5² + 0.5²) = 0.5 (max for binary)
  
  Gini split: weighted avg of children's Gini
  Choose split with LOWEST gini (most pure children)
  
  Computationally simpler than entropy (no log), slightly different splits
```

```python
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.tree import export_text, plot_tree
import matplotlib.pyplot as plt

# CLASSIFICATION TREE
clf = DecisionTreeClassifier(
    criterion='gini',           # 'gini' or 'entropy'
    max_depth=5,                # limit depth (prevents overfitting)
    min_samples_split=20,       # min samples to split a node
    min_samples_leaf=10,        # min samples in a leaf
    max_features='sqrt',        # consider sqrt(n_features) per split
    class_weight='balanced',    # handle class imbalance
    random_state=42
)
clf.fit(X_train, y_train)
y_pred = clf.predict(X_test)
y_proba = clf.predict_proba(X_test)  # probability per class

# Feature importance
importance = clf.feature_importances_  # sum = 1.0
for name, imp in sorted(zip(feature_names, importance), key=lambda x: -x[1]):
    print(f"{name}: {imp:.4f}")

# Visualize tree
print(export_text(clf, feature_names=feature_names))

# REGRESSION TREE
reg = DecisionTreeRegressor(max_depth=4, min_samples_leaf=5)
reg.fit(X_train, y_train)
y_pred = reg.predict(X_test)

# DECISION TREE PSEUDOCODE (ID3):
def id3(samples, features, target):
    if all same class: return Leaf(class)
    if no features left: return Leaf(majority_class)
    
    best = argmax(information_gain(samples, f) for f in features)
    tree = Node(feature=best)
    
    for value in unique_values(samples[best]):
        subset = samples[samples[best] == value]
        if subset is empty:
            tree.add_branch(value, Leaf(majority_class(samples)))
        else:
            tree.add_branch(value, id3(subset, features - {best}, target))
    
    return tree
```

## 6.2 Overfitting & Pruning

```python
# OVERFITTING: full tree memorizes training data
# Solution: PRUNING — simplify tree

# PRE-PRUNING (stop early):
#   max_depth, min_samples_split, min_samples_leaf, max_leaf_nodes
#   Cheap but conservative

# POST-PRUNING (grow full, then prune back):
#   Cost Complexity Pruning (CCP / Reduced Error Pruning)

# COST COMPLEXITY PRUNING in sklearn:
path = clf.cost_complexity_pruning_path(X_train, y_train)
ccp_alphas = path.ccp_alphas    # increasing alpha = more pruning

# Find optimal alpha via cross-validation:
from sklearn.model_selection import cross_val_score
best_alpha, best_score = 0, 0
for alpha in ccp_alphas:
    clf_a = DecisionTreeClassifier(ccp_alpha=alpha)
    score = cross_val_score(clf_a, X_train, y_train, cv=5).mean()
    if score > best_score:
        best_alpha, best_score = alpha, score

# ENSEMBLE METHODS (overcome tree limitations):

# RANDOM FOREST: many trees on random subsets + random features
from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(
    n_estimators=100,     # number of trees
    max_features='sqrt',  # features per split
    bootstrap=True,       # sample with replacement
    oob_score=True,       # out-of-bag evaluation
    n_jobs=-1             # parallel
)
rf.fit(X_train, y_train)
rf.oob_score_  # generalization estimate (no need for validation set!)

# GRADIENT BOOSTING: sequential trees, each fixes previous errors
from sklearn.ensemble import GradientBoostingClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

xgb = XGBClassifier(
    n_estimators=500,
    learning_rate=0.1,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    early_stopping_rounds=50
)
xgb.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
```

---

# 7. Classical ML Algorithms

## 7.1 Linear Regression

```python
# Model: ŷ = w₀ + w₁x₁ + w₂x₂ + ... + wₙxₙ = Xw
# Loss: MSE = (1/n)Σ(yᵢ - ŷᵢ)²
# Goal: find w that minimizes MSE

# NORMAL EQUATION (analytical solution for small n):
# w = (XᵀX)⁻¹Xᵀy   ← O(n³) matrix inversion, slow for large n

# GRADIENT DESCENT (iterative):
# w := w - α × ∇MSE   (α = learning rate)
# ∇MSE = (2/n) Xᵀ(Xw - y)

from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet

# Basic linear regression:
lr = LinearRegression()
lr.fit(X_train, y_train)
print("Coefficients:", lr.coef_)
print("Intercept:", lr.intercept_)
print("R² score:", lr.score(X_test, y_test))

# RIDGE REGRESSION (L2 regularization): minimize MSE + α||w||²
# Penalizes large weights → shrinks all weights toward 0
# Helps with overfitting + multicollinearity
ridge = Ridge(alpha=1.0)

# LASSO REGRESSION (L1 regularization): minimize MSE + α||w||₁
# L1 penalty → SPARSE solution (many weights exactly 0)
# Automatic feature selection!
lasso = Lasso(alpha=0.1)

# ElasticNet: L1 + L2 combined
elastic = ElasticNet(alpha=0.1, l1_ratio=0.5)
```

## 7.2 Logistic Regression

```python
# CLASSIFICATION despite the name!
# Model: P(y=1|x) = σ(w·x) = 1/(1 + e^(-w·x))
# σ = sigmoid function, squashes output to [0, 1]
# Decision boundary: P = 0.5 → w·x = 0

# Loss: Binary Cross-Entropy = -Σ[yᵢlog(ŷᵢ) + (1-yᵢ)log(1-ŷᵢ)]
# (Maximum Likelihood Estimation)

from sklearn.linear_model import LogisticRegression

lg = LogisticRegression(
    C=1.0,             # inverse of regularization strength (1/λ)
    penalty='l2',      # 'l1', 'l2', 'elasticnet', 'none'
    solver='lbfgs',    # optimization algorithm
    max_iter=1000,
    multi_class='multinomial'  # for multi-class
)
lg.fit(X_train, y_train)
proba = lg.predict_proba(X_test)  # shape: (n_samples, n_classes)
```

## 7.3 Support Vector Machine (SVM)

```python
# Find hyperplane that MAXIMALLY SEPARATES classes
# Maximum margin classifier

# Linear SVM: maximize margin = 2/||w||
# Support vectors: data points closest to decision boundary
# Margin = distance between support vectors

# SOFT MARGIN (allows some misclassification):
# C parameter controls trade-off:
#   High C: narrow margin, fewer misclassifications (risk overfit)
#   Low C:  wide margin, more misclassifications (risk underfit)

# KERNEL TRICK: map to higher dimension where linearly separable
# K(xᵢ, xⱼ) = φ(xᵢ)·φ(xⱼ)  (compute without explicit mapping!)
# Kernels:
#   Linear:  K(x,z) = x·z
#   RBF:     K(x,z) = exp(-γ||x-z||²)  ← most common
#   Poly:    K(x,z) = (x·z + c)^d
#   Sigmoid: K(x,z) = tanh(αx·z + c)

from sklearn.svm import SVC, SVR

svm = SVC(
    C=1.0,
    kernel='rbf',
    gamma='scale',    # 'scale' = 1/(n_features × X.var())
    probability=True  # enable predict_proba (slower)
)
svm.fit(X_train, y_train)
```

## 7.4 K-Nearest Neighbors (KNN)

```python
# INSTANCE-BASED learning — no explicit model!
# Classify by k nearest neighbors' majority vote
# Regression: average of k neighbors

# Distance metrics:
#   Euclidean: √(Σ(xᵢ-yᵢ)²)  ← default
#   Manhattan: Σ|xᵢ-yᵢ|       ← robust to outliers
#   Minkowski: (Σ|xᵢ-yᵢ|^p)^(1/p)  ← generalization

# Choosing k:
#   k too small: noisy, overfits
#   k too large: smooth, underfits, slow
#   Rule of thumb: k = √n, prefer odd k (avoids ties)

from sklearn.neighbors import KNeighborsClassifier
knn = KNeighborsClassifier(n_neighbors=5, weights='uniform', metric='euclidean')
# weights='distance': closer neighbors vote more

# ⚠️ Must SCALE features! Distance-based, unscaled features dominate
```

## 7.5 Naive Bayes

```python
# Based on Bayes' theorem with INDEPENDENCE assumption
# P(y|x₁,...,xₙ) ∝ P(y) × Π P(xᵢ|y)

# "Naive" = features assumed CONDITIONALLY INDEPENDENT given y
# (unrealistic but works surprisingly well in practice!)

# Fast, works well for high-dimensional sparse data
# Great for text classification!

from sklearn.naive_bayes import GaussianNB, MultinomialNB, BernoulliNB

# GaussianNB: continuous features, Gaussian distribution
gnb = GaussianNB()

# MultinomialNB: discrete counts (e.g., word counts)
mnb = MultinomialNB(alpha=1.0)  # Laplace smoothing

# BernoulliNB: binary features (word presence/absence)
bnb = BernoulliNB(alpha=1.0)
```

## 7.6 Clustering (Unsupervised)

```python
# K-MEANS: assign points to k clusters, minimize within-cluster variance
# Algorithm:
#   1. Initialize k centroids randomly
#   2. Assign each point to nearest centroid
#   3. Update centroid = mean of assigned points
#   4. Repeat until convergence

from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.metrics import silhouette_score

# Find optimal k using elbow method + silhouette:
inertias, silhouettes = [], []
for k in range(2, 11):
    km = KMeans(n_clusters=k, n_init=10, random_state=42)
    labels = km.fit_predict(X)
    inertias.append(km.inertia_)
    silhouettes.append(silhouette_score(X, labels))

# DBSCAN: density-based, finds arbitrary shapes, handles outliers!
dbscan = DBSCAN(eps=0.5, min_samples=5)
# eps: radius of neighborhood
# min_samples: minimum points to form dense region
# Noise points labeled as -1
```

---

# 8. Deep Learning

## 8.1 Neural Network Fundamentals

```
NEURON (Perceptron):
  inputs: x₁, x₂, ..., xₙ
  weights: w₁, w₂, ..., wₙ
  bias: b
  
  z = w₁x₁ + w₂x₂ + ... + wₙxₙ + b = w·x + b
  output = activation(z)

  One neuron = one linear separator (can only solve linearly separable problems)

NEURAL NETWORK:
  Multiple layers of neurons
  Hidden layers learn intermediate representations

  Input → [Hidden Layer 1] → [Hidden Layer 2] → Output
  
  Each layer: z = Wx + b, a = activation(z)
  W = weight matrix, b = bias vector

DEPTH (number of layers) enables learning HIERARCHICAL features:
  Layer 1: edges, colors
  Layer 2: textures, patterns
  Layer 3: object parts (eyes, wheels)
  Layer 4: complete objects (face, car)

UNIVERSAL APPROXIMATION THEOREM:
  A neural network with ONE hidden layer and enough neurons
  can approximate ANY continuous function to arbitrary precision
  → Depth helps with efficiency (exponentially fewer neurons needed)
```

## 8.2 Activation Functions

```python
import numpy as np

# SIGMOID: σ(z) = 1/(1+e^(-z)) → range (0, 1)
# Pros: smooth, differentiable, outputs "probability"
# Cons: VANISHING GRADIENT (saturates for |z|>>0 → gradient ≈ 0)
#       Not zero-centered (gradient always positive/negative)
#       Use: output layer for binary classification ONLY
sigmoid = lambda z: 1 / (1 + np.exp(-z))

# TANH: tanh(z) = (e^z - e^(-z))/(e^z + e^(-z)) → range (-1, 1)
# Pros: zero-centered (better than sigmoid)
# Cons: still has vanishing gradient problem
# Use: RNN hidden states
tanh = np.tanh

# RELU (Rectified Linear Unit): max(0, z)
# Pros: NO vanishing gradient for z > 0, computationally cheap
#       SPARSE activation (50% neurons inactive → efficient)
# Cons: DYING RELU: neurons with z < 0 always output 0, gradient = 0, never update
# Use: DEFAULT for deep networks, CNN hidden layers
relu = lambda z: np.maximum(0, z)

# LEAKY RELU: max(αz, z), α ≈ 0.01
# Fixes dying ReLU (small gradient for negative z)
leaky_relu = lambda z, alpha=0.01: np.where(z > 0, z, alpha * z)

# ELU (Exponential Linear Unit): z if z≥0, α(e^z - 1) if z<0
# Smoother than ReLU, mean activations closer to 0

# GELU (Gaussian Error Linear Unit):
# z × Φ(z) where Φ = CDF of normal distribution
# Used in BERT, GPT, modern Transformers
# Smoother than ReLU, often better performance

# SWISH: z × σ(z)  (Google's self-gated activation)
# Consistently outperforms ReLU on deep networks
swish = lambda z: z * sigmoid(z)

# SOFTMAX: exp(zᵢ)/Σexp(zⱼ) → outputs sum to 1 (probability distribution)
# USE: output layer for multi-class classification (gives class probabilities)
softmax = lambda z: np.exp(z) / np.sum(np.exp(z))

# WHEN TO USE WHAT:
# Hidden layers: ReLU (default) > Leaky ReLU > ELU > GELU
# Output (binary classification): Sigmoid
# Output (multi-class): Softmax
# Output (regression): Linear (no activation)
# RNN: Tanh
```

## 8.3 Backpropagation

```
FORWARD PASS: compute output from input
  z¹ = W¹x + b¹, a¹ = activation(z¹)
  z² = W²a¹ + b², a² = activation(z²)
  ŷ = a² (output layer)
  L = loss(ŷ, y)

BACKWARD PASS: compute gradients via chain rule
  ∂L/∂W² = ∂L/∂ŷ × ∂ŷ/∂z² × ∂z²/∂W²
           = δ² × (a¹)ᵀ
  where δ² = ∂L/∂z² (error signal)
  
  ∂L/∂W¹ = ∂L/∂a¹ × ∂a¹/∂z¹ × ∂z¹/∂W¹
           = (W²)ᵀδ² × activation'(z¹) × xᵀ

UPDATE WEIGHTS (Gradient Descent):
  W := W - α × ∂L/∂W
  b := b - α × ∂L/∂b

CHAIN RULE: if z = f(y) and y = g(x):
  dz/dx = dz/dy × dy/dx

GRADIENT FLOW through layers:
  If sigmoid: σ'(z) = σ(z)(1-σ(z)) ≤ 0.25
  After 10 layers: gradient multiplied by ≤ 0.25^10 ≈ 10^-6
  → VANISHING GRADIENT PROBLEM → deeper layers learn nothing!
  
  Solutions:
    ReLU activation (gradient = 1 for z > 0)
    Batch Normalization
    Skip connections (ResNet)
    Careful weight initialization (Xavier, He)
```

```python
import torch
import torch.nn as nn
import torch.optim as optim

# NEURAL NETWORK IN PYTORCH:
class MLP(nn.Module):
    def __init__(self, input_dim, hidden_dims, output_dim):
        super().__init__()
        layers = []
        dims = [input_dim] + hidden_dims
        for i in range(len(dims) - 1):
            layers += [
                nn.Linear(dims[i], dims[i+1]),
                nn.BatchNorm1d(dims[i+1]),   # normalize layer outputs
                nn.ReLU(),
                nn.Dropout(0.3)              # randomly zero 30% of neurons
            ]
        layers.append(nn.Linear(dims[-1], output_dim))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)

model = MLP(input_dim=784, hidden_dims=[512, 256, 128], output_dim=10)

# LOSS FUNCTIONS:
criterion_clf    = nn.CrossEntropyLoss()     # multi-class classification
criterion_binary = nn.BCEWithLogitsLoss()    # binary classification
criterion_reg    = nn.MSELoss()              # regression
criterion_reg2   = nn.SmoothL1Loss()        # regression, robust to outliers (Huber)

# OPTIMIZERS:
sgd   = optim.SGD(model.parameters(), lr=0.01, momentum=0.9, weight_decay=1e-4)
adam  = optim.Adam(model.parameters(), lr=1e-3, betas=(0.9, 0.999), eps=1e-8)
adamw = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)  # AdamW preferred

# TRAINING LOOP:
for epoch in range(num_epochs):
    model.train()
    for X_batch, y_batch in train_loader:
        optimizer.zero_grad()       # clear previous gradients!
        output = model(X_batch)
        loss = criterion(output, y_batch)
        loss.backward()             # compute gradients
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)  # gradient clipping
        optimizer.step()            # update weights

    # Validation
    model.eval()
    with torch.no_grad():
        val_output = model(X_val)
        val_loss = criterion(val_output, y_val)

# LEARNING RATE SCHEDULES:
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5)
scheduler = optim.lr_scheduler.OneCycleLR(optimizer, max_lr=0.01, ...)
```

## 8.4 Regularization Techniques

```python
# DROPOUT: randomly zero neurons during training
# Forces redundant representations, prevents co-adaptation
# At test time: no dropout, scale by keep probability (or use inverted dropout)
nn.Dropout(p=0.5)   # zero 50% of neurons
nn.Dropout2d(p=0.2) # zero entire channels (for CNN)

# BATCH NORMALIZATION:
# Normalize layer inputs to mean=0, std=1
# Learn scale (γ) and shift (β) parameters
# Benefits: faster training, higher learning rates, regularization effect
# Apply: after linear layer, before activation
nn.BatchNorm1d(num_features)   # for fully connected
nn.BatchNorm2d(num_channels)   # for CNN
# Layer Norm (used in Transformers): normalize over feature dimension
nn.LayerNorm(normalized_shape)

# WEIGHT DECAY (L2 regularization):
# Add λ||W||² to loss → discourages large weights
optim.AdamW(model.parameters(), weight_decay=0.01)

# EARLY STOPPING:
# Stop training when validation loss stops improving
best_val_loss, patience_counter = float('inf'), 0
for epoch in range(max_epochs):
    val_loss = evaluate(model, val_loader)
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        patience_counter = 0
        torch.save(model.state_dict(), 'best_model.pt')
    else:
        patience_counter += 1
        if patience_counter >= patience: break

# DATA AUGMENTATION (implicit regularization for images):
from torchvision import transforms
augment = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.RandomCrop(32, padding=4),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.RandomRotation(15),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225])
])
```

---

# 9. Convolutional Neural Networks (CNN)

## 9.1 Convolution Operation

```
CONVOLUTION: slide filter over image, compute dot product at each position
  
  Image patch (3×3):    Filter (3×3):    Output (1×1):
  [1 2 3]               [0 1 0]
  [4 5 6]         ×     [1 0 1]    =  (0+2+0 + 4+0+6 + 0+8+0) = 20
  [7 8 9]               [0 1 0]

KEY CONCEPTS:
  Padding: add zeros around border to control output size
    SAME padding: output = input size
    VALID padding: output = input - kernel + 1
  
  Stride: step size of filter movement
    Stride 1: output size = (input - kernel + 2*pad) / stride + 1
  
  Channels: multiple filters → multiple feature maps
    RGB input: 3 input channels
    After 64 filters: 64 feature maps

WHY CONVOLUTION works:
  Local receptive field: each neuron sees small region (local patterns)
  Parameter sharing: same filter across entire image
    1 filter: k×k×channels params vs k×k×channels×W×H (fully connected)
  Translation invariance: detected feature regardless of position
  
POOLING: reduce spatial dimensions, provide invariance
  Max pooling:     take maximum in each region
  Average pooling: take average in each region
  Global avg pool: average entire feature map → single value per channel

TYPICAL CNN ARCHITECTURE:
  Input (H×W×3)
  → Conv(64 filters, 3×3) → BN → ReLU              (H×W×64)
  → Conv(64 filters, 3×3) → BN → ReLU              (H×W×64)
  → MaxPool(2×2)                                     (H/2×W/2×64)
  → Conv(128 filters, 3×3) → BN → ReLU             (H/2×W/2×128)
  → MaxPool(2×2)                                     (H/4×W/4×128)
  → Flatten → FC(512) → Dropout → FC(n_classes)
```

```python
import torch.nn as nn

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            # Block 1
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),   # 32×32 → 16×16
            nn.Dropout2d(0.25),
            
            # Block 2
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),   # 16×16 → 8×8
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 8 * 8, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        return self.classifier(self.features(x))

# Famous architectures:
# LeNet-5 (1998):   First practical CNN, 5 layers, MNIST
# AlexNet (2012):   Won ImageNet, deep learning renaissance
# VGGNet (2014):    Simple deep (16-19 layers), 3×3 convolutions only
# GoogLeNet (2014): Inception modules, 1×1 convolutions, 22 layers
# ResNet (2015):    Skip connections, 152 layers! Solved vanishing gradient
# DenseNet (2017):  Dense connections (every layer to every later layer)
# EfficientNet (2019): Compound scaling (width × depth × resolution)
# ViT (2020):       Vision Transformer — patches as tokens

# TRANSFER LEARNING (use pre-trained features):
from torchvision.models import resnet50, ResNet50_Weights

model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)

# Freeze all layers:
for param in model.parameters():
    param.requires_grad = False

# Replace final classifier:
model.fc = nn.Linear(model.fc.in_features, num_classes)

# Fine-tune: unfreeze last few blocks
for name, param in model.named_parameters():
    if 'layer4' in name or 'fc' in name:
        param.requires_grad = True
```

---

# 10. Recurrent Neural Networks (RNN, LSTM)

## 10.1 RNN Basics

```
RNN: processes SEQUENTIAL data
  Hidden state hₜ captures "memory" of past inputs
  
  hₜ = tanh(Wₓ·xₜ + Wₕ·hₜ₋₁ + b)
  yₜ = Wᵧ·hₜ + bᵧ
  
  Same weights W used at every time step!
  
  x₁  x₂  x₃  x₄  x₅
  ↓   ↓   ↓   ↓   ↓
  h₁→ h₂→ h₃→ h₄→ h₅
          ↓
          y₃ (output at step 3)

RNN LIMITATIONS:
  VANISHING GRADIENT: gradient propagated back through many time steps
  → multiply Wₕ repeatedly → gradients vanish (or explode)
  → RNN can't remember long-range dependencies
  "RNN forgets what happened 10 steps ago"
```

## 10.2 LSTM (Long Short-Term Memory)

```
LSTM: solves vanishing gradient via GATES and CELL STATE
  Cell state (cₜ): long-term memory (conveyor belt, minimal modification)
  Hidden state (hₜ): short-term memory / output

FOUR COMPONENTS:
  1. FORGET GATE:  fₜ = σ(Wf[hₜ₋₁, xₜ] + bf)
     What to forget from cell state
     fₜ ≈ 0: forget, fₜ ≈ 1: keep

  2. INPUT GATE:   iₜ = σ(Wi[hₜ₋₁, xₜ] + bi)
                   g̃ₜ = tanh(Wg[hₜ₋₁, xₜ] + bg)
     What new info to add to cell state

  3. CELL UPDATE:  cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ g̃ₜ
     (⊙ = element-wise multiplication)
     Forget old + add new

  4. OUTPUT GATE:  oₜ = σ(Wo[hₜ₋₁, xₜ] + bo)
                   hₜ = oₜ ⊙ tanh(cₜ)
     What to output based on cell state

WHY IT WORKS:
  Cell state flows forward with only ADDITIVE operations (not multiplicative)
  Gradients can flow back unobstructed through cell state
  Gates are LEARNED — network decides what to remember/forget
```

```python
import torch
import torch.nn as nn

class LSTMClassifier(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,   # input: (batch, seq, feature)
            dropout=0.3,
            bidirectional=True  # process sequence forward AND backward
        )
        self.fc = nn.Linear(hidden_size * 2, output_size)  # *2 for bidirectional

    def forward(self, x):
        # x: (batch, seq_len, input_size)
        out, (hidden, cell) = self.lstm(x)
        # out: (batch, seq_len, hidden*2) — all time steps
        # hidden: (num_layers*2, batch, hidden) — last time step
        
        # Use last time step for classification:
        last = out[:, -1, :]  # (batch, hidden*2)
        return self.fc(last)

# GRU: simpler than LSTM, often comparable performance
class GRUModel(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.gru = nn.GRU(input_size, hidden_size, batch_first=True)
        self.fc  = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        out, hidden = self.gru(x)
        return self.fc(out[:, -1, :])
```

---

# 11. Transformers & Attention

## 11.1 Attention Mechanism

```
MOTIVATION: RNNs process sequentially — can't parallelize
            Long-range dependencies hard even with LSTM
            Attention: directly connect any two positions!

SELF-ATTENTION: each position attends to ALL positions in sequence

Step 1: Create Q, K, V from input X:
  Q = XWQ (Queries: "what am I looking for?")
  K = XWK (Keys: "what do I have?")
  V = XWV (Values: "what do I actually give out?")

Step 2: Compute attention scores:
  scores = QKᵀ / √dk     (√dk prevents exploding dot products)

Step 3: Softmax to get attention weights:
  attention = softmax(scores)   (sum to 1 for each query)

Step 4: Weighted sum of values:
  output = attention × V

INTUITION:
  Query: "I want information about verbs"
  Keys:  each word advertises what it contains
  High attention score: query matches key well
  Output: mix of values weighted by relevance

MULTI-HEAD ATTENTION:
  Run self-attention h times in parallel with different W projections
  Each head learns different relationships
  Concatenate and project: MultiHead(Q,K,V) = Concat(head₁,...,headₕ)W°
  
  Benefits:
    Different heads can focus on: syntax, semantics, co-reference...
    Richer representation than single attention
```

## 11.2 Transformer Architecture

```
"Attention is All You Need" — Vaswani et al., 2017

ENCODER block (repeated N times):
  Input Embedding + Positional Encoding
  → Multi-Head Self-Attention (+ skip connection)
  → Layer Normalization
  → Feed-Forward Network (FFN): two linear layers + ReLU
  → Layer Normalization

DECODER block (repeated N times):
  Target Embedding + Positional Encoding
  → Masked Self-Attention (can't see future tokens!)
  → Cross-Attention (attend to encoder output)
  → FFN + Layer Norms

POSITIONAL ENCODING:
  Attention is PERMUTATION INVARIANT (doesn't know word order!)
  Add sinusoidal encoding to inject position information
  PE(pos, 2i)   = sin(pos / 10000^(2i/dmodel))
  PE(pos, 2i+1) = cos(pos / 10000^(2i/dmodel))

FFN (Feed-Forward Network) in each layer:
  FFN(x) = max(0, xW₁ + b₁)W₂ + b₂
  Hidden dim typically 4× larger than model dim
  → Most parameters are in FFN layers!

SCALING LAWS:
  Performance scales predictably with:
  - Model size (number of parameters)
  - Dataset size
  - Compute budget
  GPT-3: 175B params, 45TB data → emergent capabilities!
```

```python
# Simplified Transformer Self-Attention:
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def scaled_dot_product_attention(self, Q, K, V, mask=None):
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.d_k ** 0.5)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        attn = torch.softmax(scores, dim=-1)
        return torch.matmul(attn, V), attn

    def forward(self, Q, K, V, mask=None):
        batch = Q.size(0)
        # Project and split into heads
        Q = self.W_q(Q).view(batch, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(K).view(batch, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(V).view(batch, -1, self.num_heads, self.d_k).transpose(1, 2)

        x, attn = self.scaled_dot_product_attention(Q, K, V, mask)
        # Concatenate heads
        x = x.transpose(1, 2).contiguous().view(batch, -1, self.d_model)
        return self.W_o(x)

# Famous Transformer models:
# BERT (2018):    Encoder only, masked language modeling + next sentence prediction
#                 Bidirectional → great for understanding (classification, NER, QA)
# GPT (2018+):    Decoder only, causal language modeling (predict next token)
#                 Left-to-right → great for generation
# T5 (2019):      Encoder-Decoder, "text-to-text" everything
# ViT (2020):     Vision Transformer — image patches as tokens
# GPT-4 (2023):   Multimodal (text + images), 100B+ params
# LLaMA (2023):   Open source, strong performance
# Claude (2023+): Constitutional AI alignment
```

---

# 12. Reinforcement Learning

> 📖 https://spinningup.openai.com/

## 12.1 RL Framework

```
RL: agent learns to take ACTIONS in an ENVIRONMENT to maximize cumulative REWARD

COMPONENTS:
  Agent:       the learner/decision maker
  Environment: what agent interacts with
  State (s):   current situation
  Action (a):  what agent can do
  Reward (r):  feedback signal (positive = good, negative = bad)
  Policy (π):  strategy — maps states to actions  π(a|s)
  Value (V):   expected cumulative reward from state s
  Q-function:  expected cumulative reward from state s, action a → Q(s,a)

MARKOV DECISION PROCESS (MDP):
  (S, A, P, R, γ)
  S: state space
  A: action space
  P(s'|s,a): transition probabilities
  R(s,a,s'): reward function
  γ: discount factor (0 < γ ≤ 1)

  MARKOV PROPERTY: next state depends ONLY on current state (not history)
  "The future is independent of the past given the present"

RETURN: total discounted future reward
  Gₜ = rₜ + γrₜ₊₁ + γ²rₜ₊₂ + ... = Σᵢ γⁱrₜ₊ᵢ
  γ = 0.99: care a lot about future
  γ = 0.1:  very short-sighted

VALUE FUNCTIONS:
  V^π(s) = E[Gₜ | Sₜ = s]          (expected return from state s following π)
  Q^π(s,a) = E[Gₜ | Sₜ = s, Aₜ = a] (expected return from (s,a) following π)

BELLMAN EQUATION:
  V^π(s) = Σₐ π(a|s) Σₛ' P(s'|s,a)[R(s,a,s') + γV^π(s')]
  
  "Value of current state = expected immediate reward + discounted future value"
```

## 12.2 Q-Learning & DQN

```python
# Q-LEARNING: model-free, off-policy algorithm
# Learns optimal Q-function Q*(s,a) = max expected return
# Bellman optimality: Q*(s,a) = R + γ max_a' Q*(s',a')

# Q-TABLE UPDATE RULE:
# Q(s,a) ← Q(s,a) + α[r + γ max_a' Q(s',a') - Q(s,a)]
#                         └────────────────────┘
#                         TD Target (new estimate)
#                    └──────────────────────────────┘
#                    TD Error (how wrong was current estimate?)

class QLearning:
    def __init__(self, n_states, n_actions, lr=0.1, gamma=0.99, epsilon=1.0):
        self.Q = np.zeros((n_states, n_actions))
        self.lr = lr
        self.gamma = gamma
        self.epsilon = epsilon

    def select_action(self, state):
        # ε-GREEDY: explore randomly ε% of time, exploit best action otherwise
        if np.random.random() < self.epsilon:
            return np.random.randint(self.Q.shape[1])  # explore
        return np.argmax(self.Q[state])                 # exploit

    def update(self, state, action, reward, next_state, done):
        td_target = reward if done else reward + self.gamma * np.max(self.Q[next_state])
        td_error  = td_target - self.Q[state, action]
        self.Q[state, action] += self.lr * td_error

    def decay_epsilon(self):
        self.epsilon = max(0.01, self.epsilon * 0.995)


# DQN (Deep Q-Network) — Q-learning with neural network
# Q(s,a; θ) ≈ Q*(s,a)    (neural net as function approximator)
# Used by DeepMind to play Atari games from pixels

class DQN(nn.Module):
    def __init__(self, input_dim, output_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128), nn.ReLU(),
            nn.Linear(128, 128),       nn.ReLU(),
            nn.Linear(128, output_dim)
        )
    def forward(self, x): return self.net(x)

class DQNAgent:
    def __init__(self, state_dim, action_dim):
        self.policy_net = DQN(state_dim, action_dim)
        self.target_net = DQN(state_dim, action_dim)  # FIXED target network!
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=1e-4)

        # EXPERIENCE REPLAY BUFFER (key innovation!)
        from collections import deque
        self.memory = deque(maxlen=10000)
        self.epsilon = 1.0

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def train_step(self, batch_size=64):
        if len(self.memory) < batch_size: return

        # Sample random BATCH from memory (breaks correlations!)
        batch = random.sample(self.memory, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)

        states     = torch.tensor(states,     dtype=torch.float)
        actions    = torch.tensor(actions,    dtype=torch.long)
        rewards    = torch.tensor(rewards,    dtype=torch.float)
        next_states= torch.tensor(next_states,dtype=torch.float)
        dones      = torch.tensor(dones,      dtype=torch.float)

        # Current Q values
        current_q = self.policy_net(states).gather(1, actions.unsqueeze(1))

        # Target Q values (using TARGET NETWORK — stable!)
        with torch.no_grad():
            next_q    = self.target_net(next_states).max(1)[0]
            target_q  = rewards + 0.99 * next_q * (1 - dones)

        loss = nn.MSELoss()(current_q.squeeze(), target_q)
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.policy_net.parameters(), 10)
        self.optimizer.step()

    def update_target_network(self):
        # Copy weights every N steps (or soft update)
        self.target_net.load_state_dict(self.policy_net.state_dict())
```

## 12.3 Policy Gradient Methods

```python
# POLICY GRADIENT: directly optimize policy π_θ(a|s)
# Instead of learning V or Q, learn policy directly!

# REINFORCE (Monte Carlo Policy Gradient):
# θ ← θ + α × Gₜ × ∇θ log π_θ(aₜ|sₜ)
# Gₜ = return from time t
# "If return was good, increase probability of actions that led to it"

class PolicyNetwork(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 128), nn.ReLU(),
            nn.Linear(128, action_dim),
            nn.Softmax(dim=-1)
        )
    def forward(self, x): return self.net(x)

class REINFORCEAgent:
    def __init__(self, state_dim, action_dim):
        self.policy = PolicyNetwork(state_dim, action_dim)
        self.optimizer = optim.Adam(self.policy.parameters(), lr=1e-3)

    def select_action(self, state):
        state = torch.FloatTensor(state)
        probs = self.policy(state)
        dist = torch.distributions.Categorical(probs)
        action = dist.sample()
        return action.item(), dist.log_prob(action)

    def update(self, log_probs, returns):
        # Normalize returns (reduce variance)
        returns = torch.tensor(returns)
        returns = (returns - returns.mean()) / (returns.std() + 1e-8)

        loss = -sum(lp * R for lp, R in zip(log_probs, returns))
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()


# ACTOR-CRITIC: combine value learning + policy learning
# Actor: policy π_θ(a|s) — decides actions
# Critic: value V_φ(s) — evaluates actions
# Use advantage A(s,a) = Q(s,a) - V(s) instead of raw return
# A > 0: action better than average → increase probability
# A < 0: action worse than average → decrease probability

# PPO (Proximal Policy Optimization) — state of the art!
# Prevents too-large policy updates (training stability)
# Clip ratio: r(θ) = π_θ(a|s) / π_θold(a|s)
# L_CLIP = E[min(r(θ)A, clip(r(θ), 1-ε, 1+ε)A)]
# Used by: OpenAI (GPT-RLHF), Robotics, Game AI

# FAMOUS MILESTONES:
# DQN (2013-2015):      Atari games from pixels
# AlphaGo (2016):       Beat world champion Lee Sedol
# AlphaZero (2017):     Mastered Chess, Go, Shogi — self-play only!
# OpenAI Five (2019):   Beat world champions in Dota 2
# AlphaFold (2020-21):  Solved protein structure prediction
# ChatGPT (2022):       RLHF for aligned LLMs
```

---

# 13. Evaluation Metrics

## 13.1 Classification Metrics

```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, average_precision_score,
    classification_report
)
import numpy as np

# CONFUSION MATRIX:
#               Predicted
#                Pos  Neg
#  Actual Pos [  TP   FN ]
#         Neg [  FP   TN ]

y_true = [1, 1, 0, 0, 1, 0, 1, 1]
y_pred = [1, 0, 0, 0, 1, 1, 1, 0]

cm = confusion_matrix(y_true, y_pred)
TP, FN, FP, TN = cm[1,1], cm[1,0], cm[0,1], cm[0,0]

# ACCURACY: (TP+TN) / total — misleading for imbalanced data!
accuracy = accuracy_score(y_true, y_pred)

# PRECISION: TP / (TP+FP) — of all predicted positives, how many are truly positive?
# "When model says positive, how often is it right?"
precision = precision_score(y_true, y_pred)

# RECALL (Sensitivity): TP / (TP+FN) — of all actual positives, how many found?
# "What fraction of actual positives did model find?"
recall = recall_score(y_true, y_pred)

# F1 SCORE: harmonic mean of precision and recall
# F1 = 2 × (precision × recall) / (precision + recall)
# Use when: imbalanced classes, want balance between precision and recall
f1 = f1_score(y_true, y_pred)

# Precision-Recall tradeoff:
# High threshold → high precision, low recall (conservative: only say positive if very sure)
# Low threshold  → low precision, high recall (aggressive: say positive often)

# Fbeta: weight precision vs recall
# F2: weights recall 2x (miss fewer actual positives — medical diagnosis)
# F0.5: weights precision 2x (avoid false alarms — spam filter)
from sklearn.metrics import fbeta_score
f2 = fbeta_score(y_true, y_pred, beta=2)

# ROC-AUC: Area Under ROC Curve
# ROC: plots TPR vs FPR at different thresholds
# AUC = 1.0: perfect, AUC = 0.5: random
# Threshold-independent measure
auc = roc_auc_score(y_true, y_pred)

# Full report:
print(classification_report(y_true, y_pred, target_names=['Neg', 'Pos']))

# Multi-class averaging:
# macro: average per-class (equal weight to each class)
# micro: aggregate globally (favors frequent classes)
# weighted: weighted by support (number of true instances per class)
precision_macro = precision_score(y_true_multi, y_pred_multi, average='macro')
```

## 13.2 Regression Metrics

```python
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

y_true = [3, -0.5, 2, 7]
y_pred = [2.5, 0.0, 2, 8]

# MAE: mean absolute error — robust to outliers
mae = mean_absolute_error(y_true, y_pred)   # 0.5

# MSE: mean squared error — penalizes large errors more
mse = mean_squared_error(y_true, y_pred)    # 0.375

# RMSE: root MSE — same units as target
rmse = np.sqrt(mse)                          # 0.612

# MAPE: mean absolute percentage error
# ((actual-predicted)/actual) × 100%
mape = np.mean(np.abs((np.array(y_true) - np.array(y_pred)) / np.array(y_true))) * 100

# R² (coefficient of determination):
# 1.0 = perfect, 0 = no better than predicting mean, negative = worse than mean
r2 = r2_score(y_true, y_pred)              # 0.948
```

## 13.3 Common Pitfalls

```
DATA LEAKAGE: training data contains information about test set
  Leakage types:
    Feature leakage: feature derived from target (e.g., using future data)
    Train-test contamination: scaler fit on ALL data, not just train
    Time series: using future data to predict past
  
  Prevention:
    ALWAYS fit scalers/imputers on TRAIN only, transform test
    Use pipelines to prevent leakage
    Careful with feature engineering — does this feature "look into the future?"

CLASS IMBALANCE:
  Example: fraud detection (0.1% fraud, 99.9% normal)
  Naive model: "always predict normal" → 99.9% accuracy! (useless)
  
  Solutions:
    Oversampling: SMOTE (generate synthetic minority samples)
    Undersampling: randomly remove majority samples
    Class weights: weight_balanced in sklearn
    Threshold tuning: lower threshold → more fraud detected (recall vs precision)
    Evaluation: use F1, AUC, precision-recall curve instead of accuracy

OVERFITTING DETECTION:
  Train accuracy >> Validation accuracy → overfitting
  Fix: more data, regularization, simpler model, early stopping

UNDERFITTING DETECTION:
  Both train and validation accuracy low
  Fix: more complex model, more features, less regularization

DISTRIBUTION SHIFT:
  Model trained on distribution P(x) but deployed on Q(x) ≠ P(x)
  Example: train on 2020 data, deploy in 2024 — world changed!
  Fix: continuous monitoring, model retraining, domain adaptation
```

---

# 14. AI Ethics & Practical Concepts

## 14.1 Bias & Fairness

```
TYPES OF BIAS:
  Historical bias: training data reflects past discrimination
    → Hiring model trained on biased historical decisions
  Representation bias: certain groups underrepresented in training data
    → Face recognition fails on darker skin tones (trained mostly on light skin)
  Measurement bias: proxy variables capture bias
    → Using zip code (correlates with race) as credit risk feature
  Aggregation bias: ignoring subgroup differences
    → Medical model trained on mostly male data, worse for women

FAIRNESS METRICS (often in tension!):
  Demographic parity: equal positive rates across groups
  Equalized odds: equal TPR and FPR across groups
  Individual fairness: similar individuals treated similarly
  
  "Fairness impossibility theorem": can't satisfy all fairness criteria simultaneously!
  Must choose which fairness notion matches the domain ethics

MITIGATION STRATEGIES:
  Pre-processing: rebalance/reweight training data
  In-processing: fairness constraints in training objective
  Post-processing: calibrate outputs differently per group
  Transparency: explainable AI (LIME, SHAP, attention maps)
```

## 14.2 Explainability

```python
# SHAP (SHapley Additive exPlanations):
# Attribute prediction to each feature — how much each feature contributed
import shap

explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test)

# Waterfall plot for single prediction:
shap.plots.waterfall(shap_values[0])

# Summary plot for all features:
shap.summary_plot(shap_values, X_test, feature_names=feature_names)

# LIME (Local Interpretable Model-agnostic Explanations):
# Train simple linear model LOCALLY around the prediction to explain
from lime.lime_tabular import LimeTabularExplainer

explainer = LimeTabularExplainer(X_train, feature_names=feature_names)
exp = explainer.explain_instance(X_test[0], model.predict_proba, num_features=10)
exp.show_in_notebook()
```

## 14.3 MLOps Concepts

```
MLOps = DevOps for Machine Learning

KEY CHALLENGES in production ML:
  Training-serving skew: code/data different in train vs production
  Data drift: input distribution changes over time
  Model decay: model performance degrades as world changes
  Reproducibility: can you recreate the exact model from 6 months ago?

ML PIPELINE:
  Data ingestion → Data validation → Feature engineering
  → Model training → Model evaluation → Model serving
  → Monitoring → Retraining trigger

FEATURE STORE:
  Centralized repository of features
  Online store: low-latency serving (Redis)
  Offline store: batch training (Parquet, Hive)
  Feature reuse, consistency between train and serve

MODEL REGISTRY:
  Version control for models (MLflow, W&B, Vertex AI)
  Track: parameters, metrics, artifacts, lineage

MONITORING:
  Data drift: input distribution changed (KL divergence, PSI)
  Prediction drift: output distribution changed
  Model performance: accuracy, AUC degraded on recent data
  Infrastructure: latency, memory, throughput

RETRAINING STRATEGIES:
  Scheduled: retrain every week regardless
  Triggered: retrain when metrics drop below threshold
  Continuous: online learning, model updates with each new data point
```

## 14.4 Modern AI Concepts

```
LARGE LANGUAGE MODELS (LLMs):
  Trained on massive text corpora
  In-context learning: few-shot examples in prompt → adapt without retraining
  Chain-of-thought: "Let's think step by step" → better reasoning
  RLHF: Reinforcement Learning from Human Feedback → align with human preferences

PROMPT ENGINEERING:
  Zero-shot: "Classify: is this spam? 'Claim your prize!'"
  Few-shot: provide examples in prompt
  Chain-of-thought: ask model to show reasoning
  Role prompting: "You are an expert Java developer..."
  ReAct: Reason + Act (tool use with reasoning)

RAG (Retrieval-Augmented Generation):
  Retrieval: find relevant documents from knowledge base (vector search)
  Augmentation: add retrieved context to prompt
  Generation: LLM generates answer using context
  Combines parametric (model weights) + non-parametric (retrieved) knowledge

VECTOR DATABASES (for RAG):
  Embed text → dense vector, store in vector DB
  Similarity search: cosine similarity, dot product
  Examples: Pinecone, Weaviate, Qdrant, pgvector

FINE-TUNING vs PROMPTING:
  Prompting: no training, fast, flexible (but limited by context window)
  LoRA/QLoRA: efficient fine-tuning (trains only low-rank adapters)
  Full fine-tuning: most powerful but expensive

EVALUATION of LLMs:
  Benchmarks: MMLU, HellaSwag, ARC, TruthfulQA
  Human evaluation: preferred response, safety rating
  LLM-as-judge: use stronger model to evaluate weaker one
```

---

## 📎 Quick Reference

```
SEARCH ALGORITHMS:
  BFS:   complete, optimal (unit cost), O(b^d) time/space
  DFS:   incomplete, not optimal, O(b*m) space
  UCS:   complete, optimal (any cost), Dijkstra for search
  IDDFS: complete, optimal (unit cost), O(b^d) time, O(b*d) space ← BEST uninformed
  A*:    complete, optimal (admissible h), O(b^d) but much better with good h

HEURISTICS:
  Admissible: never overestimates → A* optimal
  Consistent: h(n) ≤ c(n,n') + h(n') → A* never revisits
  Dominant: h2 ≥ h1 → h2 expands fewer nodes

GAME SEARCH:
  Minimax: O(b^m), optimal against optimal player
  Alpha-beta: O(b^(m/2)) best case with good move ordering

ML FUNDAMENTALS:
  Bias-Variance: total error = bias² + variance + noise
  Overfitting: complex model → low train, high test error
  Underfitting: simple model → high train AND test error

NEURAL NETWORK ACTIVATIONS:
  Hidden: ReLU (default), Leaky ReLU, GELU
  Output (binary clf): Sigmoid
  Output (multi-class): Softmax
  Output (regression): Linear

EVALUATION:
  Accuracy: good for balanced classes
  F1: good for imbalanced classes
  AUC-ROC: threshold-independent
  R²: regression quality
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| CS50 AI (Harvard, free) | https://cs50.harvard.edu/ai/ |
| Deep Learning Book | https://www.deeplearningbook.org/ |
| fast.ai (practical DL) | https://course.fast.ai/ |
| PyTorch Tutorial | https://pytorch.org/tutorials/ |
| Scikit-learn User Guide | https://scikit-learn.org/stable/user_guide.html |
| OpenAI Spinning Up (RL) | https://spinningup.openai.com/ |
| Hugging Face NLP Course | https://huggingface.co/learn/nlp-course/ |
| Stanford CS229 (ML) | https://cs229.stanford.edu/ |
| Stanford CS231n (CNN) | http://cs231n.stanford.edu/ |
| Stanford CS224n (NLP) | http://web.stanford.edu/class/cs224n/ |
| RLHF Paper | https://arxiv.org/abs/2203.02155 |
| Attention Is All You Need | https://arxiv.org/abs/1706.03762 |
| AlphaGo Paper | https://www.nature.com/articles/nature16961 |
| Google AI Principles | https://ai.google/principles/ |
| AI Safety (Anthropic) | https://www.anthropic.com/research |

---

*Học theo thứ tự: Search (BFS/DFS) → Heuristics → A* → Minimax/Alpha-Beta → ML fundamentals → Decision Trees → Neural Networks → Deep Learning → RL*
