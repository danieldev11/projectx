# Workflow Documentation Standard

This document defines the standard format and metadata structure for documenting n8n workflows.
Each workflow should be exported as a `.json` file and accompanied by a corresponding `.md` summary under `documents/workflows/`.

---

## Table of Contents

1. Purpose
2. File Structure
3. Workflow Documentation Template
4. Workflow Naming Convention
5. Automation Rules (AI Assistant)
6. Metadata Extraction Logic
7. Documentation Update Triggers
8. Indexing and Cross-References
9. Compliance

---

## 1. Purpose

Create a clear, auditable record of every automation in production. Each workflow documentation file serves as both a technical reference and a change log anchor.

---

## 2. File Structure

| Directory | Purpose |
|-----------|---------|
| `workflows/` | Raw n8n JSON exports (one per workflow). If this top-level folder doesn't exist, confirm with maintainers before creating it. |
| `documents/workflows/` | Human-readable Markdown summaries for each workflow |
| `documents/workflows/_index.md` | Optional global list of all workflows with links |

Each workflow must have a one-to-one relationship between the `.json` and `.md` files.

Example:

```text
workflows/wf_lead_intake.json
documents/workflows/wf_lead_intake.md
```

---

## 3. Workflow Documentation Template

Each `.md` file should follow this format:

```markdown
# Workflow: <workflow_name>

**Last updated:** <YYYY-MM-DD>
**Environment:** <Production | R&D>
**Author:** <Name or AI Assistant>
**Source File:** `/workflows/<filename>.json`

---

## Summary
<Brief 2–3 sentence overview explaining what this workflow does and when it runs.>

---

## Trigger
| Type | Details |
|------|---------|
| Webhook / Cron / Manual / Trigger Node | <Describe how it’s activated> |

Example:
Triggered by a Cloudflare Worker webhook when a lead form is submitted.

---

## Data Flow
Input → Processing → Output

| Step | Description | Example |
|------|------------|---------|
| 1 | Input collected via webhook | POST from Cloudflare Worker |
| 2 | Data stored or transformed | Validated and inserted into Supabase |
| 3 | Output or notification | Email sent via Postmark |

---

## Dependencies

| Component | Function |
|-----------|----------|
| Supabase | Stores leads, user data, or logs |
| Cloudflare Workers | Acts as request proxy and input filter |
| Postmark / Twilio | Sends emails or SMS notifications |
| API Keys Used | List environment variable names, not actual keys |

Example environment variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_KEY
POSTMARK_TOKEN
```

---

## Error Handling

Describe how the workflow manages errors:

- Retry logic
- Fallback workflows
- Notifications or logs

Example:
If the Supabase insert fails, the workflow triggers a Slack alert to `#automation-notify`.

---

## Security Considerations

- No PII stored in logs
- All credentials reference environment variables
- n8n Cloud credential store handles encryption

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2025-11-06 | Workflow created and documented | AI Assistant |
| 2025-11-10 | Added Postmark integration | Amogh |

---

## Notes

Optional section for implementation details, testing notes, or related workflows.

---

## 4. Workflow Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| General | `wf_<category>_<purpose>.json` | `wf_lead_intake.json` |
| Scheduled | `wf_cron_<function>.json` | `wf_cron_data_cleanup.json` |
| Integration-Specific | `wf_<service>_<action>.json` | `wf_postmark_send_email.json` |

Corresponding docs should share the same prefix:

```text
wf_lead_intake.md → wf_lead_intake.json
```

---

## 5. Automation Rules (AI Assistant)

The AI Assistant can help enforce this standard by:

- Scanning `workflows/` for `.json` files lacking corresponding `.md` summaries
- Parsing metadata (name, trigger, connected nodes, credentials)
- Generating Markdown summaries using this structure
- Inserting a generated footer with timestamp
- Skipping updates for files tagged as `manual-doc: true` in front matter

---

## 6. Metadata Extraction Logic

When parsing `.json`, extract and normalize:

- `name` → workflow title
- `nodes` → connected integrations
- `connections` → flow structure
- `trigger` → node type (Webhook, Cron, etc.)
- `parameters` → key data (e.g., URL, schedule, table name)

---

## 7. Documentation Update Triggers

Update workflow docs when:

- A new node or external integration is added
- Input/output format changes
- Environment variables are modified
- Error-handling or logging logic changes
- Workflow is promoted from R&D → Production

---

## 8. Indexing and Cross-References

The AI Assistant may maintain an optional `documents/workflows/_index.md` listing all workflows:

### Workflow Index

| Workflow | Description | Environment | Last Updated |
|----------|-------------|-------------|--------------|
| [wf_lead_intake](wf_lead_intake.md) | Captures form leads from website | Production | 2025-11-06 |
| [wf_cron_cleanup](wf_cron_cleanup.md) | Deletes inactive records daily | R&D | 2025-11-04 |

This file is auto-generated and should not be manually edited.

---

## 9. Compliance

- Every production workflow must have a matching `.md` file before deployment.
- Any undocumented `.json` file is treated as incomplete.
- The AI Assistant and maintainers share responsibility for ensuring synchronization.

---

Last updated: 2025-11-06
