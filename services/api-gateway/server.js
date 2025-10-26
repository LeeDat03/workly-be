// For testing services only
const http = require("http");

const createServer = (port, message) => {
	http.createServer((req, res) => {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.end(message);
	}).listen(port, () => {
		console.log(`✅ Server running on http://localhost:${port}`);
	});
};

// user-company-service
createServer(8003, "Response from Service 1 (Port 8003)");

// post-hire-service
createServer(8004, "Response from Service 2 (Port 8004)");

// chat-notification-service
createServer(8005, "Response from Service 3 (Port 8005)");

console.log("Starting all test servers...");
