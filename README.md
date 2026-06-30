# ✅ 01 — CMS AWS Onboarding Checklist

> Extracted from **"CMS AWS – Startcamp onboarding"** (Day 0 → Day 2) + Useful Links.
> Tick each box as you complete it. Add the **date done** so your leader can see progress.

**Legend:** `[ ]` = to do · `[x]` = done · ⭐ = high priority for a newbie

---

## 🟢 Day 0 — Orientation & Account Access
Goal: understand the team and request every access role you need.

- [ ] ⭐ Read & understand **CMS AWS** at `go/cms` — _Date done: _____
- [ ] ⭐ Learn how to use `go/myID` to request access — _Date done: _____
- [ ] ⭐ Request access to **all roles below** via `go/myID` — _Date done: _____

### Access roles to request (via `go/myID`)
> Request these, then tick when **approved/active** (not just submitted).

**AWS accounts**
- [ ] 1. AWS (CMSHUB – cmshubnonprod – nonprod) – Devops-Appstack – AUR
- [ ] 2. AWS (CMSHUB – cmshubnonprod – nonprod) – Read Only – AUR
- [ ] 3. AWS (CMSHUB-NON-PROD) – CMS-Jump-Provision – AUR
- [ ] 4. AWS (CMSHUB-NON-PROD) – CMS-Jump-Viewer – AUR
- [ ] 5. AWS (CMSHUB – cmshubprod – prod) – Devops-Appstack – AUR
- [ ] 6. AWS (CMSHUB – cmshubprod – prod) – Read Only – AUR
- [ ] 7. AWS (CMSHUB-PROD) – CMS-Jump-Provision – AUR
- [ ] 8. AWS (CMSHUB-PROD) – CMS-Jump-Viewer – AUR
- [ ] 10. AWS (CMS – NON-PROD) – Devops-Appstack – AUR
- [ ] 11. AWS (CMS – NON-PROD) – Read Only – AUR

**GitHub**
- [ ] 12. GitHub Enterprise (ICWCMS) – Member – AUR
- [ ] 13. GitHub Enterprise (ET) – Member – AUR → also join `nis-approvers` and `nis-contributor`

**Confluence**
- [ ] 14. Confluence Enterprise (CLOUDATNAB-PROD) – View – AUR
- [ ] 15. Confluence Enterprise (CLOUDATNAB-PROD) – Edit – AUR
- [ ] 16. Confluence Enterprise (TECHACADEMY-PROD) – View – AUR

**CI/CD (NEFCICD)**
- [ ] 17. NEFCICD (nisdev-NONPROD) – ReadOnly – AUR
- [ ] 18. NEFCICD (nisdev-NONPROD) – Execute – AUR
- [ ] 19. NEFCICD (nis-NONPROD) – ReadOnly – AUR
- [ ] 20. NEFCICD (nis-NONPROD) – Execute – AUR

**Other tools**
- [ ] 21. Power BI Reporting (ET Cloud CMS-PROD) – Viewer – AUR
- [ ] 22. Wiz (PROD) – NIS Read Only – AUR
- [ ] 23. ⭐ Udemy (PROD) – Read Only – AUR  _(needed for your courses!)_
- [ ] 24. Clarity PPM (PROD) – Enter Timesheet – AUR

### Communications & people to know
- [ ] Find & note CMS Consultant – Cloud Engineer (Group 3) channel
- [ ] Find & note CMS Senior Consultant – Cloud Engineer (Group 4) channel
- [ ] Note key contacts: Head of Engineering (Uyen.A.Nguyen), EMs (Dzung.Vo, Son.Lam)
- [ ] Join Teams groups: Cloud Managed Services, Terraform Enterprise, Cloud@NAB
- [ ] Ask **Son.Lam@nab.com.au** to add me to: Backlog Grooming, Planning, BAU Catchup (Zoom)
- [ ] Join CMS Shared Mailbox (CMSsupport + distribution groups) & Snab assignment groups

---

## 🟡 Day 1 — CMS AWS Knowledge Base
Goal: set up tools and start learning.

### Training
- [ ] ⭐ Explore `go/learning` (A Cloud Guru, Udemy, Pluralsight) & `go/cloudguild` — _Date: _____
- [ ] ⭐ Use the CMS AWS Knowledge Base to set up CLI tools: Terraform, AWS CLI, GitHub — _Date: _____
- [ ] Go through the container CLI tool (from the KB) — _Date: _____
- [ ] ServiceNAB: complete Incident / Change training modules first → `go/snchange` — _Date: _____
- [ ] Learn how to log working hours: `go/clarity`, `go/workdays` on `go/peoplehub` — _Date: _____

### Setting up tools
- [ ] ⭐ Set up **Visual Studio Code** + **Git** — _Date: _____
- [ ] ⭐ Set up **Terraform** (Mac users) — _Date: _____
- [ ] Set up **SAML auth**: `github.aus.thenational.com/cd/saml-myauth` — _Date: _____

### Security & Compliance (know where these live)
- [ ] Bookmark **MIS dashboard**
- [ ] Bookmark **CSAM Status – Cloud Compliance Aggregator**
- [ ] Bookmark **Splunk CMS Patching & Compliance Dashboard**
- [ ] Bookmark **Algosec firewall checker** (traffic checker / request checker)
- [ ] Bookmark **CPS Communication Matrix**

---

## 🔵 Day 2 — Shadow
Goal: deepen AWS + NAB knowledge and start shadowing real work.

- [ ] Read `go/devstack` — how NAB uses the technologies — _Date: _____
- [ ] ⭐ Start to **shadow a task** assigned by a Senior / Leader — _Date: _____

### Who to contact for what
- [ ] Note: **Patching** → Kay Phan, Thanh Tran
- [ ] Note: **Internal Tool & IACM** → Van Loc Tran, Yemi Tran
- [ ] Note: **Non-compliant** → Yemi Tran, Toan Vo, Khoa Trinh
- [ ] Note: **Other AWS technical issues** → Khoa Trinh, Hugo Phan

---

## 📚 Useful Links to read (from the doc)
- [ ] CMS AWS On-boarding Checklist – 2026
- [ ] NAB Acronyms (LINK)
- [ ] Wiki Cloud: `CLOUDATNAB:Cloud @NAB`
- [ ] CMS AWS Patching (Confluence)
- [ ] CMS AWS Monitoring (Confluence)
- [ ] Old TFE template: `ICWCMS/aws-lz250` (ODRM Project)
- [ ] Current monorepo for Terraform IaC: `github.aus.thenational.com/ET/nis-tenants-infra`
- [ ] CMS Portal: `ICWCMS/cmsaws-static` (static web hosting)
- [ ] Power Mgmt: `go/powermngt`
- [ ] Tagging: `go/awstagging`

---

### ✍️ Notes / blockers on access
_Use this space to record anything stuck (e.g. "role 5 pending approval since dd/mm")._
-

# 🗓️ 02 — My First 2-Week Plan (AWS focus, newbie-friendly)

> A realistic day-by-day plan. Each day has: **Focus → Courses → Checklist tasks → Target (done = success) → DSU/journal reminder.**
> Assumes ~7.5h workday: roughly **2–3h study**, **rest = setup / reading / shadowing / admin.**
> Adjust freely — this is *your* plan. Move things if access is delayed.

---

## ⚠️ Read this first — about your courses
You listed several AWS Cloud Practitioner courses. **They mostly cover the same exam (CLF-C02).** Don't do all of them fully — that's wasted time. Smart order:

1. **Main course (do fully):** _Ultimate AWS Certified Cloud Practitioner CLF-C02 2026_ → this is your backbone.
2. **Near the end (skim + practice):** _Exam review_ / _exam training_ / _practice exam_ courses → use these only for revision + mock exams in Week 2.
3. **Supporting fundamentals (parallel, light):** _Fundamental Operating System_, _Fundamental Networking_ → great for a newbie, do in small chunks.
4. **Stretch / later (after CLF-C02):** _Azure AZ-900_ → AWS is your focus, so this is a Week-2 taster only, full study later.

> 📎 Official AWS exam guide (what's actually tested): https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html
> 📎 Free official AWS exam-prep plan (Skill Builder): https://skillbuilder.aws/

---

# WEEK 1 — Access + AWS Foundations

### 📅 Day 1 (Mon) — Get oriented & request access
- **Focus:** Understand the team + fire off ALL access requests early (approvals take days).
- **Courses:** _none yet_ (access first). If Udemy already works → watch AWS CP **Intro + "What is Cloud Computing"** (~45 min).
- **Checklist tasks:** Read `go/cms`; learn `go/myID`; **request all 24 roles**; set up how to log hours (`go/clarity`).
- **🎯 Target:** Every access role submitted. Know who my leader & seniors are.
- **DSU + Journal:** ✍️ Fill in Daily template.

### 📅 Day 2 (Tue) — Set up my machine
- **Focus:** Developer environment.
- **Courses:** AWS CP — **Cloud Concepts** section (start). _Fundamental OS_ — first 30 min.
- **Checklist tasks:** Install **VS Code + Git**; install **Terraform**; set up **SAML auth**.
- **🎯 Target:** I can open VS Code, run `git --version` and `terraform -version` successfully.
- **DSU + Journal:** ✍️
- **📎 Docs:** Git — https://git-scm.com/doc · Terraform — https://developer.hashicorp.com/terraform/docs · AWS CLI — https://docs.aws.amazon.com/cli/

### 📅 Day 3 (Wed) — AWS Compute basics
- **Focus:** First real AWS service knowledge.
- **Courses:** AWS CP — **EC2 / Compute** section. _Fundamental Networking_ — first 30 min (IP, DNS, ports).
- **Checklist tasks:** Explore `go/learning` & `go/cloudguild`; start the AWS CLI / container CLI setup from KB.
- **🎯 Target:** I can explain in 2 sentences what EC2 is and what an instance type is.
- **DSU + Journal:** ✍️
- **📎 Docs:** EC2 — https://docs.aws.amazon.com/ec2/

### 📅 Day 4 (Thu) — AWS Storage & Databases
- **Focus:** S3 + database services.
- **Courses:** AWS CP — **S3 / Storage** + **Databases (RDS, DynamoDB)**.
- **Checklist tasks:** Read **CMS AWS Patching** & **CMS AWS Monitoring** Confluence pages.
- **🎯 Target:** I can explain what an S3 bucket is and name one AWS database service.
- **DSU + Journal:** ✍️
- **📎 Docs:** S3 — https://docs.aws.amazon.com/s3/ · RDS — https://docs.aws.amazon.com/rds/

### 📅 Day 5 (Fri) — Security/IAM + Week 1 review
- **Focus:** IAM & a weekly retro.
- **Courses:** AWS CP — **IAM & Security** section.
- **Checklist tasks:** Complete **ServiceNAB Incident/Change** training modules; bookmark all Security & Compliance dashboards (MIS, CSAM, Splunk, Algosec, CPS).
- **🎯 Target:** I can explain the AWS **shared responsibility model** in one line. Course ~50% done.
- **DSU + Journal:** ✍️ + **Week 1 retro** (see template page 04).
- **📎 Docs:** IAM — https://docs.aws.amazon.com/IAM/ · Shared responsibility — https://aws.amazon.com/compliance/shared-responsibility-model/

---

# WEEK 2 — Deeper AWS + NAB tech + Shadowing

### 📅 Day 6 (Mon) — Networking on AWS
- **Focus:** VPC + global infrastructure.
- **Courses:** AWS CP — **VPC / Networking** + **Regions & AZs**. _Fundamental Networking_ — continue.
- **Checklist tasks:** Read `go/devstack`; read **Tagging** (`go/awstagging`).
- **🎯 Target:** I can explain Region vs Availability Zone, and what a VPC is.
- **DSU + Journal:** ✍️
- **📎 Docs:** VPC — https://docs.aws.amazon.com/vpc/ · Global infra — https://aws.amazon.com/about-aws/global-infrastructure/

### 📅 Day 7 (Tue) — Pricing, billing & Well-Architected
- **Focus:** Cost + best-practice framework.
- **Courses:** AWS CP — **Pricing & Billing** + **Well-Architected Framework**.
- **Checklist tasks:** Read **Power Mgmt** (`go/powermngt`); explore monorepo `ET/nis-tenants-infra` (read-only browse).
- **🎯 Target:** I can name 3 AWS pricing principles (pay-as-you-go, etc.) and the 6 pillars idea.
- **DSU + Journal:** ✍️
- **📎 Docs:** Pricing — https://aws.amazon.com/pricing/ · Well-Architected — https://aws.amazon.com/architecture/well-architected/

### 📅 Day 8 (Wed) — Finish core + first practice questions
- **Focus:** Close out the main course, test myself.
- **Courses:** AWS CP — **finish remaining sections**; start the **exam training / practice-question** course.
- **Checklist tasks:** Note all "who to contact for what" (Patching / IACM / Non-compliant / AWS issues).
- **🎯 Target:** Main course **100% done**. First practice quiz attempted (record score).
- **DSU + Journal:** ✍️

### 📅 Day 9 (Thu) — Mock exam #1 + shadow
- **Focus:** Real exam-style practice + watch real work.
- **Courses:** **Exam review** course + **Practice Exam #1** (full).
- **Checklist tasks:** ⭐ **Shadow a senior task** (ask leader/senior what I can observe).
- **🎯 Target:** Practice exam #1 score recorded. Note weak topics to revisit.
- **DSU + Journal:** ✍️ (write down weak areas!)

### 📅 Day 10 (Fri) — Mock exam #2, gap review, plan ahead
- **Focus:** Close gaps + a taste of Azure + 2-week retro.
- **Courses:** **Practice Exam #2**; revisit weak topics; **AZ-900** — intro section only (stretch/taster).
- **Checklist tasks:** Finish any outstanding checklist items; confirm access all approved.
- **🎯 Target:** Score trending up vs Day 9. Decide: am I ready to book the CLF-C02 exam? Draft a Week 3–4 plan.
- **DSU + Journal:** ✍️ + **2-week retro**.
- **📎 Docs (later):** AZ-900 study guide — https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900

---

## 🧭 Simple weekly rhythm (repeat habit)
| Time of day | Habit |
|---|---|
| Morning (10 min) | Read today's plan + yesterday's DSU. Set today's 1 main target. |
| Mid-day study block | Watch course + take notes in journal. |
| Afternoon | Checklist tasks / reading / shadow. |
| End of day (15 min) | Fill **Daily Journal + DSU** (page 04). Update **Course Tracker** (03) & **Progress** (05). |

## 🪜 After 2 weeks (so I know where this is heading)
- Book & pass **AWS Cloud Practitioner (CLF-C02)**.
- Go deeper: AWS Solutions Architect Associate (the usual next step).
- Full **AZ-900** if multi-cloud is useful for the team.
- Move from *shadowing* → *picking up small real tasks* (patching, tagging, compliance fixes).

# 📚 03 — Course Tracker

> All my courses in one place. Update **Progress %** and **Status** after each study block.
> **Status options:** ⬜ Not started · 🟦 In progress · ✅ Done · ⏸️ Paused

---

## 🎯 Priority 1 — AWS Cloud Practitioner (CLF-C02) — *main goal*
> These all target the **same exam**. Do **one** fully, use the rest for revision/practice only.

| # | Course | Role | Status | Progress | Notes |
|---|---|---|---|---|---|
| 1 | Ultimate AWS Certified Cloud Practitioner CLF-C02 2026 | ⭐ **Main course** | ⬜ | 0% | Backbone — do fully |
| 2 | AWS Cert Cloud Practitioner CLF-C02 exam training | Practice | ⬜ | 0% | Week 2 |
| 3 | Exam review AWS Cert Cloud Practitioner | Revision | ⬜ | 0% | Week 2 |
| 4 | New AWS Cert Cloud Practitioner 2026 | Backup/skim | ⬜ | 0% | Only if gaps |
| 5 | AWS Cert Cloud Practitioner CLF-C02 | Backup/skim | ⬜ | 0% | Only if gaps |

**Official references (always trust these over any course):**
- Exam guide (what's tested): https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html
- Cert overview & booking: https://aws.amazon.com/certification/certified-cloud-practitioner/
- Free official prep (AWS Skill Builder): https://skillbuilder.aws/
- AWS documentation home: https://docs.aws.amazon.com/

---

## 🎯 Priority 2 — Fundamentals (support my AWS learning)
| # | Course | Why it helps | Status | Progress |
|---|---|---|---|---|
| 6 | Fundamental Operating System | Understand servers/EC2, processes, patching | ⬜ | 0% |
| 7 | Fundamental Networking | Understand VPC, IP, DNS, firewalls (Algosec) | ⬜ | 0% |

---

## 🎯 Priority 3 — Stretch (after CLF-C02)
| # | Course | When | Status | Progress |
|---|---|---|---|---|
| 8 | Azure AZ-900 (Microsoft Azure Fundamentals) | Week 2 taster, full later | ⬜ | 0% |

**Official references:**
- AZ-900 cert page: https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/
- AZ-900 study guide: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900

---

## 🧪 Practice exam scores (track the trend ↑)
| Date | Exam | Score | Pass? (700+) | Weak topics to revisit |
|---|---|---|---|---|
| | Practice #1 | /1000 | | |
| | Practice #2 | /1000 | | |
| | Practice #3 | /1000 | | |

> CLF-C02 pass mark = **700 / 1000**. Aim to consistently score 800+ on practice before booking.

---

## 📝 CLF-C02 exam — the 4 domains (track my confidence 1–5)
| Domain | Weight | Confidence (1–5) |
|---|---|---|
| 1. Cloud Concepts | 24% | |
| 2. Security & Compliance | 30% | |
| 3. Cloud Technology & Services | 34% | |
| 4. Billing, Pricing & Support | 12% | |

> Update confidence weekly. Anything ≤2 → schedule extra revision.

# 📓 04 — Daily Journal + Personal DSU (TEMPLATE)

> **How to use:** Copy the block below into a **new page each day** (name it `Day 01 - dd/mm`).
> Fill it at the **end of every working day** (~15 min). This is the habit my leader asked for.

---

## 📋 COPY FROM HERE ⬇️

# Day __ — dd/mm/yyyy

### 🧍 Personal DSU (Daily Stand-Up)
> Same format the team uses in stand-up — just for myself.

- **✅ Yesterday I:**
  -
- **🎯 Today I will / did:**
  -
- **⛔ Blockers / waiting on:**
  - _(e.g. "access role #5 still pending", "not sure how SAML works")_

---

### 📚 What I learned today
> 2–5 bullet points in **my own words**. If I can't explain it simply, I don't understand it yet.
-
-
-

**New AWS terms / acronyms I met:**
| Term | My one-line meaning |
|---|---|
| | |

---

### 🛠️ What I did (tasks / course)
- **Course progress:** _course name_ — from __% → __%
- **Checklist items ticked:** _(e.g. "VS Code installed", "requested role 12")_
- **Hands-on / tools:**

---

### 🤔 Questions to ask my leader / senior
> Park questions here instead of getting stuck. Bring them to stand-up.
-
-

---

### ⭐ One win + one struggle
- **Win today:**
- **Struggle / what was confusing:**

### 🔭 Plan for tomorrow (1 main target)
-

## 📋 COPY TO HERE ⬆️

---
---

# 🔁 WEEKLY RETRO TEMPLATE (use Day 5 & Day 10)

> Copy into a page named `Week 1 - Retro` / `Week 2 - Retro`.

## Week __ Retro — dd/mm

**1. What went well this week?**
-

**2. What was hard / what slowed me down?**
-

**3. Checklist progress:** __ / __ items done. Outstanding:
-

**4. Course progress:** ___% (target was ___%). On track? Y / N

**5. Top 3 things I learned this week:**
1.
2.
3.

**6. Blockers I need help with:**
-

**7. Goal for next week (one sentence):**
-

---

### 💡 Tip
Keep entries short and honest. The point isn't a perfect diary — it's proof you're learning daily and a record you (and your leader) can look back on. Consistency > length.

# 📊 05 — Progress Tracker / Dashboard

> My one-glance "where am I" page. Update at the **end of each day**.

---

## 🔥 Daily habit streak (did I journal + DSU?)
> Tick the day once the Daily Journal + DSU is written. Aim: 10/10.

| | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| **Week 1** | ⬜ D1 | ⬜ D2 | ⬜ D3 | ⬜ D4 | ⬜ D5 |
| **Week 2** | ⬜ D6 | ⬜ D7 | ⬜ D8 | ⬜ D9 | ⬜ D10 |

**Current streak:** __ days · **Total written:** __ / 10

---

## 📈 Big rocks (overall status)
| Goal | Status | % | Notes |
|---|---|---|---|
| Access — all 24 roles approved | 🟦 In progress | __% | |
| Dev environment set up (VS Code/Git/Terraform/SAML) | ⬜ | 0% | |
| AWS CP main course | ⬜ | 0% | |
| Practice exams (score 800+) | ⬜ | 0% | Best score: ___ |
| Read key Cloud@NAB KB pages | ⬜ | 0% | |
| Shadowed a senior task | ⬜ | 0% | |

> **Status key:** ⬜ Not started · 🟦 In progress · ✅ Done · ⚠️ Blocked

---

## ✅ Checklist completion (rough count)
| Section | Done / Total |
|---|---|
| Day 0 — Access | __ / ~30 |
| Day 1 — Knowledge base & tools | __ / ~13 |
| Day 2 — Shadow & contacts | __ / ~6 |
| Useful links read | __ / ~11 |

---

## ⛔ Open blockers (the short list)
> Anything stopping me. Raise these at stand-up.
| Raised on | Blocker | Who can help | Resolved? |
|---|---|---|---|
| | | | |
| | | | |

---

## 🏁 Milestones
- [ ] Day 1: all access requested
- [ ] Day 2: machine set up & working
- [ ] Day 5: AWS CP course ~50%, Week 1 retro done
- [ ] Day 8: AWS CP course 100%
- [ ] Day 10: 2 practice exams done, 2-week retro done
- [ ] (Stretch) CLF-C02 exam booked