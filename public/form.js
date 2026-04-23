// ===============================
// Form handling for resources page
// IMPROVED with teacher's feedback (RED errors + user-friendly field names)
// ===============================

// -------------- Helpers --------------
function $(id) {
  return document.getElementById(id);
}

function getFormMessageEl() {
  return document.getElementById("formMessage");
}

// NEW: Clear field errors (remove red borders)
function clearFieldErrors() {
  const fields = ['resourceName', 'resourceDescription', 'resourcePrice'];
  fields.forEach(field => {
    const element = $(field);
    if (element) {
      element.classList.remove('field-error');
    }
    const errorSpan = document.getElementById(`${field}-error`);
    if (errorSpan) errorSpan.remove();
  });
}

// NEW: Highlight a specific field with red border
function highlightFieldError(fieldId, errorMessage) {
  const element = $(fieldId);
  if (!element) return;
  
  element.classList.add('field-error');
  
  let errorSpan = document.getElementById(`${fieldId}-error`);
  if (!errorSpan) {
    errorSpan = document.createElement('span');
    errorSpan.id = `${fieldId}-error`;
    errorSpan.className = 'error-text';
    element.parentNode.insertBefore(errorSpan, element.nextSibling);
  }
  errorSpan.textContent = errorMessage;
}

// NEW: Convert technical field names to user-friendly names
function getUserFriendlyFieldName(field) {
  const fieldNames = {
    'resourceName': 'Resource name',
    'resourceDescription': 'Resource description', 
    'resourcePrice': 'Price',
    'resourcePriceUnit': 'Time unit'
  };
  return fieldNames[field] || field;
}

// Add CSS for error highlighting
function addErrorStyles() {
  if (document.getElementById('error-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'error-styles';
  style.textContent = `
    .field-error {
      border: 2px solid #dc3545 !important;
      background-color: #fff8f8 !important;
    }
    .error-text {
      color: #dc3545;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: block;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #formMessage:not(.hidden) {
      animation: slideIn 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}

/**
 * IMPROVED: Show a success/error/info message in the UI.
 * Now with RED color for errors (teacher's feedback)
 * type: "success" | "error" | "info"
 */
function showFormMessage(type, message, fieldErrors = null) {
  const el = getFormMessageEl();
  if (!el) return;

  // Clear previous field errors
  clearFieldErrors();

  // Base styling
  el.className = "mt-6 rounded-2xl border px-4 py-3 text-sm whitespace-pre-line";
  el.classList.remove("hidden");

  // Type-specific styling - ERROR now uses RED (teacher's feedback)
  if (type === "success") {
    el.classList.add("border-emerald-200", "bg-emerald-50", "text-emerald-900");
  } else if (type === "info") {
    el.classList.add("border-amber-200", "bg-amber-50", "text-amber-900");
  } else {
    // ERROR - RED background and border (teacher's requirement)
    el.classList.add("border-red-400", "bg-red-50", "text-red-800");
    el.style.borderLeft = "4px solid #dc3545";
  }

  // Add icon based on type
  let icon = "";
  if (type === "success") icon = "✅ ";
  else if (type === "error") icon = "❌ ";
  else if (type === "info") icon = "⚠️ ";
  
  el.textContent = icon + message;

  // Add field errors if provided
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    let errorList = "\n\nPlease fix the following:\n";
    for (const [field, error] of Object.entries(fieldErrors)) {
      const friendlyName = getUserFriendlyFieldName(field);
      errorList += `\n• ${friendlyName}: ${error}`;
      highlightFieldError(field, error);
    }
    el.textContent += errorList;
  }

  // NEW: Add "What to do next" for error messages (teacher's requirement)
  if (type === "error") {
    let nextAction = "";
    const msgLower = message.toLowerCase();
    if (msgLower.includes("already exists") || msgLower.includes("duplicate")) {
      nextAction = "\n\n📋 What to do next: Please choose a different name or check the existing resources list.";
    } else if (msgLower.includes("validation") || msgLower.includes("invalid values")) {
      nextAction = "\n\n📋 What to do next: Please fix the highlighted fields above and try again.";
    } else if (msgLower.includes("network") || msgLower.includes("server")) {
      nextAction = "\n\n📋 What to do next: Please check your connection and ensure the backend server is running.";
    } else {
      nextAction = "\n\n📋 What to do next: Please review your input and try again.";
    }
    el.textContent += nextAction;
  }

  // Bring message into view
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  
  // Auto-hide success messages after 5 seconds
  if (type === "success") {
    setTimeout(() => {
      if (el && !el.classList.contains('hidden')) {
        el.classList.add('hidden');
      }
    }, 5000);
  }
}

function clearFormMessage() {
  const el = getFormMessageEl();
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
  clearFieldErrors();
}

/**
 * Try to read JSON from the response.
 */
async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return { ok: false, error: "Invalid JSON response" };
    }
  }

  const text = await response.text().catch(() => "");
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: "Non-JSON response", raw: text };
  }
}

/**
 * IMPROVED: Build a clearer message for validation errors.
 * Now returns both message AND field-specific errors for highlighting
 */
function buildValidationMessage(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return {
      message: "The resource could not be created because some fields contain invalid values.\n\nPlease review the form, correct the highlighted information, and try again.",
      fieldErrors: {}
    };
  }

  const fieldErrors = {};
  const lines = errors.map((e) => {
    const field = e.field || "field";
    const msg = e.msg || "Invalid value";
    const friendlyName = getUserFriendlyFieldName(field);
    
    // Map backend field names to frontend IDs
    let frontendField = field;
    if (field === 'name') frontendField = 'resourceName';
    if (field === 'description') frontendField = 'resourceDescription';
    if (field === 'price') frontendField = 'resourcePrice';
    
    fieldErrors[frontendField] = msg;
    return `• ${friendlyName}: ${msg}`;
  });

  return {
    message: `The resource could not be created because some fields contain invalid values.\n\nPlease correct the following and try again:\n\n${lines.join("\n")}`,
    fieldErrors: fieldErrors
  };
}

/**
 * Build a readable message for generic API errors.
 */
function buildGenericErrorMessage(status, body) {
  const details = body?.details ? `\n\nDetails: ${body.details}` : "";
  const error = body?.error ? body.error : "Request failed";
  return `Server returned an error (${status}).\n\nReason: ${error}${details}`;
}

// -------------- Form wiring --------------
document.addEventListener("DOMContentLoaded", () => {
  // Add error styles
  addErrorStyles();
  
  // Create input fields if they don't exist (for your HTML structure)
  const nameContainer = document.getElementById('resourceNameCnt');
  if (nameContainer && !document.getElementById('resourceName')) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'resourceName';
    input.name = 'resourceName';
    input.placeholder = 'e.g., Conference Room A';
    input.className = 'mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30';
    input.required = true;
    nameContainer.appendChild(input);
  }
  
  const descContainer = document.getElementById('resourceDescriptionCnt');
  if (descContainer && !document.getElementById('resourceDescription')) {
    const textarea = document.createElement('textarea');
    textarea.id = 'resourceDescription';
    textarea.name = 'resourceDescription';
    textarea.placeholder = 'Describe the resource (capacity, location, features)';
    textarea.rows = 3;
    textarea.className = 'mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30';
    textarea.required = true;
    descContainer.appendChild(textarea);
  }
  
  // Create action buttons if not present
  const actionsContainer = document.getElementById('resourceActions');
  if (actionsContainer && actionsContainer.children.length === 0) {
    actionsContainer.innerHTML = `
      <button type="submit" name="action" value="create" 
        class="w-full rounded-2xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green/80">
        ➕ Create Resource
      </button>
      <button type="button" 
        class="w-full rounded-2xl bg-brand-blue px-4 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed" disabled>
        ✏️ Update Resource
      </button>
      <button type="button" 
        class="w-full rounded-2xl bg-brand-rose px-4 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed" disabled>
        🗑️ Delete Resource
      </button>
    `;
  }
  
  // Clear errors when user types
  const nameField = document.getElementById('resourceName');
  const descField = document.getElementById('resourceDescription');
  const priceField = document.getElementById('resourcePrice');
  
  if (nameField) {
    nameField.addEventListener('input', () => {
      nameField.classList.remove('field-error');
      const errSpan = document.getElementById('resourceName-error');
      if (errSpan) errSpan.remove();
    });
  }
  if (descField) {
    descField.addEventListener('input', () => {
      descField.classList.remove('field-error');
      const errSpan = document.getElementById('resourceDescription-error');
      if (errSpan) errSpan.remove();
    });
  }
  if (priceField) {
    priceField.addEventListener('input', () => {
      priceField.classList.remove('field-error');
      const errSpan = document.getElementById('resourcePrice-error');
      if (errSpan) errSpan.remove();
    });
  }
  
  const form = $("resourceForm");
  if (!form) return;
  form.addEventListener("submit", onSubmit);
});

async function onSubmit(event) {
  event.preventDefault();

  const submitter = event.submitter;
  const actionValue = submitter && submitter.value ? submitter.value : "create";

  const selectedUnit =
    document.querySelector('input[name="resourcePriceUnit"]:checked')?.value ?? "";

  const priceRaw = $("resourcePrice")?.value ?? "";
  const resourcePrice = priceRaw === "" ? 0 : Number(priceRaw);

  const payload = {
    action: actionValue,
    resourceName: $("resourceName")?.value ?? "",
    resourceDescription: $("resourceDescription")?.value ?? "",
    resourceAvailable: $("resourceAvailable")?.checked ?? false,
    resourcePrice,
    resourcePriceUnit: selectedUnit,
  };

  try {
    clearFormMessage();

    const response = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await readResponseBody(response);

    // -----------------------------------------
    // Error handling by HTTP status
    // -----------------------------------------
    if (!response.ok) {
      // 400 = server-side validation errors
      if (response.status === 400) {
        const { message, fieldErrors } = buildValidationMessage(body?.errors);
        showFormMessage("error", message, fieldErrors);
        return;
      }

      // 409 = duplicate resourceName (RED message with field highlight)
      if (response.status === 409) {
        const resourceName = payload.resourceName || "This resource";
        const message = `Resource "${resourceName}" already exists.\n\nPlease choose a different resource name or check the existing resource list before trying again.`;
        const fieldErrors = { resourceName: "This name is already taken. Please choose a different name." };
        showFormMessage("error", message, fieldErrors);
        return;
      }

      // Other errors
      showFormMessage("error", buildGenericErrorMessage(response.status, body));
      return;
    }

    // -----------------------------------------
    // Success handling (2xx)
    // -----------------------------------------
    const createdAtIso = body?.data?.created_at || "";
    const createdAt = createdAtIso
      ? createdAtIso.replace("T", " ").replace("Z", "")
      : "";

    const message = `Resource "${body?.data?.name}" was created successfully.\n\nResource ID: ${body?.data?.id}\nCreated at: ${createdAt}`;

    showFormMessage("success", message);

    // Clear form after successful creation
    const form = $("resourceForm");
    if (form) form.reset();
    clearFieldErrors();

    // Notify UI layer (resources.js)
    if (typeof window.onResourceActionSuccess === "function") {
      window.onResourceActionSuccess({
        action: actionValue,
        data: "success",
      });
    }
  } catch (err) {
    console.error("POST error:", err);
    showFormMessage(
      "error",
      "Network error: Could not reach the server. Check your environment and try again."
    );
  }
}