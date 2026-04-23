// ===============================
// 1) DOM references
// ===============================
const actions = document.getElementById("resourceActions");
const resourceNameCnt = document.getElementById("resourceNameCnt");
const resourceDescriptionCnt = document.getElementById("resourceDescriptionCnt");
// Example roles
const role = "admin"; // "reserver" | "admin"

// Will hold a reference to the Create button so we can enable/disable it
let createButton = null;

// Primary editing button
let primaryActionButton = null;

// Used for clearing inputs
let clearButton = null;

// Resource name and description validation status
let resourceNameValid = false
let resourceDescriptionValid = false

// Updates from form.js
let formMode = "create";

// ===============================
// 2) Button creation helpers
// ===============================

const BUTTON_BASE_CLASSES =
  "w-full rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out";

const BUTTON_ENABLED_CLASSES =
  "bg-brand-primary text-white hover:bg-brand-dark/80 shadow-soft";

const BUTTON_DISABLED_CLASSES =
  "cursor-not-allowed opacity-50";

function addButton({ label, type = "button", value, classes = "" }) {
  const btn = document.createElement("button");
  btn.type = type;
  btn.textContent = label;
  btn.name = "action";
  if (value) btn.value = value;

  btn.className = `${BUTTON_BASE_CLASSES} ${classes}`.trim();

  actions.appendChild(btn);
  return btn;
}

function setButtonEnabled(btn, enabled) {
  if (!btn) return;

  btn.disabled = !enabled;

  btn.classList.toggle("cursor-not-allowed", !enabled);
  btn.classList.toggle("opacity-50", !enabled);

  if (!enabled) {
    btn.classList.remove("hover:bg-brand-dark/80");
  } else {
    if (btn.value === "create" || btn.textContent === "Create") {
      btn.classList.add("hover:bg-brand-dark/80");
    }
  }
}

function renderActionButtons(currentRole) {
  actions.innerHTML = "";
  if (currentRole === "admin" && formMode === "create") {
    createButton = addButton({
      label: "Create",
      type: "submit",
      value: "create",
      classes: BUTTON_ENABLED_CLASSES,
    });

    clearButton = addButton({
      label: "Clear",
      type: "button",
      classes: BUTTON_ENABLED_CLASSES,
    });

    setButtonEnabled(createButton, false);
    primaryActionButton = createButton;
    setButtonEnabled(clearButton, true);
    clearButton.addEventListener("click", clearResourceForm);
  }

  if (currentRole === "admin" && formMode === "edit") {
    updateButton = addButton({
      label: "Update",
      value: "update",
      classes: BUTTON_ENABLED_CLASSES,
    });

    deleteButton = addButton({
      label: "Delete",
      value: "delete",
      classes: BUTTON_ENABLED_CLASSES,
    });
    setButtonEnabled(updateButton, false);
    primaryActionButton = updateButton;
    setButtonEnabled(deleteButton, true);
  }
}

// ===============================
// 3) Input creation + validation + clearing
// ===============================

// NEW: Add CSS for error highlighting (teacher's feedback)
function addErrorStyles() {
  if (document.getElementById('resource-error-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'resource-error-styles';
  style.textContent = `
    /* RED error styling for form.js messages */
    .error-message-red {
      background-color: #f8d7da !important;
      border-left: 4px solid #dc3545 !important;
      color: #721c24 !important;
    }
    
    /* Field error styling */
    .field-error-red {
      border: 2px solid #dc3545 !important;
      background-color: #fff8f8 !important;
    }
    
    .error-text-red {
      color: #dc3545;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: block;
    }
    
    /* Success message styling */
    .success-message-green {
      background-color: #d4edda !important;
      border-left: 4px solid #28a745 !important;
      color: #155724 !important;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    #formMessage:not(.hidden) {
      animation: slideIn 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}

function createResourceNameInput(container) {
  const input = document.createElement("input");

  input.id = "resourceName";
  input.name = "resourceName";
  input.type = "text";
  input.placeholder = "e.g., Meeting Room A";

  input.className = `
    mt-2 w-full rounded-2xl border border-black/10 bg-white
    px-4 py-3 text-sm outline-none
    focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30
    transition-all duration-200 ease-out
  `;

  container.appendChild(input);
  return input;
}

function isResourceNameValid(value) {
  const trimmed = value.trim();

  const allowedPattern = /^[a-zA-Z0-9äöåÄÖÅ \,\.\-]+$/;
  const lengthValid = trimmed.length >= 5 && trimmed.length <= 30;
  const charactersValid = allowedPattern.test(trimmed);
  return lengthValid && charactersValid;
}

function createResourceDescriptionArea(container) {
  const textarea = document.createElement("textarea");

  textarea.id = "resourceDescription";
  textarea.name = "resourceDescription";
  textarea.rows = 5;
  textarea.placeholder =
    "Describe location, capacity, included equipment, or any usage notes…";

  textarea.className = `
    mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none
    focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30 transition-all duration-200 ease-out
  `;

  container.appendChild(textarea);
  return textarea;
}

function isResourceDescriptionValid(value) {
  const trimmed = value.trim();

  const allowedPattern = /^[a-zA-Z0-9äöåÄÖÅ \,\.\-]+$/;
  const lengthValid = trimmed.length >= 10 && trimmed.length <= 50;
  const charactersValid = allowedPattern.test(trimmed);
  return lengthValid && charactersValid;
}

function setInputVisualState(input, state) {
  input.classList.remove(
    "border-green-500",
    "bg-green-100",
    "focus:ring-green-500/30",
    "border-red-500",
    "bg-red-100",
    "focus:ring-red-500/30",
    "focus:border-brand-blue",
    "focus:ring-brand-blue/30",
    "field-error-red"  // Remove our custom red class if present
  );

  input.classList.add("focus:ring-2");

  if (state === "valid") {
    input.classList.add("border-green-500", "bg-green-100", "focus:ring-green-500/30");
  } else if (state === "invalid") {
    // Use RED for invalid (teacher's feedback)
    input.classList.add("border-red-500", "bg-red-100", "focus:ring-red-500/30");
  } else {
    // neutral: keep base styling
  }
}

// NEW: Clear field errors from form.js messages
function clearFieldErrors() {
  const fields = ['resourceName', 'resourceDescription', 'resourcePrice'];
  fields.forEach(field => {
    const element = document.getElementById(field);
    if (element) {
      element.classList.remove('field-error-red');
    }
    const errorSpan = document.getElementById(`${field}-error`);
    if (errorSpan) errorSpan.remove();
  });
}

function attachResourceNameValidation(input) {
  const update = () => {
    const raw = input.value;
    if (raw.trim() === "") {
      setInputVisualState(input, "neutral");
      setButtonEnabled(createButton, false);
      return;
    }
    resourceNameValid = isResourceNameValid(raw);

    setInputVisualState(input, resourceNameValid ? "valid" : "invalid");
    setButtonEnabled(primaryActionButton, resourceNameValid && resourceDescriptionValid);
  };

  input.addEventListener("input", update);
  update();
}

function attachResourceDescriptionValidation(input) {
  const update = () => {
    const raw = input.value;
    if (raw.trim() === "") {
      setInputVisualState(input, "neutral");
      setButtonEnabled(createButton, false);
      return;
    }

    resourceDescriptionValid = isResourceDescriptionValid(raw);
    setInputVisualState(input, resourceDescriptionValid ? "valid" : "invalid");
    setButtonEnabled(primaryActionButton, resourceNameValid && resourceDescriptionValid);
  };

  input.addEventListener("input", update);
  update();
}

// Clear button functionality 
function clearResourceForm() {
  resourceNameInput.value = "";
  resourceNameInput.dispatchEvent(new Event("input", { bubbles: true }));
  resourceDescriptionArea.value = "";
  resourceDescriptionArea.dispatchEvent(new Event("input", { bubbles: true }));
  const defaultAvailable = document.getElementById("resourceAvailable");
  if (defaultAvailable) {
    defaultAvailable.checked = false;
  }
  const priceInput = document.getElementById("resourcePrice");
  if (priceInput) {
    priceInput.value = "";
    priceInput.dispatchEvent(new Event("input", { bubbles: true }));
  }
  const defaultUnit = document.querySelector(
    'input[name="resourcePriceUnit"][value="hour"]'
  );
  if (defaultUnit) {
    defaultUnit.checked = true;
  }
  setButtonEnabled(createButton, false);
  
  // Clear any error messages and field highlights
  clearFieldErrors();
  const formMessage = document.getElementById("formMessage");
  if (formMessage) {
    formMessage.classList.add("hidden");
  }
};

// ===============================
// 4) Bootstrapping
// ===============================

// Add error styles first
addErrorStyles();

renderActionButtons(role);

// Create + validate input
const resourceNameInput = createResourceNameInput(resourceNameCnt);
attachResourceNameValidation(resourceNameInput);
const resourceDescriptionArea = createResourceDescriptionArea(resourceDescriptionCnt);
attachResourceDescriptionValidation(resourceDescriptionArea);

// Override the showFormMessage function to use RED for errors (teacher's feedback)
// This enhances the existing form.js function
if (typeof window.showFormMessage === 'function') {
  const originalShowFormMessage = window.showFormMessage;
  window.showFormMessage = function(type, message, fieldErrors = null) {
    const el = document.getElementById("formMessage");
    if (!el) return;
    
    // Clear previous field errors
    clearFieldErrors();
    
    // Base styling
    el.className = "mt-6 rounded-2xl border px-4 py-3 text-sm whitespace-pre-line";
    el.classList.remove("hidden");
    
    // Type-specific styling - ERROR uses RED (teacher's feedback)
    if (type === "success") {
      el.classList.add("border-emerald-200", "bg-emerald-50", "text-emerald-900");
      el.textContent = "✅ " + message;
    } else if (type === "info") {
      el.classList.add("border-amber-200", "bg-amber-50", "text-amber-900");
      el.textContent = "⚠️ " + message;
    } else {
      // ERROR - RED background and border (teacher's requirement)
      el.classList.add("border-red-400", "bg-red-50", "text-red-800");
      el.style.borderLeft = "4px solid #dc3545";
      el.textContent = "❌ " + message;
      
      // Add "What to do next" for error messages
      let nextAction = "";
      const msgLower = message.toLowerCase();
      if (msgLower.includes("already exists") || msgLower.includes("duplicate")) {
        nextAction = "\n\n📋 What to do next: Please choose a different name or check the existing resources list.";
      } else if (msgLower.includes("validation") || msgLower.includes("invalid")) {
        nextAction = "\n\n📋 What to do next: Please fix the highlighted fields above and try again.";
      } else if (msgLower.includes("network") || msgLower.includes("server")) {
        nextAction = "\n\n📋 What to do next: Please check your connection and ensure the backend server is running.";
      } else {
        nextAction = "\n\n📋 What to do next: Please review your input and try again.";
      }
      el.textContent += nextAction;
    }
    
    // Add field errors if provided
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      let errorList = "\n\nPlease fix the following:\n";
      for (const [field, error] of Object.entries(fieldErrors)) {
        const friendlyName = field === 'resourceName' ? 'Resource name' : 
                            field === 'resourceDescription' ? 'Resource description' : 
                            field === 'resourcePrice' ? 'Price' : field;
        errorList += `\n• ${friendlyName}: ${error}`;
        
        // Highlight the field in RED
        const element = document.getElementById(field);
        if (element) {
          element.classList.add('field-error-red');
          let errorSpan = document.getElementById(`${field}-error`);
          if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.id = `${field}-error`;
            errorSpan.className = 'error-text-red';
            element.parentNode.insertBefore(errorSpan, element.nextSibling);
          }
          errorSpan.textContent = error;
        }
      }
      el.textContent += errorList;
    }
    
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    
    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        if (el && !el.classList.contains('hidden')) {
          el.classList.add('hidden');
        }
      }, 5000);
    }
  };
}

// From form.js - MODIFIED to stay in CREATE mode
window.onResourceActionSuccess = ({ action, data }) => {
  if (action === "create" && data === "success") {
    // DO NOT switch to edit mode - stay in create mode
    // formMode = "edit";
    // renderActionButtons(role);
    
    // Optional: Auto-clear the form for the next entry
    setTimeout(() => {
      clearResourceForm();
    }, 1000);
  }
};