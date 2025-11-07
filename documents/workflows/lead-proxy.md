# Workflow: `lead-proxy` (Cloudflare Worker)

## 1) Purpose

Edge gateway for public form submissions. Enforces CORS and schema, signs payloads with HMAC, attaches a `trace_id`, and forwards to n8n Cloud’s production webhook. Returns a minimal success object or a typed error without exposing upstream internals.

---

## 2) Scope & Ownership

* **Scope:** Ingress for `POST /forms/lead` only; no rendering or business logic.
* **Owner:** Automation Platform (Edge)
* **Upstream:** n8n Cloud (Production webhook)
* **Downstream (planned):** Supabase via n8n

---

## 3) Triggers & Routes

| Method  | Path          | Behavior                               |
| ------- | ------------- | -------------------------------------- |
| OPTIONS | `/forms/lead` | CORS preflight → `204 No Content`      |
| POST    | `/forms/lead` | Validate, sign, forward to n8n webhook |
| GET     | `/health`     | Health probe → `200 OK` body: `ok`     |
| *       | *             | Any other path → `404 Not Found`       |

**Routing (Cloudflare):** `api.work.com/* → lead-proxy`
**Frontend origins:** `https://www.work.com`, `https://hayai.cc` (expand via env).

---

## 4) Input Contract

### Headers (required)

* `Content-Type: application/json`

### JSON Body (required)

```json
{
  "name": "string, non-empty",
  "email": "string, contains @",
  "phone": "string, optional",
  "message": "string, optional",
  "trace_id": "string, optional (client-supplied)"
}
```

### Constraints

* Max payload size: **64 KB**
* Content-Type must be `application/json`

---

## 5) Output Contract

### Success

* **Status:** `200`
* **Body:**

  ```json
  { "ok": true, "trace_id": "<uuid-or-client-id>" }
  ```

### Errors (typed)

| Status | Code                     | Body Example                                  |
| ------ | ------------------------ | --------------------------------------------- |
| 400    | `invalid_json`           | `{ "error":"invalid_json" }`                  |
| 400    | `missing_field`          | `{ "error":"missing_field","field":"email" }` |
| 400    | `invalid_email`          | `{ "error":"invalid_email" }`                 |
| 403    | `origin_not_allowed`     | `{ "error":"origin_not_allowed" }`            |
| 413    | `payload_too_large`      | `{ "error":"payload_too_large" }`             |
| 415    | `unsupported_media_type` | `{ "error":"unsupported_media_type" }`        |
| 502    | `upstream_timeout`       | `{ "error":"upstream_timeout" }`              |
| 502    | `upstream_error`         | `{ "error":"upstream_error" }`                |
| 404    | `not_found`              | `{ "error":"not_found" }`                     |

CORS headers are included on both preflight and POST responses for allowed origins.

---

## 6) Transformations & Enrichment

1. **Origin allowlist** → block non-approved origins.
2. **Schema validation** → required fields present; minimal email check.
3. **`trace_id` handling** → accept client-provided or generate server-side UUID.
4. **HMAC signature** → compute `hex(hmac_sha256(SIGNING_SECRET, rawBody))`.

   * Forwarded as `X-Signature: <hex>`
   * Also forward `X-Trace-Id: <trace_id>`
5. **Timeout control** → upstream call capped at 5,000 ms.

No PII is persisted at the edge.

---

## 7) Upstream Call (n8n Cloud)

* **Method:** `POST`
* **URL:** `${N8N_BASE_URL}${N8N_WEBHOOK_PATH}` (production webhook)
* **Headers:**

  * `Content-Type: application/json`
  * `X-Signature: <hex>`
  * `X-Trace-Id: <trace_id>`
* **Body:** Validated JSON (original fields + normalized `trace_id`)

**Expected response:** HTTP `2xx` with small JSON body. Non-2xx → map to `502 upstream_error`.

---

## 8) Environment & Secrets

Defined in `wrangler.toml`:

| Variable            | Description                                         | Example                                 |
| ------------------- | --------------------------------------------------- | --------------------------------------- |
| `ENVIRONMENT`       | Label for behavior toggles/logging                  | `production`                            |
| `ALLOWED_ORIGINS`   | Comma-separated origins (no trailing slashes)       | `https://www.work.com,https://hayai.cc` |
| `N8N_BASE_URL`      | Public n8n Cloud base URL                           | `https://hayai.app.n8n.cloud`           |
| `N8N_WEBHOOK_PATH`  | The production webhook path                         | `/webhook/lead`                         |
| `SIGNING_SECRET`    | HMAC key (keep in Cloudflare secrets, never commit) | (secret)                                |
| `TIMEOUT_MS`        | Upstream timeout (ms)                               | `5000`                                  |
| `RATE_LIMIT_TTL_S`* | KV limiter window (seconds)                         | `60`                                    |
| `RATE_LIMIT_MAX`*   | Allowed requests per window per IP/origin           | `30`                                    |
| `REPLAY_TTL_S`*     | Nonce/trace replay window                           | `600`                                   |

* Used when rate limiting/replay protection is enabled.

**Bindings (optional planned):**

* `KV` namespace: `RATE_LIMIT_STORE`
* `KV` namespace: `REPLAY_NONCE_STORE`

---

## 9) Security Controls

* **CORS allowlist**: strict origins only.
* **HMAC integrity**: `X-Signature` computed over raw body.
* **No secrets to client**: secrets exist only in Worker env; never echoed.
* **Size limits**: reject large payloads before upstream call.
* **Time bounds**: deterministic upstream timeout.
* **Replay guards (planned)**: nonce or `trace_id` de-duplication in KV; short TTL windows.
* **n8n verification (required on workflow)**: verify `X-Signature` with same secret before processing.

---

## 10) Observability

* **Health:** `GET /health` returns `200` with `"ok"`.
* **Traceability:** `X-Trace-Id` propagated through Worker → n8n.
* **Synthetic check (planned):** nightly GitHub Action or n8n Cron sends a dummy lead; assert 200 and presence in n8n logs.

---

## 11) Test Matrix (Minimal)

**Preflight**

```bash
curl -i -X OPTIONS https://api.work.com/forms/lead \
  -H "Origin: https://www.work.com" \
  -H "Access-Control-Request-Method: POST"
```

Expect `204` + CORS headers.

**Happy Path**

```bash
curl -i https://api.work.com/forms/lead \
  -H "Origin: https://www.work.com" \
  -H "Content-Type: application/json" \
  --data '{"name":"Ada","email":"ada@work.com"}'
```

Expect `200 {"ok":true,"trace_id":"..."}` and execution logged in n8n.

**Invalid Origin**text

```bash
curl -i https://api.work.com/forms/lead \
  -H "Origin: https://evil.tld" \
  -H "Content-Type: application/json" \
  --data '{"name":"A","email":"a@b.com"}'
```

Expect `403 origin_not_allowed`.

**Timeout Simulation**text

* Temporarily point `N8N_BASE_URL` to a slow endpoint or use a 5s sleeper.
* Expect `502 upstream_timeout`.

---

## 12) Failure Modes & Handling

| Failure          | Cause                                    | Worker Behavior                 | Operator Action                         |
| ---------------- | ---------------------------------------- | ------------------------------- | --------------------------------------- |
| Upstream timeout | n8n slow or unreachable                  | `502 upstream_timeout`          | Check n8n status; re-run synthetic test |
| Upstream 4xx/5xx | Validation/business logic failure in n8n | `502 upstream_error`            | Inspect n8n execution + retry logic     |
| Bad origin       | Misrouted or hostile request             | `403 origin_not_allowed`        | Review DNS/routes; confirm allowlist    |
| Replay (planned) | Duplicate `trace_id`/nonce               | `409 replay_detected` (planned) | Tune TTL/max; inspect logs              |

---

## 13) Versioning & Deployment

* **Source:** `/cloudflare/lead-proxy` (TypeScript)
* **Config:** `/cloudflare/wrangler.toml`
* **Deploy:** `wrangler deploy --env production`
* **Rollback:** `wrangler versions list` → `wrangler versions rollback <id>`

**Change control:** Bump doc `Version:` and note in repo changelog upon deployment.

---

## 14) n8n Workflow Expectations

The target webhook workflow must:

1. **Verify `X-Signature`** using the shared `SIGNING_SECRET` against the raw body.
2. **Trust `trace_id`** as idempotency key.
3. **(Planned) Persist** to Supabase with a unique index on `trace_id`.
4. **Return small 2xx JSON** quickly; heavy processing should be async/follow-up.

---

## 15) Roadmap (Edge Concerns Only)

* **Enable KV rate limiting** per IP and per origin.
* **Enable replay protection** using `trace_id` or explicit nonce in KV.
* **Structured logging** via Workers Logs/Sentry (if added).
* **Add `/metrics` (optional)** behind an access token for synthetic probes.

---

**Status:** Active in production
**Last Verified:** 2025-11-07
**Version:** 1.0
