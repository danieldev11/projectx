var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var LEAD_ROUTE = "/forms/lead";
var HEALTH_ROUTE = "/health";
var MAX_PAYLOAD_BYTES = 64 * 1024;
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    const cors = new Cors(env.ALLOWED_ORIGINS);
    if (request.method === "OPTIONS") {
      return cors.preflight(origin, request.headers.get("Access-Control-Request-Method"));
    }
    if (url.pathname === HEALTH_ROUTE && request.method === "GET") {
      return cors.wrap(
        origin,
        jsonResponse({
          status: "ok",
          project: env.PROJECT_NAME,
          env: env.ENVIRONMENT
        })
      );
    }
    if (url.pathname === LEAD_ROUTE && request.method === "POST") {
      return cors.wrap(origin, await handleLead(request, env));
    }
    return cors.wrap(
      origin,
      jsonResponse({ error: "Not found" }, 404)
    );
  }
};
async function handleLead(request, env) {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader && Number(contentLengthHeader) > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ error: "Payload too large" }, 413);
  }
  const bodyText = await request.text();
  if (new TextEncoder().encode(bodyText).byteLength > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ error: "Payload too large" }, 413);
  }
  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (!isObject(payload)) {
    return jsonResponse({ error: "Body must be a JSON object" }, 400);
  }
  const name = extractString(payload.name);
  const email = extractString(payload.email);
  if (!name || !name.trim()) {
    return jsonResponse({ error: "Missing required field: name" }, 400);
  }
  if (!email || !email.includes("@")) {
    return jsonResponse({ error: "Invalid email address" }, 400);
  }
  const signature = await createSignature(env.SIGNING_SECRET, bodyText);
  const target = buildWebhookUrl(env.N8N_BASE_URL, env.N8N_WEBHOOK_PATH);
  const upstreamResponse = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature": signature
    },
    body: bodyText
  });
  if (!upstreamResponse.ok) {
    const text = await safeText(upstreamResponse);
    return jsonResponse(
      {
        error: "Upstream webhook call failed",
        status: upstreamResponse.status,
        detail: text.slice(0, 200)
      },
      502
    );
  }
  return jsonResponse({ ok: true });
}
__name(handleLead, "handleLead");
async function createSignature(secret, payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign"
  ]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signatureBuffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(createSignature, "createSignature");
function buildWebhookUrl(baseUrl, path) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
__name(buildWebhookUrl, "buildWebhookUrl");
async function safeText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
__name(safeText, "safeText");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
__name(isObject, "isObject");
function extractString(value) {
  return typeof value === "string" ? value : null;
}
__name(extractString, "extractString");
var Cors = class {
  static {
    __name(this, "Cors");
  }
  origins;
  constructor(originList) {
    this.origins = new Set(
      originList.split(",").map((origin) => origin.trim()).filter(Boolean)
    );
  }
  headersForOrigin(origin) {
    if (!origin || !this.origins.has(origin)) {
      return {};
    }
    return {
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin"
    };
  }
  wrap(origin, response) {
    const headers = new Headers(response.headers);
    const corsHeaders = this.headersForOrigin(origin);
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
  preflight(origin, method) {
    if (!method) {
      return jsonResponse({ error: "Missing Access-Control-Request-Method" }, 400);
    }
    if (!origin || !this.origins.has(origin)) {
      return jsonResponse({ error: "Origin not allowed" }, 403);
    }
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin"
      }
    });
  }
};

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-TW0rCw/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-TW0rCw/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
