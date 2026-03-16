async function getBackend<T>(url: string): Promise<T> {
	const response = await fetch(`/api${url}`, { method: "GET" });
	if (!response.ok) {
		throw new Error(`GET ${url} failed with status ${response.status}`);
	}
	return response.json() as Promise<T>;
}

async function postBackend<T>(url: string, body?: unknown): Promise<T> {
	const options: RequestInit = {
		method: "POST",
		headers: {},
	};

	if (body !== undefined) {
		options.headers = {
			"Content-Type": "application/json",
		};
		options.body = JSON.stringify(body);
	}

	const response = await fetch(`/api${url}`, options);

	if (!response.ok) {
		throw new Error(`POST ${url} failed with status ${response.status}`);
	}

	return response.json() as Promise<T>;
}

async function deleteBackend<T>(url: string): Promise<T> {
	const response = await fetch(`/api${url}`, { method: "DELETE" });
	if (!response.ok) {
		throw new Error(`DELETE ${url} failed with status ${response.status}`);
	}
	return response.json() as Promise<T>;
}

export { getBackend, postBackend, deleteBackend };
