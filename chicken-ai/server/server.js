require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

app.post("/api/chatgpt", async (req, res) => {
  try {
    const { prompt, temperature, topP, maxLength } = req.body;
    console.log("Received request:", req.body);
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: maxLength,
        top_p: topP,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    // console.log("OpenAI API response:", response.data);
    // console.log("OpenAI API response:", response.data.choices);

    res.json(response.data.choices[0].message);
  } catch (error) {
    console.error("Error message:", error.message);
    console.error("Error response data:", error.response?.data);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
