# MMRP — Městské Město Roleplay

Web pro český FiveM roleplay server MMRP. Statická stránka (HTML/CSS/JS),
hostovaná na GitHub Pages, doména `mmrp.fun`.

## Struktura repozitáře

```
index.html      – hlavní stránka
tym/index.html  – A-Team (URL: /tym, data z team.json)
style.css       – veškerý styl webu
script.js       – veškerá interaktivita (menu, animace, statistiky, tým)
logo.webp       – logo MMRP
favicon.png     – ikonka do záložky prohlížeče
team.json       – seznam členů týmu, generuje ho automaticky GitHub Action

sync-team.mjs                    – skript, který stahuje tým z Discordu
.github/workflows/sync-team.yml – automatické spouštění skriptu
```

`.github/` je jediná povinná systémová složka (vyžaduje ji GitHub Actions
pro automatizaci) — zbytek webu, včetně `sync-team.mjs`, je v jedné rovné
složce bez podadresářů.

## Co je potřeba upravit ručně

V `index.html` (2×) hledej komentář `ZDE ZMEŇ`:

```html
<a href="fivem://connect/000.000.000.000:30120" ...>
```

Nahraď skutečnou IP adresou a portem tvého FiveM serveru.

## Nastavení automatické synchronizace týmu z Discordu

1. **Repo → Settings → Secrets and variables → Actions → New repository secret**
   - Name: `DISCORD_BOT_TOKEN`
   - Value: token tvého Discord bota
   - **Uložit**

2. **Repo → Settings → Actions → General → Workflow permissions**
   - Zaškrtnout **"Read and write permissions"**
   - **Save** (bez tohoto krok Action nemůže zapsat `team.json` zpět do repozitáře)

3. **Repo → záložka Actions → "Sync Discord Team" → Run workflow**
   - Spustí se ručně poprvé, dál pak běží automaticky každých 6 hodin

Guild ID a ID rolí jsou nastavené přímo v `sync-team.mjs`
(nejsou to citlivé údaje, není problém je mít v kódu). Token bota
citlivý je — proto jde jen do GitHub Secret, nikdy do souborů.

Pokud chceš přidat/odebrat roli, která se má na webu zobrazovat,
uprav pole `ROLE_PRIORITY` v `sync-team.mjs`.

## Vlastní doména (mmrp.fun)

DNS u Wedosu už je nastavené na Netlify. Při přechodu na GitHub Pages
je potřeba DNS záznamy přesměrovat na GitHub servery — ozvi se, projdeme to.
