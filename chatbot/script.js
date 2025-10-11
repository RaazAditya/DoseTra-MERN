// ====== Get DOM elements ======
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatBody = document.getElementById("chatBody");
const chatToggle = document.getElementById("chatToggle");
const chatContainer = document.getElementById("chatContainer");
const closeBtn = document.getElementById("closeBtn");
const emojiBtn = document.getElementById("emojiBtn");
const fileInput = document.getElementById("fileInput");
const emojiPicker = document.getElementById("emojiPicker");

// ====== Event Listeners ======
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ====== Send Message Function ======
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("user-message");
  msgDiv.innerHTML = `<div class="message">${text}</div>`;
  chatBody.appendChild(msgDiv);
  userInput.value = "";

  chatBody.scrollTop = chatBody.scrollHeight;

  // Typing indicator
  const thinkingDiv = document.createElement("div");
  thinkingDiv.classList.add("bot-message");
  thinkingDiv.innerHTML = `
    <span class="material-icons-outlined bot-icon">smart_toy</span>
    <div class="message thinking">...</div>`;
  chatBody.appendChild(thinkingDiv);
  sendBtn.disabled = true;

  try {
    const res = await fetch("http://localhost:7000/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, userId: "user123" }),
    });

    const data = await res.json();

    thinkingDiv.remove();
    botReply(data.reply);
  } catch (err) {
    thinkingDiv.remove();
    botReply("⚠️ Server not responding. Please try again later.");
  } finally {
    sendBtn.disabled = false;
  }
}

// ====== Bot Reply ======
function botReply(text) {
  const botDiv = document.createElement("div");
  botDiv.classList.add("bot-message");
  botDiv.innerHTML = `
    <span class="material-icons-outlined bot-icon">smart_toy</span>
    <div class="message">${text}</div>`;
  chatBody.appendChild(botDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// ====== File Upload Preview ======
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("user-message");

  if (file.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.maxWidth = "120px";
    img.style.borderRadius = "6px";
    msgDiv.appendChild(img);
  } else {
    msgDiv.innerHTML = `<div class="message"><span class="material-icons-outlined">attach_file</span> ${file.name}</div>`;
  }

  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
});

// ====== Emoji Picker ======
emojiBtn.addEventListener("click", () => {
  emojiPicker.style.display =
    emojiPicker.style.display === "block" ? "none" : "block";
});

emojiPicker.addEventListener("emoji-click", (event) => {
  userInput.value += event.detail.unicode;
  emojiPicker.style.display = "none";
});

document.addEventListener("click", (e) => {
  if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
    emojiPicker.style.display = "none";
  }
});

// ====== Chat Toggle ======
chatToggle.addEventListener("click", () => {
  chatContainer.style.display = "flex";
  chatToggle.style.display = "none";
});

closeBtn.addEventListener("click", () => {
  chatContainer.style.display = "none";
  chatToggle.style.display = "flex";
});
