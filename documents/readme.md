# Project Overview

This repository documents the operational framework for an automation agency built around **n8n Cloud**.  
The immediate priority is to deliver reliable client workflows using vendor-managed infrastructure, while maintaining the option to expand into a self-hosted environment later.

---

## Purpose

To standardize how automation projects are built, configured, and maintained on n8n Cloud.  
All documentation, credentials, and workflow exports are organized to ensure replicability, security, and fast onboarding.

---

## Core Environment

| Environment | Role | Hosting | Responsibility |
|--------------|------|----------|----------------|
| **Production** | Client workflows and data handling | n8n Cloud | Vendor-managed |
| **Future / R&D** | Optional testing and DevOps experimentation | Self-hosted VPS (Docker) | Internal, non-critical |

*Production reliability is the current operational focus. The self-hosted path exists only for training, backup, or later migration.*

---

## Components

- **n8n Cloud** – Main automation platform  
- **Supabase** – Managed database for structured lead and client data  
- **Cloudflare Workers** – Request routing, webhook protection, and environment-based filtering  
- **GitHub Repository** – Version control for workflow JSONs, environment variables, and documentation  

---

## Workflow Lifecycle

1. Design automation in n8n Cloud.  
2. Test, document, and export workflow JSON to the repository.  
3. Configure production credentials using n8n’s encrypted store.  
4. Connect relevant APIs and confirm end-to-end triggers.  
5. Record environment variables and update documentation.

---

## Guiding Principles

1. **Reliability before autonomy** — prioritize n8n Cloud stability.  
2. **Document everything** — all workflows, variables, and endpoints must be traceable.  
3. **Security first** — encrypted credentials, minimal API scopes.  
4. **Scalable structure** — the same architecture can later extend to a VPS or hybrid setup.  
5. **Simplicity over redundancy** — avoid managing infrastructure until there is a defined operational need.

---

## Next Steps

1. Finalize production account setup on n8n Cloud.  
2. Define workflow templates for lead intake and client delivery.  
3. Connect Supabase and Cloudflare Workers.  
4. Establish export and versioning policy for workflows.  
5. (Optional) Begin documenting sandbox procedures under `/docs/R&D`.

---

_Last updated: November 2025_
