# 🚀 Software Development Process — Complete Deep Dive
> Agile, Scrum, Kanban, Waterfall, DevOps, CI/CD và Quy trình Phát triển Phần mềm

---

## 📚 Table of Contents

1. [SDLC — Software Development Life Cycle](#1-sdlc--software-development-life-cycle)
2. [Waterfall Model](#2-waterfall-model)
3. [Agile Manifesto & Principles](#3-agile-manifesto--principles)
4. [Scrum Framework](#4-scrum-framework)
5. [Kanban](#5-kanban)
6. [SAFe — Scaled Agile](#6-safe--scaled-agile)
7. [Scrum of Scrums](#7-scrum-of-scrums)
8. [Requirements Engineering](#8-requirements-engineering)
9. [Software Testing](#9-software-testing)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [DevOps Culture](#11-devops-culture)
12. [Project Estimation & Planning](#12-project-estimation--planning)

---

# 1. SDLC — Software Development Life Cycle

## 1.1 Overview

```
SDLC = quy trình có cấu trúc để lập kế hoạch, tạo, kiểm thử và deliver phần mềm

Phases:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Planning → Analysis → Design → Implementation → Testing →     │
│  Deployment → Maintenance                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

1. PLANNING
   - Xác định scope, mục tiêu, timeline, budget
   - Feasibility study (technical, financial, operational)
   - Resource planning (team, tools, infrastructure)
   - Risk identification

2. REQUIREMENTS ANALYSIS
   - Thu thập yêu cầu từ stakeholders
   - Functional requirements: hệ thống làm gì?
   - Non-functional requirements: performance, security, scalability
   - Business requirements: tại sao cần?
   - Output: SRS (Software Requirements Specification)

3. SYSTEM DESIGN
   - High-level design: kiến trúc, modules, data flow
   - Low-level design: class diagrams, DB schema, API contracts
   - Technology stack selection
   - Output: Design Document, Architecture Diagram

4. IMPLEMENTATION (CODING)
   - Developers write code theo design
   - Code review, pair programming
   - Version control (Git)
   - Unit testing trong quá trình code

5. TESTING
   - Unit, Integration, System, UAT testing
   - Bug tracking và fixing
   - Performance testing
   - Security testing

6. DEPLOYMENT
   - Deploy lên production environment
   - User training (nếu cần)
   - Cutover strategy (phased, big bang, parallel run)

7. MAINTENANCE
   - Bug fixes
   - Feature enhancements
   - Performance optimization
   - Security patches
```

## 1.2 SDLC Models So Sánh

```
                Waterfall   Iterative   Spiral   Agile/Scrum
Planning        Upfront     Partial     Full     Minimal/Just-in-time
Flexibility     Very low    Medium      Medium   Very high
Customer input  Start+end   Per iter.   All      Continuous
Risk mgmt       Low         Medium      High     Adaptive
Team size       Any         Any         Large    Small (5-9)
Requirements    Fixed       Semi-fixed  Fixed    Changing OK
Documentation   Heavy       Medium      Heavy    Light
Delivery        End         Per iter.   Per iter.Sprints (2-4w)
Best for        Known req.  Medium risk High risk Uncertain/changing

PREDICTIVE vs ADAPTIVE:
  Predictive (Plan-driven): Waterfall, V-Model
    Requirements fully defined upfront
    Works well when: stable requirements, regulated industries
    Risk: late discovery of problems

  Adaptive (Change-driven): Agile, Scrum, Kanban
    Embrace change, deliver incrementally
    Works well when: unclear/changing requirements, fast markets
    Risk: scope creep if not managed
```

---

# 2. Waterfall Model

> 📖 Introduced by Winston Royce (1970), despite being called "flawed"

## 2.1 Phases

```
┌─────────────────────────────────────────────────────────────┐
│  1. Requirements                                            │
│     ↓ (only move down when phase complete)                  │
│  2. System Design                                           │
│     ↓                                                       │
│  3. Implementation                                          │
│     ↓                                                       │
│  4. Integration & Testing                                   │
│     ↓                                                       │
│  5. Deployment                                              │
│     ↓                                                       │
│  6. Maintenance                                             │
└─────────────────────────────────────────────────────────────┘

Key characteristic: each phase COMPLETES before next begins
No going back! (In theory)
```

## 2.2 Waterfall Documents

```
Phase               Document
────────────────────────────────────────────────────────────
Requirements        BRD (Business Requirements Document)
                    SRS (Software Requirements Specification)
                    Use Case Document

System Design       SAD (System Architecture Document)
                    HLD (High Level Design)
                    LLD (Low Level Design)
                    DB Design Document

Implementation      Source Code
                    Unit Test Results
                    Code Review Reports

Testing             Test Plan
                    Test Cases
                    Test Execution Report
                    Bug Reports
                    Test Summary Report

Deployment          Deployment Plan
                    Release Notes
                    User Manual

Maintenance         Change Request Log
                    Incident Reports
                    Patch Notes
```

## 2.3 Waterfall Strengths & Weaknesses

```
✅ STRENGTHS:
  Clear structure và documentation
  Easy to understand và manage
  Well-defined phases và milestones
  Works when requirements are very stable and clear
  Required in regulated industries (banking, defense, medical)
  Easy to estimate cost and timeline upfront
  Clear division of responsibility

❌ WEAKNESSES:
  Inflexible — very hard to change requirements mid-project
  Customer only sees product at the END (late feedback)
  Testing happens too late (bugs expensive to fix)
  "Working in silos" — teams don't interact much
  High risk of "Big Bang" delivery failure
  Doesn't adapt well to changing business needs
  Assumes requirements can be 100% defined upfront (rarely true!)

Real-world problems with Waterfall:
  The "90% done" problem: everything seems fine until integration!
  Requirements that made sense 1 year ago are now wrong
  Customer says "that's not what I wanted" only at delivery
  Technology landscape changes during long development
  
When Waterfall STILL makes sense:
  Fixed-price government/military contracts
  Projects with stable, well-understood requirements
  Regulatory compliance (FDA, DO-178C for avionics)
  Short projects with clear scope
  Hardware development (physical constraints)
```

## 2.4 V-Model (Variation of Waterfall)

```
Verification        ←————→    Validation
(Are we building it right?)  (Are we building the right thing?)

Requirements    ←──────────────────────────→  Acceptance Testing
    ↓                                              ↑
System Design   ←──────────────────────────→  System Testing
    ↓                                              ↑
Architecture    ←──────────────────────────→  Integration Testing
    ↓                                              ↑
Module Design   ←──────────────────────────→  Unit Testing
    ↓                                              ↑
           ←────── IMPLEMENTATION ──────→

Each LEFT phase has corresponding RIGHT test phase
Testing is planned WHILE designing (not after!)
Popular in Germany, automotive industry (ASPICE), medical devices
```

---

# 3. Agile Manifesto & Principles

> 📖 https://agilemanifesto.org/ (signed 2001, Snowbird Utah by 17 developers)

## 3.1 The Agile Manifesto

```
We are uncovering better ways of developing software
by doing it and helping others do it.
Through this work we have come to value:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Individuals and interactions  OVER  processes and tools   │
│                                                             │
│  Working software              OVER  comprehensive docs    │
│                                                             │
│  Customer collaboration        OVER  contract negotiation  │
│                                                             │
│  Responding to change          OVER  following a plan      │
│                                                             │
│  That is, while there IS value in the items on the right,  │
│  we VALUE the items on the LEFT more.                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Ý nghĩa thực tế:
  - Team communication > tools và processes
  - Phần mềm chạy được > tài liệu đầy đủ (nhưng không phải không có docs!)
  - Làm việc cùng khách hàng > contract cứng nhắc
  - Thích nghi với thay đổi > follow plan mù quáng
```

## 3.2 12 Agile Principles

```
1. CUSTOMER SATISFACTION THROUGH EARLY DELIVERY
   "Satisfy the customer through early and continuous delivery
    of valuable software."
   → Release sớm, release thường xuyên, lấy feedback

2. WELCOME CHANGING REQUIREMENTS
   "Welcome changing requirements, even late in development.
    Agile processes harness change for competitive advantage."
   → Thay đổi = opportunity, không phải problem

3. DELIVER WORKING SOFTWARE FREQUENTLY
   "Deliver working software frequently, from a couple of weeks
    to a couple of months, with a preference to the shorter timescale."
   → Sprint 2 tuần, không phải 1 năm mới release

4. BUSINESS + DEVELOPERS WORK TOGETHER DAILY
   "Business people and developers must work together daily
    throughout the project."
   → PO/BA ngồi cùng team, không phải email qua lại

5. BUILD AROUND MOTIVATED INDIVIDUALS
   "Build projects around motivated individuals.
    Give them the environment and support they need."
   → Trust your team, remove obstacles

6. FACE-TO-FACE CONVERSATION
   "The most efficient and effective method of conveying information
    is face-to-face conversation."
   → Daily standup, không phải 10-page status reports

7. WORKING SOFTWARE IS PRIMARY MEASURE OF PROGRESS
   "Working software is the primary measure of progress."
   → Done = working, not "80% coded"

8. SUSTAINABLE DEVELOPMENT PACE
   "Agile processes promote sustainable development.
    Sponsors, developers, and users should be able to maintain
    a constant pace indefinitely."
   → No death marches, no crunch culture

9. CONTINUOUS ATTENTION TO TECHNICAL EXCELLENCE
   "Continuous attention to technical excellence and good design
    enhances agility."
   → Refactoring, clean code, TDD = not luxury but necessity

10. SIMPLICITY
    "The art of maximizing the amount of work not done is essential."
    → YAGNI (You Aren't Gonna Need It), MVP first

11. SELF-ORGANIZING TEAMS
    "The best architectures, requirements, and designs emerge from
     self-organizing teams."
    → Team decides HOW, not just top-down assignments

12. REFLECT AND ADJUST
    "At regular intervals, the team reflects on how to become more
     effective, then tunes and adjusts its behavior accordingly."
    → Sprint retrospectives, kaizen mindset
```

## 3.3 Agile Frameworks So Sánh

```
                Scrum       Kanban      XP          SAFe
Timeboxing      Yes (Sprint) No         Yes (iter.) Yes (PI)
Roles defined   Yes (3)     No          Yes (5)     Many
Ceremonies      5           None        Several     Many
Work in progress Sprint     WIP limits  Iter.       PI
Best for        Complex     Maintenance Code quality Enterprise
Team size       5-9         Any         2-12        100+
Release cadence Sprint      Continuous  Continuous  PI Planning
Customer role   PO role     Varies      On-site     Product Mgmt
```

---

# 4. Scrum Framework

> 📖 https://scrumguides.org/ (Schwaber & Sutherland, 2020)

## 4.1 Scrum Overview

```
Scrum = lightweight framework for complex product development
"Not a process or technique but a framework within which you can employ
 various processes and techniques"

3 Pillars (Empirical Process Control):
  TRANSPARENCY: mọi người đều thấy thực trạng
  INSPECTION:   thường xuyên kiểm tra artifacts + progress
  ADAPTATION:   điều chỉnh khi deviation được phát hiện

5 Values:
  COMMITMENT: team cam kết đạt Sprint Goal
  COURAGE:    làm điều đúng, giải quyết vấn đề khó
  FOCUS:      tập trung vào Sprint Goal
  OPENNESS:   cởi mở về công việc và thách thức
  RESPECT:    tôn trọng lẫn nhau

Scrum Rhythm:
┌──────────────────────────────────────────────────────────────────┐
│  Product        Sprint         Sprint        Sprint              │
│  Backlog        Planning       Execution     Review + Retro      │
│  Refinement     (4-8h)        (1-4 weeks)   (2-3h + 1.5-3h)    │
│  (ongoing)      ↓              ↓             ↓                   │
│               Sprint        Daily          Increment            │
│               Backlog       Standup        + Retro              │
│                             (15min/day)    Improvements         │
└──────────────────────────────────────────────────────────────────┘
```

## 4.2 Scrum Roles

```
┌──────────────────────────────────────────────────────────────────┐
│  PRODUCT OWNER (PO)                                              │
│                                                                  │
│  Accountable for WHAT to build and in what ORDER                 │
│  Responsibilities:                                               │
│    - Owns and manages the Product Backlog                        │
│    - Defines and prioritizes User Stories                        │
│    - Sets Sprint Goals                                           │
│    - Accepts or rejects Sprint Increments                        │
│    - Represents stakeholders and customers                       │
│    - Says NO (just as important as yes!)                         │
│    - Maximizes VALUE delivered                                   │
│                                                                  │
│  ⚠️  NOT: project manager, proxy for team, micromanager         │
│  ⚠️  Must be AVAILABLE to team (answer questions daily)         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  SCRUM MASTER (SM)                                               │
│                                                                  │
│  Accountable for Scrum's EFFECTIVENESS                           │
│  Responsibilities:                                               │
│    - Coach team on Scrum theory and practices                    │
│    - Remove impediments (blockers) for team                      │
│    - Facilitate Scrum events                                     │
│    - Help PO with backlog management                             │
│    - Help organization adopt Scrum                               │
│    - Shield team from external interference                      │
│    - Servant-leader (not boss!)                                  │
│                                                                  │
│  ⚠️  NOT: project manager, team lead, status reporter           │
│  The goal: make themselves unnecessary (self-sufficient team)    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  DEVELOPERS (Development Team)                                   │
│                                                                  │
│  Accountable for creating DONE increments each Sprint           │
│  Characteristics:                                                │
│    - Self-organizing: THEY decide HOW                            │
│    - Cross-functional: all skills needed are IN the team        │
│    - No titles/hierarchy (everyone = "Developer" in Scrum)      │
│    - Size: 3-9 people (5-7 optimal)                             │
│                                                                  │
│  Responsibilities:                                               │
│    - Sprint Planning: select + plan Sprint Backlog              │
│    - Daily Standup: inspect progress, adapt plan                │
│    - Create "Done" increment                                     │
│    - Participate in all Scrum events                             │
│    - Definition of Done adherence                               │
│                                                                  │
│  Includes: developers, QA, UX, BA (anyone who builds product)   │
└──────────────────────────────────────────────────────────────────┘
```

## 4.3 Scrum Events (Ceremonies)

```
THE SPRINT: time-boxed iteration (1-4 weeks, usually 2 weeks)
  - Fixed length, never shortened or extended
  - No changes that endanger Sprint Goal
  - Product Backlog refinement as needed
  - Scope can be clarified with PO

────────────────────────────────────────────────────────────────

SPRINT PLANNING: What will we do? How will we do it?
  WHO:  PO + Scrum Master + Developers
  WHEN: Start of Sprint
  HOW LONG: max 8 hours for 4-week sprint (proportional)
  
  Part 1 — WHY (Sprint Goal):
    PO proposes Sprint Goal based on business need
    Team discusses and agrees on Sprint Goal
  
  Part 2 — WHAT (Sprint Backlog):
    Team selects items from Product Backlog
    Clarify details with PO
    Select how many stories based on velocity/capacity
  
  Part 3 — HOW (Tasks):
    Developers break stories into tasks (usually 4-8 hours each)
    Identify dependencies and risks
    Estimate (hours or story points)
  
  Output: Sprint Goal + Sprint Backlog (stories + tasks)

────────────────────────────────────────────────────────────────

DAILY SCRUM (Daily Standup): 15 minutes, same time/place
  WHO:  Developers (PO + SM optional/observers)
  WHEN: Every day of Sprint
  PURPOSE: Inspect progress toward Sprint Goal, adapt Sprint plan
  
  Classic 3 questions (one approach — not mandatory):
    What did I do yesterday to progress toward Sprint Goal?
    What will I do today?
    Any impediments in my way?
  
  Modern approach (goal-focused):
    Are we on track to meet Sprint Goal?
    What needs attention today?
    Who needs help?
  
  ⚠️  NOT a status report to Scrum Master/PO!
  ⚠️  Longer discussions → park and address AFTER standup
  ⚠️  Should be energizing, not a chore

────────────────────────────────────────────────────────────────

SPRINT REVIEW: Inspect the increment and adapt Product Backlog
  WHO:  Scrum Team + Stakeholders (customers, management...)
  WHEN: End of Sprint
  HOW LONG: max 4 hours for 4-week sprint
  
  Agenda:
    1. PO explains Sprint Goal and what was/wasn't completed
    2. Team demos WORKING software (not slides, not reports!)
    3. Stakeholders give feedback
    4. PO updates Product Backlog based on feedback
    5. Discuss what to do next
  
  ⚠️  Demo only DONE items (meets Definition of Done)
  ⚠️  If not Done, do NOT demo — return to backlog
  ⚠️  Not a status meeting — it's a collaborative review
  
  Output: Revised Product Backlog, lessons learned, next steps

────────────────────────────────────────────────────────────────

SPRINT RETROSPECTIVE: How can we improve?
  WHO:  Scrum Team (no external stakeholders typically)
  WHEN: After Sprint Review, before next Sprint Planning
  HOW LONG: max 3 hours for 4-week sprint
  
  Purpose: inspect team processes, tools, relationships, Definition of Done
  
  Classic format (Start/Stop/Continue):
    START: things we should start doing
    STOP:  things we should stop doing
    CONTINUE: things working well that we should keep
  
  Other formats:
    4 L's: Liked, Learned, Lacked, Longed for
    Sailboat: wind (helps), anchors (slows), rocks (risks), destination
    Mad/Sad/Glad: emotional check-in
    5 Whys: root cause analysis of top issue
  
  Output: Action items with owners (max 3 improvements per sprint)
  
  ⚠️  Improvement MUST be actionable and specific
  ⚠️  Follow up on previous retro actions!
  ⚠️  Psychological safety is essential — blame-free environment
```

## 4.4 Scrum Artifacts

```
┌──────────────────────────────────────────────────────────────────┐
│  PRODUCT BACKLOG                                                 │
│                                                                  │
│  Owned by: Product Owner                                         │
│  Contains: ALL work that might be done for the product          │
│  Format: User Stories, Epics, Bugs, Technical Debt, Spikes      │
│                                                                  │
│  DEEP END (top, high priority, Sprint-ready):                    │
│    Small, estimated, detailed, clear acceptance criteria        │
│    → Ready to be pulled into Sprint                              │
│                                                                  │
│  SHALLOW END (bottom, low priority):                             │
│    Large, vague, un-estimated, rough ideas                       │
│    → Gets refined over time as priority increases               │
│                                                                  │
│  Commitment: PRODUCT GOAL                                        │
│    Long-term objective the product is working toward            │
│    Each Sprint should bring product closer to Product Goal      │
│                                                                  │
│  Product Backlog Refinement (ongoing, not official ceremony):    │
│    Adding detail, estimates, and order to backlog items          │
│    Should consume max 10% of team's time                        │
│    Goal: keep top of backlog "Sprint-ready"                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  SPRINT BACKLOG                                                  │
│                                                                  │
│  Owned by: Developers                                            │
│  Contains:                                                       │
│    - Sprint Goal (WHY)                                           │
│    - Selected Product Backlog Items (WHAT)                       │
│    - Plan for delivering Increment (HOW — tasks)                 │
│                                                                  │
│  Updated daily (in Daily Scrum or as work progresses)           │
│  Visible to all (burndown chart, task board)                    │
│                                                                  │
│  Commitment: SPRINT GOAL                                         │
│    Single objective for the Sprint                               │
│    Gives team flexibility in WHAT is done to achieve it         │
│    All items in Sprint should contribute to Sprint Goal         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  INCREMENT                                                       │
│                                                                  │
│  Each Sprint must produce a usable Increment                    │
│  "Concrete stepping stone toward Product Goal"                  │
│  Must meet Definition of Done                                   │
│  Additive: each Sprint's increment adds to previous ones        │
│  Can be released or not — PO decides                            │
│                                                                  │
│  Commitment: DEFINITION OF DONE (DoD)                           │
│    Shared understanding of what "done" means                    │
│    Quality checklist for every piece of work                    │
│    Example DoD:                                                  │
│      ✅ Code written and reviewed (peer review)                  │
│      ✅ Unit tests written and passing                           │
│      ✅ Integration tests passing                                │
│      ✅ No known critical/high bugs                              │
│      ✅ Documentation updated                                    │
│      ✅ Merged to main branch                                    │
│      ✅ Deployed to staging environment                         │
│      ✅ Acceptance criteria met (verified with PO)              │
└──────────────────────────────────────────────────────────────────┘
```

## 4.5 User Stories

```
USER STORY FORMAT:
  "As a [type of user],
   I want [to do something],
   So that [I get some benefit / value]"

Examples:
  "As a returning customer,
   I want to save my payment info,
   So that I can checkout faster next time."

  "As a bank teller,
   I want to see a customer's transaction history,
   So that I can answer their questions without calling support."

INVEST Criteria (good user story checklist):
  I — Independent  : story can be developed separately
  N — Negotiable   : details can be discussed/changed
  V — Valuable     : delivers value to user/business
  E — Estimable    : team can estimate it
  S — Small        : can be completed in 1 sprint
  T — Testable     : has clear acceptance criteria

ACCEPTANCE CRITERIA:
  Specific conditions that must be met for story to be "Done"
  Written in Given/When/Then (Gherkin) format:

  Feature: Save Payment Info
    Scenario: Successfully save credit card
      GIVEN I am on the checkout page
       AND I have entered valid credit card details
      WHEN I click "Save this card for future purchases"
      THEN my card should be saved to my account
       AND I should see "Card ending in 4242 saved" confirmation
       AND on next checkout, my saved card should be pre-selected

  Or simple checklist format:
    - [ ] User can save card during checkout
    - [ ] Saved cards appear in account settings
    - [ ] User can delete saved cards
    - [ ] Max 5 cards per account
    - [ ] Sensitive data masked (show only last 4 digits)

STORY SPLITTING (F.I.R.S.T):
  When story is too big for 1 sprint, split by:
    By workflow steps: "As user I can search products" →
      - Search by name
      - Search by category
      - Filter by price range
    By CRUD: create, read, update, delete as separate stories
    By happy path then edge cases
    By user role
    By performance: basic then fast

EPICS vs FEATURES vs STORIES:
  Epic   : large body of work, spans multiple sprints
             "User Authentication System"
  Feature: subset of epic, group of related stories
             "Login with Social Accounts"
  Story  : independently deliverable unit of value
             "Login with Google account"
  Task   : technical subtask within a story
             "Implement OAuth2 callback handler"
  Bug    : defect to fix
  Spike  : time-boxed research/exploration (no deliverable)
```

## 4.6 Story Points & Velocity

```
STORY POINTS:
  Relative measure of complexity, effort, risk, uncertainty
  NOT hours! Not person-days!
  Team-specific unit (your 5 ≠ another team's 5)
  
  Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21, 40, 100, ∞
  (Why Fibonacci? Gaps increase as complexity increases, 
   reflecting uncertainty in bigger items)

ESTIMATION TECHNIQUES:

Planning Poker:
  1. PO reads user story
  2. Team asks clarifying questions
  3. Each member privately selects card (1,2,3,5,8,13,21...)
  4. All reveal simultaneously
  5. Outliers explain reasoning
  6. Discuss, re-estimate until consensus
  
  Why simultaneous? Prevent anchoring bias
  Why discuss outliers? They often have info others missed

T-Shirt Sizing (for quick high-level estimation):
  XS, S, M, L, XL, XXL
  Later mapped to story points
  Useful for roadmap planning

Affinity Estimation (for bulk estimation):
  Place stories into size buckets (XS to XXL) silently
  Then discuss disagreements
  Fast for large backlogs

VELOCITY:
  Average story points completed per sprint over last 3-5 sprints
  
  Sprint 1: 32 points
  Sprint 2: 28 points
  Sprint 3: 35 points
  Sprint 4: 31 points
  Sprint 5: 34 points
  Average velocity: (32+28+35+31+34)/5 = 32 points/sprint
  
  Use for: sprint capacity planning, release date forecasting
  
  "When will feature X be ready?"
  Feature X: 95 story points remaining
  Velocity: 32 points/sprint
  Estimated: ~3 sprints (but add buffer!)
  
  ⚠️  Velocity is a PLANNING tool, not a performance metric!
  ⚠️  Don't compare velocities between teams
  ⚠️  Velocity naturally varies — use range not single number

CAPACITY PLANNING:
  Sprint capacity = (team members × days in sprint × focus factor)
  Focus factor: usually 60-70% (meetings, reviews, interruptions)
  
  Example:
    5 developers × 10 days × 70% focus = 35 developer-days
    If avg story point = 1 developer-day → capacity ~35 points
    (But use historical velocity to validate!)
```

## 4.7 Scrum Board & Burndown Chart

```
SCRUM BOARD (Sprint Board):
  Visual representation of Sprint Backlog

  TO DO  │  IN PROGRESS  │  IN REVIEW  │  DONE
  ───────┼───────────────┼─────────────┼──────
  [S01]  │    [S03]      │   [S05]     │ [S02]
  [S04]  │               │             │ [S06]
  [S07]  │    [S08]      │             │
  
  Stories broken into tasks:
  [Story: Login with Google]
    → [Task: OAuth2 setup]         — IN PROGRESS
    → [Task: DB user creation]     — TO DO
    → [Task: Frontend callback]    — TO DO
    → [Task: Write unit tests]     — TO DO
    → [Task: Integration test]     — TO DO

BURNDOWN CHART:
  Shows remaining work over Sprint duration
  X-axis: Sprint days
  Y-axis: Remaining story points

  Ideal burndown (straight line from 40pt day 1 to 0pt day 10):
  
  40 │╲
  32 │  ╲   (ideal line)
  24 │    ╲
  16 │      ╲
   8 │        ╲
   0 │──────────╲
     D1 D2 D3 D4 D5 D6 D7 D8 D9 D10
  
  Real burndown might show:
    Flat at start (tasks being added)
    Steep drops (story completed)
    Goes UP (scope added mid-sprint!)
    Doesn't reach 0 (sprint didn't complete)

BURNUP CHART (alternative):
  Shows completed work (going UP) vs total scope
  Better shows scope changes (scope line changes too)
  
  50 │──────────────── SCOPE LINE
  40 │            ╱
  30 │         ╱
  20 │      ╱
  10 │   ╱  ← completed work
   0 │╱
     D1 D2 D3 D4 D5 D6 D7 D8 D9 D10

CUMULATIVE FLOW DIAGRAM (CFD):
  Shows work in each column over time
  Highlights: WIP, throughput, cycle time, bottlenecks
  Width of each band = WIP in that state
```

---

# 5. Kanban

> 📖 Originated at Toyota (1940s) → adapted for software by David Anderson (2007)

## 5.1 Kanban Principles

```
Kanban = "signboard" or "visual card" in Japanese

CORE PRACTICES:
1. VISUALIZE THE WORK
   Make all work visible on a board
   Everyone sees the same picture

2. LIMIT WORK IN PROGRESS (WIP)
   Maximum items in each column at any time
   "Stop starting, start finishing!"
   WIP limits expose bottlenecks

3. MANAGE FLOW
   Track cycle time, throughput
   Identify and remove impediments
   
4. MAKE POLICIES EXPLICIT
   Clear definition of done for each stage
   Entry/exit criteria per column
   
5. IMPLEMENT FEEDBACK LOOPS
   Regular reviews (replenishment, ops review, delivery review)
   
6. IMPROVE COLLABORATIVELY, EVOLVE EXPERIMENTALLY
   Make changes based on data (metrics!)
   Small experiments

KANBAN BOARD:
  BACKLOG │ ANALYSIS │  DEV  │ REVIEW │ TEST │  DONE
          │ (WIP: 2) │(WIP:3)│(WIP: 2)│(WIP:2)│
  ────────┼──────────┼───────┼────────┼──────┼──────
  [Item1] │ [Item3]  │[Item5]│[Item6] │[Item8]│[Item9]
  [Item2] │ [Item4]  │[Item7]│        │       │[Item10]
  ...     │          │       │        │       │
```

## 5.2 Kanban Metrics

```
CYCLE TIME:
  Time from "start work" to "done"
  Customer-facing metric: "how long does it take?"
  Goal: reduce and make predictable

LEAD TIME:
  Time from "requested" to "done"
  Includes wait time in backlog
  Lead Time ≥ Cycle Time

THROUGHPUT:
  Number of items completed per time period
  "How many stories/week do we deliver?"
  Planning metric: predict future delivery rate

WIP (Work In Progress):
  Little's Law: Lead Time = WIP / Throughput
  Reduce WIP → reduce Lead Time!
  
  Example:
    WIP = 10 items, Throughput = 2 items/day
    Lead Time = 10/2 = 5 days
    
    Reduce WIP to 4: Lead Time = 4/2 = 2 days (60% improvement!)

FLOW EFFICIENCY:
  Active time / Total lead time × 100%
  Typical: 5-15% (most time is WAITING not WORKING)
  Good: >40%
  
  Item took 10 days: 2 days actual work, 8 days waiting
  Flow efficiency = 2/10 = 20%

SCRUM vs KANBAN:
                  Scrum           Kanban
Iterations        Fixed (Sprint)  Continuous
Velocity          Story points    Throughput + cycle time
WIP limits        Per Sprint      Per column, per stage
Roles             3 defined       None defined
Ceremonies        5 events        Optional cadences
Changes           Next sprint     Anytime (if WIP allows)
Best for          New features    Maintenance + support
```

---

# 6. SAFe — Scaled Agile Framework

> 📖 https://scaledagileframework.com/

## 6.1 Why SAFe?

```
Problem: Agile works well for 1 team (5-9 people)
But enterprise has 50-500+ people across many teams!

Challenges at scale:
  - Multiple teams on same product (dependencies!)
  - Portfolio management (what to build across ALL products?)
  - Alignment: all teams working toward same goals?
  - Release coordination: can't ship when 1 team is ready,
    need all teams aligned
  - Technical practices at scale (architecture, testing)

SAFe solution:
  Organizes teams into ARTs (Agile Release Trains)
  ART = 5-12 teams (50-125 people) that plan and deliver together
  PI Planning = big-room planning every 8-12 weeks
```

## 6.2 SAFe Levels

```
PORTFOLIO LEVEL:
  Strategy: which value streams to invest in?
  Portfolio Kanban: epics at highest level
  WSJF: Weighted Shortest Job First (prioritization)
  OKRs: Objectives and Key Results

LARGE SOLUTION LEVEL (optional for very large):
  Coordinates multiple ARTs
  Solution Train: multiple ARTs building one large solution

PROGRAM LEVEL (ART):
  Agile Release Train (ART): 5-12 Agile teams
  PI (Program Increment): 8-12 weeks of development
    Contains 4-5 Sprints + 1 Innovation & Planning Sprint
  PI Planning: 2-day event for all ART members
    Teams plan their Sprints for the PI
    Identify dependencies (team to team!)
    Risks identified and ROAM'd

TEAM LEVEL:
  Scrum teams with Sprint cadence
  Sprint in sync with PI cadence
  Sync points: ART Sync, PO Sync, Scrum of Scrums

PI PLANNING (the heartbeat of SAFe):
  Who: ALL members of ART (50-125 people!)
  When: Every PI (8-12 weeks)
  Duration: 2 days
  
  Day 1:
    Business context: executive vision, product roadmap
    Team breakouts: plan sprints 1-4 individually
    Draft plans presented to entire ART
    
  Day 2:
    Continue team planning
    Identify cross-team dependencies (Program Board!)
    Risk identification and ROAM
    Confidence vote: thumbs up/down/sideways
    Final plan presentation
    
  Output:
    Team Sprint Plans
    Program Board (dependencies, milestones)
    Risks (ROAM'd: Resolved, Owned, Accepted, Mitigated)
    PI Objectives (what each team commits to)

ROAM (Risk Management):
  R — Resolved:  risk is no longer a concern
  O — Owned:     specific person takes ownership
  A — Accepted:  risk is acknowledged, no action planned
  M — Mitigated: plan exists to reduce probability/impact
```

---

# 7. Scrum of Scrums

## 7.1 Overview

```
Problem: Multiple Scrum teams working on same product
  Team A and Team B both need to modify shared module
  Team B's API changes affect Team A
  Need coordination mechanism!

Scrum of Scrums (SoS):
  Meta-team of representatives from each Scrum team
  Meets regularly to coordinate across teams
  
  NOT a management meeting — it's team coordination

PARTICIPANTS:
  One representative per team (usually tech lead or volunteer)
  Can rotate (different person each time OK)
  Scrum of Scrums Master (SoSM) facilitates
  
FREQUENCY:
  3x per week (or daily for complex projects)
  Same time as Daily Scrum or shortly after
  15-30 minutes
  
4 QUESTIONS (classic format):
  1. What has my team done since last SoS that affects other teams?
  2. What will my team do before next SoS that might affect others?
  3. Are there any impediments affecting our teams' coordination?
  4. Are we about to introduce anything that will block others?
```

## 7.2 Scaling Patterns

```
2-5 TEAMS (Scrum of Scrums sufficient):

  Team A  Team B  Team C
   [rep]   [rep]   [rep]
      \      |      /
       ──────┼──────
             │ Scrum of Scrums
             │ (weekly or 3x/week)

5-10 TEAMS (Scrum of Scrums of Scrums):

  [Team cluster 1]     [Team cluster 2]
  Team A, B, C         Team D, E, F, G
       ↓                     ↓
   SoS rep               SoS rep
       └──────────┬───────────┘
                  │ SoSoS
                  │ (weekly)

NEXUS (Scrum.org framework):
  3-9 Scrum teams building one product
  Nexus Integration Team: ensures integration
  
  Events:
    Nexus Sprint Planning
    Nexus Daily Scrum (dependencies focus)
    Nexus Sprint Review (one product demo)
    Nexus Sprint Retrospective
  
  Nexus Integration Team:
    Product Owner
    Scrum Master
    Developers who resolve integration issues
    (Members may also belong to regular teams)
```

## 7.3 Dependency Management

```
Cross-team dependencies = #1 challenge in multi-team Scrum

PROGRAM BOARD (SAFe) / DEPENDENCY MAP:
  Visual board showing dependencies across teams
  
  Sprint →   SP1    SP2    SP3    SP4
  ─────────────────────────────────────
  Team A  │ [A1]  [A2]   [A3]  [A4]
  Team B  │ [B1]  [B2]   [B3]  [B4]
  Team C  │ [C1]  [C2]   [C3]  [C4]
  
  Arrow: Team B's B2 depends on Team A's A1 completing first
  A1 ────────────→ B2 (B2 is blocked until A1 done)
  
  Color code:
    Green: on track
    Yellow: at risk
    Red: blocked

DEPENDENCY TYPES:
  Producer/Consumer: Team A builds API that Team B consumes
    → Team A should complete SPRINT BEFORE Team B needs it
    → Buffer sprint recommended
    
  Feature dependency: shared component both teams modify
    → Coordinate in SoS
    → Shared team ownership or inner-source model
    
  Sequence dependency: A must happen before B (technical)
    → Map out sequence in PI Planning
    → Identify critical path

BEST PRACTICES:
  "API-first" development: agree on contracts early
  Feature flags: deploy but not activate until all ready
  Component teams vs Feature teams debate:
    Component team: owns one technical layer (DB, API, UI)
      ❌ Cross-component feature needs 3 teams coordinating
    Feature team: end-to-end feature capability
      ✅ Most features completable by one team
      ✅ Better flow, fewer dependencies
      ❌ Needs full-stack skills in every team
  
  Recommendation: Feature teams where possible + shared guilds
```

---

# 8. Requirements Engineering

## 8.1 Types of Requirements

```
FUNCTIONAL REQUIREMENTS (WHAT the system does):
  Features, behaviors, functions
  "The system shall allow users to reset their password via email"
  
  Documented as:
    User Stories (Agile)
    Use Cases (UML)
    Functional Specs (traditional)

NON-FUNCTIONAL REQUIREMENTS (HOW WELL it does it):
  Quality attributes, constraints

  Performance:
    Response time: 95th percentile < 200ms
    Throughput: support 10,000 concurrent users
    Availability: 99.99% uptime
    
  Security:
    All data encrypted at rest (AES-256)
    Authentication: JWT with 24h expiry
    OWASP Top 10 compliance
    
  Scalability:
    Horizontal scaling to 50 nodes
    Handle 10x traffic spikes
    
  Usability:
    WCAG 2.1 Level AA accessibility
    < 3 clicks to complete core user journey
    Mobile-first responsive design
    
  Maintainability:
    Test coverage > 80%
    Max cyclomatic complexity: 10
    
  Compliance:
    GDPR (EU data protection)
    PCI-DSS (payment card industry)
    SOC2 Type II

BUSINESS REQUIREMENTS:
  Why the system is needed (business goal)
  "Increase online sales conversion rate by 15%"

TECHNICAL REQUIREMENTS:
  Implementation constraints
  "Must integrate with existing SAP ERP system"
  "Must run on AWS infrastructure"
```

## 8.2 Writing Good Requirements

```
BAD REQUIREMENTS (common problems):

  Ambiguous:
    ❌ "The system should be fast"
    ✅ "API response time P95 < 200ms, P99 < 500ms under 1000 concurrent users"
  
  Unmeasurable:
    ❌ "The UI should be user-friendly"
    ✅ "New users can complete registration in < 3 minutes with < 5% error rate"
  
  Multiple requirements in one:
    ❌ "Users can login with email/password or Google and also see their profile"
    ✅ Split into: Login with email, Login with Google, View profile
  
  Implementation as requirement:
    ❌ "The system will use PostgreSQL for data storage"
    ✅ "The system will store user data with ACID compliance and support for transactions"
    (unless there's a real constraint to use PostgreSQL)
  
  Inconsistent:
    ❌ One section says "users can have unlimited storage"
       Another says "storage limited to 10GB"

QUALITIES OF GOOD REQUIREMENTS (SMART):
  Specific:    clear and unambiguous
  Measurable:  can be tested/verified
  Achievable:  technically feasible
  Relevant:    aligns with business goals
  Testable:    can write acceptance test for it

REQUIREMENTS PRIORITIZATION (MoSCoW):
  M — Must Have:   critical, system fails without it
  S — Should Have: important but not critical (workaround exists)
  C — Could Have:  nice to have (won't miss if not included)
  W — Won't Have:  explicitly excluded from this release
  
  Common mistake: everything is MUST HAVE → no prioritization
  Rule: Must Have should be ≤ 60% of total scope
```

---

# 9. Software Testing

## 9.1 Testing Pyramid

```
                    ╱───────────────╲
                   ╱   E2E Tests     ╲    Few, Slow, Expensive
                  ╱   (UI, Browser)   ╲
                 ╱─────────────────────╲
                ╱   Integration Tests   ╲  Some, Medium
               ╱   (API, DB, Services)   ╲
              ╱───────────────────────────╲
             ╱       Unit Tests            ╲  Many, Fast, Cheap
            ╱   (functions, methods, class) ╲
           ╱─────────────────────────────────╲

Rule of thumb (Google):
  70% unit, 20% integration, 10% E2E

Unit Tests:
  Test smallest unit in isolation (function, method, class)
  Mock/stub external dependencies
  Fast (ms), hundreds per second
  
Integration Tests:
  Test multiple components together
  Real DB (test instance), real APIs
  Medium speed (seconds)
  
E2E Tests:
  Test complete user flows through UI
  Selenium, Playwright, Cypress
  Slow (minutes), fragile, expensive to maintain

TEST DOUBLES:
  Dummy:  passed but never used (fill parameter list)
  Stub:   returns predefined data (no behavior)
  Spy:    records calls, can assert on them
  Mock:   pre-programmed with expectations
  Fake:   working implementation but shortcuts (in-memory DB)
  
  // Mockito (Java) example:
  UserRepository mockRepo = mock(UserRepository.class);
  when(mockRepo.findById(1L)).thenReturn(Optional.of(user));
  verify(mockRepo, times(1)).findById(1L);
```

## 9.2 Testing Types

```
UNIT TESTING:
  What: individual functions/methods
  Tools: JUnit5, TestNG (Java), Jest (JS), pytest (Python)
  Speed: < 1ms per test
  Run: every commit/push

INTEGRATION TESTING:
  What: multiple components (service + DB, API + cache)
  Tools: Spring Boot Test, @DataJpaTest, Testcontainers
  Speed: seconds
  Run: every PR/merge

CONTRACT TESTING:
  What: API contracts between services (Pact)
  Consumer defines what it expects from API
  Provider verifies it meets those expectations
  Prevents breaking changes without full E2E needed

PERFORMANCE TESTING:
  Load test: normal expected load
  Stress test: beyond normal, find breaking point
  Soak test: sustained load over long period (memory leaks!)
  Spike test: sudden traffic spike
  Tools: JMeter, Gatling, k6, Locust

SECURITY TESTING:
  SAST (Static Application Security Testing): analyze code
    Tools: SonarQube, Checkmarx, Semgrep
  DAST (Dynamic Application Security Testing): running app
    Tools: OWASP ZAP, Burp Suite
  Penetration testing: ethical hackers try to break in

UAT (User Acceptance Testing):
  Business stakeholders verify against requirements
  "Does this solve the business problem?"
  Alpha: internal testing
  Beta: limited external users testing

A/B TESTING (for features):
  50% users get feature A, 50% get feature B
  Measure: conversion, engagement, retention
  Statistical significance before concluding!
  Tools: LaunchDarkly, Optimizely, custom feature flags
```

## 9.3 TDD — Test Driven Development

```
Red → Green → Refactor cycle:

  1. RED: Write failing test FIRST (test doesn't pass yet)
  2. GREEN: Write minimum code to make test pass
  3. REFACTOR: Clean up code, tests still pass

Example:
  // STEP 1: Write failing test
  @Test
  void calculateTax_for_income_50M_should_return_5M() {
      TaxCalculator calc = new TaxCalculator();
      assertEquals(5_000_000, calc.calculate(50_000_000));
  }
  // Run → RED (TaxCalculator doesn't exist)

  // STEP 2: Write minimum code
  class TaxCalculator {
      long calculate(long income) {
          return income * 10 / 100;
      }
  }
  // Run → GREEN

  // STEP 3: Refactor
  class TaxCalculator {
      private static final double TAX_RATE = 0.10;
      long calculate(long income) {
          return Math.round(income * TAX_RATE);
      }
  }
  // Run → still GREEN

Benefits of TDD:
  ✅ Forces clear thinking about requirements before coding
  ✅ Instant feedback (know immediately if you broke something)
  ✅ Built-in regression test suite
  ✅ Better design (testable = loosely coupled, single responsibility)
  ✅ Documentation: tests show HOW to use the code
  ✅ Confidence to refactor
  
Challenges:
  ❌ Learning curve, slower initially
  ❌ Hard for UI code, integration-heavy code
  ❌ Team must commit (1 person not writing tests undermines the rest)

BDD (Behavior Driven Development):
  TDD from user's perspective
  Tests written in natural language (Gherkin)
  
  Feature: User Login
    Scenario: Successful login
      Given I am on the login page
      When I enter valid credentials
      Then I should be redirected to dashboard
      And I should see "Welcome, Khang!" message
      
  Tools: Cucumber (Java), Behave (Python), Cypress (JS)
```

---

# 10. CI/CD Pipeline

> 📖 https://docs.gitlab.com/ee/ci/

## 10.1 CI/CD Overview

```
CI (Continuous Integration):
  Developers frequently merge code → shared mainline (main/master)
  Automated build + test on every merge
  Catch integration issues EARLY (not after 2 weeks!)
  "If it hurts, do it more often" — Martin Fowler

CD (Continuous Delivery):
  Every change that passes CI is RELEASABLE
  Deployment to production is a business decision (not technical)
  One-click deployment to production anytime

CD (Continuous Deployment):
  Every change that passes CI automatically deploys to PRODUCTION
  No human approval needed (high maturity, high trust in tests)
  Companies like Netflix, Amazon deploy hundreds times/day

Pipeline flow:
Code commit
    ↓
Source Control (Git)
    ↓
CI Server trigger (GitHub Actions, GitLab CI, Jenkins)
    ↓
BUILD: compile, package (Maven, Gradle, npm)
    ↓
UNIT TESTS: fast tests (~2 min)
    ↓
STATIC ANALYSIS: SonarQube, linting, security scan
    ↓
INTEGRATION TESTS: API tests, DB tests (~10 min)
    ↓
BUILD DOCKER IMAGE + push to registry
    ↓
DEPLOY to STAGING
    ↓
E2E TESTS on staging (~20 min)
    ↓
PERFORMANCE TESTS (optional, expensive)
    ↓
SECURITY SCAN (DAST on staging)
    ↓
APPROVAL (for prod) — optional human gate
    ↓
DEPLOY to PRODUCTION
    ↓
SMOKE TESTS on prod
    ↓
MONITORING: alerts, metrics, logs
```

## 10.2 GitHub Actions / GitLab CI

```yaml
# .github/workflows/ci-cd.yml (GitHub Actions)

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # JOB 1: Build and Test
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Cache Maven dependencies
        uses: actions/cache@v3
        with:
          path: ~/.m2/repository
          key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
      
      - name: Run tests
        run: mvn -B test
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/testdb
      
      - name: Code coverage check
        run: mvn jacoco:check
        # Fails if coverage < 80%
      
      - name: SonarQube analysis
        run: mvn sonar:sonar
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      
      - name: Upload test report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: target/surefire-reports/

  # JOB 2: Build Docker Image
  build-image:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # JOB 3: Deploy to Staging
  deploy-staging:
    needs: build-image
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Deploy to staging
        run: |
          ssh deploy@staging.example.com \
            "docker pull ghcr.io/${{ github.repository }}:${{ github.sha }} && \
             docker-compose up -d"

  # JOB 4: Deploy to Production (manual approval)
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: 
      name: production
      url: https://myapp.com
    
    steps:
      - name: Deploy to production
        run: ./deploy.sh production ${{ github.sha }}
```

## 10.3 Deployment Strategies

```
BIG BANG DEPLOYMENT:
  Take down old, bring up new — all at once
  Simple but risky
  Downtime required
  No rollback without full re-deployment
  Use: small apps, scheduled maintenance windows

ROLLING DEPLOYMENT:
  Update instances one-by-one (or in batches)
  v1: [S1][S2][S3][S4][S5]
  → Update S1: [S2][S2][S3][S4][S5] (S1 draining)
  → S1 updated: [S1v2][S2][S3][S4][S5]
  → Continue until all updated
  
  ✅ Zero downtime
  ✅ Easy to pause if issues found
  ❌ Both versions running simultaneously (API compatibility needed!)
  ❌ Slow (one at a time)

BLUE-GREEN DEPLOYMENT:
  Blue = current production
  Green = new version being deployed
  Switch traffic from Blue → Green (DNS or LB change)
  
  Blue (v1): [S1][S2][S3]  ← currently serving 100% traffic
  Green(v2): [S4][S5][S6]  ← new version deployed, tested
  
  Flip switch: 100% traffic → Green
  
  ✅ Zero downtime
  ✅ Instant rollback: flip back to Blue
  ✅ Test Green with production traffic before full cutover
  ❌ Requires 2x infrastructure
  ❌ DB migrations must be backward compatible

CANARY DEPLOYMENT:
  Route small % of traffic to new version, gradually increase
  
  v1: ████████████████████████ 95% traffic
  v2: █ 5% traffic (canary users)
  
  Monitor: errors, latency, business metrics
  Good? → 10% → 25% → 50% → 100%
  Bad? → immediate rollback (just route 0% to canary)
  
  ✅ Real production testing with real users
  ✅ Gradual risk exposure
  ✅ Quick rollback
  ❌ Complexity: need traffic splitting capability

FEATURE FLAGS (dark launch):
  Deploy code but hide feature behind flag
  Enable for specific users/% gradually
  Separate deployment from release!
  
  Tools: LaunchDarkly, Unleash, Split.io, Flipt
  
  // Code:
  if (featureFlags.isEnabled('new-checkout', userId)) {
      return newCheckoutFlow()
  } else {
      return legacyCheckoutFlow()
  }
  
  Benefits:
    Ship code continuously without exposing unfinished features
    Kill switch if issues: instantly disable in production
    A/B test: 50% get feature, measure impact
    Gradual rollout: 1% → 5% → 20% → 100%
```

---

# 11. DevOps Culture

## 11.1 DevOps Overview

```
DevOps = Culture + Practices + Tools
Breaks down silos between Development and Operations

Traditional (Waterfall) silos:
  Dev team: "My code is done, throwing over the wall"
  Ops team: "Why are you deploying on Friday?!"
  → Blame culture, slow delivery, fear of change

DevOps goal:
  Shared responsibility for the entire lifecycle
  Dev and Ops work TOGETHER
  Automate everything possible
  Fast feedback loops
  Continuous improvement

CALMS framework:
  C — Culture:         shared ownership, blame-free
  A — Automation:      CI/CD, IaC, testing
  L — Lean:            eliminate waste (waiting, rework)
  M — Measurement:     metrics, monitoring, data-driven
  S — Sharing:         knowledge sharing, transparency

Key metrics (DORA metrics — DevOps Research & Assessment):
  Deployment Frequency: how often to production?
    Elite: multiple/day
    High: weekly
    Medium: monthly
    Low: every 6 months
  
  Lead Time for Changes: commit to production
    Elite: < 1 hour
    High: 1 day - 1 week
    Medium: 1 week - 1 month
    Low: > 1 month
  
  Change Failure Rate: % of deployments causing incidents
    Elite: 0-15%
    Low/Medium: 46-60%
  
  Time to Restore Service: how fast to recover from failure?
    Elite: < 1 hour
    High: < 1 day
    Low: 1 week - 1 month
```

## 11.2 Infrastructure as Code (IaC)

```yaml
# Docker Compose (local development)
version: '3.8'
services:
  app:
    build: .
    ports: ["8080:8080"]
    environment:
      - SPRING_PROFILES_ACTIVE=local
      - DB_URL=jdbc:postgresql://db:5432/myapp
    depends_on:
      db:
        condition: service_healthy
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myapp"]
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    
volumes:
  postgres_data:

# Terraform (cloud infrastructure)
resource "aws_instance" "app" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  
  tags = {
    Name        = "app-server"
    Environment = "production"
  }
}

resource "aws_db_instance" "main" {
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.medium"
  db_name        = "myapp"
  multi_az       = true  # high availability
  
  backup_retention_period = 7  # 7 days backups
}
```

## 11.3 Monitoring & Observability

```
3 PILLARS OF OBSERVABILITY:

1. METRICS (what is happening):
   Quantitative measurements over time
   Types:
     Counter: monotonically increasing (requests, errors)
     Gauge: point-in-time value (memory, connections)
     Histogram: distribution (response time percentiles)
   
   Tools: Prometheus + Grafana
   Key metrics:
     USE Method: Utilization, Saturation, Errors
     RED Method: Rate, Errors, Duration (for services)
     DORA metrics (deployment, incidents)

2. LOGS (what happened in detail):
   Structured logging (JSON) → searchable
   Levels: DEBUG, INFO, WARN, ERROR
   
   // Structured log entry:
   {
     "timestamp": "2025-05-19T10:30:00Z",
     "level": "ERROR",
     "service": "order-service",
     "traceId": "abc123",
     "userId": 1234,
     "message": "Payment failed",
     "error": "Card declined",
     "orderId": 5678
   }
   
   Tools: ELK Stack (Elasticsearch + Logstash + Kibana)
          Loki + Grafana
          AWS CloudWatch, Datadog, Splunk

3. TRACES (how requests flow):
   Distributed tracing: track request across multiple services
   Each operation has: traceId, spanId, parentSpanId, duration
   
   Request: User → API Gateway → Order Service → Payment Service → DB
   
   Trace: ─────────────────────────────── (total: 250ms)
     API Gateway:           ─ (5ms)
     Order Service:           ────────── (220ms)
       DB query:              ─────── (180ms)
       Payment call:                 ── (30ms)
   
   Tools: Jaeger, Zipkin, OpenTelemetry, AWS X-Ray

SLI/SLO/SLA:
  SLI (Service Level Indicator): metric being measured
    "Request success rate = successful / total requests"
  
  SLO (Service Level Objective): target for SLI
    "99.9% of requests succeed over 30-day window"
  
  SLA (Service Level Agreement): contractual commitment
    "If availability drops below 99.9%, customer gets credit"
    SLA is usually less strict than SLO (buffer!)
  
  Error Budget:
    If SLO = 99.9%, error budget = 0.1% = 43.8 min/month
    Use error budget: how much can we risk with new deployments?
    Error budget depleted → freeze deployments, focus on reliability

ALERTING BEST PRACTICES:
  Alert on SYMPTOMS, not CAUSES
    ❌ "CPU is at 80%" (may not be a problem)
    ✅ "Response time P99 > 2s" (users are affected!)
    ✅ "Error rate > 1% for 5 minutes"
  
  Pages (wake up at 3am) only for critical user-impacting issues
  Avoid alert fatigue: too many → people ignore them
  Runbooks: every alert should have a runbook (what to do?)
  
  Tools: PagerDuty, OpsGenie, AlertManager
```

---

# 12. Project Estimation & Planning

## 12.1 Estimation Techniques

```
CONE OF UNCERTAINTY:
  At project start: estimate could be 4x off (0.25x - 4x)
  As project progresses, uncertainty narrows
  At 25% complete: within 1.5x - 0.67x
  
  Don't give precise estimates early in project!
  Give RANGES not single numbers
  "3-6 months" is more honest than "4 months"

THREE-POINT ESTIMATION (PERT):
  O = Optimistic (best case)
  M = Most Likely (normal case)
  P = Pessimistic (worst case, including known risks)
  
  Expected = (O + 4M + P) / 6
  Std Dev  = (P - O) / 6
  
  Example: feature development
    O = 3 days, M = 5 days, P = 15 days (risk: API changes)
    Expected = (3 + 20 + 15) / 6 = 6.3 days
    Std Dev  = (15-3)/6 = 2 days
    So: 6.3 ± 2 days (with ~68% confidence)
    Or: 4.3 - 8.3 days

WHY DEVELOPERS UNDERESTIMATE (Hofstadter's Law):
  "Everything takes longer than you think, even when you
   take Hofstadter's Law into account."
  
  Common causes:
    Unknown unknowns (things you didn't know you didn't know)
    Optimism bias ("I'll do it right the first time")
    Ignoring integration, testing, code review time
    Meeting time, context switching, interruptions
    Bug fixing not accounted for
    Unclear requirements that get clarified during development
  
  Solutions:
    Multiply estimates by 2-3x (empirically validated!)
    Use historical velocity data
    Include buffer for unknowns (20-40% buffer)
    Track estimates vs actuals, improve over time
    "Reference class forecasting": similar past projects took how long?
```

## 12.2 Release Planning

```
PRODUCT ROADMAP:
  High-level view: what's being built over next 3-12 months
  Organized by themes or goals, not specific features
  
  Q1 2025: "Foundation & Core Features"
    → User authentication system
    → Basic dashboard
    → Core API v1
  
  Q2 2025: "Growth Features"
    → Payment integration
    → Analytics dashboard
    → Mobile app v1
  
  Q3 2025: "Scale & Reliability"
    → Performance optimization
    → Advanced reporting
    → Enterprise features

RELEASE PLANNING (in Scrum):
  How many sprints until feature X is done?
  
  Feature X: 50 story points (estimated from backlog)
  Team velocity: 25 points/sprint
  Estimated: 2 sprints minimum
  
  Add buffer (requirements uncertainty, team changes): 3 sprints
  Sprint = 2 weeks → Release in ~6 weeks from now
  
  Release Planning Meeting (every 3-6 sprints):
    Review what's been completed
    Reprioritize backlog
    Forecast next 3-6 sprints
    Communicate timeline to stakeholders

MANAGING STAKEHOLDER EXPECTATIONS:
  "The Iron Triangle" — Pick 2:
    ┌──────────────────────────────────────┐
    │                                      │
    │        Scope                         │
    │         /\                           │
    │        /  \                          │
    │       /    \                         │
    │      /      \                        │
    │ Time ─────── Cost                   │
    │                                      │
    └──────────────────────────────────────┘
  
  You CAN'T: increase scope, reduce time, AND reduce cost
  
  Fix scope + fix time → adjust cost (hire more people)
  Fix scope + fix cost → adjust time (might need more sprints)
  Fix time + fix cost → adjust scope (MVP first)
  
  Most flexible in Agile: scope is variable sprint to sprint
  Deliver highest value items first!

MINIMUM VIABLE PRODUCT (MVP):
  Smallest product that:
    Delivers core value to target users
    Allows learning about market fit
    Can be shipped to real users
  
  NOT: prototype, proof-of-concept, incomplete product
  YES: real, working, just limited scope
  
  Build → Measure → Learn loop:
    Build MVP
    Measure user behavior/feedback
    Learn: are we building the right thing?
    Decide: pivot or persevere?
    Repeat with next increment
```

## 12.3 Definition of Ready vs Done

```
DEFINITION OF READY (DoR):
  Criteria a story must meet BEFORE it can enter a Sprint
  Prevents "underprepared" work entering sprint = waste
  
  Example DoR:
    ✅ User story written in correct format
    ✅ Acceptance criteria clear and testable
    ✅ Story estimated by team (story points assigned)
    ✅ Dependencies identified and resolved (or planned)
    ✅ UI/UX mockups available (if needed)
    ✅ API contracts defined (if integration needed)
    ✅ Fits within a single Sprint (if not, split it)
    ✅ PO has reviewed and approved

DEFINITION OF DONE (DoD):
  Criteria ALL work must meet to be considered DONE
  Ensures quality and releasability
  Applies to EVERY story, every sprint
  
  Basic DoD example:
    ✅ Code written following coding standards
    ✅ Unit tests written (coverage >= 80%)
    ✅ Integration tests pass
    ✅ Code reviewed by ≥ 1 peer
    ✅ No high/critical bugs
    ✅ Deployed to staging environment
    ✅ Acceptance criteria verified with PO
    ✅ Documentation updated (API docs, README)
    ✅ No known technical debt introduced (or documented)
    ✅ Merged to main branch
    ✅ Feature flag configured (if needed)
  
  Extended DoD for regulated industries:
    ✅ Security review completed
    ✅ Accessibility (WCAG 2.1 AA) verified
    ✅ Performance benchmarks met
    ✅ Compliance documentation updated
  
  "Done means done. Not 95%. Not code complete. DONE."
```

---

## 📎 Process Selection Guide

```
Choose WATERFALL when:
  ✅ Requirements extremely stable and well-understood
  ✅ Regulated industry requires heavy documentation
  ✅ Fixed-price contracts with governments/defense
  ✅ Short project with clear deliverables
  ✅ Team unfamiliar with Agile, time to train unavailable
  
Choose AGILE/SCRUM when:
  ✅ Requirements unclear or expected to change
  ✅ Customer involvement available continuously
  ✅ Fast market with frequent competitive changes
  ✅ Complex problem (learn-as-you-go)
  ✅ Need to deliver value early and often

Choose KANBAN when:
  ✅ Maintenance and support work (unpredictable)
  ✅ Continuous flow more important than sprints
  ✅ Team doesn't want Sprint ceremonies
  ✅ Work items are independent (not Sprint-level)

Choose SAFe when:
  ✅ Enterprise with 100+ people on same product
  ✅ Need alignment across multiple Scrum teams
  ✅ Quarterly business planning cycle
  ✅ Compliance-heavy environment

Most teams use a HYBRID:
  Waterfall-like: requirements, architecture phase upfront
  Agile: implementation in sprints
  Kanban: for ongoing maintenance
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Scrum Guide 2020 | https://scrumguides.org/scrum-guide.html |
| Agile Manifesto | https://agilemanifesto.org/ |
| SAFe Framework | https://scaledagileframework.com/ |
| Kanban Guide | https://kanbanguides.org/ |
| Nexus Guide | https://www.scrum.org/resources/nexus-guide |
| DORA Metrics | https://dora.dev/research/2022/dora-report/ |
| GitHub Actions | https://docs.github.com/en/actions |
| GitLab CI/CD | https://docs.gitlab.com/ee/ci/ |
| Jira (Atlassian) | https://www.atlassian.com/software/jira/guides |
| SRE Book (Google) | https://sre.google/sre-book/table-of-contents/ |
| DevOps Handbook | https://itrevolution.com/product/the-devops-handbook/ |
| Accelerate (DORA book) | https://itrevolution.com/product/accelerate/ |
| Extreme Programming | http://www.extremeprogramming.org/ |
| Martin Fowler Blog | https://martinfowler.com/ |

---

*Học theo thứ tự: SDLC overview → Agile values → Scrum roles + ceremonies + artifacts → User Stories → CI/CD → DevOps metrics*
