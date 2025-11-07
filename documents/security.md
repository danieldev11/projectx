# Security Policy

This document defines the security standards, responsibilities, and data-handling rules for all systems and contributors.  
It applies to all automation workflows, integrations, and documentation managed within this repository.

---

## 1. Scope

This policy governs:

- **n8n Cloud** workflows and credentials  
- **Supabase** database access and API keys  
- **Cloudflare Workers** and associated secrets  
- **Repository access** via GitHub and Codex automation  
- **Future self-hosted / R&D** environments running on Docker or VPS  

All contributors and automated agents (e.g., Codex) must follow these standards when interacting with the project.

---

## 2. Principles

1. **Least privilege** — only grant access strictly necessary for the task.  
2. **Separation of environments** — production and R&D credentials never overlap.  
3. **Credential minimization** — use short-lived tokens or service-scoped keys where possible.  
4. **Encryption at rest and in transit** — all secrets must be stored and transmitted using secure channels (HTTPS/TLS).  
5. **Transparency and auditability** — every sensitive change must be logged or versioned without exposing secrets.  

---

## 3. Credential Storage

| Component | Storage Method | Notes |
|------------|----------------|-------|
| **n8n Cloud** | Native encrypted credential manager | Do not export credentials with workflows. |
| **Supabase** | Stored as environment variables in n8n Cloud | Use service role keys only in secure server contexts. |
| **Cloudflare Workers** | Managed via `wrangler secret` | Never hardcode credentials in `.ts` or `.toml` files. |
| **Local / R&D** | `.env` file excluded from Git | Rotate and purge regularly. |

---

## 4. Repository Security

- `.env` and other secret files are **never committed**.  
- Sensitive tokens must be redacted from logs, commits, and pull requests.  
- All documentation examples must use **placeholders** (e.g., `SUPABASE_KEY=YOUR_KEY_HERE`).  
- Branch protection and mandatory reviews are required for changes under `/cloudflare`, `/supabase`, or `/workflows`.

---

## 5. Codex Security Directives

Codex operates under the following constraints:

1. **Read-only access** to real credentials — Codex references variable names, never values.  
2. **No logging of secrets** in output or commit messages.  
3. **Environment simulation only** — Codex can infer variable use but must not attempt live API calls.  
4. **Credential redaction** — any found secret pattern (e.g., API key, JWT, token) must be replaced with `{{REDACTED}}`.  
5. **Restricted write scope** — Codex edits are limited to code and documentation, not production systems.

---

## 6. Access Control

| Role | Access Level | Authentication |
|------|---------------|----------------|
| **Team Members** | Read/Write on repo, n8n Cloud collaborator access | GitHub SSO + n8n role-based access |
| **Codex Agent** | Controlled read/write on repo only | GitHub API key or local token |
| **R&D Operators** | VPS user-level SSH only (no root) | SSH keypairs with passphrases |
| **Clients** | Workflow output access only | No credential visibility |

All access must be reviewed quarterly or after role changes.

---

## 7. Incident Response

1. **Identify** — Detect exposure via Git history, logs, or third-party alerts.  
2. **Revoke** — Immediately invalidate affected tokens or keys.  
3. **Rotate** — Generate and update new secrets across all dependent services.  
4. **Review** — Commit a redacted patch and update this document if process changes.  
5. **Report** — Record the event internally with date, cause, and resolution.

---

## 8. Data Protection

- Personal or client data handled by n8n workflows must comply with relevant privacy laws (e.g., GDPR, CCPA if applicable).  
- Use Supabase Row Level Security (RLS) to restrict unauthorized reads/writes.  
- Logs or error messages must not contain PII or sensitive metadata.  
- Retain workflow data only as long as operationally necessary.

---

## 9. Backup and Recovery

- n8n Cloud maintains its own backups for hosted workflows.  
- Supabase enables point-in-time recovery; review retention settings monthly.  
- For R&D or VPS environments, enable Docker volume backups via snapshot or cron job.  
- All backups must be encrypted and stored in access-restricted locations.

---

## 10. Future Self-Hosted Considerations

When migrating or replicating to a VPS:

- Use Docker secrets or an external vault (e.g., HashiCorp Vault).  
- Restrict inbound ports to HTTPS (443) only.  
- Use reverse proxy (e.g., Nginx/Caddy) with automatic TLS renewal.  
- Rotate SSH keys quarterly.  

---

## 11. Compliance and Review

- Security policies must be reviewed **biannually** or after any major infrastructure change.  
- Codex can assist by generating a compliance checklist or validating env consistency.  
- Deviations from policy must be documented under `/docs/R&D/security_exceptions.md`.

---

_Last updated: November 2025_
