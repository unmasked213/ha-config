// /config/www/cards/rota_upload_card.js
import "/local/base/foundation.js";
import { uiComponents } from "/local/base/components.js";
import { callService, sleep, applyThemeClass } from "/local/base/helpers.js";

class RotaUploadCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = "idle"; // idle | uploading | processing | success | error
  }

  set hass(hass) {
    this._hass = hass;
    applyThemeClass(this, hass);
  }

  setConfig(config) {
    this.config = config;
    this.render();
  }

  getCardSize() {
    return 2;
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [window.uiFoundation, uiComponents];
  }

  render() {
    const cardStyles = `
      .card {
        padding: var(--ui-space-5);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ui-space-3);
        text-align: center;
      }

      .description {
        font-size: var(--ui-font-s);
        color: var(--ui-text-mute);
        line-height: 1.4;
        max-width: 320px;
      }

      .upload-btn {
        min-width: 200px;
      }

      .upload-btn.is-loading {
        pointer-events: none;
      }

      input[type="file"] {
        display: none;
      }
    `;

    const buttonContent = this.getButtonContent();

    this.shadowRoot.innerHTML = `
      <style>${cardStyles}</style>

      <div class="ui-surface card">
        <div class="description">
          Upload a screenshot of your rota,<br>
          shifts will appear in your calendar (takes <b>1–2 minutes</b>).
        </div>

        <input type="file" id="fileInput" accept="image/*">

        <button
          id="uploadBtn"
          class="ui-btn ui-btn--accent ${this.state === 'idle' ? 'ui-btn--filled' : ''} upload-btn ${this.state !== 'idle' ? 'is-loading' : ''}"
        >
          ${buttonContent}
        </button>
      </div>
    `;

    this.attachEvents();
  }

  getButtonContent() {
    switch (this.state) {
      case "processing":
      case "uploading":
        return `<ha-icon icon="svg-spinners:3-dots-move" class="ui-spinner"></ha-icon>`;
      case "success":
        return "Done";
      case "error":
        return "Failed";
      default:
        return "Upload Rota";
    }
  }

  attachEvents() {
    const fileInput = this.shadowRoot.querySelector("#fileInput");
    const uploadBtn = this.shadowRoot.querySelector("#uploadBtn");

    uploadBtn.onclick = () => {
      if (this.state === "idle") fileInput.click();
    };

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.state = "uploading";
      this.render();

      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const base64 = await this.resizeImage(event.target.result, 1600, 0.7);

          await callService(this._hass, "pyscript", "save_rota_image", {
            file_data: base64,
            file_name: "current_rota.jpeg"
          });

          this.state = "processing";
          this.render();

          await callService(this._hass, "script", "extract_shifts_enhy");

          this.state = "success";
          this.render();

          await sleep(3000);
          this.state = "idle";
          this.render();

        } catch (err) {
          console.error("rota-upload-card:", err);
          this.state = "error";
          this.render();

          await sleep(4000);
          this.state = "idle";
          this.render();
        }
      };

      reader.onerror = async () => {
        console.error("rota-upload-card: FileReader error");
        this.state = "error";
        this.render();

        await sleep(4000);
        this.state = "idle";
        this.render();
      };

      reader.readAsDataURL(file);
    };
  }
  resizeImage(dataUrl, maxDim, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
      };
      img.src = dataUrl;
    });
  }
}

customElements.define("rota-upload-card", RotaUploadCard);
