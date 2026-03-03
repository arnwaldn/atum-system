# Installed Dev Stack (updated 2026-03-03)

- **Languages**: Node v24.13.1, Python 3.13.2, Go 1.26.0, Rust 1.93.1, .NET 9.0.311, Java 21.0.10, Deno 2.6.10, PHP 8.4.18, Ruby 3.3.10, Dart 3.11.0
- **JS/TS**: TypeScript 5.9.3, Vite 7.3.1, Next.js 16.1.6, Angular 21.1, Vue CLI 5, NestJS 11, Nuxt 3.33, Tailwind 4.2
- **Python**: Django 6.0, Flask 3.1, FastAPI 0.129, pytest 9.0.2, black 26.1.0, ruff 0.15.1, mypy 1.19.1
- **PHP/Ruby**: Composer 2.9.5 (`~/bin/composer.phar`), Laravel 12.52, Rails 8.1.2
- **Build Tools**: VS Build Tools 2022 v17.14.27 (MSVC C++), MSYS2 20251213 (GCC 15.2.0 ucrt64 + make), Android Studio 2025.3.1.8
- **Sysinternals**: handle64.exe (`~/bin/`) — pour diagnostiquer les locks fichiers
- **Desktop**: Electron 40.6, Tauri CLI 2.10.0
- **Mobile**: Expo CLI 6.3.10, EAS CLI 18.0.6, Android SDK 34 (platform-tools 37.0.0, build-tools 34.0.0), Watchman 20250223, Firebase CLI 15.6.0
  - `ANDROID_HOME=~/AppData/Local/Android/Sdk` (.bashrc)
  - Android SDK cmdline-tools in `$ANDROID_HOME/cmdline-tools/latest/`
  - No emulator installed (use Expo Go on physical device or EAS Build cloud)
  - Expo login required (interactive) — `npx expo login`
- **Game Engine**: Godot 4.6.1 (`~/bin/godot`, `~/bin/godot-console`)
- **Blockchain**: Hardhat 3.1.9 (via npx)
- **DB**: SQLite native, PostgreSQL/Redis/MongoDB/MySQL via Docker
- **Linting**: Oxlint 1.50.0 (Rust-based, 10-100x faster than ESLint), tsgo 7.0.0-dev (Rust-based TS typecheck)
- **Testing**: Jest 30.1.3, Vitest 4.0.18, Playwright 1.58.2, pytest + pytest-cov
- **Payments**: Stripe CLI 1.37.2 (`~/bin/stripe` wrapper)
- **DevOps**: Docker 29.2.1, git 2.53.0, gh CLI 2.87.0, Vercel CLI 50.19.1
- **Supply-chain**: pnpm minimumReleaseAge=2880 (refuse packages < 2 days old)

## Wrappers ~/bin/ (Git Bash)
cloudflared, composer, flyctl, gh, godot, godot-console, gsudo, jq, pip, pip3, python, python3, stripe, uv, uvx, watchman
