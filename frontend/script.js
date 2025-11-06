// DOM Elements
const lobbySection = document.getElementById("lobby");
const debateRoomSection = document.getElementById("debateRoom");
const newDebateBtn = document.getElementById("newDebateBtn");
const joinDebateBtn = document.getElementById("joinDebateBtn");
const submitCreateDebate = document.getElementById("submitCreateDebate");
const submitJoinDebate = document.getElementById("submitJoinDebate");
const joinModal = document.getElementById("joinModal");
const closeJoinModal = document.getElementById("closeJoinModal");
const cancelJoin = document.getElementById("cancelJoin");
const debatesList = document.getElementById("debates");
const argumentInput = document.getElementById("argumentInput");

// Handle difficulty selection and mode changes
const modeSelect = document.getElementById("mode");
const difficultyGroup = document.getElementById("difficultyGroup");
const difficultyCards = document.querySelectorAll(".difficulty-card");

if (modeSelect) {
  // Show/hide difficulty section based on mode
  modeSelect.addEventListener("change", function () {
    difficultyGroup.style.display =
      this.value === "human-vs-ai" ? "block" : "none";
  });

  // Initialize difficulty section visibility
  difficultyGroup.style.display =
    modeSelect.value === "human-vs-ai" ? "block" : "none";
}

// Add click handler for difficulty cards
difficultyCards.forEach((card) => {
  card.addEventListener("click", function () {
    // Remove selected class from all cards
    difficultyCards.forEach((c) => c.classList.remove("selected"));
    // Add selected class to clicked card
    this.classList.add("selected");
    // Check the radio button
    const radio = this.querySelector('input[type="radio"]');
    radio.checked = true;
  });
});

// Auto-resize textarea
if (argumentInput) {
  // Reset height on each input
  argumentInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  // Handle Enter key for submission
  argumentInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("submitArgument").click();
    }
  });
}

const leaveDebateBtn = document.getElementById("leaveDebateBtn");
const endDebateBtn = document.getElementById("endDebateBtn");
const submitArgument = document.getElementById("submitArgument");
const argumentsContainer = document.getElementById("arguments");
const evaluationSection = document.getElementById("evaluation");
const evaluationContent = document.getElementById("evaluationContent");
const waitingArea = document.getElementById("waitingArea");

// State
let currentDebate = null;
let participantName = "";

// Use the same origin as the current page
const API_BASE_URL = "";

// Event Listeners
if (newDebateBtn) {
  newDebateBtn.addEventListener("click", () => {
    // Since the form is now directly in the lobby, we just need to ensure it's visible
    lobbySection.classList.remove("hidden");
    debateRoomSection.classList.add("hidden");
  });
}

if (joinDebateBtn) {
  joinDebateBtn.addEventListener("click", () => {
    if (joinModal) {
      joinModal.classList.remove("hidden");
    }
  });
}

if (closeJoinModal) {
  closeJoinModal.addEventListener("click", () => {
    if (joinModal) {
      joinModal.classList.add("hidden");
    }
  });
}

if (cancelJoin) {
  cancelJoin.addEventListener("click", () => {
    if (joinModal) {
      joinModal.classList.add("hidden");
    }
  });
}

// Submit buttons
if (submitCreateDebate) {
  submitCreateDebate.addEventListener("click", createDebate);
}

if (submitJoinDebate) {
  submitJoinDebate.addEventListener("click", joinDebate);
}

if (leaveDebateBtn) {
  leaveDebateBtn.addEventListener("click", leaveDebate);
}

if (endDebateBtn) {
  endDebateBtn.addEventListener("click", endDebate);
}

if (submitArgument) {
  submitArgument.addEventListener("click", submitArgumentHandler);
}

// Functions
async function createDebate() {
  const topic = document.getElementById("topic").value;
  const mode = document.getElementById("mode").value;
  const difficultyRadio = document.querySelector(
    'input[name="difficulty"]:checked',
  );
  const difficulty =
    mode === "human-vs-ai" && difficultyRadio
      ? difficultyRadio.value
      : "intermediate";
  participantName = document.getElementById("participantName").value;

  if (!topic || !participantName) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/debates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic, mode, participantName, difficulty }), // Send difficulty to backend
    });

    if (response.ok) {
      currentDebate = await response.json();

      // Store difficulty in the debate object for display purposes
      currentDebate.difficulty = difficulty;

      // Show debate room first
      showDebateRoom();

      // Force the end debate button to be visible for the creator
      const endDebateBtn = document.getElementById("endDebateBtn");
      if (endDebateBtn) {
        endDebateBtn.classList.remove("hidden");
      }

      // Update the rest of the debate view
      updateDebateView();

      // Show waiting area for human vs human mode
      if (mode === "human-vs-human" && waitingArea) {
        waitingArea.classList.remove("hidden");
      }

      // Show success notification
      showNotification("Debate created successfully!", "success");
    } else {
      const errorData = await response.json();
      showNotification(
        `Error: ${errorData.error || "Failed to create debate"}`,
        "error",
      );
    }
  } catch (error) {
    console.error("Error creating debate:", error);
    showNotification(
      "An error occurred while creating the debate. Please make sure the server is running.",
      "error",
    );
  }
}

async function joinDebate() {
  const debateId = document.getElementById("joinDebateId").value;
  participantName = document.getElementById("joinParticipantName").value;

  if (!debateId || !participantName) {
    showNotification("Please fill in all required fields", "error");
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
      if (waitingArea) waitingArea.classList.add("hidden");
      if (joinModal) joinModal.classList.add("hidden"); // Hide modal after successful join

      // Show success notification
      showNotification("Joined debate successfully!", "success");
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || "Failed to join debate";
      showNotification(`Error: ${errorMessage}`, "error");
    }
  } catch (error) {
    console.error("Error joining debate:", error);
    showNotification(
      "An error occurred while joining the debate. Please make sure the server is running.",
      "error",
    );
  } finally {
    // Close the join modal
    if (joinModal) {
      joinModal.classList.add("hidden");
    }
  }
}

function showDebateRoom() {
  lobbySection.classList.add("hidden");
  debateRoomSection.classList.remove("hidden");

  // Get references to buttons
  const endDebateBtn = document.getElementById("endDebateBtn");
  const viewEvalBtn = document.getElementById("viewEvaluationBtn");

  if (endDebateBtn) {
    // Show end debate button for debate creator in all modes when not ended
    if (
      currentDebate &&
      currentDebate.participants[0] === participantName &&
      currentDebate.status !== "ended"
    ) {
      endDebateBtn.classList.remove("hidden");
    } else if (currentDebate && currentDebate.status === "ended") {
      endDebateBtn.classList.add("hidden");
    }
  }
}

function showLobby() {
  debateRoomSection.classList.add("hidden");
  lobbySection.classList.remove("hidden");
}

function leaveDebate() {
  currentDebate = null;
  showLobby();
}

async function updateDebateView() {
  if (!currentDebate) return;

  // Update debate header information
  document.getElementById("debateTopic").textContent = currentDebate.topic;
  document.getElementById("debateMode").textContent =
    `Mode: ${currentDebate.mode}`;
  document.getElementById("debateParticipants").textContent =
    `Participants: ${currentDebate.participants.join(", ")}`;

  // Update difficulty display if it exists
  const difficultyElement = document.getElementById("debateDifficulty");
  if (difficultyElement) {
    if (currentDebate.difficulty) {
      difficultyElement.textContent = `Difficulty: ${currentDebate.difficulty.charAt(0).toUpperCase() + currentDebate.difficulty.slice(1)}`;
      difficultyElement.style.display = "inline";
    } else {
      difficultyElement.style.display = "none";
    }
  }

  // Render arguments
  renderArguments();

  // Handle end debate button visibility
  const endDebateBtn = document.getElementById("endDebateBtn");
  const viewEvalBtn = document.getElementById("viewEvaluationBtn");

  if (endDebateBtn) {
    if (currentDebate.status === "ended") {
      endDebateBtn.classList.add("hidden");
      if (!viewEvalBtn) {
        console.log("View Evaluation button not found, creating it");
        showViewEvaluationButton();
      } else {
        console.log("View Evaluation button already exists");
      }
    } else if (currentDebate.participants[0] === participantName) {
      endDebateBtn.classList.remove("hidden");
    } else {
      endDebateBtn.classList.add("hidden");
    }
  }

  // Update current debate ID in waiting area if it exists
  const currentDebateIdElement = document.getElementById("currentDebateId");
  if (currentDebateIdElement) {
    currentDebateIdElement.textContent = currentDebate.id;
  }
}

function renderArguments() {
  if (!argumentsContainer || !currentDebate) return;

  argumentsContainer.innerHTML = "";

  if (currentDebate.arguments.length === 0) {
    argumentsContainer.innerHTML =
      '<div class="empty-state">No arguments yet. Be the first to contribute!</div>';
    return;
  }

  currentDebate.arguments.forEach((arg) => {
    const argumentElement = document.createElement("div");
    argumentElement.className = `message ${arg.participant === participantName ? "user" : arg.participant === "AI Assistant" || arg.participant === "AI Judge" || arg.participant === "AI Final Evaluator" ? "ai" : "other"}`;

    // Format timestamp
    const timestamp = new Date(arg.timestamp).toLocaleTimeString();

    argumentElement.innerHTML = `
            <div class="message-header">
                <span class="message-speaker">${arg.participant}</span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-content ${arg.participant === participantName ? "user" : arg.participant === "AI Assistant" || arg.participant === "AI Judge" || arg.participant === "AI Final Evaluator" ? "ai" : "other"}">
                ${arg.argument}
            </div>
        `;

    argumentsContainer.appendChild(argumentElement);
  });

  // Scroll to bottom
  argumentsContainer.scrollTop = argumentsContainer.scrollHeight;
}

async function submitArgumentHandler() {
  if (!currentDebate) return;

  const argument = argumentInput.value.trim();
  if (!argument) {
    showNotification("Please enter an argument", "error");
    return;
  }

  const argumentContainer = document.querySelector(".input-area");
  const submitButton = document.getElementById("submitArgument");

  // Disable input and button during submission
  argumentInput.disabled = true;
  submitButton.disabled = true;
  argumentContainer.classList.add("disabled");

  // Add loading animation to button
  submitButton.classList.add("submitting");

  // Add temporary loading message
  const loadingMessage = document.createElement("div");
  loadingMessage.className = "message ai";
  loadingMessage.innerHTML = `
        <div class="message-content ai">
            <div class="loading-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

  const argumentsContainer = document.getElementById("arguments");
  if (argumentsContainer) {
    argumentsContainer.appendChild(loadingMessage);
    argumentsContainer.scrollTop = argumentsContainer.scrollHeight;
  }

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

    // Remove loading message
    if (loadingMessage && loadingMessage.parentNode) {
      loadingMessage.parentNode.removeChild(loadingMessage);
    }

    if (response.ok) {
      const result = await response.json();

      // Clear input immediately after successful submission
      argumentInput.value = "";

      // Reset textarea height
      argumentInput.style.height = "auto";

      // Refresh debate to get all updates
      await refreshDebate();

      // Show success notification
      showNotification("Argument submitted successfully!", "success");
    } else {
      const errorData = await response.json();
      showNotification(
        `Error: ${errorData.error || "Failed to submit argument"}`,
        "error",
      );
    }
  } catch (error) {
    console.error("Error submitting argument:", error);

    // Remove loading message on error
    if (loadingMessage && loadingMessage.parentNode) {
      loadingMessage.parentNode.removeChild(loadingMessage);
    }

    showNotification(
      "An error occurred while submitting your argument. Please make sure the server is running.",
      "error",
    );

    // If the AI is unavailable, show a user-friendly message
    if (
      error.message &&
      error.message.includes("Sorry, I couldn't generate a response")
    ) {
      showNotification(
        "The AI is currently unavailable. Please try again later.",
        "error",
      );
    }
  } finally {
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
      const updatedDebate = await response.json();
      // Preserve the difficulty setting when refreshing
      if (currentDebate.difficulty) {
        updatedDebate.difficulty = currentDebate.difficulty;
      }
      currentDebate = updatedDebate;
      updateDebateView();
    }
  } catch (error) {
    console.error("Error refreshing debate:", error);
  }
}

// Modal functions
function showEvaluationModal(evaluationData) {
  console.log("Showing evaluation modal with data:", evaluationData);

  const modal = document.getElementById("evaluationModal");
  if (!modal) {
    console.error("Evaluation modal not found");
    showNotification("Evaluation modal not found", "error");
    return;
  }

  // Check if this is detailed evaluation data or simple data
  // Accept detailed evaluation that may include participants or only overall data
  if (evaluationData && (evaluationData.participants || evaluationData.overall)) {
    // Detailed evaluation with progress bars and/or overall summary
    showDetailedEvaluation(evaluationData);
  } else {
    // Simple evaluation - show as notification
    showNotification("Debate evaluation completed", "success");
    return;
  }

  // Show modal with animation
  modal.classList.remove("hidden");

  // Close button functionality
  const closeBtn = document.getElementById("closeEvaluationModal");
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.add("hidden");
      showViewEvaluationButton(); // Always show the button after closing
    };
  }

  // Click outside to close
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      showViewEvaluationButton(); // Always show the button after closing
    }
  };

  // Prevent modal content clicks from closing the modal
  const modalContent = modal.querySelector(".modal");
  if (modalContent) {
    modalContent.onclick = (e) => e.stopPropagation();
  }

  console.log("Evaluation modal displayed");
}

function showDetailedEvaluation(evaluationData) {
  console.log("Showing detailed evaluation with data:", evaluationData);

  // Update each participant's evaluation section
  const participantsContainer = document.querySelector(
    ".participants-evaluation",
  );
  if (!participantsContainer) {
    console.error("Participants container not found");
    return;
  }

  // Clear existing content
  participantsContainer.innerHTML = "";

  const participants = Array.isArray(evaluationData.participants)
    ? evaluationData.participants
    : [];

  // Create participant sections safely (use defaults if fields missing)
  participants.forEach((participant = {}, index) => {
    const name = participant.name || `Participant ${index + 1}`;
    const scores = participant.scores || {};
    const reasoning = scores.reasoning || { score: 0, feedback: "" };
    const evidence = scores.evidence || { score: 0, feedback: "" };
    const persuasiveness = scores.persuasiveness || { score: 0, feedback: "" };
    const relevance = scores.relevance || { score: 0, feedback: "" };
    const strengths = Array.isArray(participant.strengths)
      ? participant.strengths
      : [];
    const improvements = Array.isArray(participant.improvements)
      ? participant.improvements
      : [];

    const participantSection = document.createElement("div");
    participantSection.className = "participant-section";
    participantSection.id = `participant${index + 1}Evaluation`;

    const strengthsHtml = strengths.map((s) => `<li>${s}</li>`).join("");
    const improvementsHtml = improvements
      .map((s) => `<li>${s}</li>`)
      .join("");

    participantSection.innerHTML = `
      <h3 class="participant-name">${name}</h3>
      <div class="scores-grid">
        <div class="evaluation-section">
          <h4 class="evaluation-title">Reasoning</h4>
          <div class="score-label">
            <span>Logical Flow</span>
            <span class="score">${reasoning.score}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" data-category="reasoning" style="width: ${reasoning.score}%"></div>
          </div>
          <div class="feedback-text">${reasoning.feedback || ""}</div>
        </div>
        <div class="evaluation-section">
          <h4 class="evaluation-title">Evidence</h4>
          <div class="score-label">
            <span>Supporting Facts</span>
            <span class="score">${evidence.score}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" data-category="evidence" style="width: ${evidence.score}%"></div>
          </div>
          <div class="feedback-text">${evidence.feedback || ""}</div>
        </div>
        <div class="evaluation-section">
          <h4 class="evaluation-title">Persuasiveness</h4>
          <div class="score-label">
            <span>Effectiveness</span>
            <span class="score">${persuasiveness.score}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" data-category="persuasiveness" style="width: ${persuasiveness.score}%"></div>
          </div>
          <div class="feedback-text">${persuasiveness.feedback || ""}</div>
        </div>
        <div class="evaluation-section">
          <h4 class="evaluation-title">Relevance</h4>
          <div class="score-label">
            <span>Topic Focus</span>
            <span class="score">${relevance.score}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" data-category="relevance" style="width: ${relevance.score}%"></div>
          </div>
          <div class="feedback-text">${relevance.feedback || ""}</div>
        </div>
      </div>
      <div class="feedback-section">
        <div class="strengths">
          <h4>Key Strengths</h4>
          <ul class="strength-list">${strengthsHtml}</ul>
        </div>
        <div class="improvements">
          <h4>Areas for Improvement</h4>
          <ul class="improvement-list">${improvementsHtml}</ul>
        </div>
      </div>
    `;

    participantsContainer.appendChild(participantSection);
  });

  // Update overall evaluation section using IDs present in the HTML
  if (evaluationData.overall) {
    const winnerNameEl = document.getElementById("winnerName");
    const debateQualityScoreEl = document.getElementById("debateQualityScore");
    const debateQualitySummaryEl = document.getElementById("debateQualitySummary");

    if (winnerNameEl) winnerNameEl.textContent = evaluationData.overall.winner || "";
    if (debateQualityScoreEl) debateQualityScoreEl.textContent = `${evaluationData.overall.debateQuality || 0}%`;
    if (debateQualitySummaryEl) debateQualitySummaryEl.textContent = evaluationData.overall.summary || "";
  }

  console.log("Detailed evaluation displayed");
}

function setProgress(elementId, value) {
  const progressElement = document.getElementById(elementId);
  if (!progressElement) return;

  // Safely get the score element
  const parentElement = progressElement.parentElement;
  if (!parentElement) return;

  const previousSibling = parentElement.previousElementSibling;
  if (!previousSibling) return;

  const scoreElement = previousSibling.querySelector(".score");

  progressElement.style.width = "0%";

  // Animate progress bar
  setTimeout(() => {
    progressElement.style.width = `${value}%`;
    if (scoreElement) {
      scoreElement.textContent = `${value}%`;
    }
  }, 100);
}

// Store evaluation data globally
let lastEvaluationData = null;

function showViewEvaluationButton() {
  console.log(
    "Showing view evaluation button, lastEvaluationData:",
    lastEvaluationData,
  );
  console.log("lastEvaluationData type:", typeof lastEvaluationData);
  if (lastEvaluationData) {
    console.log("lastEvaluationData keys:", Object.keys(lastEvaluationData));
  }

  // Remove existing view evaluation button if it exists
  const existingViewEvalBtn = document.getElementById("viewEvaluationBtn");
  if (existingViewEvalBtn) {
    console.log("Removing existing view evaluation button");
    existingViewEvalBtn.remove();
  }

  // Create new view evaluation button
  const viewEvalBtn = document.createElement("button");
  viewEvalBtn.id = "viewEvaluationBtn";
  viewEvalBtn.className = "btn primary";
  viewEvalBtn.style.display = "block"; // Ensure it's visible
  viewEvalBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="eval-icon" style="width: 16px; height: 16px; margin-right: 8px;">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
            <path fill="currentColor" d="M7 12h2v5H7zm4-7h2v12h-2zm4 4h2v8h-2z"/>
        </svg>
        View Evaluation
    `;
  viewEvalBtn.onclick = () => {
    console.log("View evaluation button clicked, lastEvaluationData:", lastEvaluationData);
    console.log("lastEvaluationData type:", typeof lastEvaluationData);
    if (lastEvaluationData) {
      console.log("lastEvaluationData keys:", Object.keys(lastEvaluationData));
      showEvaluationModal(lastEvaluationData);
    } else {
      showNotification("No evaluation data available", "error");
    }
  };

  // Find a suitable place to add the button
  const debateHeader = document.querySelector(".debate-header");
  console.log("Debate header element:", debateHeader);
  if (debateHeader) {
    const actionsDiv = debateHeader.querySelector(".debate-actions");
    console.log("Actions div element:", actionsDiv);
    if (actionsDiv) {
      actionsDiv.appendChild(viewEvalBtn);
      console.log("View evaluation button added to DOM");

      // Verify it was added
      setTimeout(() => {
        const addedButton = document.getElementById("viewEvaluationBtn");
        if (addedButton) {
          console.log("View evaluation button confirmed in DOM");
        } else {
          console.error("View evaluation button not found in DOM after adding");
        }
      }, 100);
    } else {
      console.error("Debate actions div not found");
    }
  } else {
    console.error("Debate header not found");
  }
}

async function endDebate() {
  if (!currentDebate) return;

  const endDebateBtn = document.getElementById("endDebateBtn");

  const argumentInput = document.getElementById("argumentInput");

  const submitArgument = document.getElementById("submitArgument");

  try {
    // Disable all inputs and show loading state

    if (endDebateBtn) {
      endDebateBtn.disabled = true;

      endDebateBtn.classList.add("button-loading");
    }

    if (argumentInput) argumentInput.disabled = true;

    if (submitArgument) submitArgument.disabled = true;

    // End debate API call

    const response = await fetch(
      `${API_BASE_URL}/api/debates/${currentDebate.id}/end`,

      {
        method: "POST",

        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);

        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text

        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    currentDebate.status = "ended";

    // Store detailed evaluation data for later use

    if (result.detailedEvaluation) {
      lastEvaluationData = result.detailedEvaluation;
    }

    // Update the debate view to show the status change
    updateDebateView();

    // Hide the end debate button
    if (endDebateBtn) {
      endDebateBtn.classList.remove("button-loading");
      endDebateBtn.classList.add("hidden");
    }

    // Show evaluation modal with detailed results if present
    if (result && result.detailedEvaluation) {
      console.log("Setting lastEvaluationData:", result.detailedEvaluation);
      lastEvaluationData = result.detailedEvaluation;
      // Open the evaluation modal immediately so users see results right away
      showNotification("Debate ended! Showing evaluation...", "success");
      try {
        showEvaluationModal(lastEvaluationData);
      } catch (e) {
        console.error("Error showing evaluation modal:", e);
      }
    } else {
      // Show success notification if no detailed evaluation
      console.log("No detailed evaluation data received, result:", result);
      showNotification("Debate ended successfully!", "success");
    }
  } catch (error) {
    console.error("Error ending debate:", error);

    // Show error notification

    showNotification(`Failed to end debate: ${error.message}`, "error");

    // Re-enable inputs and remove loading state on error

    if (endDebateBtn) {
      endDebateBtn.disabled = false;

      endDebateBtn.classList.remove("button-loading");
    }

    if (argumentInput) argumentInput.disabled = false;

    if (submitArgument) submitArgument.disabled = false;
  }
}

// Simple notification function - Claude AI Inspired
function showNotification(message, type = "info") {
  // Check if a notification with the same message already exists
  const existingNotifications = document.querySelectorAll(".notification");
  for (let notification of existingNotifications) {
    if (notification.textContent.includes(message)) {
      return; // Don't show duplicate notifications
    }
  }

  // Create a temporary notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add animation styles if not already present
  let style = document.getElementById("notification-styles");
  if (!style) {
    style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(100%); }
        10% { opacity: 1; transform: translateX(0); }
        90% { opacity: 1; transform: translateX(0); }
        100% { opacity: 0; transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Remove notification after animation
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
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
  const debatesList = document.getElementById("debates");
  if (!debatesList) return;

  debatesList.innerHTML = "";

  if (debates.length === 0) {
    debatesList.innerHTML = "<p class='empty-state'>No active debates.</p>";
    return;
  }

  debates.forEach((debate) => {
    const li = document.createElement("div");
    li.className = "debate-item";

    // Determine if debate can be joined
    const canJoin =
      debate.mode === "human-vs-human" && debate.participants.length < 2;
    const isFull =
      debate.mode === "human-vs-human" && debate.participants.length >= 2;
    const isAiMode = debate.mode === "human-vs-ai";

    // Create participant info text
    let participantInfo = `${debate.participants.length}/2 participants`;
    if (isAiMode) {
      participantInfo = "AI opponent";
    } else if (isFull) {
      participantInfo = "Full";
    }

    // Create button HTML
    let buttonHtml = "";
    if (canJoin) {
      buttonHtml = `<button class="btn secondary small" onclick="joinDebateById('${debate.id}')">Join</button>`;
    } else if (isAiMode) {
      buttonHtml = `<button class="btn secondary small" onclick="joinDebateById('${debate.id}')">View</button>`;
    } else {
      buttonHtml = `<button class="btn secondary small" disabled>Not Joinable</button>`;
    }

    li.innerHTML = `
      <div class="debate-item-header">
        <div class="debate-topic">${debate.topic}</div>
        <div class="debate-mode">${debate.mode.replace("-", " ")}</div>
      </div>
      <div class="debate-meta">
        <div class="debate-date">${new Date(debate.createdAt).toLocaleDateString()}</div>
        <div class="debate-participants">${participantInfo}</div>
      </div>
      ${buttonHtml}
    `;
    debatesList.appendChild(li);
  });
}

// Global function for joining debates from the list
window.joinDebateById = async function (debateId) {
  try {
    // First, get the debate details to check if it's joinable
    const response = await fetch(`/api/debates/${debateId}`);
    if (!response.ok) {
      showNotification("Debate not found", "error");
      return;
    }

    const debate = await response.json();

    // Check if this is a joinable debate
    if (debate.mode !== "human-vs-human") {
      showNotification("This debate type cannot be joined", "error");
      return;
    }

    if (debate.participants.length >= 2) {
      showNotification("This debate is already full", "error");
      return;
    }

    // Set the debate ID in the join modal
    const joinDebateIdInput = document.getElementById("joinDebateId");
    if (joinDebateIdInput) {
      joinDebateIdInput.value = debateId;
    }

    // Show the join modal
    const joinModal = document.getElementById("joinModal");
    if (joinModal) {
      joinModal.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error checking debate:", error);
    showNotification("Failed to check debate details", "error");
  }
};

// Poll for updates in human vs human debates
setInterval(async () => {
  if (currentDebate && currentDebate.mode === "human-vs-human") {
    await refreshDebate();
  }
}, 5000);

// Expose test function to window object for debugging
window.testSetEvaluationData = testSetEvaluationData;

// Test function to manually set evaluation data for debugging
function testSetEvaluationData() {
  console.log("Manually setting test evaluation data");
  lastEvaluationData = {
    participants: [
      {
        name: "Test Participant 1",
        scores: {
          reasoning: { score: 85, feedback: "Strong logical flow" },
          evidence: { score: 78, feedback: "Good use of facts" },
          persuasiveness: { score: 92, feedback: "Very convincing" },
          relevance: { score: 88, feedback: "Stayed on topic" },
        },
        strengths: ["Clear arguments", "Good examples"],
        improvements: ["More counterarguments", "Better transitions"],
      },
      {
        name: "Test Participant 2",
        scores: {
          reasoning: { score: 76, feedback: "Decent logic" },
          evidence: { score: 82, feedback: "Solid evidence" },
          persuasiveness: { score: 73, feedback: "Could be more engaging" },
          relevance: { score: 85, feedback: "Mostly relevant" },
        },
        strengths: ["Factual accuracy", "Structured approach"],
        improvements: ["Stronger conclusions", "More persuasive language"],
      },
    ],
    overall: {
      winner: "Test Participant 1",
      reason: "Demonstrated superior argumentation skills",
      debateQuality: 82,
      summary: "Well-structured debate with thoughtful arguments",
    },
  };
  console.log("Test evaluation data set:", lastEvaluationData);
  showNotification(
    "Test evaluation data set! Try clicking 'View Evaluation'",
    "success",
  );
}
