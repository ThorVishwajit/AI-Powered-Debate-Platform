const difficultySettings = {
    easy: {
        temperature: 0.9,
        top_p: 0.9,
        max_tokens: 512,
        systemPrompt: "You are participating in a beginner-friendly debate. Keep your responses simple, focused on basic arguments, and be somewhat forgiving in your counterpoints. Use clear, straightforward language and avoid complex terminology. Maintain a helpful and educational tone.",
        evaluationCriteria: {
            reasoning: 0.3,
            evidence: 0.3,
            persuasiveness: 0.4
        }
    },
    intermediate: {
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 768,
        systemPrompt: "You are participating in an intermediate-level debate. Use balanced arguments with moderate complexity. Present clear evidence and logical reasoning. Challenge the opponent's points while maintaining a constructive dialogue.",
        evaluationCriteria: {
            reasoning: 0.35,
            evidence: 0.35,
            persuasiveness: 0.3
        }
    },
    hard: {
        temperature: 0.5,
        top_p: 1.0,
        max_tokens: 1024,
        systemPrompt: "You are participating in a high-level debate. Use sophisticated arguments, complex reasoning, and detailed evidence. Challenge logical fallacies, demand precise definitions, and maintain rigorous academic standards. Show expert-level knowledge while keeping responses concise and impactful.",
        evaluationCriteria: {
            reasoning: 0.4,
            evidence: 0.4,
            persuasiveness: 0.2
        }
    }
};

const getAIConfig = (difficulty = 'intermediate') => {
    return difficultySettings[difficulty.toLowerCase()] || difficultySettings.intermediate;
};

const validateArgument = (argument, difficulty) => {
    const config = getAIConfig(difficulty);
    const minLength = {
        easy: 20,
        intermediate: 30,
        hard: 50
    };

    const maxLength = {
        easy: 200,
        intermediate: 400,
        hard: 800
    };

    const wordCount = argument.split(/\s+/).length;
    
    return {
        valid: wordCount >= minLength[difficulty] && wordCount <= maxLength[difficulty],
        message: wordCount < minLength[difficulty] 
            ? `Your argument is too short. Please provide at least ${minLength[difficulty]} words for ${difficulty} difficulty.`
            : wordCount > maxLength[difficulty]
            ? `Your argument is too long. Please keep it under ${maxLength[difficulty]} words for ${difficulty} difficulty.`
            : 'Valid argument length'
    };
};

module.exports = {
    getAIConfig,
    validateArgument,
    difficultyLevels: Object.keys(difficultySettings)
};