export interface Env {
	PROJECT_NAME: string;
	ENVIRONMENT: string;
	ALLOWED_ORIGINS: string;
	N8N_BASE_URL: string;
	N8N_WEBHOOK_PATH: string;
	SIGNING_SECRET: string;
}

const LEAD_ROUTE = '/forms/lead';
const HEALTH_ROUTE = '/health';
const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const origin = request.headers.get('Origin') ?? '';
		const cors = new Cors(env.ALLOWED_ORIGINS);

		if (request.method === 'OPTIONS') {
			return cors.preflight(origin, request.headers.get('Access-Control-Request-Method'));
		}

		if (url.pathname === HEALTH_ROUTE && request.method === 'GET') {
			return cors.wrap(
				origin,
				jsonResponse({
					status: 'ok',
					project: env.PROJECT_NAME,
					env: env.ENVIRONMENT
				})
			);
		}

		if (url.pathname === LEAD_ROUTE && request.method === 'POST') {
			return cors.wrap(origin, await handleLead(request, env));
		}

		return cors.wrap(
			origin,
			jsonResponse({ error: 'Not found' }, 404)
		);
	}
};

async function handleLead(request: Request, env: Env): Promise<Response> {
	const contentLengthHeader = request.headers.get('content-length');
	if (contentLengthHeader && Number(contentLengthHeader) > MAX_PAYLOAD_BYTES) {
		return jsonResponse({ error: 'Payload too large' }, 413);
	}

	const bodyText = await request.text();
	if (new TextEncoder().encode(bodyText).byteLength > MAX_PAYLOAD_BYTES) {
		return jsonResponse({ error: 'Payload too large' }, 413);
	}

	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(bodyText);
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400);
	}

	if (!isObject(payload)) {
		return jsonResponse({ error: 'Body must be a JSON object' }, 400);
	}

	const name = extractString(payload.name);
	const email = extractString(payload.email);

	if (!name || !name.trim()) {
		return jsonResponse({ error: 'Missing required field: name' }, 400);
	}

	if (!email || !email.includes('@')) {
		return jsonResponse({ error: 'Invalid email address' }, 400);
	}

	const signature = await createSignature(env.SIGNING_SECRET, bodyText);
	const target = buildWebhookUrl(env.N8N_BASE_URL, env.N8N_WEBHOOK_PATH);

	const upstreamResponse = await fetch(target, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Signature': signature
		},
		body: bodyText
	});

	if (!upstreamResponse.ok) {
		const text = await safeText(upstreamResponse);
		return jsonResponse(
			{
				error: 'Upstream webhook call failed',
				status: upstreamResponse.status,
				detail: text.slice(0, 200)
			},
			502
		);
	}

	return jsonResponse({ ok: true });
}

async function createSignature(secret: string, payload: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign'
	]);
	const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	return Array.from(new Uint8Array(signatureBuffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

function buildWebhookUrl(baseUrl: string, path: string): string {
	const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${normalizedBase}${normalizedPath}`;
}

async function safeText(response: Response): Promise<string> {
	try {
		return await response.text();
	} catch {
		return '';
	}
}

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store'
		}
	});
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractString(value: unknown): string | null {
	return typeof value === 'string' ? value : null;
}

class Cors {
	private origins: Set<string>;

	constructor(originList: string) {
		this.origins = new Set(
			originList
				.split(',')
				.map((origin) => origin.trim())
				.filter(Boolean)
		);
	}

	private headersForOrigin(origin: string): HeadersInit {
		if (!origin || !this.origins.has(origin)) {
			return {};
		}

		return {
			'Access-Control-Allow-Origin': origin,
			Vary: 'Origin'
		};
	}

	wrap(origin: string, response: Response): Response {
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

	preflight(origin: string, method: string | null): Response {
		if (!method) {
			return jsonResponse({ error: 'Missing Access-Control-Request-Method' }, 400);
		}

		if (!origin || !this.origins.has(origin)) {
			return jsonResponse({ error: 'Origin not allowed' }, 403);
		}

		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '86400',
				Vary: 'Origin'
			}
		});
	}
}
