# 🤖 AI Coding Agent — Developer Complete Guide 2026
>
> Claude Code, Skills (SKILL.md), Remote Workflow, Trends, Auto-Code Loops

---

## 📚 Table of Contents

1. [AI Agent Là Gì — Mental Model](#1-ai-agent-là-gì--mental-model)
2. [Claude Code — Setup & Core Usage](#2-claude-code--setup--core-usage)
3. [SKILL.md — Tại Sao File Markdown?](#3-skillmd--tại-sao-file-markdown)
4. [Kiếm Skills Ở Đâu — Best Sources](#4-kiếm-skills-ở-đâu--best-sources)
5. [Top Skills Nên Cài](#5-top-skills-nên-cài)
6. [Cách Dùng Skills Hiệu Quả](#6-cách-dùng-skills-hiệu-quả)
7. [Tự Tạo Custom Skill](#7-tự-tạo-custom-skill)
8. [Agent Tự Clone / Tự Cài Skill Được Không?](#8-agent-tự-clone--tự-cài-skill-được-không)
9. [Dùng Claude Code Từ Điện Thoại (Remote)](#9-dùng-claude-code-từ-điện-thoại-remote)
10. [Auto-Code Loop — Gen, Test, Fix Tự Động](#10-auto-code-loop--gen-test-fix-tự-động)
11. [CLAUDE.md — Project Context File](#11-claudemd--project-context-file)
12. [MCP vs Skills — Khác Nhau Thế Nào?](#12-mcp-vs-skills--khác-nhau-thế-nào)
13. [Multi-Agent Orchestration](#13-multi-agent-orchestration)
14. [Trends 2025-2026 & Cách Theo Dõi](#14-trends-2025-2026--cách-theo-dõi)
15. [Workflow Thực Tế Cho Dev](#15-workflow-thực-tế-cho-dev)

---

# 1. AI Agent Là Gì — Mental Model

## 1.1 Sự Khác Biệt: Chatbot vs Agent

```
CHATBOT (cũ):
  Bạn: "Viết function tính fibonacci"
  AI:  [trả code]
  Bạn: [copy-paste thủ công vào editor]
  Bạn: [chạy test, thấy lỗi]
  Bạn: "Fix lỗi này: ..."
  AI:  [trả code sửa]
  → Bạn là người chạy mọi bước. AI chỉ trả lời.

AGENT (2025-2026):
  Bạn: "Thêm feature OAuth login vào app"
  Agent: [đọc codebase của bạn]
         [tìm file liên quan auth]
         [viết code]
         [chạy tests]
         [thấy test fail → tự sửa]
         [chạy lại test → pass]
         [tạo PR]
  → Agent TỰ làm mọi bước. Bạn chỉ review kết quả.

KEY DIFFERENCE:
  Chatbot: stateless, single-turn, no tools
  Agent:   stateful, multi-step, has tools (bash, file read/write, browser, API calls)
```

## 1.2 Các AI Coding Agent Phổ Biến Nhất (2026)

```
┌─────────────────┬──────────┬────────────────────────────────────────┐
│ Tool            │ Maker    │ Đặc điểm                               │
├─────────────────┼──────────┼────────────────────────────────────────┤
│ Claude Code     │ Anthropic│ Terminal CLI, local files, skills,     │
│                 │          │ remote control, computer use           │
├─────────────────┼──────────┼────────────────────────────────────────┤
│ Codex CLI       │ OpenAI   │ Cloud sandbox, goal mode (hours),      │
│                 │          │ mobile app, remote computer use        │
├─────────────────┼──────────┼────────────────────────────────────────┤
│ Cursor Agent    │ Cursor   │ IDE tích hợp, composer, background     │
│                 │          │ agents                                 │
├─────────────────┼──────────┼────────────────────────────────────────┤
│ Gemini CLI      │ Google   │ Open source, 1M context, free tier     │
│                 │          │ generous (1000 req/day FREE)           │
├─────────────────┼──────────┼────────────────────────────────────────┤
│ GitHub Copilot  │ Microsoft│ IDE extension, workspace chat,         │
│ (Agent mode)    │          │ supports SKILL.md standard             │
├─────────────────┼──────────┼────────────────────────────────────────┤
│ Windsurf        │ Codeium  │ IDE, Cascade agent, flow               │
├─────────────────┼──────────┼────────────────────────────────────────┤
│ Kiro            │ AWS      │ Spec-driven, hooks, steering           │
└─────────────────┴──────────┴────────────────────────────────────────┘

TẠI SAO CHỌN CLAUDE CODE?
  ✅ Skills ecosystem phong phú nhất (60,000+ skills end-2025)
  ✅ Truy cập file local trực tiếp (không upload lên cloud)
  ✅ Remote control (điều khiển từ phone)
  ✅ Computer use (tự dùng được GUI apps)
  ✅ Skills open standard → skill của Claude Code dùng được ở Cursor, Codex, Gemini
  ✅ Claude Sonnet 4.6 / Opus 4.x = state-of-art coding models
```

---

# 2. Claude Code — Setup & Core Usage

## 2.1 Cài Đặt

```bash
# Yêu cầu: Node.js 18+
node --version  # kiểm tra

# Cài Claude Code:
npm install -g @anthropic-ai/claude-code
# hoặc (nếu dùng npm global path issues):
npx @anthropic-ai/claude-code

# Verify:
claude --version

# Authenticate (lần đầu):
claude
# → sẽ mở browser để authenticate với Anthropic account
# → cần Claude Pro / Max / Team / Enterprise account

# Project-level config:
claude config set model claude-sonnet-4-6  # hoặc opus-4-7 cho heavy tasks
claude config list
```

## 2.2 Chạy Claude Code

```bash
# ── INTERACTIVE MODE (default) ──
cd /path/to/your/project
claude
# → mở interactive session, Claude thấy toàn bộ project context

# ── NON-INTERACTIVE (one-shot) ──
claude -p "Add unit tests for the UserService class"
# -p = prompt, chạy xong thoát

# ── WITH SPECIFIC FILES ──
claude --add-file src/services/UserService.java \
       --add-file src/services/OrderService.java
# Claude chỉ thấy những file này (tiết kiệm context)

# ── PIPE INPUT ──
cat error.log | claude -p "Explain what's causing this error"
git diff HEAD~1 | claude -p "Review these changes"

# ── WATCH MODE (auto-run khi file thay đổi) ──
claude --watch "Run tests and fix any failing ones"

# ── SKIP CONFIRMATION (dùng thận trọng!) ──
claude --dangerously-skip-permissions -p "Refactor the auth module"
# Tự động apply changes mà không hỏi permission
```

## 2.3 Slash Commands Quan Trọng

```
Trong interactive session:

/help           → list tất cả available commands + skills
/compact        → compress conversation history (tiết kiệm context)
/clear          → bắt đầu conversation mới (xóa history)
/status         → xem current context usage, model, etc.
/cost           → xem token usage trong session này

/code-review    → review code hiện tại [built-in skill]
/debug          → bắt đầu debug session có cấu trúc [built-in]
/batch          → chạy nhiều tasks theo thứ tự [built-in]
/loop           → chạy task lặp lại theo schedule [built-in] ← mới 2026!
/test           → viết và chạy tests

/reload-plugins → reload plugins sau khi thay đổi
/skills         → list tất cả skills đang active
/memory         → xem/edit memory của Claude về project

# Bất kỳ custom skill nào cũng tạo slash command:
/frontend-design → trigger skill frontend-design
/deploy          → trigger custom deploy skill của bạn
/my-workflow     → trigger custom workflow skill
```

---

# 3. SKILL.md — Tại Sao File Markdown?

## 3.1 Skill Là Gì?

```
SKILL = SKILL.md file trong thư mục skills/
  → Là "hướng dẫn chuyên gia" mà agent đọc khi cần làm một loại task cụ thể
  → Không phải code → không cần compile, không có dependencies
  → Chỉ là text → LLM đọc và hiểu trực tiếp

MỖI SKILL CÓ:
  SKILL.md   ← file bắt buộc (frontmatter + instructions)
  scripts/   ← optional: helper scripts agent có thể chạy
  resources/ ← optional: templates, examples, reference files
  agents/    ← optional: sub-agents cho complex workflows
```

## 3.2 Tại Sao Là Markdown (.md) Không Phải Code?

```
LÝ DO 1: LLM đọc text trực tiếp (không cần parsing)
  Java/Python function:
    agent gọi → compile/interpret → execute → return result
    Latency cao, cần runtime environment
  
  Markdown skill:
    agent đọc text → hiểu instruction → thực thi
    Zero overhead! Không cần thêm gì cả.

LÝ DO 2: Token efficiency (Progressive Disclosure)
  Cách cũ: load TẤT CẢ context vào conversation ngay từ đầu
    → 100 prompts × 500 tokens = 50,000 tokens wasted mỗi session!
  
  SKILL.md với frontmatter:
    Startup: chỉ scan frontmatter (name + description = ~30-50 tokens/skill)
    Khi match: load toàn bộ SKILL.md vào context (thường < 5,000 tokens)
    Chỉ load khi THỰC SỰ cần!
    
  Ví dụ với 100 skills:
    Không có skill: bạn paste instructions mỗi lần → 500 tokens × mỗi request
    Với skills: startup ~3,000 tokens scan, chỉ load skill khi relevant

LÝ DO 3: Human readable + AI readable cùng lúc
  Markdown đủ có cấu trúc để AI parse ổn định
  Đủ đơn giản để con người đọc, chỉnh sửa, version control
  Không cần IDE đặc biệt để viết skill
  
LÝ DO 4: Cross-platform (Open Standard)
  CÙNG 1 file SKILL.md hoạt động trên:
  Claude Code, Cursor, Codex CLI, Gemini CLI, GitHub Copilot, Kiro, OpenCode
  Viết 1 lần → dùng được trên mọi agent!

LÝ DO 5: Version control thân thiện
  git diff SKILL.md → thấy exactly thay đổi gì
  Review skill changes như review code
  Branch, merge, rollback → same workflow

KHI NÀO CHUYỂN TỪ .MD SANG HÀM/CODE THỰC?
  Giữ nguyên .md khi:
    ✅ Instructions/guidelines (viết code theo style này...)
    ✅ Workflow steps (step 1: ..., step 2: ...)
    ✅ Template/boilerplate generation
    ✅ Context/knowledge (codebase conventions, API docs)
    ✅ Anything LLM cần đọc và suy nghĩ
  
  Chuyển sang code/script khi:
    → Cần gọi external API (thêm vào scripts/helper.py)
    → Cần data transformation phức tạp, deterministic
    → Cần side effects mà LLM không nên tự làm (deploy, DB migration)
    → Performance critical operations
    → Integration với MCP tools
  
  HYBRID PATTERN (most common):
    SKILL.md: describes WHAT and HOW (reasoning, decision making)
    scripts/: helper tools SKILL.md can call for specific operations
    
    Ví dụ skill "deploy":
      SKILL.md: "khi deploy, check tests pass, bump version, notify team..."
      scripts/deploy.sh: actual deployment commands
      SKILL.md calls: "run scripts/deploy.sh with these parameters"
```

## 3.3 Cấu Trúc SKILL.md

```yaml
---
# FRONTMATTER (YAML) — Agent scan cái này đầu tiên!
name: frontend-design                    # tên skill (tạo /frontend-design command)
description: >                           # QUAN TRỌNG: AI dùng cái này để decide có load không
  Creates high-quality, production-grade frontend UI with distinctive
  design that avoids generic AI aesthetics. Use for any web UI, 
  React components, CSS layouts, or when asked to style/beautify.
version: 2.1.0
author: anthropic
tags: [frontend, ui, react, css, design]
invocation: auto                         # auto = Claude quyết định khi nào load
                                         # manual = chỉ load khi user gõ /skill-name
---

# Frontend Design Skill

## When This Skill Applies
<!-- Claude reads this section to confirm it should activate -->
Activate when:
- Building any user-facing UI component, page, or application
- Asked to "make it look better", "improve design", "style this"
- Creating landing pages, dashboards, forms, navigation

## Design Principles
<!-- The actual knowledge/instructions -->
1. Avoid generic AI aesthetics (Inter font + purple gradient = NOT acceptable)
2. Use distinctive typography: consider Space Grotesk, Sohne, or system fonts
3. Micro-interactions on hover/focus/active states (not just color change)
...

## Output Requirements
- Always include responsive breakpoints
- Dark mode support with CSS variables
- Use CSS custom properties for theming
...

## Examples
<!-- Few-shot examples help the LLM a lot! -->
### GOOD: Distinctive button
```html
<button class="btn-primary">...</button>
```css
.btn-primary {
  /* design tokens here */
}
```

### BAD: Generic AI output

```html
<button style="background: purple; border-radius: 8px">
```

```

---

# 4. Kiếm Skills Ở Đâu — Best Sources

## 4.1 Official & Curated Sources

```

1. ANTHROPIC OFFICIAL SKILLS
   Cài qua Claude Code:
   npx skills add anthropics/claude-code --skill frontend-design
   npx skills add anthropics/claude-code --skill pptx
   npx skills add anthropics/claude-code --skill xlsx
   npx skills add anthropics/claude-code --skill pdf

   Xem list: <https://code.claude.com/docs/en/skills#official-skills>
   Quality: verified, maintained, production-grade

2. ANTIGRAVITY AWESOME SKILLS (LARGEST COLLECTION)
   GitHub: <https://github.com/sickn33/antigravity-awesome-skills>
   39,000+ ⭐ | 1,494+ skills | updated weekly

   Cài tất cả 1 lần:
   npx antigravity-awesome-skills --claude    # cho Claude Code
   npx antigravity-awesome-skills --cursor    # cho Cursor
   npx antigravity-awesome-skills --codex     # cho Codex CLI
   npx antigravity-awesome-skills --gemini    # cho Gemini CLI

   Hoặc cài bundle theo role:
   npx antigravity-awesome-skills --bundle frontend
   npx antigravity-awesome-skills --bundle backend
   npx antigravity-awesome-skills --bundle security
   npx antigravity-awesome-skills --bundle infra
   npx antigravity-awesome-skills --bundle product

3. AWESOME-CLAUDE-SKILLS (CURATED LIST)
   GitHub: <https://github.com/travisvn/awesome-claude-skills>
   Curated collection với reviews, star counts, categories
   Format: giống awesome-* repos khác

4. AGENTSKILLS.IO (OPEN STANDARD HUB)
   Website: <https://agentskills.io>
   Community hub cho Agent Skills open standard
   Search by tool, category, use case

5. SKILLS MARKETPLACE
   npx skills search "react testing"    # tìm skills theo keyword
   npx skills search "security audit"
   npx skills list --installed           # xem skills đang cài

```

## 4.2 Cộng Đồng & Khám Phá

```

GITHUB SEARCH:
  topic:claude-code-skill
  topic:skill-md
  topic:agent-skills
  filename:SKILL.md language:markdown

  Ví dụ: github.com/search?q=topic:claude-code-skill&sort=stars

REDDIT:
  r/ClaudeAI — thảo luận skills workflow
  r/AIAssistants — community reviews
  r/LocalLLaMA — local model skills

X/TWITTER:
  Theo dõi: @AnthropicAI, @simonw (Simon Willison), @swyx
  Search: "SKILL.md", "claude code skill", "#agentic"

DISCORD:
  Anthropic Discord: discord.gg/anthropic → #claude-code channel
  Cursor Discord → #skills channel
  The AI Engineer World's Fair Discord

YOUTUBE:
  "Claude Code workflow 2026"
  "agentic coding SKILL.md"
  Anthropic's official channel cho demos

```

---

# 5. Top Skills Nên Cài

## 5.1 Must-Have Skills (Cài Ngay)

```bash
# ── CATEGORY 1: CODE QUALITY ──

# 1. Code Reviewer / Simplify — BẮT BUỘC
# Tự động refactor first-draft code thành cleaner second-draft
npx skills add anthropics/claude-code --skill simplify
# Auto-trigger sau khi agent viết code
# Loại bỏ: unnecessary abstractions, over-engineering, boilerplate

# 2. Security Audit
npx antigravity-awesome-skills --skill security-audit
# STRIDE threat modeling, OWASP checks, code review
# Trigger khi: "review security", "audit this", "check vulnerabilities"

# ── CATEGORY 2: UI / FRONTEND ──

# 3. Frontend Design — BẮT BUỘC cho web devs
npx skills add anthropics/claude-code --skill frontend-design
# 277K+ installs (most popular official skill!)
# Tránh generic AI aesthetics, design tokens, accessibility

# 4. Apple HIG Designer (nếu làm iOS)
npx skills add --skill apple-hig-designer
# Follow Apple Human Interface Guidelines

# ── CATEGORY 3: PRODUCTIVITY ──

# 5. Browser Use — Agent dùng được browser thật!
npx skills add --skill browser-use
# E2E testing, web scraping, dynamic content research
# Agent mở Chrome, click, fill forms, take screenshots

# 6. Code Documentation
npx skills add --skill docgen
# Auto-generate JSDoc, JavaDoc, docstrings
# Pattern: code written → docgen triggers → docs added

# ── CATEGORY 4: RESEARCH ──

# 7. Valyu — Web search + 36 specialized data sources
npx skills add valyuAI/skills
# SEC filings, PubMed, academic papers, economic data
# 79% accuracy on FreshQA vs Google 39%!
# Dùng cho: research workflows, fact-checking

# 8. Firecrawl
npx skills add firecrawl/skills
# Web crawling, documentation scraping, knowledge base building
# Chuyển docs website thành skill

# ── CATEGORY 5: DEV TOOLS ──

# 9. Git Workflow
npx skills add --skill git-workflow
# Conventional commits, PR descriptions, changelog generation
# Auto-trigger khi agent cần commit/push

# 10. Remotion (nếu cần video)
npx skills add --skill remotion
# Generate video content, demos, release notes → video
# Render React components thành video

# Cài hết bundle backend + frontend một lần:
npx antigravity-awesome-skills --bundle backend --bundle frontend --claude
```

## 5.2 Skills Theo Role

```bash
# ── BACKEND DEVELOPER ──
npx antigravity-awesome-skills --bundle backend --claude
# Includes: API design, database, testing, security, Docker

# ── FRONTEND DEVELOPER ──
npx antigravity-awesome-skills --bundle frontend --claude
# Includes: UI design, accessibility, performance, testing

# ── DEVOPS / INFRA ──
npx antigravity-awesome-skills --bundle infra --claude
# Includes: Kubernetes, Terraform, CI/CD, monitoring

# ── SECURITY ENGINEER ──
npx antigravity-awesome-skills --bundle security --claude
# Includes: STRIDE, OWASP, pen testing, hardening

# ── DATA SCIENTIST / ML ──
npx skills add --skill data-analysis
npx skills add --skill sql-optimization
npx skills add --skill jupyter-workflow
```

---

# 6. Cách Dùng Skills Hiệu Quả

## 6.1 Skills Directory Structure

```
Hai vị trí skills:

1. GLOBAL (~/.claude/skills/) — áp dụng cho TẤT CẢ projects
   ~/.claude/
   └── skills/
       ├── frontend-design/
       │   ├── SKILL.md
       │   └── resources/
       ├── security-audit/
       │   ├── SKILL.md
       │   └── scripts/
       └── git-workflow/
           └── SKILL.md

2. PROJECT (.claude/skills/) — chỉ cho project này
   your-project/
   ├── .claude/
   │   ├── CLAUDE.md         ← project context (xem section 11)
   │   └── skills/
   │       ├── deploy/        ← deployment skill riêng cho project
   │       │   ├── SKILL.md
   │       │   └── scripts/deploy.sh
   │       └── code-style/    ← coding conventions của team
   │           └── SKILL.md
   └── src/

BEST PRACTICE:
  Global: generic skills (design, security, git)
  Project: team-specific skills (deploy, conventions, domain knowledge)
```

## 6.2 Automatic vs Manual Invocation

```
AUTOMATIC INVOCATION (invocation: auto trong frontmatter):
  Claude scan mọi task description
  Nếu description của skill match → tự load SKILL.md
  
  Ví dụ:
    Bạn: "Build a login form"
    Claude: → scan skill descriptions
    → frontend-design: "Use for any web UI" ← match!
    → Load frontend-design/SKILL.md
    → Apply design principles automatically
    Bạn không cần gõ gì thêm!

MANUAL INVOCATION (invocation: manual trong frontmatter):
  Chỉ load khi bạn gõ /skill-name
  Dùng cho: power skills, dangerous operations, explicit workflows
  
  /deploy          ← explicitly trigger deploy workflow
  /security-audit  ← explicitly request security review
  /code-review     ← explicitly request review

BEST PRACTICE:
  Auto: skills bạn LUÔN muốn applied (design, simplify, docgen)
  Manual: skills chỉ dùng khi cần (deploy, audit, report generation)
```

## 6.3 Kiểm Tra Skills Đang Chạy

```bash
# Trong Claude Code interactive session:
/skills                    # list tất cả active skills + trigger count
/status                    # xem context, active skills, memory

# Hoặc terminal:
claude --list-skills        # list skills từ all directories
claude --list-skills --verbose  # với description

# Live update (không cần restart!):
# Chỉnh sửa SKILL.md → Claude Code tự detect trong 1-2 giây!
# (Chỉ cần restart nếu tạo thư mục skills/ mới)
```

---

# 7. Tự Tạo Custom Skill

## 7.1 Template Cơ Bản

```bash
# Tạo skill mới:
mkdir -p .claude/skills/my-skill
touch .claude/skills/my-skill/SKILL.md
```

```yaml
# .claude/skills/my-skill/SKILL.md
---
name: my-skill
description: >
  [QUAN TRỌNG! Viết rõ ràng để AI trigger đúng lúc]
  Use this when: [list trigger conditions here]
  Creates/helps with: [what it produces]
version: 1.0.0
invocation: auto  # hoặc manual
---

# My Skill Name

## When To Use
<!-- AI reads this to confirm activation -->
Trigger this skill when the user:
- [Condition 1]
- [Condition 2]

## Instructions
<!-- Step-by-step what Claude should do -->

### Step 1: [Name]
[Detailed instructions]

### Step 2: [Name]
[Detailed instructions]

## Output Format
<!-- Specify exactly what you want -->
Always produce:
- [Artifact 1]
- [Artifact 2]

## Examples
### Example 1: [Use case]
Input: "..."
Expected output:
```

[example output here]

```

## Don'ts
<!-- Equally important: what NOT to do -->
- Never [bad practice 1]
- Avoid [bad pattern 2]
```

## 7.2 Ví Dụ: Skill Cho NestJS Project

```yaml
---
name: nestjs-module
description: >
  Creates complete NestJS modules with controller, service, DTOs, and
  repository following NAB NABVN coding standards. Use when asked to
  add a new feature, endpoint, or module to the NestJS application.
version: 1.0.0
invocation: auto
---

# NestJS Module Generator

## Trigger Conditions
Use this skill when:
- Asked to create a new module, feature, or endpoint
- Adding CRUD operations for a new entity
- "Tạo module X" or "Add endpoint for Y"

## Architecture Rules
This project uses:
- NestJS with TypeScript (strict mode)
- TypeORM with PostgreSQL
- Repository pattern (no direct EntityManager)
- DTOs with class-validator decorators
- Swagger decorators on ALL endpoints

## Folder Structure
```

src/modules/{module-name}/
├── {module-name}.module.ts
├── {module-name}.controller.ts
├── {module-name}.service.ts
├── entities/
│   └── {module-name}.entity.ts
├── dto/
│   ├── create-{module-name}.dto.ts
│   └── update-{module-name}.dto.ts
└── repositories/
    └── {module-name}.repository.ts

```

## Naming Conventions
- Entities: PascalCase, singular (User, Order, Product)
- Tables: snake_case, plural (users, orders, products)
- DTOs: CreateXDto, UpdateXDto, ResponseXDto
- Endpoints: kebab-case (/user-profiles, /order-items)

## Always Include
1. @ApiTags() on controller
2. @ApiOperation() on every endpoint  
3. Pagination for list endpoints (page, limit params)
4. Soft delete (deletedAt column, không dùng hard delete)
5. CreatedAt, updatedAt timestamps (auto-managed)

## Testing
After creating module, always create:
- Unit test for service (mock repository)
- E2E test template for controller

## Example Output Structure
[example code blocks here]
```

---

# 8. Agent Tự Clone / Tự Cài Skill Được Không?

## 8.1 Khả Năng Hiện Tại

```
CÓ — Agent có thể tự cài/clone skills nếu bạn cho phép:

CÁCH 1: Qua Bash Tool (Claude Code có thể chạy shell)
  Bạn: "Install the security audit skill"
  Claude:
    → biết lệnh cài skill
    → chạy: npx skills add antigravity/security-audit
    → tự verify SKILL.md có trong .claude/skills/
    → báo cáo: "Đã cài, reload session để active"

CÁCH 2: Tự Clone từ GitHub
  Claude Code có thể:
    git clone https://github.com/org/repo /tmp/skill-repo
    cp /tmp/skill-repo/my-skill ~/.claude/skills/
  Nhưng: cần bạn explicitly ask (không tự làm mà không được phép)

CÁCH 3: /batch command để cài nhiều skills
  /batch install frontend backend security skills
  Claude xử lý từng bước, báo cáo kết quả

GIỚI HẠN:
  ❌ Claude KHÔNG tự ý cài skills không được hỏi
  ❌ Skills cài vào global (~/.claude/) cần confirm
  ✅ Skills cài vào project (.claude/) ít nghiêm ngặt hơn
  ✅ Nếu bạn setup CLAUDE.md với "auto-install these skills" → có thể

BEST PRACTICE:
  Cho phép agent tự cài: thêm vào CLAUDE.md:
  "If a task requires a skill not installed, install it automatically
   from the approved sources: anthropics/claude-code, antigravity-awesome-skills"
```

## 8.2 Skill Discovery Tự Động

```yaml
# CLAUDE.md (xem section 11)
## Skill Management
When you recognize a task that would benefit from a skill you don't have:
1. Check if skill exists: `npx skills search <keyword>`
2. If found from trusted source (anthropic, antigravity): install it
3. If not found: create a simple SKILL.md in .claude/skills/ for this project
4. Always notify user when installing or creating new skills

## Trusted Skill Sources
- anthropics/claude-code (official)
- sickn33/antigravity-awesome-skills (community, verified)
- Local .claude/skills/ (team skills)
```

---

# 9. Dùng Claude Code Từ Điện Thoại (Remote)

## 9.1 Remote Control — Shipped February 2026

```
REMOTE CONTROL = điều khiển Claude Code session trên laptop/server từ phone

ARCHITECTURE:
  Laptop/Server ──── Claude Code (chạy locally, có access file system)
        ↑                                    ↓
    File system                     Anthropic Remote Control server
    (an toàn! không sync lên cloud)          ↓
                                    Claude Mobile App (điện thoại)
                                    (bạn monitor, steer từ đây)

SECURITY:
  ✅ Code và credentials GIỮ NGUYÊN TRÊN LOCAL MACHINE
  ✅ Không upload code lên cloud (chỉ chat messages sync)
  ✅ Encrypted connection
  ✅ Session tied to your Anthropic account
```

## 9.2 Setup Remote Control

```bash
# BƯỚC 1: Start session với remote control enabled
claude --remote
# hoặc trong interactive session:
/remote enable

# Output:
# Remote control enabled
# Session ID: cc_abc123def456
# Connect via: Claude mobile app → Remote Sessions → cc_abc123def456
# OR: claude.ai/remote → enter session ID

# BƯỚC 2: Mở Claude mobile app
# → Menu → Remote Sessions → Add Session
# → Nhập Session ID hoặc scan QR code
# → Thấy terminal session live!

# BƯỚC 3: Điều khiển từ phone
# - Xem output real-time
# - Gõ commands (hoặc nói với voice mode)
# - Approve/deny file operations
# - Monitor multiple sessions
```

## 9.3 Workflow Thực Tế Với Phone

```
SCENARIO 1: Commute Coding
  Sáng ra nhà (7am): 
    Terminal: claude --remote
    Claude: "Start implementing the payment module"
    Bật remote control → đi xe buýt đi làm
  
  Trên xe buýt (7:30am):
    Phone: xem Claude đang viết code, đang chạy tests
    Nếu Claude hỏi approval: "Yes, apply those changes"
    Nếu bị stuck: voice command "try a different approach with Stripe"
  
  Đến công ty (8:30am):
    Laptop: mở lại session → Claude đã viết xong payment module
    Review code → done!

SCENARIO 2: Multi-Agent Supervision
  Laptop: start 3 parallel sessions
    Session A: "Write unit tests for UserService"
    Session B: "Refactor the database layer"
    Session C: "Update API documentation"
  
  Phone: monitor tất cả 3 sessions cùng lúc
    → Session A done: approve PR
    → Session B failed: "Fix the migration error"
    → Session C done: review docs

SCENARIO 3: Overnight Tasks
  Tối (11pm):
    claude --remote
    "Review all 47 open PRs, categorize by priority, 
     auto-merge the ones that just update dependencies"
    Đi ngủ.
  
  Sáng (7am):
    Phone: "Completed. Merged 12 dependency PRs, 
            categorized 35 others by priority"
    Done!

TIPS:
  ✅ caffeinate -s claude  # Mac: ngăn laptop sleep khi chạy overnight
  ✅ Use /loop for scheduled recurring tasks (cron-like)
  ✅ Set up git worktrees for parallel sessions (isolated branches)
  ✅ Enable notifications in mobile app for task completion
```

## 9.4 Voice Commands Từ Phone

```
Claude Code Mobile hỗ trợ voice input (2026):

Use cases phù hợp với voice:
  "Add error handling to the payment function"
  "Run the test suite and fix any failures"
  "What's the current status of the refactoring?"
  "Approve the file changes"
  "Stop and revert the last operation"

Không phù hợp với voice:
  Complex code reviews (cần đọc)
  Specific technical specs (dễ misinterpret)
  Security-sensitive decisions

WORKFLOW:
  Voice: high-level steering (what to do, approve/deny)
  Screen: review outputs, read code
  Keyboard (optional): paste specific code/config
```

---

# 10. Auto-Code Loop — Gen, Test, Fix Tự Động

## 10.1 Basic TDD Loop

```bash
# Hướng dẫn Claude chạy TDD loop:
claude -p "
I need to implement the UserRepository interface.
Follow TDD:
1. Read the interface at src/repositories/UserRepository.java
2. Write failing tests first (src/test/UserRepositoryTest.java)
3. Implement to make tests pass
4. Run: mvn test
5. If any test fails, fix the implementation
6. Repeat until all tests pass
7. Then refactor for clarity (run tests again to confirm still passing)
Report progress at each step.
"
```

## 10.2 Full Feature Loop (Tự Động Hoàn Toàn)

```bash
# Cách 1: Single prompt với instructions đầy đủ
claude -p "
Implement feature: User email verification

Requirements:
- On registration, send verification email with token
- Token expires in 24 hours
- /api/auth/verify?token=xxx endpoint to verify
- Resend verification option

Workflow:
1. Check existing code structure (read src/)
2. Design the implementation (explain plan briefly)
3. Implement the feature
4. Write unit tests
5. Run tests (mvn test)
6. Fix any failures
7. Write integration test
8. Run all tests
9. Check if any TODO comments remain
10. Create a summary of what was implemented

Do NOT stop to ask questions unless truly blocked.
If unsure about something, make a reasonable choice and note it.
"

# Cách 2: Dùng /loop command (scheduled auto-loop)
/loop --schedule "every 2 hours" "
Run test suite.
If failures found: fix them.
If coverage drops below 80%: add missing tests.
Report: test count, coverage %, any fixes made.
"
```

## 10.3 Research Loop (Tự Động Nghiên Cứu)

```bash
# Ví dụ: nghiên cứu competitive analysis
claude -p "
Research: What are the main competitors to [your product]?

Process:
1. Search web for '[product category] alternatives 2026'
2. For each competitor found:
   a. Visit their website (use browser skill)
   b. Note: pricing, key features, target audience, tech stack
   c. Check reviews on G2/Product Hunt/Reddit
3. Compile into comparison table
4. Identify our competitive advantages and gaps
5. Write executive summary (max 500 words)
6. Save to research/competitor-analysis-$(date +%Y-%m).md

Tools available: browser, web search, file write
"

# Ví dụ: nghiên cứu security vulnerabilities
claude -p "
Security audit of the authentication module:

1. Read all files in src/auth/
2. Check against OWASP Top 10 2024
3. Use security-audit skill for systematic review
4. For each finding:
   - Severity: Critical/High/Medium/Low
   - Description of vulnerability
   - Example exploit scenario
   - Recommended fix
5. Auto-fix Low and Medium severity issues
6. Create report at security/auth-audit-$(date +%Y-%m-%d).md
7. Create GitHub issues for Critical and High severity
"
```

## 10.4 CI/CD Integration — Agent Trong Pipeline

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      
      - name: Run AI Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          git diff origin/main...HEAD > /tmp/changes.diff
          claude -p "
          Review this PR diff for:
          1. Logic errors
          2. Security vulnerabilities  
          3. Performance issues
          4. Missing tests
          5. Breaking changes
          
          For each issue: file:line, severity, description, suggested fix.
          Format as GitHub PR review comments.
          Output as JSON: [{file, line, body, severity}]
          " --input /tmp/changes.diff > /tmp/review.json
      
      - name: Post Review Comments
        uses: actions/github-script@v7
        with:
          script: |
            const review = require('/tmp/review.json');
            // post as PR review comments
```

## 10.5 Self-Healing Test Loop

```bash
# Pattern mạnh nhất: agent chạy test → fix → chạy lại → repeat
claude -p "
You are running in a self-healing loop.

Goal: Make all tests pass for the payment module.

Loop:
1. Run: npm test -- --testPathPattern=payment
2. If ALL PASS: done! Report summary.
3. If failures exist:
   a. Analyze each failure carefully
   b. Identify root cause
   c. Fix the code (NOT the test, unless test is wrong)
   d. Go to step 1
4. If stuck in loop >5 iterations: report what's blocking you

Constraints:
- Do not skip or delete tests
- Do not change test assertions unless clearly wrong
- Fix the implementation to match the spec (tests are the spec)

Start now.
"
```

---

# 11. CLAUDE.md — Project Context File

## 11.1 CLAUDE.md Là Gì?

```
CLAUDE.md = file context mà Claude đọc NGAY KHI bắt đầu session
  Đặt tại: ./CLAUDE.md (root của project)
  Mọi instruction ở đây = applied to every conversation automatically
  
  Khác với SKILL.md:
    CLAUDE.md: persistent project context (always loaded)
    SKILL.md:  on-demand specialist knowledge (loaded when needed)
```

## 11.2 Template CLAUDE.md Hoàn Chỉnh

```markdown
# Project: [Your App Name]

## Quick Overview
[2-3 sentences about what this project does]
E.g.: "NestJS REST API for NAB's banking app. Handles user auth,
transactions, and reporting. Uses TypeScript, PostgreSQL, Redis."

## Tech Stack
- Runtime: Node.js 20 + TypeScript 5.3 (strict mode)
- Framework: NestJS 10
- Database: PostgreSQL 15 (TypeORM), Redis 7
- Testing: Jest + Supertest
- CI: GitHub Actions

## Architecture
src/
├── modules/        # Feature modules (one folder per feature)
├── common/         # Shared: guards, decorators, filters, pipes
├── config/         # Configuration
└── database/       # Migrations, seeds

## Coding Conventions
- Never use `any` type — use `unknown` with type guards if needed
- All DTOs must have class-validator decorators
- Controllers: thin (delegate to service)
- Services: business logic only
- Repositories: data access only
- Every public method needs JSDoc
- Magic numbers → named constants

## Git Conventions
- Branch: feature/TICKET-123-short-description
- Commits: conventional commits (feat:, fix:, docs:, test:, chore:)
- PR: must have: description, testing steps, screenshots if UI change

## Running the Project
```bash
docker-compose up -d  # start DB + Redis
npm run start:dev     # start with hot reload
npm test              # run tests
npm run test:e2e      # run e2e tests
```

## Test Coverage Requirements

- Unit tests: minimum 80% coverage
- All new features must have tests
- Run before committing: npm test

## Important Files

- Database config: src/config/database.config.ts
- Auth module: src/modules/auth/
- Main entity: src/modules/users/entities/user.entity.ts

## What NOT To Do

- NEVER use raw SQL (use TypeORM query builder)
- NEVER commit .env files
- NEVER disable TypeScript strict rules
- NEVER use console.log (use Logger from @nestjs/common)

## Skill Management

Auto-install skills from trusted sources when needed:

- anthropics/claude-code
- antigravity-awesome-skills (security, backend bundles)

## Agent Permissions

You may:

- Read/write any file in this repo
- Run: npm test, npm run build, npm run lint
- Create/modify branches
- NOT run: npm publish, git push (requires human confirmation)

```

---

# 12. MCP vs Skills — Khác Nhau Thế Nào?

## 12.1 So Sánh

```

SKILLS (SKILL.md)                    MCP (Model Context Protocol)
────────────────                     ──────────────────────────────
Là TEXT instructions                 Là CODE server (tools)
Agent đọc → suy nghĩ → làm          Agent gọi → gets exact data/action
Light (~30-5000 tokens)              Executes in real-time
Cross-platform (.md standard)        Protocol standard (JSON-RPC)
For: workflows, conventions,         For: integrations, data sources,
     templates, guidance                  APIs, external services

ANALOGY:
  Skill = Employee training manual  MCP = Equipment/software employee uses
  "Here's how we do code reviews    "Here's your access to Jira, GitHub,
   at this company..."               Slack, PostgreSQL..."

DÙNG CÀI NÀO KHI NÀO?

Use SKILL when:
  "Teach agent HOW to do something"
  Code style guide → SKILL.md
  Deployment workflow → SKILL.md
  Domain knowledge (business rules) → SKILL.md
  Output format requirements → SKILL.md

Use MCP when:
  "Give agent ACCESS to something"
  Read from Jira → MCP Jira server
  Write to Slack → MCP Slack server
  Query PostgreSQL → MCP PostgreSQL server
  Browse web → MCP browser tool
  Read Google Drive → MCP Drive server

COMBINATION (most powerful):
  SKILL.md: "When deploying, follow this process..."
  MCP tool: SKILL.md calls MCP GitHub to create PR,
            calls MCP Slack to notify team,
            calls MCP monitoring to check health

```

## 12.2 MCP Setup (Nhanh)

```json
// ~/.claude/settings.json — MCP servers
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "your-token" }
    },
    "postgres": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-postgres",
               "postgresql://user:pass@localhost/dbname"]
    },
    "slack": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-slack"],
      "env": { "SLACK_BOT_TOKEN": "your-token" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    }
  }
}
```

---

# 13. Multi-Agent Orchestration

## 13.1 Parallel Agents

```bash
# Pattern: chia work thành parallel tasks, chạy agents cùng lúc

# Terminal 1: Agent A
claude -p "Write unit tests for the UserService"

# Terminal 2: Agent B (cùng lúc!)
claude -p "Write unit tests for the OrderService"

# Terminal 3: Agent C (cùng lúc!)
claude -p "Update API documentation for new endpoints"

# Sau khi cả 3 xong:
claude -p "Run all tests (npm test) and fix any integration issues"

# Remote control từ phone: monitor cả 3 sessions cùng lúc!
```

## 13.2 Subagents Trong Skill

```yaml
# .claude/skills/full-feature/SKILL.md
---
name: full-feature
description: Build a complete feature end-to-end using subagents
invocation: manual
---

# Full Feature Builder

## Process
This skill orchestrates multiple subagents:

### Subagent 1: Spec Writer
Task: Analyze requirements and write technical spec
Output: .claude/specs/{feature-name}.md

### Subagent 2: Code Writer  
Depends on: Subagent 1 (reads spec)
Task: Implement backend code
Output: src/modules/{feature}/

### Subagent 3: Test Writer
Depends on: Subagent 2 (reads implementation)
Task: Write comprehensive tests
Output: src/test/{feature}/

### Subagent 4: Doc Writer
Depends on: Subagent 2
Task: Update API docs and README
Output: docs/api/{feature}.md

## Execution
Run subagents sequentially (each depends on previous output).
If any subagent fails: report clearly and stop.
Final report: what was built, test coverage, docs updated.
```

---

# 14. Trends 2025-2026 & Cách Theo Dõi

## 14.1 Trends Quan Trọng Nhất

```
TREND 1: SKILLS ECOSYSTEM EXPLOSION (Late 2025 - Now)
  Late 2025: Anthropic release SKILL.md open standard (Dec 18, 2025)
  20 days after: 40,000+ skills created by community!
  Now (2026): 60,000+ skills, universal standard across ALL agents
  Impact: agent không còn generic, có "personality" và expertise riêng
  
  Tại sao quan trọng:
  "A raw Claude without skills = senior engineer on day 1"
  "Claude with skills = senior engineer who knows your codebase"

TREND 2: VIBE CODING
  Thuật ngữ Andrej Karpathy coined (Feb 2025)
  "Fully give into the vibes, ignore understanding the code"
  Developer mô tả OUTCOME, agent làm hoàn toàn
  
  Thực tế 2026:
  - Phù hợp: prototypes, solo projects, non-critical features
  - Không phù hợp: production financial systems, security-critical
  - Best practice: vibe code fast → then review carefully

TREND 3: REMOTE CONTROL & ASYNC AGENT WORK
  Feb 2026: Claude Code Remote Control shipped
  Developer đặt task → đi làm việc khác → agent chạy nền
  Kiểm tra kết quả sau → approve → tiếp tục
  "The developer who never sleeps" workflow

TREND 4: COMPUTER USE
  Agent dùng được GUI applications (không chỉ terminal/API)
  Click buttons, fill forms, interact with desktop apps
  Use case: test UI apps, automate manual workflows
  Claude Code Computer Use: March 2026

TREND 5: MULTI-AGENT ORCHESTRATION
  Thay vì 1 agent làm tất cả: chia thành specialized agents
  Orchestrator agent điều phối worker agents
  Parallel execution → faster delivery
  "37 agents building a startup from PRD to revenue" (real demo!)

TREND 6: /loop & SCHEDULED AGENTS
  Agents chạy theo schedule (cron-like)
  "Every 2 hours, run tests. If failure, fix immediately"
  "Every morning, review overnight PRs and categorize"
  Moves from "tool you use" → "employee that works for you"

TREND 7: SPECIFICATION-DRIVEN DEVELOPMENT
  Write spec first → agent reads spec → implements
  Kiro IDE: steers toward spec, not just code
  "Spec as source of truth" pattern
  Agent writes failing tests from spec → implements → all green

TREND 8: UNIVERSAL AGENT STANDARD
  SKILL.md được adopt bởi Cursor, Codex, Gemini, Copilot, Kiro
  Write once, run everywhere (skills portability)
  Community skills ecosystem shared across tools

TREND 9: AGENTS IN CI/CD
  PR opened → AI agent reviews automatically
  Test fails → agent fixes immediately
  Deployment → agent monitors + rollback if needed
  "Autonomous DevOps" becoming real

TREND 10: LOCAL-FIRST AGENT SECURITY
  User demand: code never leaves local machine
  Claude Code: code on laptop, only messages to cloud
  vs Codex: runs in cloud sandbox
  Enterprise: strongly prefer local-first
```

## 14.2 Cách Theo Dõi Trends

```
PRIMARY SOURCES:
  1. Anthropic Blog: anthropic.com/news
     → release notes, research papers, use cases
  
  2. Claude Code Changelog: code.claude.com/changelog
     → weekly updates, new features
  
  3. Simon Willison's Blog: simonwillison.net
     → best independent AI developer coverage
     → "TIL" posts = quick practical discoveries

SECONDARY SOURCES:
  4. X/Twitter Lists:
     Follow: @simonw, @swyx, @karpathy, @AnthropicAI
     Search: "claude code" (filter: latest, past week)
     Search: "SKILL.md" (filter: latest)
  
  5. Hacker News: news.ycombinator.com
     Search "claude code" — community discussions, real usage
     "Show HN" posts often = new tools/workflows
  
  6. Reddit:
     r/ClaudeAI — active, practical discussion
     r/AIAssistants — comparisons
     r/LocalLLaMA — power users
  
  7. YouTube:
     "Claude Code" filter: this month
     Anthropic official channel
     Fireship (short, technical, trendy)

GITHUB TRENDING:
  github.com/trending?l=markdown → SKILL.md files
  Search: topic:claude-code, topic:agent-skills
  Watch: sickn33/antigravity-awesome-skills (most active skills repo)

NEWSLETTERS (subscribe):
  "The Neuron" — daily AI news (theneurondaily.com)
  "TLDR AI" — quick daily digest
  "Import AI" — deeper technical (importai.substack.com)

DISCORD:
  Anthropic Discord (discord.gg/anthropic) → most direct info
  Cursor Discord → skills discussion
  The AI Engineer → professional usage

PODCAST:
  "Latent Space" — developer-focused AI
  "Practical AI" — real use cases
  "Lex Fridman" — founder interviews (Dario Amodei episodes)
```

---

# 15. Workflow Thực Tế Cho Dev

## 15.1 Daily Dev Workflow Với Agent

```
SÁng (9am):
  1. claude   ← open interactive session
  2. /status  ← check previous session notes
  3. Ask Claude to read overnight PRs/issues:
     "Summarize the 3 new GitHub issues and suggest priorities"

Viết Feature Mới:
  "Implement issue #47: add rate limiting to payment API
  - Read the issue description on GitHub (use MCP)  
  - Check existing middleware in src/middleware/
  - Implement rate limiting (Redis-based)
  - Write tests
  - Update docs
  Let me know if you have questions, otherwise proceed."
  
  → Đi làm việc khác
  → Check lại sau 20-30 phút
  → Review code → approve

Bug Fix:
  "Fix: users report login fails after password reset
  - Check error logs (logs/app.log)
  - Reproduce the issue
  - Fix and write regression test
  - Verify fix doesn't break other auth tests"

Code Review:
  /code-review  ← trigger skill
  hoặc: "Review the changes in src/auth/ for security issues"

End of Day:
  "Summarize what was implemented today.
   Create commit message for all changes.
   List any technical debt introduced."
```

## 15.2 Research Workflow

```bash
# Nghiên cứu công nghệ mới
claude -p "
Research: Should we migrate from REST to GraphQL?

Research plan:
1. Search recent articles (2025-2026) about REST vs GraphQL trade-offs
2. Find case studies of companies with similar scale (startup, 50-100 devs)
3. Analyze our current API usage patterns:
   - Read src/modules/*/controller.ts
   - Count endpoints, identify over-fetching patterns
4. Research GraphQL adoption cost:
   - Frontend migration complexity
   - Backend implementation options for NestJS
   - Team learning curve
5. Write decision document:
   - Recommendation (with clear reasoning)
   - Migration path if yes
   - Timeline estimate
   - Risks
6. Save to: docs/adr/001-graphql-evaluation-$(date +%Y-%m).md

Use browser + web search + file read tools.
"
```

## 15.3 Self-Documenting Codebase

```bash
# Agent tự generate documentation từ code
claude -p "
Generate comprehensive documentation for this codebase:

1. Architecture overview diagram (text-based)
2. API reference (all endpoints, params, responses)
3. Database schema documentation (tables, relationships, indexes)
4. Common patterns and conventions used
5. Setup guide for new developers
6. Troubleshooting guide (common errors + solutions)

Save to docs/ folder with proper structure.
Use the actual code as source of truth (not comments which may be stale).
"
```

---

## 📎 Quick Reference

```
INSTALL SKILLS:
  Official:    npx skills add anthropics/claude-code --skill <name>
  Antigravity: npx antigravity-awesome-skills --claude
  Bundle:      npx antigravity-awesome-skills --bundle frontend --claude
  Custom:      mkdir .claude/skills/my-skill && touch .claude/skills/my-skill/SKILL.md

SKILL FILE LOCATIONS:
  Global:  ~/.claude/skills/     (all projects)
  Project: .claude/skills/       (this project only)
  Format:  SKILL.md with YAML frontmatter + markdown body

KEY FILES:
  CLAUDE.md   → always-loaded project context
  SKILL.md    → on-demand specialist skills
  .mcp.json   → MCP server configs
  settings.json → Claude Code settings

REMOTE FROM PHONE:
  claude --remote              → enable remote control
  Mobile app → Remote Sessions → enter session ID

AUTO-LOOP COMMANDS:
  /loop --schedule "every 2h" "run tests"
  claude -p "do X, if fail fix, repeat until success"
  /batch "task1" "task2" "task3"  → sequential tasks

FIND TRENDS:
  simonwillison.net → best independent coverage
  code.claude.com/changelog → official updates
  github.com/trending → new tools/skills
  r/ClaudeAI → community discussions
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Claude Code Docs | <https://code.claude.com/docs> |
| Skills Guide | <https://code.claude.com/docs/en/skills> |
| Agent Skills API | <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview> |
| CLAUDE.md Format | <https://code.claude.com/docs/en/claude-md> |
| MCP Introduction | <https://docs.anthropic.com/en/docs/mcp> |
| Remote Control | <https://code.claude.com/docs/en/remote-control> |
| Antigravity Skills | <https://github.com/sickn33/antigravity-awesome-skills> |
| Awesome Claude Skills | <https://github.com/travisvn/awesome-claude-skills> |
| AgentSkills Open Standard | <https://agentskills.io> |
| Anthropic Skills Course | <https://anthropic.skilljar.com/introduction-to-agent-skills> |
| Changelog | <https://code.claude.com/changelog> |
