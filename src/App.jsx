import EventSource from "react-native-sse";

import { useEffect } from "react";

function App() {
	const url = "https://192.168.11.6:5005/events";
	const token = "86cad014-c7c4-4ad7-9437-8ec84b5aa155";

	useEffect(() => {
		const listen = async () => {
			const es = new EventSource(url, {
				headers: {
					Authorization: {
						toString: function () {
							return "Bearer " + token;
						},
					},
				},
			});

			es.addEventListener("open", () => {
				console.log("Open SSE connection.");
			});

			es.addEventListener("message", (event) => {
				console.log("New message event:", event.data);
			});

			es.addEventListener("error", (event) => {
				if (event.type === "error") {
					console.error("Connection error:", event.message);
				} else if (event.type === "exception") {
					console.error("Error:", event.message, event.error);
				}
			});

			es.addEventListener("close", () => {
				console.log("Close SSE connection.");
			});
		};

		listen();
	}, []);

	return (
		<>
			<h1>Teste</h1>
		</>
	);
}

export default App;
