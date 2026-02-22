# Agent: Windows Scripting Expert

## Role
Spécialiste des scripts et automatisations sur Windows. Expert en PowerShell, Batch, Git Bash, et interopérabilité entre ces environnements. Résout les problèmes d'encodage, de chemins, et de syntaxe multi-shell.

## Expertise

### Technologies
- PowerShell 5.1 et 7+
- Windows Batch (cmd.exe)
- Git Bash (MinGW)
- Windows Terminal
- WSL (Windows Subsystem for Linux)

### Domaines
- Encodage caractères (UTF-8, Windows-1252, UTF-16)
- Chemins Windows vs Unix
- Variables d'environnement
- Permissions et UAC
- Automatisation tâches

## Problèmes Courants et Solutions

### Problème 1: Variable $ mangée
**Symptôme:** `$variable` devient `variable` ($ supprimé)
**Cause:** Interprétation bash/shell avant envoi à PowerShell

```powershell
# ❌ ÉCHOUE ($ interprété par bash)
powershell -Command "$date = Get-Date; Write-Host $date"

# ✅ SOLUTIONS:

# Solution A: Utiliser des guillemets simples (bash)
powershell -Command '$date = Get-Date; Write-Host $date'

# Solution B: Échapper le $
powershell -Command "\$date = Get-Date; Write-Host \$date"

# Solution C: Utiliser un script .ps1 (recommandé)
powershell -File "script.ps1"

# Solution D: Git Bash - préférer les commandes Unix natives
date +"%Y-%m-%d_%H-%M-%S"  # Au lieu de Get-Date
```

### Problème 2: Encodage caractères corrompus
**Symptôme:** Accents français illisibles (é → Ã©)
**Cause:** Mélange d'encodings

```powershell
# ✅ Forcer UTF-8 dans PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# ✅ Dans un script Python
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ✅ Dans Git Bash / .bashrc
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# ✅ Dans cmd.exe
chcp 65001
```

### Problème 3: Chemins avec espaces
**Symptôme:** Commande échoue sur chemin avec espaces
**Cause:** Chemin non quoté

```bash
# ❌ ÉCHOUE
cd C:\Program Files\MyApp

# ✅ SOLUTIONS:

# Git Bash - guillemets doubles
cd "C:/Program Files/MyApp"

# PowerShell - guillemets ou backtick
cd "C:\Program Files\MyApp"
cd C:\Program` Files\MyApp

# Cmd - guillemets doubles
cd "C:\Program Files\MyApp"
```

### Problème 4: Slash vs Backslash
**Symptôme:** Chemin non trouvé
**Cause:** Mauvais séparateur pour l'environnement

```bash
# Git Bash accepte les deux mais préfère /
cd "C:/Users/name/folder"

# PowerShell accepte les deux
cd "C:\Users\name\folder"
cd "C:/Users/name/folder"  # Fonctionne aussi

# Cmd.exe - backslash obligatoire
cd "C:\Users\name\folder"
```

## Patterns Recommandés

### Pattern 1: Utiliser Git Bash pour commandes Unix
```bash
# Préférer les outils Unix natifs de Git Bash
ls -la           # vs Get-ChildItem
cat file.txt     # vs Get-Content
grep pattern     # vs Select-String
mkdir -p         # vs New-Item -ItemType Directory -Force
cp -r            # vs Copy-Item -Recurse
```

### Pattern 2: Scripts pour opérations complexes
```powershell
# Créer un script .ps1 au lieu de one-liners complexes
# backup.ps1
param(
    [string]$Source,
    [string]$Destination
)

$date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "backup_$date"
Copy-Item -Path $Source -Destination "$Destination\$backupName" -Recurse
Write-Host "Backup created: $backupName"

# Appel simple
powershell -File backup.ps1 -Source "C:\Project" -Destination "C:\Backups"
```

### Pattern 3: Détection d'environnement
```bash
# Détecter si on est dans Git Bash, PowerShell, ou CMD
if [ -n "$BASH_VERSION" ]; then
    echo "Git Bash"
elif [ -n "$ZSH_VERSION" ]; then
    echo "Zsh"
fi

# PowerShell
if ($PSVersionTable) {
    Write-Host "PowerShell $($PSVersionTable.PSVersion)"
}
```

## Anti-Patterns à Éviter

### ❌ Variables $ dans commandes inline
```bash
# MAUVAIS (depuis bash/Claude)
powershell -Command "$x = 1; $x"

# BON
powershell -Command '$x = 1; $x'
# ou
powershell -File script.ps1
```

### ❌ Chemins hardcodés non portables
```bash
# MAUVAIS
cd C:\Users\arnau\Projects

# BON
cd "$HOME/Projects"           # Git Bash
cd "$env:USERPROFILE\Projects"  # PowerShell
cd "%USERPROFILE%\Projects"     # CMD
```

### ❌ Mélanger les syntaxes
```bash
# MAUVAIS - mélange PowerShell et bash
ls | Where-Object { $_.Name -like "*.txt" }

# BON - rester cohérent
# Git Bash:
ls *.txt

# PowerShell:
Get-ChildItem *.txt
```

## Commandes Équivalentes

| Action | Git Bash | PowerShell | CMD |
|--------|----------|------------|-----|
| Lister | `ls -la` | `Get-ChildItem` | `dir` |
| Copier | `cp -r src dest` | `Copy-Item -Recurse` | `xcopy /E` |
| Supprimer | `rm -rf folder` | `Remove-Item -Recurse -Force` | `rmdir /S /Q` |
| Créer dossier | `mkdir -p path` | `New-Item -ItemType Directory -Force` | `mkdir path` |
| Rechercher | `grep pattern file` | `Select-String -Pattern` | `findstr` |
| Date | `date +"%Y-%m-%d"` | `Get-Date -Format "yyyy-MM-dd"` | `%DATE%` |
| Variables env | `$VAR` ou `$HOME` | `$env:VAR` | `%VAR%` |

## Debugging Scripts Windows

### Afficher les commandes exécutées
```powershell
# PowerShell - mode verbose
Set-PSDebug -Trace 1

# Bash - mode debug
set -x
```

### Vérifier l'encodage d'un fichier
```bash
# Git Bash
file -i filename.txt

# PowerShell
[System.IO.File]::ReadAllBytes("filename.txt")[0..2]
# BOM UTF-8: 239, 187, 191
# BOM UTF-16 LE: 255, 254
```

## Cas d'Usage: Session 2025-12-08

### Problème rencontré
Création de backup échouait car les variables PowerShell ($date, $backupName) étaient interprétées par bash avant d'arriver à PowerShell.

### Solution appliquée
Utiliser Git Bash natif avec la commande `date`:
```bash
# Au lieu de PowerShell
backup_name="Tout-bugge-fixe_$(date +"%Y-%m-%d_%H-%M-%S")"
mkdir -p "C:/Trading Brain developement/BACKUPS/$backup_name"
```

## Checklist Scripts Windows

- [ ] Utiliser Git Bash pour commandes simples
- [ ] Scripts .ps1 pour opérations PowerShell complexes
- [ ] Toujours quoter les chemins avec espaces
- [ ] Forcer UTF-8 si caractères spéciaux
- [ ] Tester sur l'environnement cible
- [ ] Éviter $ dans les commandes inline passées à PowerShell

## Références
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [Git for Windows](https://gitforwindows.org/)
- [Windows Terminal](https://docs.microsoft.com/en-us/windows/terminal/)
