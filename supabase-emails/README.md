# Makej! — Custom auth emaily (Supabase)

Hotové HTML šablony v modrém Makej! stylu. Nejsou součástí běhu appky — vkládají se
ručně do Supabase dashboardu.

## Kam je vložit

**Supabase → Authentication → Emails → Templates**

| Soubor | Šablona v dashboardu |
|---|---|
| `confirm-signup.html` | Confirm signup |
| `reset-password.html` | Reset password |
| `magic-link.html` | Magic Link |

Otevři soubor, zkopíruj **celý obsah** (bez horního `<!-- ... -->` komentáře je to jedno,
klidně zkopíruj vše) do pole **Message body (HTML)** a nahoře nastav **Subject** podle
komentáře v souboru.

## Proměnné (Go template)

- `{{ .ConfirmationURL }}` — akční odkaz (potvrzení / reset / login)
- `{{ .SiteURL }}` — Site URL z nastavení
- `{{ .Email }}` — email příjemce
- `{{ .Data.name }}`, `{{ .Data.role }}` — z `user_metadata` (posíláme je v `signUp`)

`confirm-signup.html` rozlišuje **worker vs. employer** přes `{{ if eq .Data.role "employer" }}`.

## Důležité

1. **Site URL / Redirect URLs** nastav v *Authentication → URL Configuration*, jinak
   odkaz v emailu povede na localhost.
2. Pro ostrý provoz nastav **vlastní SMTP** (*Authentication → Emails → SMTP Settings*),
   např. Resend s doménou makej.eu — jinak platí limit ~2–4 emaily/hodinu a padá to do spamu.
3. Šablony jsou table-based + inline styly kvůli kompatibilitě (Gmail, Outlook, Apple Mail).
4. Loga jsou textová ("Makej!"). Pokud chceš obrázkové logo, nahraj PNG někam veřejně
   (např. do `makej-web`) a nahraď textový `<div>` za `<img src="https://makej.eu/logo.png" ...>`.
