// /config/www/cards/document_upload_card.js
import "/local/base/foundation.js";
import { uiComponents } from "/local/base/components.js";
import { callService, sleep, applyThemeClass } from "/local/base/helpers.js";

class DocumentUploadCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = "idle"; // idle | uploading | success | error
  }

  set hass(hass) {
    this._hass = hass;
    applyThemeClass(this, hass);
  }

  setConfig(config) {
    this.config = config || {};
    this.render();
  }

  getCardSize() {
    return 1;
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, uiComponents];
  }

  render() {
    if (!this.shadowRoot) return;

    const title = this.config.title || "Upload document";
    const description = this.config.description || "";
    const disabled = this.state !== "idle";

    let buttonLabel = title;
    let buttonClass = "ui-btn ui-btn--accent ui-btn--filled";

    if (this.state === "uploading") {
      buttonLabel = "Uploading…";
      buttonClass = "ui-btn";
    } else if (this.state === "success") {
      buttonLabel = "Uploaded";
      buttonClass = "ui-btn";
    } else if (this.state === "error") {
      buttonLabel = "Upload failed";
      buttonClass = "ui-btn";
    }

    let statusText = "";
    let statusClass = "";
    if (this.state === "success") {
      statusText = "File uploaded to server.";
      statusClass = "status-success";
    }
    if (this.state === "error") {
      statusText = "There was a problem uploading the file.";
      statusClass = "status-error";
    }

    this.shadowRoot.innerHTML = `
      <style>
        /* Card-specific styles only - foundation handles primitives */
        .card {
          padding: var(--ui-space-4);
        }

        .title {
          font-size: var(--ui-font-l);
          font-weight: 600;
          color: var(--ui-text);
          margin: 0 0 var(--ui-space-1);
        }

        .description {
          font-size: var(--ui-font-s);
          color: var(--ui-text-mute);
          margin: 0 0 var(--ui-space-3);
        }

        .upload-button {
          width: 100%;
          position: relative;
        }

        .upload-button.is-loading {
          pointer-events: none;
        }

        /* Loading spinner when uploading */
        .upload-button.uploading::before {
          content: '';
          display: inline-block;
          width: 1em;
          height: 1em;
          margin-right: var(--ui-space-2);
          border: 2px solid var(--ui-progress-faint);
          border-top-color: var(--ui-progress);
          border-radius: 50%;
          animation: ui-spin 0.8s linear infinite;
          vertical-align: middle;
        }

        .status {
          margin-top: var(--ui-space-2);
          font-size: var(--ui-font-s);
          color: var(--ui-text-mute);
          opacity: 0;
          animation: ui-fade-in var(--ui-motion-med) forwards;
        }

        .status-success {
          color: var(--ui-success);
        }

        .status-error {
          color: var(--ui-error);
        }

        input[type="file"] {
          display: none;
        }

        @keyframes ui-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes ui-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      </style>

      <div class="ui-surface card">
        <div class="title">${title}</div>
        ${description ? `<div class="description">${description}</div>` : ""}

        <button
          id="uploadBtn"
          class="${buttonClass} upload-button ${this.state === 'uploading' ? 'uploading' : ''} ${disabled ? 'is-loading' : ''}"
        >
          ${buttonLabel}
        </button>

        <input id="fileInput" type="file" />

        ${statusText ? `<div class="status ${statusClass}">${statusText}</div>` : ""}
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const fileInput = this.shadowRoot.querySelector("#fileInput");
    const uploadBtn = this.shadowRoot.querySelector("#uploadBtn");

    if (!fileInput || !uploadBtn) return;

    uploadBtn.onclick = () => {
      if (this.state === "idle") {
        fileInput.click();
      }
    };

    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file || !this._hass) {
        fileInput.value = "";
        return;
      }

      this.state = "uploading";
      this.render();

      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const result = reader.result;
          if (typeof result !== "string") {
            throw new Error("Unexpected FileReader result");
          }

          const base64 = result.split(",").pop();
          if (!base64) {
            throw new Error("Failed to extract base64 data");
          }

          // Use helper function instead of direct hass call
          await callService(this._hass, "script", "upload_document", {
            file_data: base64,
            file_name: file.name,
          });

          this.state = "success";
          this.render();

          // Use helper sleep function
          await sleep(3000);
          this.state = "idle";
          this.render();
        } catch (err) {
          console.error("document-upload-card:", err);
          this.state = "error";
          this.render();

          await sleep(4000);
          this.state = "idle";
          this.render();
        } finally {
          fileInput.value = "";
        }
      };

      reader.onerror = async () => {
        console.error("document-upload-card: FileReader error");
        this.state = "error";
        this.render();
        fileInput.value = "";

        await sleep(4000);
        this.state = "idle";
        this.render();
      };

      reader.readAsDataURL(file);
    };
  }

  static getStubConfig() {
    return {
      title: "Upload document",
      description: "Send a file to the Home Assistant server.",
    };
  }
}

customElements.define("document-upload-card", DocumentUploadCard);
