# Phase 1: Manual Steps Required

**Status**: Automated steps complete ✅
**Next**: Manual credential rotation and git history cleaning
**Timeline**: 1-2 hours

---

## ✅ What Was Done Automatically

1. **Removed .env files from git tracking**
   - `apps/mobile/.env`
   - `packages/api/.env`
   - `packages/db/.env`
   - Files still exist locally but won't be committed anymore

2. **Deleted duplicate CI workflow**
   - Removed `.github/workflows/ci-tests.yml`
   - `ci.yml` covers all necessary checks

3. **Created comprehensive assessment**
   - See `docs/HONEST_ASSESSMENT_AND_PLAN.md`
   - Industry comparison and 4-phase restructuring plan

---

## ⚠️ CRITICAL: Credential Rotation Required

The following credentials were exposed in git history and MUST be rotated immediately:

### 1. Stripe Keys 🔴

**Current (COMPROMISED - REDACTED)**:
```
Secret Key: sk_test_51TBSZJHkclG5fPEs... [REDACTED]
Publishable Key: pk_test_51TBSZJHkclG5fPEs... [REDACTED]
```

**Action**:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Click "Create secret key" (new test key)
3. Copy the new keys
4. Update your local `packages/api/.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_NEW_KEY_HERE
   STRIPE_PUBLISHABLE_KEY=pk_test_NEW_KEY_HERE
   ```
5. Delete the old keys in Stripe dashboard

---

### 2. Twilio Credentials 🔴

**Current (COMPROMISED - REDACTED)**:
```
Account SID: SK925d554... [REDACTED]
Auth Token: Qzbd... [REDACTED]
```

**Action**:
1. Go to https://console.twilio.com/
2. Create a new API key:
   - Account → API keys & tokens → Create API key
   - Name: "LED Billboard Dev Key"
   - Copy SID and Secret
3. Update your local `packages/api/.env`:
   ```bash
   TWILIO_ACCOUNT_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_new_auth_token
   ```
4. Delete the old API key (SK925d554...)

**Note**: If you're using the main account credentials (AC... format), consider switching to API keys for better security.

---

### 3. Supabase Project 🔴

**Current (COMPROMISED - REDACTED)**:
```
URL: https://taiidoqrswyrttzabmxg.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX... [REDACTED]
```

**Option A: Reset RLS Policies (Faster)**
1. Go to https://supabase.com/dashboard/project/taiidoqrswyrttzabmxg/settings/api
2. Project Settings → API → Reset API keys
3. Copy new anon key
4. Update your local `packages/api/.env`:
   ```bash
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...NEW_KEY
   ```

**Option B: New Project (Recommended for production)**
1. Create new Supabase project
2. Run migrations to set up schema
3. Update .env with new URL and keys

---

### 4. Database URL 🔴

**Current (COMPROMISED - REDACTED)**:
```
postgresql://neondb_owner:npg_wA... [REDACTED] @ep-summer-boat-aihw44kr-pooler.c-4.us-east-1.aws.neon.tech/neondb
```

**Action**:
1. Go to https://console.neon.tech/
2. Project Settings → Reset Password
3. Copy new connection string
4. Update your local `packages/api/.env` and `packages/db/.env`:
   ```bash
   DATABASE_URL="postgresql://neondb_owner:NEW_PASSWORD@ep-summer-boat-aihw44kr-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```

**Or create new database**:
1. Create new Neon project
2. Run Drizzle migrations: `cd packages/db && pnpm db:push`
3. Update .env with new URL

---

## 🧹 Git History Cleanup

**WARNING**: This will rewrite git history. Coordinate with your team!

### Step 1: Install BFG Repo-Cleaner

```bash
# macOS
brew install bfg

# Or download directly
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
```

### Step 2: Clone a Fresh Copy

```bash
# Clone a mirror (fresh copy without working directory)
cd /tmp
git clone --mirror https://github.com/Vallabha-Praneeth/texas-truck-ops.git
cd texas-truck-ops.git
```

### Step 3: Remove Sensitive Files

```bash
# Delete .env files from all history
bfg --delete-files '.env' --no-blob-protection

# OR use the jar directly
java -jar ~/Downloads/bfg-1.14.0.jar --delete-files '.env' --no-blob-protection

# This will show how many commits it modified
```

### Step 4: Clean Git Objects

```bash
# Expire all references and garbage collect
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 5: Verify Secrets Are Gone

```bash
# Check that secrets no longer exist in any commit
git log --all --full-history -- "*/.env"
# Should return nothing

# Search for Stripe keys in history
git log -S "sk_test_51TBSZJHkclG5fPEs" --all
# Should return nothing
```

### Step 6: Force Push

⚠️ **WARNING**: This will overwrite remote history!

```bash
# Push to origin (overwrites remote)
git push --force

# Notify all team members to:
# 1. Delete their local clones
# 2. Re-clone the repository
```

### Step 7: Return to Your Working Directory

```bash
cd /Users/anitavallabha/B2B
git fetch origin
git reset --hard origin/feat/frontend-integration
```

---

## 🔐 Set Up GitHub Secrets (for CI/CD)

After rotating credentials, add them to GitHub Secrets:

1. Go to https://github.com/Vallabha-Praneeth/texas-truck-ops/settings/secrets/actions

2. Add new repository secrets:

```
Name: STRIPE_SECRET_KEY
Value: sk_test_YOUR_NEW_KEY

Name: STRIPE_PUBLISHABLE_KEY
Value: pk_test_YOUR_NEW_KEY

Name: TWILIO_ACCOUNT_SID
Value: SKxxxx (your new SID)

Name: TWILIO_AUTH_TOKEN
Value: your_new_token

Name: DATABASE_URL
Value: postgresql://neondb_owner:NEW_PASSWORD@...

Name: SUPABASE_URL
Value: https://your-project.supabase.co

Name: SUPABASE_ANON_KEY
Value: eyJhbG... (new key)

Name: JWT_SECRET
Value: <generate a new random 64-character string>

Name: INTERNAL_SERVICE_KEY
Value: <generate a new random 64-character string>
```

3. Update `.github/workflows/ci.yml` to use secrets:
   ```yaml
   env:
     DATABASE_URL: ${{ secrets.DATABASE_URL }}
     STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
     # etc.
   ```

---

## ✅ Verification Checklist

After completing the above steps:

- [ ] All credentials rotated (Stripe, Twilio, Supabase, Database)
- [ ] Old credentials deleted/deactivated
- [ ] New credentials work locally (`pnpm dev:api` runs without errors)
- [ ] Git history cleaned with BFG
- [ ] Verified secrets removed from history
- [ ] Force-pushed clean history to origin
- [ ] Team notified to re-clone repository
- [ ] GitHub Secrets configured
- [ ] CI passes with new secrets
- [ ] Local .env files updated with new credentials
- [ ] .env files confirmed not in git tracking (`git status` shows no .env)

---

## 📝 Team Communication Template

Send this to your team before force-pushing:

```
Subject: URGENT: Git History Rewrite - Action Required

Team,

We've discovered that sensitive credentials (Stripe, Twilio, Supabase, database passwords)
were accidentally committed to the repository. We've taken the following actions:

1. ✅ Rotated all compromised credentials (old ones are now invalid)
2. ✅ Cleaned git history to remove all traces of old credentials
3. 🔄 About to force-push cleaned history to origin

ACTION REQUIRED FOR ALL DEVELOPERS:

1. Commit and push any local work NOW (before we force-push)
2. After force-push notification:
   a. Delete your local clone: rm -rf B2B
   b. Re-clone: git clone https://github.com/Vallabha-Praneeth/texas-truck-ops.git
   c. Get new .env files from [secure location - e.g., 1Password, LastPass]

Timeline:
- Force push scheduled for: [DATE/TIME]
- Estimated downtime: 5-10 minutes

Questions? Contact [your name]

Security is our priority. Thank you for your cooperation.
```

---

## 🚨 If You Can't Rotate Immediately

**Temporary mitigation** (until you can complete the full rotation):

1. **Stripe**: Set rate limits in dashboard (limit test transactions)
2. **Twilio**: Disable the API key temporarily
3. **Supabase**: Enable stricter RLS policies
4. **Database**: Change firewall rules to allow only specific IPs

**But this is NOT a long-term solution - rotate ASAP!**

---

## 📞 Support Resources

- **Stripe Support**: https://support.stripe.com/
- **Twilio Support**: https://www.twilio.com/help/contact
- **Supabase Support**: https://supabase.com/support
- **Neon Support**: https://neon.tech/docs/introduction
- **BFG Documentation**: https://rtyley.github.io/bfg-repo-cleaner/

---

## Next Phase

Once Phase 1 is complete:
- **Phase 2**: Test Pyramid Restructuring (2-3 weeks)
  - Add Jest unit tests
  - Reduce reliance on flaky XCTests
  - Mock external services

See `docs/HONEST_ASSESSMENT_AND_PLAN.md` for full roadmap.

---

**Questions?** Review the comprehensive plan in `HONEST_ASSESSMENT_AND_PLAN.md`

**Timeline**: Complete Phase 1 this week, then proceed to Phase 2.
