import { createServer } from "node:http";
import server from "./dist/server/server.js";

const port = Number(process.env.PORT || 3000);

const httpServer = createServer(async (req, res) => {
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
