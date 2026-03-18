# Red Team — Attack This

## Overview

Red teaming adopts an adversary's mindset to find vulnerabilities, exploit weaknesses, and expose attack vectors. Unlike pre-mortem (which imagines accidental failure), red teaming assumes a motivated, intelligent adversary who actively tries to break, exploit, or subvert the system, plan, or decision.

## The Method

```
1. Steelman the target (present what we're attacking)
2. Profile the adversaries (who would attack, and why?)
3. Enumerate attack vectors (how would they attack?)
4. Identify perverse incentives (how could the system be gamed?)
5. Rank by feasibility and impact
6. Design defenses for top threats
7. Present the 3-5 most dangerous vectors
```

## Step 1: Adversary Profiling

### Who Attacks?

| Adversary Type | Motivation | Capability | Persistence |
|---------------|-----------|------------|-------------|
| Script kiddie | Fun, bragging rights | Low (automated tools) | Low |
| Disgruntled insider | Revenge, financial gain | High (has access) | Medium |
| Competitor | Business advantage | Medium-High | High |
| Sophisticated attacker | Data theft, ransom | High (custom tools) | Very High |
| Automated bot | Spam, credential stuffing | Medium (volume) | Continuous |
| Social engineer | Access, data | Medium (psychology) | Medium |
| Regulatory auditor | Compliance gaps | High (legal authority) | Periodic |

### Adversary Profile Template

```markdown
### Adversary: {Name/Type}

- **Motivation**: {Why would they attack?}
- **Capability**: {What tools and skills do they have?}
- **Access**: {What can they already reach?}
- **Constraints**: {What limits them? Budget, time, legal risk?}
- **Target**: {What do they want? Data, disruption, access, money?}
```

## Step 2: Attack Surface Analysis

### Technical Attack Vectors

| Vector | Description | Example Attack |
|--------|------------|---------------|
| Authentication | Weak login, session management | Credential stuffing with leaked password lists |
| Authorization | Access control bypass | Modifying user ID in request to access other accounts |
| Input handling | Injection, XSS, deserialization | SQL injection via unvalidated search parameter |
| API abuse | Rate limit bypass, enumeration | Scraping all user profiles via sequential ID access |
| Supply chain | Compromised dependencies | Malicious package in dependency tree |
| Configuration | Default credentials, exposed services | Publicly accessible admin panel with default password |
| Data exposure | Logs, errors, debug endpoints | Stack traces in production revealing internal structure |
| Infrastructure | Unpatched services, open ports | Exploiting known CVE in outdated library |
| Secrets | Hardcoded keys, committed credentials | API keys found in public Git history |

### Business/Process Attack Vectors

| Vector | Description | Example Attack |
|--------|------------|---------------|
| Social engineering | Manipulating people | Phishing email to admin for credentials |
| Process abuse | Exploiting business logic | Creating unlimited free trial accounts |
| Incentive gaming | Manipulating reward systems | Fake referrals for referral bonuses |
| Information asymmetry | Using insider knowledge | Ex-employee using known internal APIs |
| Legal/regulatory | Weaponizing compliance | Competitor filing GDPR complaints to cause disruption |
| Reputation | Damaging trust | Posting fabricated vulnerability reports publicly |

### Strategy/Decision Attack Vectors

| Vector | Description | Example Attack |
|--------|------------|---------------|
| Timing exploitation | Acting at vulnerable moments | Competitor launching identical feature day before yours |
| Resource exhaustion | Draining opponent resources | Filing frivolous patents to force legal spending |
| Lock-in creation | Making switching costly | Vendor subtly making data export harder over time |
| Information warfare | Controlling the narrative | Spreading FUD about competitor's reliability |

## Step 3: Attack Scenario Development

### Scenario Template

```markdown
### Attack Scenario: {Title}

**Adversary**: {Type from profiling}
**Vector**: {Attack vector from analysis}
**Objective**: {What the adversary wants to achieve}

**Attack Steps**:
1. {Reconnaissance — what they discover first}
2. {Initial access — how they get in}
3. {Escalation — how they expand access}
4. {Execution — how they achieve their objective}
5. {Covering tracks — how they hide}

**Feasibility**: {HIGH / MEDIUM / LOW}
**Impact**: {CRITICAL / HIGH / MEDIUM / LOW}
**Current defenses**: {What stops this today}
**Defense gaps**: {Where current defenses fail}
```

### Example: API Abuse Scenario

```markdown
### Attack Scenario: Data Scraping via API

**Adversary**: Competitor (automated)
**Vector**: API abuse + enumeration
**Objective**: Scrape all public user profiles to build competing dataset

**Attack Steps**:
1. Discover API endpoints via browser DevTools on the web app
2. Note that /api/users/{id} uses sequential integer IDs
3. Write script to iterate IDs 1-1,000,000 at 100 req/sec
4. Rate limit only checked per IP; rotate through 50 proxy IPs
5. Collect all public profile data in 3 hours

**Feasibility**: HIGH (simple tooling, low cost)
**Impact**: HIGH (competitive data loss, privacy concern)
**Current defenses**: Rate limiting per IP (100/min)
**Defense gaps**: No per-user rate limiting, sequential IDs easily enumerable,
                  no CAPTCHA or bot detection
```

## Step 4: Perverse Incentives

Identify ways the system could be legitimately used in unintended ways:

| System Feature | Intended Use | Perverse Use |
|---------------|-------------|-------------|
| Free tier | Try before you buy | Infinite free accounts, never pay |
| Referral bonus | Grow user base | Self-referral with fake accounts |
| Refund policy | Customer protection | Order, use, return repeatedly |
| Public API | Developer ecosystem | Competitive scraping |
| User reviews | Social proof | Fake review manipulation |
| Freemium limits | Drive upgrades | Workaround limits with multiple accounts |

### Questions to Surface Perverse Incentives

```
1. "If someone wanted to get maximum value without paying, how would they?"
2. "If someone wanted to harm another user using our system, how would they?"
3. "If someone wanted to manipulate our metrics, how would they?"
4. "If someone wanted to extract our data systematically, how would they?"
5. "If a regulator wanted to find a compliance issue, where would they look?"
```

## Step 5: Defense Design

### Defense-in-Depth Model

```
Layer 1: PREVENT — Stop the attack from succeeding
  → Input validation, authentication, encryption, access control

Layer 2: DETECT — Discover attacks in progress
  → Anomaly detection, logging, alerting, audit trails

Layer 3: RESPOND — Minimize damage during attack
  → Rate limiting, circuit breakers, account lockout, WAF

Layer 4: RECOVER — Restore after attack
  → Backups, incident response plan, communication templates
```

### Defense Recommendation Template

```markdown
### Defense: {Against Attack Scenario Title}

| Layer | Defense | Effort | Priority |
|-------|---------|--------|----------|
| Prevent | {action} | {S/M/L} | {P1-P4} |
| Detect | {action} | {S/M/L} | {P1-P4} |
| Respond | {action} | {S/M/L} | {P1-P4} |
| Recover | {action} | {S/M/L} | {P1-P4} |
```

## Full Deliverable Template

```markdown
## Red Team Report: {Target Name}

### Target Description (Steelmanned)
{What we're protecting and why it matters}

### Adversary Profiles
{2-3 most relevant adversary types}

### Attack Vectors (Ranked)

#### 1. {Title} — Feasibility: HIGH, Impact: CRITICAL
{Scenario details}
**Defenses**: {recommended}

#### 2. {Title} — Feasibility: HIGH, Impact: HIGH
{Scenario details}
**Defenses**: {recommended}

#### 3. {Title} — Feasibility: MEDIUM, Impact: CRITICAL
{Scenario details}
**Defenses**: {recommended}

### Perverse Incentives
{System gaming possibilities}

### Defense Summary
| Priority | Action | Against | Effort |
|----------|--------|---------|--------|
| P1 | {action} | {threat} | {effort} |

### Residual Risks
{Threats we can't fully mitigate — accepted with awareness}
```

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|-------------|-------------|------------------|
| Only technical attacks | Misses social, business, and process vectors | Cover all attack surfaces |
| Unrealistic adversaries | "Nation-state attacker" for a blog | Match adversary capability to target value |
| Listing without prioritizing | All threats look equal | Rank by feasibility x impact |
| No defenses proposed | Just a scary list | Every ranked threat needs a defense |
| Assuming perfect defense | "Our WAF handles everything" | Assume each layer can be bypassed |
| Ignoring insider threats | Most damaging attacks are internal | Include trusted insiders in adversary profiles |
