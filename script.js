const socket = io("http://localhost:5050", { // Remove '/ws' from URL
    auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2I4ZWQ0YjZkNDMwODQ2NmRiOTFhMDUiLCJpYXQiOjE3NDE3NTYwMDF9.QfuiV5NJZa3GcoVUrdlJrX1rTsP8rG-DC3f4HzRZrmI" },
    path: '/ws' // Explicitly specify the path here
});

socket.on("connect", () => {
    console.log("Connected to WebSocket server!");

    // Fetch messages before enabling sending
    socket.emit("messages");
});

// Handle receiving previous messages
socket.on("messages", (messages) => {
    console.log("Previous messages received:", messages);
    messages.forEach(message => {
        displayMessage(`${message.sender === socket.userId ? "Me" : "From " + message.sender}: ${message.content}`);
    });

    // Enable send button after fetching messages
    document.getElementById("sendButton").disabled = false;
});

// Handle incoming new messages
socket.on("message", (message) => {
    console.log("New message received:", message);
    displayMessage(`From ${message.senderId}: ${message.content}`);
});

// Handle send message
document.getElementById("sendButton").addEventListener("click", () => {
    const recipientId = document.getElementById("recipientId").value.trim();
    const message = document.getElementById("messageInput").value.trim();

    if (!recipientId || !message) {
        alert("Please enter recipient ID and message!");
        return;
    }

    socket.emit("message", { recipientId, content: message });
    displayMessage(`Me: ${message}`);
    document.getElementById("messageInput").value = "";
});

// Utility function to display messages
function displayMessage(msg) {
    const messageBox = document.getElementById("messages");
    const messageElement = document.createElement("p");
    messageElement.textContent = msg;
    messageBox.appendChild(messageElement);
}