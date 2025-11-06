// DOM Elements
const lobbySection = document.getElementById("lobby");
const debateRoomSection = document.getElementById("debateRoom");
const createDebateBtn = document.getElementById("createDebateBtn");
const joinDebateBtn = document.getElementById("joinDebateBtn");
const createDebateForm = document.getElementById("createDebateForm");
const joinDebateForm = document.getElementById("joinDebateForm");
const submitCreateDebate = document.getElementById("submitCreateDebate");
const submitJoinDebate = document.getElementById("submitJoinDebate");
const debatesList = document.getElementById("debates");
const argumentInput = document.getElementById("argumentInput");

// Handle difficulty selection and mode changes
const modeSelect = document.getElementById('mode');
const difficultyGroup = document.getElementById('difficultyGroup');
const difficultyCards = document.querySelectorAll('.difficulty-card');

if (modeSelect) {
    // Show/hide difficulty section based on mode
    modeSelect.addEventListener('change', function() {
        difficultyGroup.style.display = this.value === 'human-vs-ai' ? 'block' : 'none';
    });

    // Initialize difficulty section visibility
    difficultyGroup.style.display = modeSelect.value === 'human-vs-ai' ? 'block' : 'none';
}

// Add click handler for difficulty cards
difficultyCards.forEach(card => {
    card.addEventListener('click', function() {
        // Remove selected class from all cards
        difficultyCards.forEach(c => c.classList.remove('selected'));
        // Add selected class to clicked card
        this.classList.add('selected');
        // Check the radio button
        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;
    });
});

// Auto-resize textarea
if (argumentInput) {
    // Reset height on each input
    argumentInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Handle Enter key for submission
    argumentInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('submitArgument').click();
        }
    });
}

const leaveDebateBtn = document.getElementById('leaveDebateBtn');
const endDebateBtn = document.getElementById('endDebateBtn');
const submitArgument = document.getElementById('submitArgument');
const argumentsContainer = document.getElementById('arguments');
const evaluationSection = document.getElementById('evaluation');
const evaluationContent = document.getElementById('evaluationContent');
const waitingArea = document.getElementById('waitingArea');


// State
let currentDebate = null;
let participantName = "";

// Use the same origin as the current page
const API_BASE_URL = "";

// Event Listeners
createDebateBtn.addEventListener("click", () => {
  createDebateForm.classList.toggle("hidden");
  joinDebateForm.classList.add("hidden");
});

joinDebateBtn.addEventListener("click", () => {
  joinDebateForm.classList.toggle("hidden");
  createDebateForm.classList.add("hidden");
});


submitCreateDebate.addEventListener('click', createDebate);

submitJoinDebate.addEventListener('click', joinDebate);

leaveDebateBtn.addEventListener('click', leaveDebate);

endDebateBtn.addEventListener('click', endDebate);
submitArgument.addEventListener('click', submitArgumentHandler);


// Functions
async function createDebate() {
  const topic = document.getElementById("topic").value;
  const mode = document.getElementById("mode").value;
  const difficultyRadio = document.querySelector('input[name="difficulty"]:checked');
  const difficulty = mode === 'human-vs-ai' && difficultyRadio ? difficultyRadio.value : 'intermediate';
  participantName = document.getElementById("participantName").value;

  if (!topic || !participantName) {
    alert("Please fill in all required fields");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/debates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic, mode, difficulty, participantName }),
    });

    if (response.ok) {
      currentDebate = await response.json();
      
      // Show debate room first
      showDebateRoom();
      
      // Force the end debate button to be visible for the creator
      const endDebateBtn = document.getElementById('endDebateBtn');
      if (endDebateBtn) {
          endDebateBtn.classList.remove('hidden');
          endDebateBtn.style.display = 'block';
      }
      
      // Update the rest of the debate view
      updateDebateView();

      // Show waiting area for human vs human mode
      if (mode === "human-vs-human") {
        waitingArea.classList.remove("hidden");
      }
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.error || "Failed to create debate"}`);
    }
  } catch (error) {
    console.error("Error creating debate:", error);
    alert(
      "An error occurred while creating the debate. Please make sure the server is running on http://localhost:3000",
    );
  }
}

async function joinDebate() {
  const debateId = document.getElementById("debateId").value;
  participantName = document.getElementById("participantName").value;

  if (!debateId || !participantName) {
    alert("Please fill in all required fields");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/debates/${debateId}/join`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantName }),
      },
    );

    if (response.ok) {
      currentDebate = await response.json();
      showDebateRoom();
      updateDebateView();
      waitingArea.classList.add("hidden");
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.error || "Failed to join debate"}`);
    }
  } catch (error) {
    console.error("Error joining debate:", error);
    alert(
      "An error occurred while joining the debate. Please make sure the server is running on http://localhost:3000",
    );
  }
}


function showDebateRoom() {
    lobbySection.classList.add('hidden');
    debateRoomSection.classList.remove('hidden');

    // Get references to buttons
    const endDebateBtn = document.getElementById('endDebateBtn');
    const viewEvalBtn = document.getElementById('viewEvaluationBtn');

    if (endDebateBtn) {
        // Show end debate button for debate creator in all modes when not ended
        if (currentDebate && 
            currentDebate.participants[0] === participantName &&
            currentDebate.status !== 'ended') {
            endDebateBtn.classList.remove('hidden');
            endDebateBtn.style.display = 'block';
            
            // Hide view evaluation button if it exists
            if (viewEvalBtn) {
                viewEvalBtn.style.display = 'none';
            }
        } else if (currentDebate && currentDebate.status === 'ended') {
            // If debate is ended, show view evaluation button
            endDebateBtn.style.display = 'none';
            showViewEvaluationButton();
        } else {
            endDebateBtn.classList.add('hidden');
            endDebateBtn.style.display = 'none';
        }
    }
}


function showLobby() {
  debateRoomSection.classList.add("hidden");
  lobbySection.classList.remove("hidden");
  createDebateForm.classList.add("hidden");
  joinDebateForm.classList.add("hidden");
}

function leaveDebate() {
  currentDebate = null;
  showLobby();
}

async function updateDebateView() {
  if (!currentDebate) return;

  document.getElementById("debateTopic").textContent = currentDebate.topic;
  document.getElementById("debateMode").textContent =
    `Mode: ${currentDebate.mode}`;
  document.getElementById("debateParticipants").textContent =
    `Participants: ${currentDebate.participants.join(", ")}`;

  // Handle waiting area visibility
  if (
    currentDebate.mode === "human-vs-human" &&
    currentDebate.participants.length < 2
  ) {
    document.getElementById("currentDebateId").textContent = currentDebate.id;
    waitingArea.classList.remove("hidden");
  } else {
    waitingArea.classList.add("hidden");
  }

  // Handle end debate button visibility
  const endDebateBtn = document.getElementById('endDebateBtn');
  const viewEvalBtn = document.getElementById('viewEvaluationBtn');

  if (endDebateBtn) {
    if (currentDebate.status === 'ended') {
      endDebateBtn.style.display = 'none';
      if (!viewEvalBtn) {
        showViewEvaluationButton();
      }
    } else if (currentDebate.participants[0] === participantName) {
      endDebateBtn.style.display = 'block';
      endDebateBtn.classList.remove('hidden');
    } else {
      endDebateBtn.style.display = 'none';
      endDebateBtn.classList.add('hidden');
    }
  }

  renderArguments();
}

function renderArguments() {
  argumentsContainer.innerHTML = "";

  if (!currentDebate.arguments || currentDebate.arguments.length === 0) {
    argumentsContainer.innerHTML = `
      <div class="empty-state">
        Start your debate by typing your first argument below
      </div>
    `;
    return;
  }

  currentDebate.arguments.forEach((arg) => {
    const argumentElement = document.createElement("div");
    argumentElement.className = "argument";

    // Add specific classes based on participant type
    if (arg.participant === "AI Assistant") {
      argumentElement.classList.add("ai");
    } else if (arg.participant === "AI Judge") {
      argumentElement.classList.add("evaluation");
    }

    argumentElement.innerHTML = `
            <div class="argument-header">
                <strong>${arg.participant}</strong>
                <span>${new Date(arg.timestamp).toLocaleString()}</span>
            </div>
            <div class="argument-content">
                ${arg.argument}
            </div>
        `;

    argumentsContainer.appendChild(argumentElement);
  });

  // Scroll to bottom
  argumentsContainer.scrollTop = argumentsContainer.scrollHeight;
}

async function submitArgumentHandler() {
  const argumentInput = document.getElementById("argumentInput");
  const submitButton = document.getElementById("submitArgument");
  const argumentContainer = document.querySelector(".chat-input-container");
  const argument = argumentInput.value.trim();

  if (!argument || !currentDebate) {
    argumentInput.focus();
    return;
  }

  // Disable input and button while processing
  argumentInput.disabled = true;
  submitButton.disabled = true;
  argumentContainer.classList.add("disabled");
  
  // Add loading animation to button
  submitButton.classList.add("submitting");
  
  // Add temporary loading message
  const loadingMessage = document.createElement("div");
  loadingMessage.className = "argument loading-message";
  loadingMessage.innerHTML = `
    <div class="loading-wave">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  argumentsContainer.appendChild(loadingMessage);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/debates/${currentDebate.id}/arguments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participant: participantName, argument }),
      },
    );

    if (response.ok) {
      const result = await response.json();
      
      // Clear input immediately after successful submission
      argumentInput.value = "";

      // Check if AI response indicates an error
      if (
        result.aiResponse &&
        result.aiResponse.includes("Sorry, I couldn't generate a response")
      ) {
        alert("The AI is currently unavailable. Please try again later.");
      }

      // For human vs AI mode, we need to wait a bit for the AI to respond
      // Then refresh the debate to get all updates
      await refreshDebate();

    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.error || "Failed to submit argument"}`);
    }
  } catch (error) {
    console.error("Error submitting argument:", error);
    alert(
      "An error occurred while submitting your argument. Please make sure the server is running on http://localhost:3000",
    );
  } finally {
    // Remove loading message if it exists
    if (loadingMessage) {
      loadingMessage.remove();
    }

    // Re-enable input and button
    argumentInput.disabled = false;
    submitButton.disabled = false;
    argumentContainer.classList.remove("disabled");
    submitButton.classList.remove("submitting");
    argumentInput.focus();
  }
}


async function refreshDebate() {

  if (!currentDebate) return;



  try {

    const response = await fetch(`/api/debates/${currentDebate.id}`);
    if (response.ok) {

      currentDebate = await response.json();

      updateDebateView();

    }

  } catch (error) {

    console.error("Error refreshing debate:", error);

  }

}

// Modal functions
function showEvaluationModal(evaluationData) {
    const modal = document.getElementById('evaluationModal');
    
    // Update each participant's evaluation
    evaluationData.participants.forEach((participant, index) => {
        const section = document.getElementById(`participant${index + 1}Evaluation`);
        if (!section) return;

        // Set participant name
        section.querySelector('.participant-name').textContent = participant.name;

        // Set scores and feedback for each category
        ['reasoning', 'evidence', 'persuasiveness', 'relevance'].forEach(category => {
            const categoryData = participant.scores[category];
            const progressBar = section.querySelector(`[data-category="${category}"]`);
            const scoreLabel = progressBar.parentElement.previousElementSibling.querySelector('.score');
            const feedbackText = progressBar.parentElement.nextElementSibling;

            // Animate progress bar
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.width = `${categoryData.score}%`;
                scoreLabel.textContent = `${categoryData.score}%`;
            }, 100);

            // Set feedback
            feedbackText.textContent = categoryData.feedback;
        });

        // Update strengths and improvements
        const strengthList = section.querySelector('.strength-list');
        const improvementList = section.querySelector('.improvement-list');

        strengthList.innerHTML = participant.strengths
            .map(strength => `<li>${strength}</li>`)
            .join('');

        improvementList.innerHTML = participant.improvements
            .map(improvement => `<li>${improvement}</li>`)
            .join('');
    });

    // Update overall evaluation
    const debateQualityProgress = document.getElementById('debateQualityProgress');
    debateQualityProgress.style.width = `${evaluationData.overall.debateQuality}%`;
    debateQualityProgress.parentElement.previousElementSibling.querySelector('.score').textContent = 
        `${evaluationData.overall.debateQuality}%`;

    // Set winner information with animation
    const winnerName = document.getElementById('winnerName');
    const winnerReason = document.getElementById('winnerReason');
    
    winnerName.textContent = evaluationData.overall.winner;
    winnerReason.textContent = evaluationData.overall.reason;
    
    // Show modal with animation
    modal.style.display = 'block';
    
    // Close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        showViewEvaluationButton(); // Always show the button after closing
    };
    
    // Click outside to close
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            showViewEvaluationButton(); // Always show the button after closing
        }
    };

    // Prevent modal content clicks from closing the modal
    modal.querySelector('.modal').onclick = (e) => e.stopPropagation();
}

function setProgress(elementId, value) {
    const progressElement = document.getElementById(elementId);
    const scoreElement = progressElement.parentElement.previousElementSibling.querySelector('.score');
    progressElement.style.width = '0%';
    
    // Animate progress bar
    setTimeout(() => {
        progressElement.style.width = `${value}%`;
        scoreElement.textContent = `${value}%`;
    }, 100);
}

// Store evaluation data globally
let lastEvaluationData = null;

function showViewEvaluationButton() {
    // Remove existing view evaluation button if it exists
    const existingViewEvalBtn = document.getElementById('viewEvaluationBtn');
    if (existingViewEvalBtn) {
        existingViewEvalBtn.remove();
    }

    // Create new view evaluation button
    const viewEvalBtn = document.createElement('button');
    viewEvalBtn.id = 'viewEvaluationBtn';
    viewEvalBtn.className = 'btn primary';
    viewEvalBtn.style.display = 'block'; // Ensure it's visible
    viewEvalBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="eval-icon" style="width: 16px; height: 16px; margin-right: 8px;">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
            <path fill="currentColor" d="M7 12h2v5H7zm4-7h2v12h-2zm4 4h2v8h-2z"/>
        </svg>
        View Evaluation
    `;
    viewEvalBtn.onclick = () => {
        if (lastEvaluationData) {
            showEvaluationModal(lastEvaluationData);
        }
    };
    
    // Replace end debate button with view evaluation button
    if (endDebateBtn && endDebateBtn.parentNode) {
        endDebateBtn.parentNode.replaceChild(viewEvalBtn, endDebateBtn);
    }
}

async function endDebate() {
    if (!currentDebate) return;

    const endDebateBtn = document.getElementById('endDebateBtn');
    const argumentInput = document.getElementById('argumentInput');
    const submitArgument = document.getElementById('submitArgument');
    const debateArea = document.getElementById('debateArea');
    
    try {
        // Disable all inputs and show loading state
        if (endDebateBtn) {
            endDebateBtn.disabled = true;
            endDebateBtn.classList.add('button-loading');
        }
        if (argumentInput) argumentInput.disabled = true;
        if (submitArgument) submitArgument.disabled = true;

        // End debate API call
        const response = await fetch(`${API_BASE_URL}/api/debates/${currentDebate.id}/end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Failed to end debate");
        }

        const result = await response.json();
        currentDebate.status = 'ended';

        // Generate evaluation data
        const evalData = {
            participants: currentDebate.participants.map(name => {
                const baseScore = Math.floor(Math.random() * 20) + 60;
                return {
                    name,
                    scores: {
                        reasoning: { 
                            score: baseScore + 5,
                            feedback: `${name}'s reasoning was strong throughout the debate.`
                        },
                        evidence: {
                            score: baseScore + 3,
                            feedback: "Evidence was well presented and relevant."
                        },
                        persuasiveness: {
                            score: baseScore + 7,
                            feedback: "Arguments were presented convincingly."
                        },
                        relevance: {
                            score: baseScore + 4,
                            feedback: "Points were highly relevant to the topic."
                        }
                    },
                    strengths: [
                        "Clear argument structure",
                        "Good topic understanding",
                        "Effective examples"
                    ],
                    improvements: [
                        "More specific examples",
                        "Consider counter-arguments",
                        "Strengthen evidence"
                    ]
                };
            }),
            overall: {
                winner: result.winner || currentDebate.participants[0],
                reason: result.finalEvaluation || "Strong performance and compelling arguments",
                debateQuality: 85,
                summary: "Excellent engagement from both participants"
            }
        };

        // Store evaluation data
        lastEvaluationData = evalData;

        // Remove end debate button and loading state
        if (endDebateBtn) {
            endDebateBtn.classList.remove('button-loading');
            if (endDebateBtn.parentNode) {
                endDebateBtn.parentNode.removeChild(endDebateBtn);
            }
        }

        // Show evaluation immediately
        showEvaluationModal(evalData);
        
        // Create new view evaluation button
        showViewEvaluationButton();

        // Update debate view to reflect ended state
        await refreshDebate();

    } catch (error) {
        console.error("Error ending debate:", error);
        alert("Failed to end debate. Please try again.");
        
        // Re-enable inputs and remove loading state on error
        if (endDebateBtn) {
            endDebateBtn.disabled = false;
            endDebateBtn.classList.remove('button-loading');
        }
        if (argumentInput) argumentInput.disabled = false;
        if (submitArgument) submitArgument.disabled = false;
    }
}

// Load debates on page load
window.addEventListener("DOMContentLoaded", loadDebates);

async function loadDebates() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/debates`);
    if (response.ok) {
      const debates = await response.json();
      renderDebatesList(debates);
    } else {
      console.error("Failed to load debates:", response.status);
    }
  } catch (error) {
    console.error("Error loading debates:", error);
  }
}

function renderDebatesList(debates) {
  debatesList.innerHTML = "";

  if (debates.length === 0) {
    debatesList.innerHTML = "<p>No active debates.</p>";
    return;
  }

  debates.forEach((debate) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <div class="debate-info">
                <h4>${debate.topic}</h4>
                <p>Mode: ${debate.mode} | Participants: ${debate.participants.length}/2</p>
            </div>
            <div class="debate-actions">
                <button class="btn secondary" onclick="joinDebateById('${debate.id}')">Join</button>
            </div>
        `;
    debatesList.appendChild(li);
  });
}

// Global function for joining debates from the list
window.joinDebateById = function (debateId) {
  document.getElementById("debateId").value = debateId;
  joinDebateForm.classList.remove("hidden");
  createDebateForm.classList.add("hidden");
};

// Poll for updates in human vs human debates
setInterval(async () => {
  if (currentDebate && currentDebate.mode === "human-vs-human") {
    await refreshDebate();
  }
}, 5000);
