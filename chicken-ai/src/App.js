import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const storedMessages = localStorage.getItem("chat_history");
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (inputText.trim()) {
      setMessages([...messages, { role: 'user', content: inputText }]);
  
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputText,
          temperature: 0.7,
          topP: 1,
          maxLength: 150,
        }),
      });
  
      console.log("Raw response:", response);
  
      const responseBody = await response.json();
      console.log("Response body:", responseBody);
  
      if (responseBody && responseBody.content) {
        const chatGPTResponse = responseBody.content;
        console.log("ChatGPT response:", chatGPTResponse);
  
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: chatGPTResponse },
        ]);
      } else {
        console.log("No response content:", responseBody);
      }
  
      setInputText('');
    }
  };
  
  
  return (
    <div className="App">
      <h1>Chick-fil-A ChatGPT</h1>
      <div className="chat-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.role === "user" ? "user" : "assistant"}`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;