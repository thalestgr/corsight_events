import { useEffect, useState } from "react";
import image from "../image";

function App() {
	const url = "https://192.168.11.6:5005/events";
	const token = "7b271e4d-51d4-4558-a27c-548a5ba26aab";

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
								if (data.event_type === "appearance") {
									if (data.match_data.watchlists) {
										data.match_data.watchlists.forEach((list) => {
											let found = false;
											if (list.match_outcome === "matched") {
												found = true;
											}

											if (found) {
												console.log(data);
												// await makeRequest(data);
												setMessages((prevMessages) => {
													if (prevMessages.length > maximumRecords) {
														prevMessages.pop();
													}
													return [data, ...prevMessages];
												});
											}
										});
									}
								}
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
						<p>Id: {message.event_id}</p>
						<p>{message.match_data.poi_display_name}</p>
					</div>
					<img
						src={`data:image/jpeg;base64,${message.crop_data.face_crop_img}`}
						alt="Red dot"
					/>
				</li>
			))}
		</div>
	);
}

export default App;
