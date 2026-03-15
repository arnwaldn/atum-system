# GigRoute Mobile — Beta Test Results (2026-03-13)

## VERDICT: GO POUR BETA TEST

### Tests Integration (emulateur Android 16, API 36)

| Suite | Tests | Resultat | Duree |
|-------|-------|----------|-------|
| `app_test.dart` | 10 | 10/10 PASS | 2min03 |
| `full_e2e_test.dart` | 8 | 8/8 PASS | 6min45 |
| **TOTAL** | **18** | **18/18 PASS** | ~9min |

### Ecrans couverts (35+)

Auth, Dashboard (KPIs, greeting, search, quick actions), Tours (liste, filtres, form, validation),
Bands (liste, form), Venues (liste, filtres, form), Payments (onglets, ajout),
Invoices (liste, form), Documents, Guestlist hub + Check-in, Calendar, Notifications,
Settings (4 sections avec scroll, profil, password, professions, email config),
Reports (hub, financial, guestlist, settlements, accounting), Users (liste, form),
Billing, Search, 404

### 23 feature modules
advancing, auth, bands, billing, calendar, crew, dashboard, documents, guestlist,
invoices, lineup, logistics, map, notifications, payments, planning, reports,
schedule, settings, stops, tours, users, venues

### Points d'attention (non-bloquants)
- `GET /api/v1/settings/professions` → 404 (endpoint pas implemente, app gere gracieusement)
- `GET /api/v1/reports/settlements?filter=all` → 404 (idem)
- Drift OfflineDatabase warning (instances multiples) — benin
- Planning tab crash (session precedente) — fix applique et teste OK

### Corrections appliquees pendant les tests
1. **GoRouter context fix** — `Scaffold.first` au lieu de `MaterialApp.first` pour navigation programmatique
2. **Filter chips** — assertions adaptees pour `ListView` horizontal (lazy loading, seuls les premiers chips visibles)
3. **Settings scroll** — `tester.drag()` pour verifier les sections sous le fold dans le `ListView`
4. **"Groupes" duplique** — 2x sur dashboard (KPI card + Quick Action) → `findsWidgets`
5. **Icone notifications** — 2x (AppBar + bottom nav) → `findsWidgets`

### Commandes test
```bash
cd gigroute_mobile
flutter test integration_test/app_test.dart -d emulator-5554
flutter test integration_test/full_e2e_test.dart -d emulator-5554
```

### Backend
- URL: https://live-tour-manager.onrender.com/api/v1
- Render free tier, cold start ~30-60s
- Login test: arnaud.porcel@gmail.com
