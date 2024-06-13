import { useEffect, useState } from "react";
import { motion } from "framer-motion";
// import testing from "../testing";

function App() {
	const url = "https://192.168.11.6:5005/events";
	const token = "7b271e4d-51d4-4558-a27c-548a5ba26aab";

	const [messages, setMessages] = useState([]);
	const [error, setError] = useState(false);
	const maximumRecords = 20;

	useEffect(() => {
		const fetchSSE = async () => {
			try {
				setError(false);
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
									// console.log(data);
									if (data.match_data.watchlists) {
										data.match_data.watchlists.forEach((list) => {
											let found = false;
											found = true;
											if (list.match_outcome === "matched") {
												found = true;
											}

											if (found) {
												makeRequest(data);
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
				setError(true);
				console.log("Error fetching SSE");
			}
		};

		fetchSSE();
	}, []);

	const makeRequest = async (data) => {
		try {
			await fetch("http://localhost/receive_events.php", {
				method: "post",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
		} catch (error) {
			console.error("Fetch error: " + error);
		}
	};

	const variants = {
		slideUp: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.2,
				when: "beforeChildren",
				staggerChildren: 0.1,
			},
		},
		hiddenDown: { opacity: 0, y: 100 },
		onHoverPop: { scale: 1.1 },
		onHoverColor: { color: "#fbb50a" },
		onShow: { opacity: 1, scale: [2, 0.8, 1], y: 0 },
		onHoverTap: { scale: 0.97, transition: { duration: 0.1 } },
		onHoverImagePop: { scale: 1.1 },
		onTapImagePop: { scale: 1.05 },
	};

	return (
		<div className="container">
			{!error &&
				messages.map((message, i) => (
					<motion.li
						key={i}
						className="listItem"
						variants={variants}
						initial="hiddenDown"
						whileInView="onShow"
					>
						<div>
							<img
								src={`data:image/jpeg;base64,${message.crop_data.face_crop_img}`}
							/>
							<p>{message.match_data.poi_display_name}</p>
						</div>
					</motion.li>
				))}
			{error && (
				<div className="error">
					<p>Unable to connect to the server</p>
					<a
						href={url}
						target="blank"
					>
						{url}
					</a>
				</div>
			)}
		</div>
	);
}

export default App;
