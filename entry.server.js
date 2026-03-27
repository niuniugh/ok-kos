import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import server from "./dist/server/server.js";

const port = Number(process.env.PORT || 3000);
const clientDir = join(import.meta.dirname, "dist", "client");

const mimeTypes = {
	".js": "application/javascript",
	".css": "text/css",
	".html": "text/html",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".webmanifest": "application/manifest+json",
};

async function serveStatic(req, res) {
	const filePath = join(clientDir, req.url);
	try {
		const fileStat = await stat(filePath);
		if (!fileStat.isFile()) return false;
		const content = await readFile(filePath);
		const ext = extname(filePath);
		res.writeHead(200, {
			"Content-Type": mimeTypes[ext] || "application/octet-stream",
			"Cache-Control": "public, max-age=31536000, immutable",
		});
		res.end(content);
		return true;
	} catch {
		return false;
	}
}

const httpServer = createServer(async (req, res) => {
	// Try static files first
	if (req.method === "GET" && (await serveStatic(req, res))) return;

	// Fall through to SSR
	const url = new URL(req.url, `http://${req.headers.host}`);
	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (value)
			headers.set(key, Array.isArray(value) ? value.join(", ") : value);
	}

	const body =
		req.method !== "GET" && req.method !== "HEAD"
			? await new Promise((resolve) => {
					const chunks = [];
					req.on("data", (c) => chunks.push(c));
					req.on("end", () => resolve(Buffer.concat(chunks)));
				})
			: undefined;

	const webRequest = new Request(url.toString(), {
		method: req.method,
		headers,
		body,
		duplex: "half",
	});

	const webResponse = await server.fetch(webRequest);

	res.writeHead(webResponse.status, Object.fromEntries(webResponse.headers));
	const arrayBuffer = await webResponse.arrayBuffer();
	res.end(Buffer.from(arrayBuffer));
});

httpServer.listen(port, "0.0.0.0", () => {
	console.log(`Server listening on http://0.0.0.0:${port}`);
});
