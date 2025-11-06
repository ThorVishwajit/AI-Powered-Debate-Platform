const { OpenAI } = require("openai");
const { getAIConfig } = require("../config/aiConfig");

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.NVIDIA_API_KEY || "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",
            baseURL: "https://integrate.api.nvidia.com/v1",
        });
    }

    async generateResponse(messages, difficulty) {
        const config = getAIConfig(difficulty);
        
        try {
            console.log(
                "Sending request to NVIDIA API with messages:",
                JSON.stringify(messages, null, 2),
                "Difficulty:",
                difficulty
            );

            // Prepend the difficulty-specific system prompt
            const messagesWithSystem = [
                {
                    role: "system",
                    content: config.systemPrompt
                },
                ...messages
            ];

            const completion = await this.openai.chat.completions.create({
                model: "meta/llama3-70b-instruct",
                messages: messagesWithSystem,
                temperature: config.temperature,
                top_p: config.top_p,
                max_tokens: config.max_tokens,
            });

            console.log(
                "Received response from NVIDIA API:",
                completion.choices[0].message.content
            );
            
            return {
                success: true,
                content: completion.choices[0].message.content
            };
        } catch (error) {
            console.error("Error getting AI response from NVIDIA API:", error);
            console.error("Error details:", {
                message: error.message,
                status: error.status,
                code: error.code,
                type: error.type,
            });

            return {
                success: false,
                error: "Failed to generate AI response",
                details: error.message
            };
        }
    }

    async evaluateArguments(topic, debateArgs, difficulty) {
        const config = getAIConfig(difficulty);
        const evaluationPrompt = [
            {
                role: "user",
                content: `Evaluate the following debate on "${topic}" as a professional debate judge. Analyze each participant's performance and provide detailed scoring.

                Debate Context:
                Topic: "${topic}"
                Difficulty Level: ${difficulty}

                Arguments:
                ${debateArgs.map((arg, i) => `${arg.participant}: ${arg.argument}`).join('\n\n')}

                Provide a detailed evaluation in JSON format:
                {
                    "participants": [
                        {
                            "name": "participant1_name",
                            "scores": {
                                "reasoning": {
                                    "score": number (0-100),
                                    "feedback": "specific feedback on logical structure and argumentation"
                                },
                                "evidence": {
                                    "score": number (0-100),
                                    "feedback": "feedback on use of facts and examples"
                                },
                                "persuasiveness": {
                                    "score": number (0-100),
                                    "feedback": "feedback on rhetoric and delivery"
                                },
                                "relevance": {
                                    "score": number (0-100),
                                    "feedback": "feedback on topic adherence and focus"
                                }
                            },
                            "strengths": ["list", "of", "key", "strengths"],
                            "improvements": ["areas", "for", "improvement"]
                        }
                    ],
                    "overall": {
                        "winner": "participant_name",
                        "reason": "detailed explanation of why this participant won",
                        "debateQuality": number (0-100),
                        "summary": "brief overall debate quality assessment"
                    }
                }`
            }
        ];

        const response = await this.generateResponse(evaluationPrompt, difficulty);
        
        if (!response.success) {
            throw new Error(response.error);
        }

        try {
            // Extract JSON from the response
            const jsonStr = response.content.match(/\{[\s\S]*\}/)[0];
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Error parsing evaluation response:", error);
            throw new Error("Failed to parse evaluation response");
        }
    }
}

module.exports = new AIService();