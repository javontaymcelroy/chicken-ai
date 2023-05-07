import React, { useState, useEffect, useCallback, useRef } from "react";
import menuData from "./menuData.json";
import "./App.css";

function App() {
// ------ STATES ------ //
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Welcome to Chick-fil-A! We're so excited to see you! What can we get started for you today? 🐮",
    },
  ]);
  const [menu] = useState(menuData.menu);
  const persona = "Use a friendly and approachable tone, add a touch of wit and humor, and incorporate colloquialisms and everyday language to give your writing a down-to-earth quality. Include an emoji in your message to convey personality. Write in a straightforward and concise manner (preferably under 50 characters), avoiding excessive use of flowery language or complex sentence structures. Keep your writing style relatable and easy to follow, to establish yourself as a friendly and likable person."
  const [instructions] = useState("Do not recommend menu items if the customer hasn't completed their first menu item.");
  const [lastProcessedUserMessageIndex, setLastProcessedUserMessageIndex] = useState(-1);
  const [processed, setProcessed] = useState(false);
  const [order, setOrder] = useState([]);
  const chatContainerRef = useRef(null);


// ------ FUNCTIONS //
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (inputText.trim()) {
      const newMessages = [...messages, { role: "user", content: inputText }];
      setMessages(newMessages);
      setProcessed(false);
      const chatHistory = newMessages.map((m) => m.content).join(" ");
      const response = await fetch("http://localhost:3001/api/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        prompt: `You are an AI server for Chick-fil-A, helping customers place orders using this ${persona} ${instructions} The menu items available are: ${menu.map((item) => item.name).join(", ")}. ${chatHistory}`,
        temperature: 0,
        topP: 1,
        maxLength: 150,
  }),
});

  
      const responseBody = await response.json();
  
      if (responseBody && responseBody.content) {
        const chatGPTResponse = responseBody.content;
  
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

  const overseer = useCallback(async () => {
    const unprocessedMessages = messages.slice(lastProcessedUserMessageIndex + 1).map((m) => m.content).join(" ");
  
    const response = await fetch("http://localhost:3001/api/overseer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `Analyze this conversation: ${unprocessedMessages}. Given these menu items available here: ${menu.map((item) => item.name).join(", ")} In an imperative and concise manner, return ONLY the NAMES of the menu items the user wants added to their order in a comma-separated list. Include any modifications, size, and quantity as needed. Follow this structure: Spicy Chicken Sandwich with No Pickles, Coca-Cola with Diet Coke (2)`,
        temperature: 0,
        topP: 1,
        maxLength: 100,
      }),
    });
  
    const responseBody = await response.json();
    return responseBody.content;
  }, [messages, menu, lastProcessedUserMessageIndex]);  

  const processOverseerResponse = useCallback(async () => {
    const overseerResponse = await overseer();
    const itemStrings = overseerResponse.split(", ");
    
    const newOrderItems = itemStrings.map((itemString) => {
      const [itemName, ...remaining] = itemString.split(" with ");
      const menuItem = menu.find((item) => item.name.toLowerCase() === itemName.toLowerCase());
    
      if (!menuItem) return null;
    
      const modifications = [];
      let size;
      let quantity = 1;
    
      remaining.forEach((detail) => {
        if (menuItem.modifications.find((m) => m.name.toLowerCase() === detail.toLowerCase())) {
          modifications.push(menuItem.modifications.find((m) => m.name.toLowerCase() === detail.toLowerCase()));
        } else if (parseInt(detail[0])) {
          quantity = parseInt(detail[0]);
        } else {
          size = detail;
        }
      });
    
      return {
        ...menuItem,
        size,
        quantity,
        modifications,
      };
    }).filter((item) => item);
    
    // Update the order by merging previous items and new items
    setOrder((prevOrder) => {
      const updatedOrder = [...prevOrder];
      
      newOrderItems.forEach((newItem) => {
        const existingItemIndex = updatedOrder.findIndex(
          (item) =>
            item.name.toLowerCase() === newItem.name.toLowerCase() &&
            JSON.stringify(item.modifications) === JSON.stringify(newItem.modifications)
        );
        
        if (existingItemIndex > -1) {
          updatedOrder[existingItemIndex].quantity += newItem.quantity;
        } else {
          updatedOrder.push(newItem);
        }
      });
      
      return updatedOrder;
    });
    
    console.log("Overseer:", overseerResponse);
  }, [menu, overseer]);

  const clearChat = () => {
    localStorage.removeItem("chat_history");
    setMessages([
      {
        role: "assistant",
        content: "Welcome to Chick-fil-A! We're so excited to see you! What can we get started for you today? 🐮",
      },
    ]);
    setOrder([]);
  };
  

// ------ HOOKS ------ //
useEffect(() => {
  const storedMessages = localStorage.getItem("chat_history");
  if (storedMessages) {
    setMessages(JSON.parse(storedMessages));
  }
}, []);

useEffect(() => {
  localStorage.setItem("chat_history", JSON.stringify(messages));
}, [messages]);

useEffect(() => {
  localStorage.setItem("chat_history", JSON.stringify(messages));
  if (chatContainerRef.current) {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }
}, [messages]);

useEffect(() => {
  if (messages.length > 1 && messages[messages.length - 1].role === "user" && !processed) {
    processOverseerResponse();
    setLastProcessedUserMessageIndex(messages.length - 1);
    setProcessed(true);
  }
}, [messages, menu, overseer, processOverseerResponse, processed]);


  
// ------ RETURN ------ //
  return (
    <div className="App">
      <h1>Chick-fil-AI</h1>
      <div className="order-container">
  <h2>Your Order</h2>
  {order.length > 0 ? (
  <ul>
    {order.map((item, index) => (
      <p key={index}>
        {item.name} - {item.size ? `${item.size} ` : ""}{item.quantity > 1 ? `(${item.quantity})` : ""}
        {item.modifications && item.modifications.length > 0 && (
          <span>(with {item.modifications.map((mod) => mod.name).join(", ")})</span>
        )}
      </p>
    ))}
  </ul>
) : (
  <p>No items in your order.</p>
)}

</div>
      <div className="chat-container" ref={chatContainerRef}>
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
        <button onClick={clearChat}>Clear</button>
      </form>
    </div>
  );
}

export default App;