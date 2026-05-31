# Makej! — Supabase Email Templates

Tyto šablony vlož do Supabase Dashboard ručně.

## Jak to udělat

1. Jdi na [supabase.com](https://supabase.com) → otevři projekt `cxegfwfbgcgpwerfbvra`
2. Levé menu → **Authentication** → **Email Templates**
3. Pro každou šablonu:
   - Klikni na typ šablony (viz níže)
   - Zkopíruj obsah HTML souboru do pole **Message Body**
   - Uprav **Subject** podle komentáře v souboru
   - Klikni **Save**

## Šablony

| Soubor | Supabase typ | Subject |
|---|---|---|
| `confirm-signup.html` | Confirm signup | `Potvrď svůj účet na Makej!` |
| `reset-password.html` | Reset password | `Obnova hesla na Makej!` |

## Důležité — SMTP limit na free tier

Supabase free tier = max **3 e-maily za hodinu** (sdílená IP).

Pro produkci nastav vlastní SMTP:
- Authentication → Settings → **SMTP Settings**
- Doporučujeme: **Resend** (resend.com) — 3 000 e-mailů/měsíc zdarma

## Proměnné

Supabase automaticky nahrazuje `{{ .ConfirmationURL }}` správným odkazem.
Nemaz ani neměň tyto proměnné v šablonách.
