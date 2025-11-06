const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

// In-memory storage for debates (in production, use a database)
const debates = new Map();

// NVIDIA API setup
const { OpenAI } = require("openai");
const AIService = require("./services/aiService");

const openai = new OpenAI({
  apiKey:
    process.env.NVIDIA_API_KEY ||
    "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",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// Helper function to generate AI response
async function getAIResponse(messages) {
  try {
    console.log(
      "Sending request to NVIDIA API with messages:",
      JSON.stringify(messages, null, 2),
    );

    const completion = await openai.chat.completions.create({
      model: "meta/llama3-70b-instruct",
      messages: messages,
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1024,
    });

    console.log(
      "Received response from NVIDIA API:",
      completion.choices[0].message.content,
    );
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error getting AI response from NVIDIA API:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    });

    // Return a more informative error message
    return "Sorry, I couldn't generate a response at the moment. Please check the server logs for more details.";
  }
}

// Helper function for RAG - simple keyword-based retrieval
function retrieveRelevantContext(topic, argument) {
  // In a real implementation, this would query a vector database
  // For simplicity, we'll use keyword matching
  const keywords = argument.toLowerCase().split(" ");
  const topicKeywords = {
    "climate change": [
      "environment",
      "carbon",
      "emissions",
      "global warming",
      "renewable",
      "sustainability",
    ],
    "artificial intelligence": [
      "machine learning",
      "neural network",
      "algorithm",
      "automation",
      "robotics",
    ],
    "universal basic income": [
      "welfare",
      "income",
      "employment",
      "economy",
      "social security",
    ],
  };

  const relevantKeywords = topicKeywords[topic.toLowerCase()] || [];
  const matchingKeywords = keywords.filter((word) =>
    relevantKeywords.includes(word),
  );

  if (matchingKeywords.length > 0) {
    return `Related concepts: ${matchingKeywords.join(", ")}. `;
  }
  return "";
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Create a new debate
app.post("/api/debates", (req, res) => {
  const {
    topic,
    mode,
    participantName,
    difficulty = "intermediate",
  } = req.body;

  if (!topic || !mode || !participantName) {
    return res
      .status(400)
      .json({ error: "Missing required fields: topic, mode, participantName" });
  }

  const debateId = Date.now().toString();
  const newDebate = {
    id: debateId,
    topic,
    mode,
    difficulty, // Store difficulty level for later use in evaluation
    createdAt: new Date(),
    participants: [participantName],
    arguments: [],
    status: "active",
  };

  debates.set(debateId, newDebate);

  // If it's human vs AI, add the AI as a participant
  if (mode === "human-vs-ai") {
    newDebate.participants.push("AI Assistant");
  }

  res.status(201).json(newDebate);
});

// Join a debate (for human vs human mode)
app.post("/api/debates/:id/join", (req, res) => {
  const { id } = req.params;
  const { participantName } = req.body;

  const debate = debates.get(id);
  if (!debate) {
    return res.status(404).json({ error: "Debate not found" });
  }

  if (debate.mode !== "human-vs-human") {
    return res.status(400).json({ error: "Cannot join this debate type" });
  }

  if (debate.participants.length >= 2) {
    return res.status(400).json({ error: "Debate is full" });
  }

  debate.participants.push(participantName);
  res.json(debate);
});

// Submit an argument
app.post("/api/debates/:id/arguments", async (req, res) => {
  const { id } = req.params;
  const { participant, argument } = req.body;

  const debate = debates.get(id);
  if (!debate) {
    return res.status(404).json({ error: "Debate not found" });
  }

  if (!debate.participants.includes(participant)) {
    return res.status(400).json({ error: "Participant not in debate" });
  }

  // Add the argument to the debate
  const argumentEntry = {
    id: Date.now().toString(),
    participant,
    argument,
    timestamp: new Date(),
  };

  debate.arguments.push(argumentEntry);

  // For human vs AI mode, get AI response automatically
  let aiResponse = null;
  if (debate.mode === "human-vs-ai" && participant !== "AI Assistant") {
    // Prepare context for AI with RAG
    const context = retrieveRelevantContext(debate.topic, argument);
    const aiPrompt = [
      {
        role: "system",
        content: `You are participating in a debate on "${debate.topic}". ${context}Provide a concise, well-reasoned counterargument or supporting point in a natural, human-like style. Keep your response under 3 sentences.`,
      },
      { role: "user", content: argument },
    ];

    aiResponse = await getAIResponse(aiPrompt);

    // Add AI response to debate
    const aiArgumentEntry = {
      id: (Date.now() + 1).toString(),
      participant: "AI Assistant",
      argument: aiResponse,
      timestamp: new Date(),
    };

    debate.arguments.push(aiArgumentEntry);
  }

  // For human vs human mode, get AI evaluation
  let evaluation = null;
  if (debate.mode === "human-vs-human" && debate.arguments.length % 2 === 0) {
    // Evaluate when both participants have submitted arguments
    const lastTwoArguments = debate.arguments.slice(-2);
    const evaluationPrompt = [
      {
        role: "system",
        content: `You are a debate judge evaluating arguments on "${debate.topic}". Analyze the strength of reasoning, evidence, and rhetoric. Provide a concise evaluation (2-3 sentences) in a natural, human-like style and indicate which argument was more persuasive.`,
      },
      {
        role: "user",
        content: `Participant 1 (${lastTwoArguments[0].participant}): ${lastTwoArguments[0].argument}\n\nParticipant 2 (${lastTwoArguments[1].participant}): ${lastTwoArguments[1].argument}\n\nPlease evaluate these arguments.`,
      },
    ];

    evaluation = await getAIResponse(evaluationPrompt);

    // Add evaluation as an argument
    const evaluationEntry = {
      id: (Date.now() + 2).toString(),
      participant: "AI Judge",
      argument: evaluation,
      timestamp: new Date(),
    };

    debate.arguments.push(evaluationEntry);
  }

  res.json({
    success: true,
    argument: argumentEntry,
    aiResponse,
    evaluation,
  });
});

// Get debate details
app.get("/api/debates/:id", (req, res) => {
  const { id } = req.params;
  const debate = debates.get(id);

  if (!debate) {
    return res.status(404).json({ error: "Debate not found" });
  }

  res.json(debate);
});

// Get all debates
app.get("/api/debates", (req, res) => {
  const allDebates = Array.from(debates.values());
  res.json(allDebates);
});

// Catch-all route to serve index.html for any unmatched routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// End a debate and get final evaluation
app.post("/api/debates/:id/end", async (req, res) => {
  const { id } = req.params;
  const debate = debates.get(id);

  if (!debate) {
    return res.status(404).json({ error: "Debate not found" });
  }

  // Mark debate as ended
  debate.status = "ended";

  // Get detailed evaluation from AI service
  let detailedEvaluation = null;

  if (debate.arguments.length > 0) {
    try {
      // Get detailed evaluation with scores for each participant
      detailedEvaluation = await AIService.evaluateArguments(
        debate.topic,
        debate.arguments.filter(
          (arg) => arg.participant !== "AI Final Evaluator",
        ),
        debate.difficulty || "intermediate", // Use stored difficulty or default
      );
    } catch (error) {
      console.error("Error getting detailed evaluation:", error);
      // Don't set detailedEvaluation to null, let it remain undefined
      // This will cause the response to have detailedEvaluation: undefined
      // which is better than null for the frontend to handle
    }
  }

  res.json({
    success: true,
    detailedEvaluation,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Debate platform server running on http://localhost:${PORT}`);
});
