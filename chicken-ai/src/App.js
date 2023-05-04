import React, { useState, useEffect } from "react";
import menuData from "./menuData.json";
import "./App.css";

function App() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [menu] = useState(menuData.menu);
  const [order, setOrder] = useState([]);
  const persona = "Use a friendly and approachable tone, add a touch of wit and humor, and incorporate colloquialisms and everyday language to give your writing a down-to-earth quality. Write in a straightforward and concise manner, avoiding excessive use of flowery language or complex sentence structures. Keep your writing style relatable and easy to follow, to establish yourself as a friendly and likable person."

  useEffect(() => {
    const storedMessages = localStorage.getItem("chat_history");
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  // Send the initial message to ChatGPT
  useEffect(() => {
    const sendInitialMessage = async () => {
      const response = await fetch("/api/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are an AI assistant for Chick-fil-A, helping customers place orders. Greet the customer with a short and sweet greeting. ${persona}`,
          temperature: 0.7,
          topP: 1,
          maxLength: 120,
        }),
      });

      const responseBody = await response.json();

      if (responseBody && responseBody.content) {
        setMessages([{ role: "assistant", content: responseBody.content }]);
      }
    };

    sendInitialMessage();
  }, []);

  useEffect(() => {
    console.log("Initial order:", order);
  }, [order]);
  


  function extractInfo(chatGPTResponse) {
    const patterns = [
      {
        action: "add",
        regex: /\b(?:add(?:ing)?|get(?:ting)?|i(?:'?d)? like|want|one|a)\b[^.]*\b(?<itemName>[\w\s]+)\b(?:meal|sandwich|wrap|salad|soup|dessert|drink|sides?|entree|to my order)/i,
      },
      {
        action: "update",
        regex: /\b(?:change|update|switch|substitute|modify)\b[^.]*\b(?<itemName>[\w\s]+)\b(?:meal|sandwich|wrap|salad|soup|dessert|drink|sides?|entree|in my order)\b[^.]*\b(?<quantity>\d+)\b/i,
      },
      {
        action: "delete",
        regex: /\b(?:remove|delete|cancel|take off|no)\b[^.]*\b(?<itemName>[\w\s]+)\b(?:meal|sandwich|wrap|salad|soup|dessert|drink|sides?|entree|from my order)/i,
      },
      {
        action: "info",
        regex: /\b(?:what(?:'s| is)?\s*)(?:the|is there a)\s+(?<itemName>[\w\s]+)(?:meal|sandwich|wrap|salad|soup|dessert|drink|sides?|entree)?\s*\??/i,
      },
    ];
  
    for (const pattern of patterns) {
      const match = chatGPTResponse.match(pattern.regex);
      if (match && match.groups) {
        const itemName = match.groups.itemName.trim().toLowerCase();
        const itemQuantity = match.groups.quantity ? parseInt(match.groups.quantity) : null;
        return { action: pattern.action, item: { name: itemName, quantity: itemQuantity } };
      }
    }
  
    return {};
  }
  

  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (inputText.trim()) {
      setMessages([...messages, { role: "user", content: inputText }]);
  
      const chatHistory = [...messages, { role: "user", content: inputText }].map((m) => m.content).join(" ");
      const response = await fetch("/api/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are an AI assistant for Chick-fil-A, helping customers place orders. The menu items available are: ${menu.map((item) => item.name).join(", ")}. ${chatHistory}`,
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
  
        // Extract relevant information from the ChatGPT response
        const extractedInfo = extractInfo(chatGPTResponse);
  
        // Perform CRUD operation based on the extracted information
        switch (extractedInfo.action) {
          case "add":
            const itemToAdd = menu.find((item) => item.name.toLowerCase() === extractedInfo.item.name.toLowerCase());
            if (itemToAdd) {
              console.log("Order before add:", order);
              const existingOrderItem = order.find((item) => item.id === itemToAdd.id);
              if (existingOrderItem) {
                existingOrderItem.quantity += 1;
              } else {
                setOrder([...order, { ...itemToAdd, quantity: 1 }]);
              }
              console.log("Order after add:", order);
            }
            break;
          case "update":
            const itemToUpdate = order.find((item) => item.name.toLowerCase() === extractedInfo.item.name.toLowerCase());
            if (itemToUpdate) {
              console.log("Order before update:", order);
              itemToUpdate.quantity = extractedInfo.item.quantity;
              setOrder([...order]);
              console.log("Order after update:", order);
            }
            break;
          case "delete":
            const itemToDeleteIndex = order.findIndex((item) => item.name.toLowerCase() === extractedInfo.item.name.toLowerCase());
            if (itemToDeleteIndex > -1) {
              console.log("Order before delete:", order);
              setOrder(order.filter((_, index) => index !== itemToDeleteIndex));
              console.log("Order after delete:", order);
            }
            break;
          default:
            break;
        }
  
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "assistant", content: chatGPTResponse },
        ]);
      } else {
        console.log("No response content:", responseBody);
      }
  
      setInputText("");
    }
  };
  
  
  
  return (
    <div className="App">
      <h1>Chick-fil-AI</h1>
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