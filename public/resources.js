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

// Primay editing button
let primaryActionButton = null;

// Used for clearing inputs
let clearButton = null;

// Resource name and description validation status
let resourceNameValid = false
let resourceDescriptionValid = false

// Updates from form.js
let formMode = "create";

// ===============================
// Message display function
// ===============================
function showMessage(type, text) {
    // Remove any existing message
    const existingMsg = document.querySelector('.form-message');
    if (existingMsg) existingMsg.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `form-message p-4 mb-4 rounded-lg text-sm font-semibold ${
        type === 'success' ? 'bg-green-100 text-green-700 border-l-4 border-green-600' :
        type === 'duplicate' ? 'bg-yellow-100 text-yellow-700 border-l-4 border-yellow-600' :
        type === 'validation' ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-600' :
        'bg-red-100 text-red-700 border-l-4 border-red-600'
    }`;
    msgDiv.textContent = text;
    
    const form = document.getElementById('resourceForm');
    if (form) {
        form.insertBefore(msgDiv, form.firstChild);
    }
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => msgDiv.remove(), 5000);
    }
}

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

  // Keep disabled look in ONE place (here)
  btn.classList.toggle("cursor-not-allowed", !enabled);
  btn.classList.toggle("opacity-50", !enabled);

  // Optional: remove hover feel when disabled (recommended UX)
  if (!enabled) {
    btn.classList.remove("hover:bg-brand-dark/80");
  } else {
    // Only re-add if this button is supposed to have it
    // (for Create we know it is)
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

// ==========================================
// 3) Input creation + validation + clearing
// ==========================================
function createResourceNameInput(container) {
  const input = document.createElement("input");

  // Core attributes
  input.id = "resourceName";
  input.name = "resourceName";
  input.type = "text";
  input.placeholder = "e.g., Meeting Room A";

  // Base Tailwind styling (single source of truth)
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

  // Allowed characters: A–Z, a–z, 0–9, ä ö å, space, , . - (based on your current regex)
  const allowedPattern = /^[a-zA-Z0-9äöåÄÖÅ \,\.\-]+$/;
  const lengthValid = trimmed.length >= 5 && trimmed.length <= 30;
  const charactersValid = allowedPattern.test(trimmed);
  return lengthValid && charactersValid;
}

function createResourceDescriptionArea(container) {
  const textarea = document.createElement("textarea");

  // Core attributes
  textarea.id = "resourceDescription";
  textarea.name = "resourceDescription";
  textarea.rows = 5;
  textarea.placeholder =
    "Describe location, capacity, included equipment, or any usage notes…";

  // Base Tailwind styling (single source of truth)
  textarea.className = `
    mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none
    focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30 transition-all duration-200 ease-out
  `;

  container.appendChild(textarea);
  return textarea;
}

function isResourceDescriptionValid(value) {
  const trimmed = value.trim();

  // Allowed characters: A–Z, a–z, 0–9, ä ö å, space, , . - (based on your current regex)
  const allowedPattern = /^[a-zA-Z0-9äöåÄÖÅ \,\.\-]+$/;
  const lengthValid = trimmed.length >= 10 && trimmed.length <= 50;
  const charactersValid = allowedPattern.test(trimmed);
  return lengthValid && charactersValid;
}

function setInputVisualState(input, state) {
  // Reset to neutral base state (remove only our own validation-related classes)
  input.classList.remove(
    "border-green-500",
    "bg-green-100",
    "focus:ring-green-500/30",
    "border-red-500",
    "bg-red-100",
    "focus:ring-red-500/30",
    "focus:border-brand-blue",
    "focus:ring-brand-blue/30"
  );

  // Ensure base focus style is present when neutral
  // (If we are valid/invalid, we override ring color but keep ring behavior)
  input.classList.add("focus:ring-2");

  if (state === "valid") {
    input.classList.add("border-green-500", "bg-green-100", "focus:ring-green-500/30");
  } else if (state === "invalid") {
    input.classList.add("border-red-500", "bg-red-100", "focus:ring-red-500/30");
  } else {
    // neutral: keep base border/bg; nothing else needed
  }
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

  // Real-time validation
  input.addEventListener("input", update);

  // Initialize state on page load (Create disabled until valid)
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

  // Real-time validation
  input.addEventListener("input", update);

  // Initialize state on page load (Create disabled until valid)
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
};

// ===============================
// Form submit handler
// ===============================
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        action: 'create',
        resourceName: document.getElementById('resourceName')?.value || '',
        resourceDescription: document.getElementById('resourceDescription')?.value || '',
        resourceAvailable: document.getElementById('resourceAvailable')?.checked || false,
        resourcePrice: parseFloat(document.getElementById('resourcePrice')?.value) || 0,
        resourcePriceUnit: document.querySelector('input[name="resourcePriceUnit"]:checked')?.value || 'hour'
    };
    
    // Client-side validation
    if (!formData.resourceName.trim()) {
        showMessage('validation', '⚠️ Please enter a resource name');
        return;
    }
    
    if (!formData.resourcePrice || formData.resourcePrice <= 0) {
        showMessage('validation', '⚠️ Please enter a valid price greater than 0');
        return;
    }
    
    try {
        const response = await fetch('/api/resources', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success
            if (window.onResourceActionSuccess) {
                window.onResourceActionSuccess({ action: 'create', data: 'success' });
            }
            showMessage('success', `✅ Resource "${formData.resourceName}" created successfully!`);
            setTimeout(clearResourceForm, 1000);
        } else if (response.status === 409) {
            // Duplicate
            showMessage('duplicate', `⛔ Resource "${formData.resourceName}" already exists! Please choose a different name.`);
        } else if (response.status === 400) {
            // Validation
            const fields = data.errors ? data.errors.map(e => e.field).join(', ') : 'some fields';
            showMessage('validation', `⚠️ Validation error: Please check ${fields}`);
        } else {
            // Other error
            showMessage('error', `❌ Error: ${data.error || 'Something went wrong'}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('error', '❌ Connection error. Please try again.');
    }
}

// ===============================
// 4) Bootstrapping
// ===============================
renderActionButtons(role);

// Create + validate input
const resourceNameInput = createResourceNameInput(resourceNameCnt);
attachResourceNameValidation(resourceNameInput);
const resourceDescriptionArea = createResourceDescriptionArea(resourceDescriptionCnt);
attachResourceDescriptionValidation(resourceDescriptionArea);

// From form.js
window.onResourceActionSuccess = ({ action, data }) => {
  if (action === "create" && data === "success") {
    formMode = "edit";
    renderActionButtons(role);
  }
};

// Attach form submit handler
const resourceForm = document.getElementById('resourceForm');
if (resourceForm) {
    resourceForm.addEventListener('submit', handleFormSubmit);
}