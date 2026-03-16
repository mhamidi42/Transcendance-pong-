import WebSocket, { WebSocketServer, RawData } from "ws";
import type { IncomingMessage } from "http";

type Client = {
	socket: WebSocket;
	matchId: number;
};

export function initWebSocketServer(server: any): void {
	const wss = new WebSocketServer({ server });
	const clients: Client[] = [];

	wss.on("connection", (socket: WebSocket, req: IncomingMessage) => {
		const url = new URL(req.url || "", "http://localhost");
		const matchIdParam = url.searchParams.get("match");

		if (!matchIdParam) {
			socket.close();
			return;
		}

		const matchId = Number(matchIdParam);
		if (Number.isNaN(matchId)) {
			socket.close();
			return;
		}

		const client: Client = { socket, matchId };
		clients.push(client);

		console.log(`🔌 WS connected (match ${matchId})`);

		socket.on("message", (data: RawData) => {
			for (const c of clients) {
				if (c !== client && c.matchId === matchId) {
					c.socket.send(data.toString());
				}
			}
		});

		socket.on("close", () => {
			const index = clients.indexOf(client);
			if (index !== -1) {
				clients.splice(index, 1);
			}
			console.log(`❌ WS disconnected (match ${matchId})`);
		});
	});

	console.log("🧠 WebSocket server initialized");
}
