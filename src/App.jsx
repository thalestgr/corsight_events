import { useEffect, useState } from "react";
import image from "../image";

function App() {
	const url = "https://192.168.11.6:5005/events";
	const token = "687e48f6-ca5e-444f-acae-272fa1d49b37";

	const [messages, setMessages] = useState([]);
	const maximumRecords = 20;

	useEffect(() => {
		const fetchSSE = async () => {
			try {
				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "text/event-stream",
					},
				});

				if (!response.ok) {
					throw new Error("Network response was not ok");
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder("utf-8");
				let buffer = "";

				reader.read().then(async function processText({ done, value }) {
					if (done) {
						console.log("Stream complete");
						return;
					}

					buffer += decoder.decode(value, { stream: true });

					let boundary = buffer.indexOf("\n");
					while (boundary !== -1) {
						const chunk = buffer.slice(0, boundary + 1).trim();
						buffer = buffer.slice(boundary + 1);

						if (chunk.startsWith('data: {"event_type":')) {
							try {
								const data = JSON.parse(chunk.slice(5));
								console.log(data);
								await makeRequest(data);
								setMessages((prevMessages) => {
									if (prevMessages.length > maximumRecords) {
										prevMessages.pop();
									}
									return [data, ...prevMessages];
								});
							} catch (e) {
								console.error("Failed to parse SSE data:");
							}
						}

						boundary = buffer.indexOf("\n");
					}

					return reader.read().then(processText);
				});
			} catch (error) {
				console.log("Error fetching SSE");
			}
		};

		fetchSSE();
	}, []);

	const makeRequest = async (data) => {
		try {
			const response = await fetch("http://localhost/", {
				method: "post",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			console.log(response);
		} catch (error) {
			console.error("Fetch error: " + error);
		}
	};

	return (
		<div className="container">
			{messages.map((message, index) => (
				<li
					key={index}
					className="listItem"
				>
					<div>
						<p>
							Type: {message.event_type} | Id: {message.event_id}
						</p>
						<p className="message">Message: {JSON.stringify(message)}</p>
					</div>
					<img
						src={image}
						alt="Red dot"
					/>
				</li>
			))}
		</div>
	);
}

export default App;
