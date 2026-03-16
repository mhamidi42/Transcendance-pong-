import fastify from "fastify";

export async function exchangeTokenForCode(code: string): Promise<string> {
	const response = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
		},
		body: JSON.stringify({
			client_id: process.env.GITHUB_CLIENT_ID,
			client_secret: process.env.GITHUB_CLIENT_SECRET,
			code: code,
			redirect_uri: process.env.GITHUB_REDIRECT_URI,			
		}),
	});

	const data = await response.json();

	if (data.error) {
		throw new Error(data.error_description || "Failed to exchange token");
	}
	return data.access_token;
}
