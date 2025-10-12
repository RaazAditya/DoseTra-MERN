import React, { useState, useRef, useEffect } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import "./Chatbot.css";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChatIcon from "@mui/icons-material/Chat";
import { useSelector } from "react-redux";

const Chatbot = () => {
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hey there 👋<br>How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    setMessages([
      { from: "bot", text: "Hey there 👋<br>How can I help you today?" },
    ]);
    console.log(user)
  }, [user]); // triggers only when user

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setShowEmoji(false);
    setSending(true);

    // Add typing indicator
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: "<span class='thinking'>...</span>", temp: true },
    ]);
    scrollToBottom();

    try {
      console.log("here ",user)
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chatbot`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMsg.text, userId: user?.id }),
        }
      );

      const data = await res.json();
      setMessages((prev) =>
        prev.filter((m) => !m.temp).concat([{ from: "bot", text: data.reply }])
      );
      scrollToBottom();
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => !m.temp)
          .concat([
            {
              from: "bot",
              text: "⚠️ Server not responding. Please try again later.",
            },
          ])
      );
      scrollToBottom();
    }
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleEmojiClick = (emoji) => {
    setInput((prev) => prev + emoji.native);
    setShowEmoji(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const imgUrl = URL.createObjectURL(file);
      setMessages((prev) => [
        ...prev,
        {
          from: "user",
          text: `<img src="${imgUrl}" class="preview-img" alt="preview" />`,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          from: "user",
          text: `<span class="material-icons-outlined">attach_file</span> ${file.name}`,
        },
      ]);
    }
    scrollToBottom();
    // Optionally: handle file uploads to backend here.
  };

  return (
    <>
      {/* Always show floating chat button */}
      <button
        className="chat-toggle-btn"
        onClick={() => setOpen(true)}
        aria-label="Open Chat"
        style={{ display: open ? "none" : "flex" }}
      >
        <ChatIcon />
      </button>

      {/* Overlay and chatbot panel only when open */}
      {open && (
        <div className="chat-overlay" onClick={() => setOpen(false)}>
          <div className="chat-container" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <div className="header-left">
                <SmartToyIcon className="bot-icon" />
                <span className="title">DoseTra AI</span>
              </div>
              <button
                className="close-btn"
                onClick={() => setOpen(false)}
                aria-label="Minimize Chat"
              >
                <ExpandMoreIcon />
              </button>
            </div>

            <div className="chat-body" ref={chatBodyRef}>
              {messages.map((msg, idx) =>
                msg.from === "user" ? (
                  <div key={idx} className="user-message">
                    <div
                      className="message"
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  </div>
                ) : (
                  <div key={idx} className="bot-message">
                    <SmartToyIcon className="bot-icon" />
                    <div
                      className={`message${msg.temp ? " thinking" : ""}`}
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  </div>
                )
              )}
            </div>

            <div className="chat-input">
              <div className="input-icons">
                <button
                  className="emoji-btn"
                  type="button"
                  onClick={() => setShowEmoji((val) => !val)}
                  aria-label="Toggle Emoji Picker"
                >
                  <EmojiEmotionsIcon />
                </button>

                <input
                  type="file"
                  id="fileInput"
                  className="file-input"
                  onChange={handleFileChange}
                />
                <label htmlFor="fileInput" className="file-label">
                  <AttachFileIcon />
                </label>
              </div>

              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                id="userInput"
                autoComplete="off"
                disabled={sending}
              />

              <button
                onClick={handleSend}
                disabled={sending}
                id="sendBtn"
                aria-label="Send"
              >
                <SendIcon />
              </button>

              <div style={{ position: "relative" }}>
                {showEmoji && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 40,
                      left: 0,
                      zIndex: 100,
                    }}
                  >
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiClick}
                      theme="light"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
