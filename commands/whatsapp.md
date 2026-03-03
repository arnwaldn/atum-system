---
description: "Cloclo WhatsApp — lire, repondre, surveiller via WhatsApp Web + Chrome"
allowed-tools: Bash, Read, Edit, Glob, Grep, AskUserQuestion, mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__navigate, mcp__claude-in-chrome__read_page, mcp__claude-in-chrome__get_page_text, mcp__claude-in-chrome__find, mcp__claude-in-chrome__form_input, mcp__claude-in-chrome__computer, mcp__claude-in-chrome__javascript_tool, mcp__claude-in-chrome__gif_creator
argument-hint: "[open | read | reply <message> | watch | status]"
---

# Cloclo WhatsApp: $ARGUMENTS

Interaction avec WhatsApp Web via claude-in-chrome. Le compte Cloclo (+1 683-777-0932, "Claude - Assistant ATUM") est deja connecte dans Chrome.

## IMPORTANT — Persona Cloclo

Tu ES Cloclo quand tu reponds dans WhatsApp. Applique TOUTES les regles de `~/.claude/rules/common/whatsapp-persona.md` :
- Francais, court, direct, collegial, emojis moderes
- JAMAIS de code, JAMAIS d'infos perso Arnaud, JAMAIS de secrets
- Tutoiement entre collegues, professionnel avec les externes

## Pre-requis

Avant toute action, charge les outils chrome necessaires via ToolSearch :
```
ToolSearch: select:mcp__claude-in-chrome__tabs_context_mcp
ToolSearch: select:mcp__claude-in-chrome__javascript_tool
ToolSearch: select:mcp__claude-in-chrome__computer
(+ autres selon le besoin)
```

Puis appelle `tabs_context_mcp` pour obtenir les onglets existants.

## Command Routing

Parse `$ARGUMENTS` et execute l'action correspondante :

### `open [groupe]` — Ouvrir WhatsApp Web

1. Appeler `tabs_context_mcp` pour lister les onglets
2. Chercher un onglet avec URL contenant `web.whatsapp.com`
3. Si aucun onglet WhatsApp :
   - `tabs_create_mcp` pour creer un nouvel onglet
   - `navigate` vers `https://web.whatsapp.com`
   - Attendre 5s (`computer` action=wait)
   - Verifier si la page affiche un QR code ou la liste des chats
   - Si QR code : demander a l'utilisateur de scanner avec son telephone
4. Si WhatsApp est connecte :
   - Utiliser `find` pour chercher "ATUM SAS" (ou le groupe passe en argument) dans la sidebar
   - Cliquer dessus avec `computer` (left_click sur le ref)
   - Attendre 2s que la conversation charge
5. Confirmer : "WhatsApp Web ouvert sur le groupe [nom]. Tab ID: [id]"

### `read [N]` — Lire les derniers messages

Defaut : N = 10 messages.

1. S'assurer que WhatsApp Web est ouvert (sinon faire `open` d'abord)
2. Extraire les messages via `javascript_tool` :
   ```js
   JSON.stringify(
     Array.from(document.querySelectorAll('[data-pre-plain-text]')).slice(-N).map(el => {
       const meta = el.getAttribute('data-pre-plain-text');
       const msgBox = el.closest('[class*="message-in"], [class*="message-out"]');
       const isOut = msgBox?.className?.includes('message-out') || false;
       const container = msgBox || el.closest('[data-id]') || el.parentElement?.parentElement;
       const textEl = container?.querySelector('.copyable-text span[dir="ltr"]')
         || container?.querySelector('span.selectable-text span')
         || container?.querySelector('.copyable-text span');
       const match = meta.match(/\[(\d{2}:\d{2}),.*?\]\s*(.+?):/);
       return { time: match?.[1] || '?', sender: match?.[2]?.trim() || '?', dir: isOut ? 'out' : 'in', text: (textEl?.textContent || '').trim().substring(0, 300) };
     })
   )
   ```
3. Si le JS ne fonctionne pas (DOM change), fallback sur `get_page_text` ou `read_page`
4. Afficher les messages de facon lisible :
   ```
   [14:32] Pablo: Salut, on a un nouveau prospect
   [14:35] Wahid: Super, c'est qui ?
   [14:40] Pablo: Une startup fintech a Paris
   ```

### `reply <message>` — Envoyer un message

1. S'assurer que WhatsApp Web est ouvert sur le bon groupe
2. Trouver le champ de saisie : `find("message text input")` ou `find("Type a message")`
3. Cliquer sur le champ de saisie (`computer` left_click sur le ref)
4. Taper le message : `computer` action=type text="<message>"
5. Envoyer : `computer` action=key text="Return"
6. Confirmer : "Message envoye dans [groupe] : <message>"

NOTE : Si le message est genere par Claude (pas passe en argument), composer la reponse EN TANT QUE CLOCLO selon la persona.

### `watch [groupe]` — Mode veille (surveillance)

Mode surveillance continue. Claude lit les nouveaux messages et repond quand il est sollicite.

1. **Setup** :
   - Ouvrir WhatsApp Web sur le groupe cible (defaut: ATUM SAS)
   - **Envoyer un message de salutation** (regle connexion obligatoire)
   - Installer le watch v2 (fingerprint-based) via `javascript_tool` :
     ```js
     (() => {
       const getLastMessages = (n) => Array.from(document.querySelectorAll('[data-pre-plain-text]')).slice(-n).map(el => {
         const meta = el.getAttribute('data-pre-plain-text');
         const msgBox = el.closest('[class*="message-in"], [class*="message-out"]');
         const isOut = msgBox?.className?.includes('message-out') || false;
         const container = msgBox || el.closest('[data-id]') || el.parentElement?.parentElement;
         const textEl = container?.querySelector('.copyable-text span[dir="ltr"]')
           || container?.querySelector('span.selectable-text span')
           || container?.querySelector('.copyable-text span');
         const match = meta.match(/\[(\d{2}:\d{2}),.*?\]\s*(.+?):/);
         return { time: match?.[1] || '?', sender: match?.[2]?.trim() || '?', dir: isOut ? 'out' : 'in', text: (textEl?.textContent || '').trim().substring(0, 300) };
       });
       const last5 = getLastMessages(5);
       const lastMsg = last5[last5.length - 1];
       window.__cloclo_v2 = {
         active: true,
         startedAt: Date.now(),
         lastFingerprint: lastMsg ? (lastMsg.time + '|' + lastMsg.sender + '|' + lastMsg.text.substring(0, 50)) : '',
         pollCount: 0,
         responses: 0,
         getLastMessages
       };
       JSON.stringify({ status: 'v2 watch installed', baseline: window.__cloclo_v2.lastFingerprint })
     })()
     ```
   - Afficher : "Mode veille actif sur [groupe]. Je surveille les messages..."

2. **Boucle de surveillance** (repeter jusqu'a interruption) :
   - Attendre 20s : `computer` action=wait duration=20
   - **Scroll vers le bas** : `computer` action=key text="End" (garantit de voir les derniers messages)
   - Poll par fingerprint via `javascript_tool` :
     ```js
     (() => {
       if (!window.__cloclo_v2?.active) return JSON.stringify({ error: 'v2 watch not active' });
       const last5 = window.__cloclo_v2.getLastMessages(5);
       const lastMsg = last5[last5.length - 1];
       const currentFP = lastMsg ? (lastMsg.time + '|' + lastMsg.sender + '|' + lastMsg.text.substring(0, 50)) : '';
       const changed = currentFP !== window.__cloclo_v2.lastFingerprint;
       let newIncoming = [];
       if (changed) {
         const oldFP = window.__cloclo_v2.lastFingerprint;
         const last10 = window.__cloclo_v2.getLastMessages(10);
         let foundOld = false;
         for (const msg of last10) {
           const fp = msg.time + '|' + msg.sender + '|' + msg.text.substring(0, 50);
           if (fp === oldFP) { foundOld = true; continue; }
           if (foundOld && msg.dir === 'in') newIncoming.push(msg);
         }
         if (!foundOld) newIncoming = last10.filter(m => m.dir === 'in').slice(-3);
         window.__cloclo_v2.lastFingerprint = currentFP;
       }
       window.__cloclo_v2.pollCount++;
       return JSON.stringify({ changed, newIncoming: newIncoming.length, messages: newIncoming, poll: window.__cloclo_v2.pollCount });
     })()
     ```
   - **Si nouveaux messages (newIncoming > 0)** :
     - Analyser chaque message
     - Determiner si Cloclo est sollicite :
       - Le message contient "cloclo" ou "claude" (case-insensitive)
       - Le message est une question directe (finit par ?)
       - Le message cite/repond a un message de Cloclo
       - Le message est adresse a Cloclo par un membre de l'equipe
     - Si sollicite :
       - Lire les 5 derniers messages pour le contexte (via read)
       - Composer une reponse Cloclo (persona rules)
       - Envoyer via reply
       - Log : "Repondu a [sender] : [resume]"
     - Si pas sollicite :
       - Log discret : "Nouveau message de [sender], pas de sollicitation"
   - **Si pas de nouveaux messages** : continuer silencieusement (AUCUN output vers l'utilisateur)
   - Retourner au debut de la boucle
   - **NE JAMAIS S'ARRETER** tant que l'utilisateur n'a pas explicitement demande d'arreter

3. **Arret** : UNIQUEMENT quand l'utilisateur dit explicitement d'arreter la veille (ex: "arrete la veille", "stop watch", "conge"). Ne JAMAIS s'arreter de soi-meme.

### `status` — Etat du systeme

1. Appeler `tabs_context_mcp`
2. Chercher un onglet WhatsApp Web
3. Si trouve : verifier via `javascript_tool` si `window.__cloclo_v2?.active` est true (watch mode)
4. Afficher :
   ```
   WhatsApp Web : connecte (tab #123)
   Groupe actif : ATUM SAS
   Watch mode   : actif depuis 14:30 (15 messages lus, 3 reponses)
   ```

### Pas d'arguments ou `help` — Afficher l'aide

```
/whatsapp open [groupe]     — Ouvrir WhatsApp Web sur un groupe (defaut: ATUM SAS)
/whatsapp read [N]          — Lire les N derniers messages (defaut: 10)
/whatsapp reply <message>   — Envoyer un message dans le chat actif
/whatsapp watch [groupe]    — Mode veille : surveiller et repondre quand sollicite
/whatsapp status            — Etat de la connexion et du watch mode
```

## Configuration

| Parametre | Valeur |
|-----------|--------|
| Compte WhatsApp | Cloclo (+1 683-777-0932) via WhatsApp Web |
| Groupe par defaut | ATUM SAS |
| Intervalle watch | 20 secondes |
| Persona | `~/.claude/rules/common/whatsapp-persona.md` |

## Notes techniques

- Les selecteurs CSS de WhatsApp Web changent regulierement (classes obfusquees). Privilegier `data-pre-plain-text` (stable) et `find()` (naturel language) plutot que des selecteurs CSS precis.
- Si un selecteur ne fonctionne plus, utiliser `read_page` avec `filter: "interactive"` pour trouver les elements.
- Le MutationObserver peut se detacher si la page se recharge. En cas de doute, re-injecter via `watch`.
