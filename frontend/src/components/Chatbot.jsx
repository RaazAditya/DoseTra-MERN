import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { sendChatMessage } from "@/features/api/chatbotApi";

const GREETING = {
  from: "bot",
  text: "Hey there 👋<br>I'm your privacy-first Health Assistant. Ask about your <b>next dose</b>, <b>adherence</b>, or medicine questions like <b>side effects of paracetamol</b> or <b>difference between ibuprofen and paracetamol</b>. Type <b>help</b> to see what I can do.",
};

const storageKey = (userId) => `dosetra-chat-${userId || "guest"}`;

const loadHistory = (userId) => {
  try {
    const saved = sessionStorage.getItem(storageKey(userId));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [GREETING];
};

const Chatbot = () => {
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    setMessages(loadHistory(user?.id));
  }, [user?.id]);

  const persistHistory = useCallback(
    (msgs) => {
      const toSave = msgs.filter((m) => !m.temp);
      sessionStorage.setItem(storageKey(user?.id), JSON.stringify(toSave));
    },
    [user?.id]
  );

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const token = localStorage.getItem("token");
    if (!user || !token) {
      setMessages((prev) => [
        ...prev,
        { from: "user", text: input },
        {
          from: "bot",
          text: "Please <b>log in</b> to use the Health Assistant. Your data stays private and is never sent to AI unless you ask a general health question.",
          source: "database",
        },
      ]);
      setInput("");
      scrollToBottom();
      return;
    }

    const userText = input.trim();
    const newMsg = { from: "user", text: userText };
    const withUser = [...messages.filter((m) => !m.temp), newMsg];
    setMessages([...withUser, { from: "bot", temp: true, typing: true }]);
    setInput("");
    setShowEmoji(false);
    setSending(true);
    scrollToBottom();

    try {
      const data = await sendChatMessage(userText, token);
      const botMsg = {
        from: "bot",
        text: data.reply,
        source: data.source || "database",
        sources: data.sources || [],
      };
      const updated = [...withUser, botMsg];
      setMessages(updated);
      persistHistory(updated);
    } catch (err) {
      const errorText =
        err.response?.status === 401
          ? "Your session expired. Please log in again."
          : err.response?.data?.reply || "⚠️ Server not responding. Please try again later.";
      const updated = [
        ...withUser,
        { from: "bot", text: errorText, source: "database" },
      ];
      setMessages(updated);
      persistHistory(updated);
    }

    setSending(false);
    scrollToBottom();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
  };

  const clearHistory = () => {
    setMessages([GREETING]);
    sessionStorage.removeItem(storageKey(user?.id));
  };

  const sourceLabel = (source) => {
    if (source === "rag") return { text: "Knowledge base", className: "source-rag" };
    if (source === "web") return { text: "Web search", className: "source-web" };
    if (source === "ai") return { text: "AI guidance", className: "source-ai" };
    return { text: "Your records", className: "source-db" };
  };

  const renderSources = (sources = []) => {
    if (!sources.length) return null;

    return (
      <div className="rag-sources">
        Sources:{" "}
        {sources.map((source, index) => {
          const isObject = typeof source === "object" && source !== null;
          const label = isObject ? source.title || source.url : source;
          const url = isObject ? source.url : "";

          return (
            <React.Fragment key={`${label}-${index}`}>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer">
                  {label}
                </a>
              ) : (
                <span>{label}</span>
              )}
              {index < sources.length - 1 ? ", " : ""}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <button
        className="chat-toggle-btn"
        onClick={() => setOpen(true)}
        aria-label="Open Chat"
        style={{ display: open ? "none" : "flex" }}
      >
        <ChatIcon />
      </button>

      {open && (
        <div className="chat-overlay" onClick={() => setOpen(false)}>
          <div className="chat-container" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <div className="header-left">
                <SmartToyIcon className="bot-icon" />
                <div>
                  <span className="title">DoseTra Health Assistant</span>
                  <span className="subtitle">Privacy-first · Records stay local</span>
                </div>
              </div>
              <div className="header-actions">
                <button
                  className="clear-btn"
                  onClick={clearHistory}
                  title="Clear chat history"
                  type="button"
                >
                  Clear
                </button>
                <button
                  className="close-btn"
                  onClick={() => setOpen(false)}
                  aria-label="Minimize Chat"
                  type="button"
                >
                  <ExpandMoreIcon />
                </button>
              </div>
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
                    <div className="bot-bubble">
                      {msg.typing ? (
                        <div className="typing-indicator">
                          <span />
                          <span />
                          <span />
                        </div>
                      ) : (
                        <>
                          <div
                            className="message"
                            dangerouslySetInnerHTML={{ __html: msg.text }}
                          />
                          {msg.source && (
                            <span
                              className={`source-badge ${sourceLabel(msg.source).className}`}
                            >
                              {sourceLabel(msg.source).text}
                            </span>
                          )}
                          {renderSources(msg.sources)}
                        </>
                      )}
                    </div>
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
                placeholder="Ask about doses, adherence, or health..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                id="userInput"
                autoComplete="off"
                disabled={sending}
              />

              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                id="sendBtn"
                aria-label="Send"
                type="button"
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
