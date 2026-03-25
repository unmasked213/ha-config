// my-chat-bubble-card.js
class MyChatBubbleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._initialized = false;
    this._lastState = null;
    this._lastInputSelect = null;
    this._lastTranslatorState = null;
    this._lastReplyOption1 = null;
    this._lastReplyOption2 = null;
    this._lastReplyOption3 = null;
    this._lastGeneratingReplies = null;
    this._lastChatContent = null;
    this._hass = null;
    this._messageText = "";
    this._contactMenuOpen = false;
    this._contactOptions = [];
    this._translatorOn = false;
    this._selectedContact = null;
    this._currentEntityState = null;
    this._replyOption1 = "";
    this._replyOption2 = "";
    this._replyOption3 = "";
    this._generatingReplies = false;
    this._isExpanded = false;
    this._suggestionsExpanded = false;
    this._contactUnreadMap = {};
    this._selectedSuggestion = null;
    this._fabMenuOpen = false;

    let seenMessages = [];
    try {
      if (window.localStorage) {
        seenMessages = JSON.parse(localStorage.getItem("seenMessages") || "[]");
      }
    } catch (e) {
      console.warn("Could not access or parse localStorage.seenMessages:", e);
    }
    this._seenMessages = new Set(seenMessages);
    this._resizeObserver = new ResizeObserver(() => this._scrollToBottom());
  }

  connectedCallback() {
    requestAnimationFrame(() => {
      const card = this.shadowRoot.querySelector("ha-card");
      if (card) {
        this._resizeObserver.observe(card);
      }
    });
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    if (this._outsideClickHandler && this._outsideClickHandlerAttached) {
      window.removeEventListener("click", this._outsideClickHandler);
      this._outsideClickHandlerAttached = false;
    }
  }

  static getConfigElement() {
    return null;
  }

  static getStubConfig() {
    return {
      input_select: "input_select.whatsapp_contacts",
      entity_map: {
        Enhy: "sensor.chat_history_enhy",
        Dad: "sensor.chat_history_dad",
        Ben: "sensor.chat_history_ben",
        Ange: "sensor.chat_history_ange",
      },
      contact_colors: {
        Enhy: {
          bubbleColor:
            "var(--primary-color)",
          textColor:
            "var(--primary-text-color, var(--text-primary-color, #ffffff))",
          timestampColor:
            "var(--secondary-text-color, var(--disabled-text-color, rgba(115,115,115,0.8)))",
        },
        Dad: {
          bubbleColor: "rgba(224, 145, 50, 0.85)",
          textColor:
            "var(--primary-text-color, var(--text-primary-color, #ffffff))",
          timestampColor: "rgba(224, 145, 50, 0.6)",
        },
        Ben: {
          bubbleColor: "rgba(210,70,90,0.85)",
          textColor:
            "var(--primary-text-color, var(--text-primary-color, #ffffff))",
          timestampColor: "rgba(210,70,90,0.6)",
        },
        Ange: {
          bubbleColor: "rgba(100,160,100,0.85)",
          textColor:
            "var(--primary-text-color, var(--text-primary-color, #ffffff))",
          timestampColor: "rgba(100,160,100,0.6)",
        },
      },
      alignment: "left",
      sentColor:
        "var(--primary-background-color, var(--secondary-background-color, #f5f5f5))",
      sentTextColor:
        "var(--primary-text-color, var(--text-primary-color, #212121))",
      sentTimestampColor:
        "var(--secondary-text-color, var(--disabled-text-color, rgba(115,115,115,0.8)))",
      quotedBackgroundColor:
        "var(--divider-color, var(--secondary-background-color, rgba(0,0,0,0.1)))",
      quotedTextColor:
        "var(--secondary-text-color, var(--disabled-text-color, #757575))",
      accentColor: "var(--primary-color)",
      message_entity: "input_text.whatsapp_c_message_to_send",
      translator_entity: "input_boolean.whatsapp_c_message_translator",
    };
  }

  setConfig(config) {
    if (!config.input_select) {
      throw new Error("Please define an input_select entity.");
    }
    if (!config.entity_map) {
      throw new Error("Please define entity_map mapping contacts to sensors.");
    }

    this._config = {
      alignment: "left",
      sentColor:
        "var(--primary-background-color, var(--secondary-background-color, #f5f5f5))",
      sentTextColor:
        "var(--primary-text-color, var(--text-primary-color, #212121))",
      sentTimestampColor:
        "var(--secondary-text-color, var(--disabled-text-color, rgba(115,115,115,0.8)))",
      quotedBackgroundColor:
        "var(--divider-color, var(--secondary-background-color, rgba(0,0,0,0.1)))",
      quotedTextColor:
        "var(--secondary-text-color, var(--disabled-text-color, #757575))",
      accentColor: "var(--primary-color)",
      contact_colors: {},
      message_entity: "input_text.whatsapp_c_message_to_send",
      translator_entity: "input_boolean.whatsapp_c_message_translator",
      ...config,
    };

    this._initialized = false;
  }

  set hass(hass) {
    if (!hass || !this._config?.input_select) return;
    this._hass = hass;

    const inputSelectState = hass.states[this._config.input_select];
    if (!inputSelectState) {
      console.warn(`Invalid input select entity: ${this._config.input_select}`);
      return;
    }
    const selectedContact = inputSelectState.state;
    this._selectedContact = selectedContact;
    this._contactOptions = Array.isArray(inputSelectState.attributes?.options)
      ? inputSelectState.attributes.options
      : [];

    const entityId = this._config.entity_map[selectedContact];
    if (!entityId) {
      console.warn(`No entity mapping for contact: ${selectedContact}`);
      return;
    }

    const stateObj = hass.states[entityId];
    if (!stateObj?.attributes?.chat_content) {
      console.warn(`Invalid state data for ${entityId}`);
      return;
    }

    const translatorEntityId = this._config.translator_entity;
    if (translatorEntityId && hass.states[translatorEntityId]) {
      const translatorState = hass.states[translatorEntityId].state;
      this._translatorOn = translatorState === "on";
    }

    // Track AI reply suggestions
    if (hass.states["input_text.whatsapp_reply_option_1"]) {
      this._replyOption1 = hass.states["input_text.whatsapp_reply_option_1"].state || "";
    }
    if (hass.states["input_text.whatsapp_reply_option_2"]) {
      this._replyOption2 = hass.states["input_text.whatsapp_reply_option_2"].state || "";
    }
    if (hass.states["input_text.whatsapp_reply_option_3"]) {
      this._replyOption3 = hass.states["input_text.whatsapp_reply_option_3"].state || "";
    }
    const wasGenerating = this._generatingReplies;
    if (hass.states["input_boolean.whatsapp_generating_replies"]) {
      this._generatingReplies = hass.states["input_boolean.whatsapp_generating_replies"].state === "on";
    }

    // Auto-expand suggestions when AI finishes generating
    if (wasGenerating && !this._generatingReplies && (this._replyOption1 || this._replyOption2 || this._replyOption3)) {
      this._suggestionsExpanded = true;
    }

    // Track unread status for each contact
    const contactsConfigEntity = hass.states["sensor.whatsapp_contacts_config"];
    if (contactsConfigEntity?.attributes?.contacts_by_name) {
      try {
        const contactsData = JSON.parse(contactsConfigEntity.attributes.contacts_by_name);
        this._contactUnreadMap = {};
        for (const [name, contact] of Object.entries(contactsData)) {
          if (contact.unread_boolean && hass.states[contact.unread_boolean]) {
            this._contactUnreadMap[name] = hass.states[contact.unread_boolean].state === "on";
          }
        }
      } catch (e) {
        console.warn("Failed to parse contacts config:", e);
      }
    }

    const currentChatContent = stateObj.attributes?.chat_content || "";

    const shouldRender =
      !this._initialized ||
      this._lastInputSelect !== selectedContact ||
      this._lastState !== stateObj.state ||
      this._lastChatContent !== currentChatContent ||
      this._lastTranslatorState !== this._translatorOn ||
      this._lastReplyOption1 !== this._replyOption1 ||
      this._lastReplyOption2 !== this._replyOption2 ||
      this._lastReplyOption3 !== this._replyOption3 ||
      this._lastGeneratingReplies !== this._generatingReplies;

    if (shouldRender) {
      this._lastState = stateObj.state;
      this._lastChatContent = currentChatContent;
      this._lastInputSelect = selectedContact;
      this._lastTranslatorState = this._translatorOn;
      this._lastReplyOption1 = this._replyOption1;
      this._lastReplyOption2 = this._replyOption2;
      this._lastReplyOption3 = this._replyOption3;
      this._lastGeneratingReplies = this._generatingReplies;
      this._initialized = true;
      this._currentEntityState = stateObj;
      this._render(stateObj);
    }
  }

  _render(entityState) {
    try {
      if (!this.shadowRoot) return;

      // preserve input focus and cursor position
      let hadInputFocus = false;
      let cursorPosition = null;
      const existingInput =
        this.shadowRoot.querySelector(".wa-input-field") || null;
      if (
        existingInput &&
        this.shadowRoot.activeElement === existingInput &&
        typeof existingInput.selectionStart === "number"
      ) {
        hadInputFocus = true;
        cursorPosition = existingInput.selectionStart;
      }

      const rawChat = entityState.attributes.chat_content || "";
      const lines = rawChat
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .slice(-100);

      const messages = lines.map((line) => {
        const match = line.match(
          /^(\d{1,2}:\d{2}(?::\d{2})?(?:\s?(?:AM|PM)?)?)\s+(.*)/i
        );
        const timestamp = match ? match[1] : "";
        const rawMsg = match ? match[2] : line;
        const isMe = rawMsg.includes("Me:");

        let text = rawMsg
          .replace(/^(-?\s*)?Me:\s*/i, "")
          .replace(/^(-?\s*)?[^:]+:\s*/, "")
          .trim();

        let quotedText = null;
        const quotedMatch = rawMsg.match(/\(Quoted:\s*(.*?)\)/);
        if (quotedMatch) {
          quotedText = quotedMatch[1].trim();
          // Remove the entire quoted portion from the text
          text = text.replace(/\(Quoted:\s*.*?\)/, "").trim();
          // Only set text to empty if it's actually empty after removing quoted text
          // Don't hide the text just because it contains or matches the quoted text
        }

        return { text, timestamp, isMe, quotedText };
      });

      const grouped = this._groupMessages(messages);

      const hasContactUnread = this._contactUnreadMap[this._selectedContact] || false;

      const bubblesHTML = grouped
        .map((group, index) => {
          const isNewest = index === grouped.length - 1;
          const messageId = `${this._selectedContact}-${group.isMe}-${group.lines
            .map((l) => l.text)
            .join("-")}`;
          const isNewMessage = isNewest && !this._seenMessages.has(messageId);

          // Check if this is an unread message from the contact (not from "Me")
          const isUnreadFromContact = hasContactUnread && !group.isMe;

          if (isNewMessage) {
            this._seenMessages.add(messageId);
            try {
              if (window.localStorage) {
                localStorage.setItem(
                  "seenMessages",
                  JSON.stringify(Array.from(this._seenMessages))
                );
              }
            } catch (e) {
              console.warn(
                "Could not save seenMessages to localStorage:",
                e
              );
            }
          }
          return this._renderGroup(group, isNewMessage, isUnreadFromContact);
        })
        .join("");

      const accentColor =
        this._config.accentColor ||
        "var(--primary-color)";
      const hasValueClass =
        this._messageText && this._messageText.trim().length > 0
          ? "has-value"
          : "";
      const translatorActiveClass = this._translatorOn
        ? "translator-active"
        : "";
      const selectedContact = this._selectedContact || "";
      const contactInitial =
        typeof selectedContact === "string" && selectedContact.length > 0
          ? this._escapeHTML(selectedContact[0].toUpperCase())
          : "?";
      const labelText = selectedContact
        ? `Message ${selectedContact}…`
        : "Type a message…";

      const contactMenuHTML = Array.isArray(this._contactOptions)
        ? this._contactOptions
            .map((opt) => {
              const safeOpt = this._escapeHTML(opt);
              const isSelected = opt === selectedContact;
              const hasUnread = this._contactUnreadMap[opt] || false;
              const unreadDot = hasUnread ? `<span class="unread-dot"></span>` : "";
              return `
                <div class="wa-contact-menu-item ${
                  isSelected ? "selected" : ""
                }" data-contact="${safeOpt}">
                  <span class="contact-name">${safeOpt}</span>
                  ${unreadDot}
                </div>
              `;
            })
            .join("")
        : "";

      const contactMenuClass = this._contactMenuOpen ? "open" : "";

      // Get unread count from Home Assistant entity
      const unreadCountEntity = this._hass.states["input_number.whatsapp_c_unread_count"];
      const unreadCount = unreadCountEntity ? parseInt(unreadCountEntity.state) : 0;

      // Prepare badge content and visibility
      const showBadge = !this._isExpanded && unreadCount > 0;
      let badgeContent = "";
      if (showBadge) {
        if (unreadCount > 999) {
          badgeContent = "999+";
        } else {
          badgeContent = unreadCount.toString();
        }
      }

      // Choose icon based on unread status
      const chatIcon = showBadge ? "fluent:chat-warning-24-filled" : "fluent:chat-empty-24-regular";

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
          }

          .chat-widget-container {
            position: relative;
          }

          .chat-toggle-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease, background 0.3s ease;
            position: absolute;
            bottom: 0;
            right: 0;
            opacity: 1;
            pointer-events: auto;
            padding: 0;
          }

          .chat-toggle-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
            background: color-mix(in srgb, var(--primary-text-color) 14%, transparent);
          }

          .chat-toggle-button:active {
            transform: scale(1.05);
          }

          .chat-toggle-button ha-icon {
            width: 32px;
            height: 32px;
            color: var(--primary-text-color);
            display: block;
          }

          .chat-toggle-button.hidden {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.5);
          }

          .chat-toggle-button.has-unread {
            background: var(--warning-color, #ff9800);
            animation: buttonPulseAttention 2s ease-in-out infinite;
          }

          .chat-toggle-button.has-unread ha-icon {
            color: white;
          }

          .chat-toggle-button.has-unread:hover {
            background: color-mix(in srgb, var(--warning-color, #ff9800) 85%, black);
          }

          @keyframes buttonPulseAttention {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 6px 20px rgba(255, 152, 0, 0.6), 0 0 0 0 rgba(255, 152, 0, 0.4);
            }
          }

          .unread-badge {
            position: absolute;
            top: -2px;
            right: -2px;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            border-radius: 10px;
            background: var(--primary-color);
            color: var(--text-primary-color, #ffffff);
            font-family: var(--ha-font-family-body);
            font-size: 0.7em;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            border: 2px solid var(--card-background-color, var(--secondary-background-color, #1e1e1e));
            animation: badgeIntro 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) both, badgePulse 2s ease-in-out 0.5s infinite;
            z-index: 1;
          }

          @keyframes badgeIntro {
            0% {
              opacity: 0;
              transform: scale(0);
            }
            60% {
              transform: scale(1.2);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes badgePulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            }
            50% {
              transform: scale(1.08);
              box-shadow: 0 3px 12px rgba(219, 68, 55, 0.6);
            }
          }

          ha-card {
            background: var(--ha-card-background, var(--card-background-color, var(--secondary-background-color)));
            padding: 16px;
            box-sizing: border-box;
            width: 420px;
            max-width: calc(100vw - 40px);
            max-height: calc(100vh - 100px);
            display: flex;
            flex-direction: column;
            position: absolute;
            bottom: 0;
            right: 0;
            opacity: 0;
            transform: scale(0.8) translateY(20px);
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s ease;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            border-radius: 20px;
            overflow: hidden;
          }

          ha-card.expanded {
            opacity: 1;
            transform: scale(1) translateY(0);
            pointer-events: auto;
          }

          .chat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
            padding: 10px 14px;
            background: rgba(0, 0, 0, 0.15);
            border-radius: 14px;
            min-height: 48px;
          }

          .chat-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
            min-width: 0;
          }

          .chat-header-avatar {
            width: 36px;
            height: 36px;
            min-width: 36px;
            border-radius: 50%;
            background: var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: var(--ha-font-family-body);
            font-size: 1.1em;
            font-weight: 600;
            color: white;
          }

          .chat-header-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .chat-header-title {
            font-family: var(--ha-font-family-body);
            font-size: 1em;
            font-weight: 600;
            color: var(--primary-text-color);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .chat-header-status {
            font-family: var(--ha-font-family-body);
            font-size: 0.75em;
            color: var(--secondary-text-color);
            opacity: 0.8;
          }

          .chat-minimize-button {
            width: 36px;
            height: 36px;
            min-width: 36px;
            border-radius: 50%;
            border: none;
            background: rgba(0, 0, 0, 0.2);
            color: var(--primary-text-color);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s ease, transform 0.2s ease;
          }

          .chat-minimize-button:hover {
            background: rgba(0, 0, 0, 0.3);
            transform: scale(1.1);
          }

          .chat-minimize-button:active {
            transform: scale(1.05);
          }

          .chat-minimize-button ha-icon {
            width: 20px;
            height: 20px;
          }

          .wa-suggestions-container {
            margin-top: 10px;
            border-radius: 16px;
            background: rgba(0, 0, 0, 0.2);
            overflow: hidden;
            max-height: 0;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .wa-suggestions-container.visible {
            max-height: 350px;
            opacity: 1;
            pointer-events: auto;
          }

          .wa-suggestions-header {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
            padding: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .wa-close-suggestions {
            width: 36px;
            height: 36px;
            min-width: 36px;
            border-radius: 50%;
            border: none;
            padding: 0;
            margin: 0;
            background: rgba(0, 0, 0, 0.2);
            color: var(--primary-text-color);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.2s ease-out;
          }

          .wa-close-suggestions:hover {
            background: rgba(0, 0, 0, 0.35);
            transform: scale(1.1);
          }

          .wa-close-suggestions:active {
            transform: scale(1);
          }

          .wa-close-suggestions ha-icon {
            width: 20px;
            height: 20px;
          }

          .wa-suggestions-cards {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 8px;
            max-height: 350px;
            overflow-y: auto;
          }

          .wa-suggestions-cards::-webkit-scrollbar {
            width: 6px;
          }

          .wa-suggestions-cards::-webkit-scrollbar-track {
            background: transparent;
          }

          .wa-suggestions-cards::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
          }

          .wa-suggestions-cards::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }

          .wa-suggestion-card {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 10px 12px;
            background: rgba(0, 0, 0, 0.25);
            border: 2px solid transparent;
            border-radius: 12px;
            color: var(--primary-text-color);
            font-family: var(--ha-font-family-body);
            font-size: 0.9em;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          }

          .wa-suggestion-card:hover {
            background: rgba(0, 0, 0, 0.35);
            border-color: var(--primary-color);
            transform: translateX(4px);
          }

          .wa-suggestion-card.selected {
            background: rgba(0, 0, 0, 0.4);
            border-color: var(--primary-color);
            transform: translateX(4px);
          }

          .suggestion-content {
            display: flex;
            align-items: center;
            width: 100%;
          }

          .suggestion-preview {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .suggestion-full {
            display: none;
            flex: 1;
            white-space: normal;
            word-break: break-word;
            line-height: 1.4;
          }

          /* Only show full text when a card is selected */
          .wa-suggestion-card.selected .suggestion-preview {
            display: none;
          }

          .wa-suggestion-card.selected .suggestion-full {
            display: block;
          }

          .suggestion-send-btn {
            align-self: flex-end;
            padding: 8px 20px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 20px;
            font-family: var(--ha-font-family-body);
            font-size: 0.9em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            animation: slideIn 0.3s ease-out;
          }

          .suggestion-send-btn:hover {
            background: color-mix(in srgb, var(--primary-color) 85%, black);
            transform: scale(1.05);
          }

          .suggestion-send-btn:active {
            transform: scale(1);
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

          .wa-suggestions-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 20px;
            text-align: center;
            color: var(--secondary-text-color);
            font-family: var(--ha-font-family-body);
            font-size: 0.85em;
            opacity: 0.7;
          }

          .wa-suggestions-empty ha-icon {
            width: 32px;
            height: 32px;
            color: var(--primary-color);
            opacity: 0.6;
          }

          .wa-fab-menu {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }

          .wa-fab-main {
            width: var(--wa-height);
            height: var(--wa-height);
            min-width: var(--wa-height);
            border-radius: 50%;
            border: none;
            padding: 0;
            margin: 0;
            background: rgba(0, 0, 0, 0.2);
            color: var(--primary-text-color);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 2;
          }

          .wa-fab-main:hover {
            background: rgba(0, 0, 0, 0.35);
            transform: scale(1.1);
          }

          .wa-fab-main.open {
            background: var(--primary-color);
            color: white;
            transform: rotate(45deg);
          }

          .wa-fab-main.open:hover {
            transform: rotate(45deg) scale(1.1);
          }

          .wa-fab-main ha-icon {
            width: 24px;
            height: 24px;
            transition: transform 0.3s ease;
          }

          .wa-fab-action {
            width: var(--wa-height);
            height: var(--wa-height);
            min-width: var(--wa-height);
            border-radius: 50%;
            border: none;
            padding: 0;
            margin: 0;
            background: var(--primary-color);
            color: white;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            position: absolute;
            bottom: 0;
            opacity: 0;
            pointer-events: none;
            transform: translateY(0) scale(0);
          }

          .wa-fab-menu.open .wa-fab-action:nth-child(1) {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(-70px) scale(1);
            transition-delay: 0.05s;
          }

          .wa-fab-menu.open .wa-fab-action:nth-child(2) {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(-140px) scale(1);
            transition-delay: 0.1s;
          }

          .wa-fab-action:hover {
            background: color-mix(in srgb, var(--primary-color) 85%, black);
            transform: translateY(-70px) scale(1.1);
          }

          .wa-fab-menu.open .wa-fab-action:nth-child(2):hover {
            transform: translateY(-140px) scale(1.1);
          }

          .wa-fab-action ha-icon {
            width: 24px;
            height: 24px;
          }

          .wa-refresh-suggestions {
            width: 40px;
            height: 40px;
            min-width: 40px;
            border-radius: 50%;
            border: none;
            padding: 0;
            margin: 0;
            background: rgba(0, 0, 0, 0.2);
            color: var(--primary-text-color);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: none;
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.2s ease-out;
          }

          .wa-refresh-suggestions:hover {
            transform: translateY(-1px);
          }

          .wa-refresh-suggestions:active {
            transform: translateY(0);
          }

          .wa-refresh-suggestions.loading {
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .wa-input-bar {
            --wa-height: 50px;
            display: flex;
            align-items: center;
            position: relative;
            height: var(--wa-height);
            margin-top: 10px;
          }

          .wa-input-region {
            position: absolute;
            left: 0;
            top: 0;
            height: var(--wa-height);
            width: calc(100% - 190px);
            display: flex;
            align-items: center;
          }

          .wa-input-pill {
            position: relative;
            width: 100%;
            height: var(--wa-height);
            border-radius: var(--wa-height);
            border: 3px solid transparent;
            background: rgba(0, 0, 0, 0.2);
            box-sizing: border-box;
            display: flex;
            align-items: center;
            transition: border-color 0.3s ease-in-out;
            overflow: hidden;
          }

          .wa-input-pill:focus-within {
            border-color: var(--primary-color);
          }

          .wa-input-label {
            position: absolute;
            left: 18px;
            right: 18px;
            height: calc(var(--wa-height) + 10px);
            line-height: calc(var(--wa-height) + 6px);
            border-radius: var(--wa-height);
            background: transparent;
            font-family: var(--ha-font-family-body);
            font-size: 0.95em;
            font-weight: 400;
            letter-spacing: 1px;
            color: var(--secondary-text-color);
            opacity: 0.3;
            pointer-events: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: color 0.3s ease-in-out, opacity 0.3s ease-in-out,
              transform 0.3s ease-in-out;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          .wa-input-pill.has-value .wa-input-label,
          .wa-input-pill:focus-within .wa-input-label {
            opacity: 0;
            transform: translateY(-2px);
          }

          .wa-input-field {
            position: relative;
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            padding: 5px 18px;
            font-family: var(--ha-font-family-body);
            font-size: 0.95em;
            font-weight: 400;
            letter-spacing: 1px;
            color: var(--primary-text-color);
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            z-index: 1;
          }

          .wa-input-field::placeholder {
            color: transparent;
          }

          .wa-button-group {
            position: absolute;
            right: 0;
            top: 0;
            height: var(--wa-height);
            width: 180px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
          }

          .wa-circle-button,
          .wa-contact-button {
            width: var(--wa-height);
            height: var(--wa-height);
            min-width: var(--wa-height);
            max-width: var(--wa-height);
            border-radius: 50%;
            border: none;
            padding: 0;
            margin: 0;
            background: rgba(0, 0, 0, 0.2);
            color: var(--primary-text-color);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: none;
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.2s ease-out;
          }

          .wa-circle-button:hover,
          .wa-contact-button:hover {
            transform: translateY(-1px);
          }

          .wa-circle-button:active,
          .wa-contact-button:active {
            transform: translateY(0);
          }

          .wa-circle-button ha-icon {
            width: 24px;
            height: 24px;
          }

          .wa-contact-wrapper {
            position: relative;
          }

          .wa-contact-button {
            font-weight: 500;
            font-size: 1em;
            border: 3px solid transparent;
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.2s ease-out;
          }

          .wa-contact-button.menu-open {
            border-color: var(--primary-color);
          }

          .wa-contact-initial {
            font-family: var(--ha-font-family-body);
            font-size: 1.1em;
            font-weight: 600;
            letter-spacing: 0.05em;
          }

          .wa-contact-menu {
            position: absolute;
            bottom: calc(100% + 4px);
            right: 0;
            min-width: 160px;
            max-width: 220px;
            max-height: 260px;
            background: var(--card-background-color, rgba(25, 25, 25, 0.96));
            border-radius: var(--ha-card-border-radius, 12px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
            overflow-y: auto;
            overflow-x: hidden;
            padding: 8px 0;
            opacity: 0;
            pointer-events: none;
            transform: translateY(4px);
            transition: opacity 0.3s ease-out, transform 0.3s ease-out;
            z-index: 10;
          }

          .wa-contact-menu.open {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
          }

          .wa-contact-menu-item {
            padding: 10px 14px;
            margin: 4px 8px;
            font-family: var(--ha-font-family-body);
            font-size: 0.95em;
            color: var(--primary-text-color);
            cursor: pointer;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            border-radius: var(--ha-card-border-radius, 8px);
            background: transparent;
            transition: background-color 0.3s ease, color 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .wa-contact-menu-item:hover {
            background: color-mix(in srgb, var(--primary-color) 20%, transparent);
          }

          .wa-contact-menu-item.selected {
            background: var(--primary-color);
            color: black;
          }

          .contact-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .unread-dot {
            width: 8px;
            height: 8px;
            min-width: 8px;
            border-radius: 50%;
            background: var(--primary-color);
            box-shadow: 0 0 8px var(--primary-color);
            animation: unreadDotPulse 2s ease-in-out infinite;
          }

          .wa-contact-menu-item.selected .unread-dot {
            background: black;
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
          }

          @keyframes unreadDotPulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.2);
            }
          }

          .wa-circle-button.translator-button.${translatorActiveClass} {
            background: var(--primary-color);
            color: var(--primary-text-color);
          }

          .chat-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 300px;
            min-height: 150px;
            overflow-y: auto;
            overflow-x: hidden;
            user-select: text;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
            padding-right: 4px;
          }

          .chat-container::-webkit-scrollbar {
            width: 6px;
          }

          .chat-container::-webkit-scrollbar-track {
            background: transparent;
          }

          .chat-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
          }

          .chat-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }

          .bubble-row {
            display: flex;
            margin: 4px 0;
          }

          .bubble-left {
            animation: slideFromLeft 0.3s ease-out both;
          }

          .bubble-right {
            animation: slideFromRight 0.3s ease-out both;
          }

          @keyframes slideFromLeft {
            0% { opacity: 0; transform: translateX(-20px); }
            100% { opacity: 1; transform: translateX(0); }
          }

          @keyframes slideFromRight {
            0% { opacity: 0; transform: translateX(20px); }
            100% { opacity: 1; transform: translateX(0); }
          }

          .bubble-left .bubble-shape,
          .bubble-right .bubble-shape {
            padding: 10px 16px;
            box-shadow: none;
            max-width: 70%;
            filter: url("#goo-filter");
            position: relative;
            overflow: hidden;
          }

          .bubble-left .bubble-shape {
            background-color: ${
              this._config.contact_colors[this._lastInputSelect]?.bubbleColor ||
              "var(--primary-color)"
            };
            color: ${
              this._config.contact_colors[this._lastInputSelect]?.textColor ||
              "var(--primary-text-color, var(--text-primary-color, #ffffff))"
            };
            margin-right: auto;
            border-radius: 19px 19px 19px 3px;
          }

          .bubble-right .bubble-shape {
            background-color: ${
              this._config.sentColor ||
              "var(--primary-background-color, var(--secondary-background-color, #f5f5f5))"
            };
            color: ${
              this._config.sentTextColor ||
              "var(--primary-text-color, var(--text-primary-color, #212121))"
            };
            margin-left: auto;
            border-radius: 19px 19px 3px 19px;
          }

          .bubble-text {
            font-size: 1rem;
            line-height: 1.4;
            word-wrap: break-word;
            position: relative;
            z-index: 2;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          .message-main {
            display: inline-block;
          }

          .timestamp {
            font-size: 0.65em;
            padding-top: 4px;
            opacity: 0.8;
          }

          .bubble-left .timestamp {
            text-align: left;
            color: ${
              this._config.contact_colors[this._lastInputSelect]
                ?.timestampColor ||
              "var(--secondary-text-color, var(--disabled-text-color, rgba(115,115,115,0.8)))"
            };
          }

          .bubble-right .timestamp {
            text-align: right;
            color: ${
              this._config.sentTimestampColor ||
              "var(--secondary-text-color, var(--disabled-text-color, rgba(115,115,115,0.8)))"
            };
          }

          .quoted-message {
            background-color: ${
              this._config.quotedBackgroundColor ||
              "var(--divider-color, var(--secondary-background-color, rgba(0,0,0,0.1)))"
            };
            color: ${
              this._config.quotedTextColor ||
              "var(--secondary-text-color, var(--disabled-text-color, #757575))"
            };
            padding: 8px 12px;
            margin: 6px 0;
            border-left: 3px solid var(--success-color);
            border-radius: 4px 18px 18px 4px;
            box-shadow: inset 0 0 0.5px rgba(0,0,0,0.35);
            line-height: 1.4;
            font-style: oblique;
            font-size: 0.65rem;
            font-weight: 400;
            opacity: 0.6;
          }

          .new-message .bubble-shape {
            border: 3px solid var(--primary-color);
            animation: bubble_popup 0.3s 1s both, fadeBorder 3s 1s forwards;
          }

          .unread-message .bubble-shape {
            box-shadow: 0 0 0 2px var(--primary-color), 0 0 12px rgba(var(--primary-color-rgb, 80, 110, 172), 0.4);
            animation: unreadGlow 2s ease-in-out infinite;
          }

          @keyframes unreadGlow {
            0%, 100% {
              box-shadow: 0 0 0 2px var(--primary-color), 0 0 12px rgba(var(--primary-color-rgb, 80, 110, 172), 0.4);
            }
            50% {
              box-shadow: 0 0 0 2px var(--primary-color), 0 0 20px rgba(var(--primary-color-rgb, 80, 110, 172), 0.6);
            }
          }

          .glass-effect {
            background: linear-gradient(0deg, transparent, #fff, transparent);
            position: absolute;
            width: 150%;
            height: 150%;
            opacity: 0;
            transform: translate(-200px, -200px) rotate(-45deg);
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 1;
          }

          .new-message .glass-effect {
            animation: glass_slide 1.5s 1.4s forwards;
          }

          @keyframes glass_slide {
            0% {
              opacity: 0.35;
              transform: translate(-200px, -200px) rotate(-45deg);
            }
            100% {
              opacity: 0.35;
              transform: translate(200px, 200px) rotate(-45deg);
            }
          }

          @keyframes bubble_popup {
            0%   { transform: scale(.2); opacity: 0; }
            45%  { transform: scale(1.1); opacity: 1; }
            80%  { transform: scale(.95); }
            100% { transform: scale(1); }
          }

          @keyframes fadeBorder {
            0%   { border-color: var(--primary-color); }
            75%  { border-color: var(--primary-color); }
            100% { border-color: transparent; }
          }
        </style>
        <div class="chat-widget-container">
          <button class="chat-toggle-button ${this._isExpanded ? 'hidden' : ''} ${showBadge ? 'has-unread' : ''}" aria-label="Open chat">
            <ha-icon icon="${chatIcon}"></ha-icon>
            ${showBadge ? `<span class="unread-badge">${badgeContent}</span>` : ''}
          </button>
          <ha-card class="${this._isExpanded ? 'expanded' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="position: absolute; width: 0; height: 0;">
              <defs>
                <filter id="goo-filter">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
                </filter>
              </defs>
            </svg>
            <div class="chat-header">
              <div class="chat-header-left">
                <div class="chat-header-avatar">${contactInitial}</div>
                <div class="chat-header-info">
                  <div class="chat-header-title">${this._escapeHTML(selectedContact || 'Chat')}</div>
                  <div class="chat-header-status">WhatsApp</div>
                </div>
              </div>
              <button class="chat-minimize-button" aria-label="Minimize chat">
                <ha-icon icon="mdi:chevron-down"></ha-icon>
              </button>
            </div>
            <div class="chat-container" role="log" aria-label="Chat messages">
            ${
              bubblesHTML
                ? bubblesHTML
                : "<p>No chat content available</p>"
            }
          </div>
          ${this._renderSuggestionsBar()}
          <div class="wa-input-bar" role="group" aria-label="WhatsApp message input">
            <div class="wa-input-region">
              <div class="wa-input-pill ${hasValueClass}">
                <label class="wa-input-label">${this._escapeHTML(
                  labelText
                )}</label>
                <input
                  type="text"
                  class="wa-input-field"
                  value="${this._escapeHTML(this._messageText || "")}"
                  autocomplete="off"
                  spellcheck="true"
                />
              </div>
            </div>
            <div class="wa-button-group">
              <div class="wa-fab-menu ${this._fabMenuOpen ? 'open' : ''}">
                <button class="wa-fab-action wa-send-button" title="Send message" aria-label="Send message">
                  <ha-icon icon="mdi:send"></ha-icon>
                </button>
                <button class="wa-fab-action wa-ai-button" title="AI Suggestions" aria-label="AI Suggestions">
                  <ha-icon icon="mdi:robot-outline"></ha-icon>
                </button>
                <button class="wa-fab-main ${this._fabMenuOpen ? 'open' : ''}" title="Actions" aria-label="Actions">
                  <ha-icon icon="${this._fabMenuOpen ? 'mdi:close' : 'mdi:plus'}"></ha-icon>
                </button>
              </div>
              <div class="wa-contact-wrapper">
                <button class="wa-contact-button ${contactMenuClass ? 'menu-open' : ''}" title="Change contact" aria-label="Change contact">
                  <span class="wa-contact-initial">${contactInitial}</span>
                </button>
                <div class="wa-contact-menu ${contactMenuClass}">
                  ${contactMenuHTML}
                </div>
              </div>
              <button class="wa-circle-button wa-translator-button translator-button ${translatorActiveClass}"
                title="Toggle translation"
                aria-label="Toggle translation">
                <ha-icon icon="mdi:translate"></ha-icon>
              </button>
            </div>
          </div>
          </ha-card>
        </div>
      `;

      requestAnimationFrame(() => {
        this._attachInputBarEvents(hadInputFocus, cursorPosition);
        this._scrollToBottom();
        this._animateNewMessages();
      });
    } catch (err) {
      console.error("Error rendering my-chat-bubble-card:", err);
      this.shadowRoot.innerHTML = `<hui-warning>Error: ${err.message}</hui-warning>`;
    }
  }

  _attachInputBarEvents(hadInputFocus, cursorPosition) {
    const root = this.shadowRoot;
    if (!root) return;

    const inputEl = root.querySelector(".wa-input-field");
    const sendButton = root.querySelector(".wa-send-button");
    const contactButton = root.querySelector(".wa-contact-button");
    const contactMenu = root.querySelector(".wa-contact-menu");
    const translatorButton = root.querySelector(".wa-translator-button");
    const toggleButton = root.querySelector(".chat-toggle-button");
    const minimizeButton = root.querySelector(".chat-minimize-button");

    if (inputEl) {
      inputEl.addEventListener("input", (e) => {
        this._messageText = e.target.value;
      });

      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this._sendMessage();
        }
      });

      if (hadInputFocus) {
        inputEl.focus();
        if (
          typeof cursorPosition === "number" &&
          cursorPosition <= inputEl.value.length
        ) {
          try {
            inputEl.setSelectionRange(cursorPosition, cursorPosition);
          } catch (_) {}
        }
      }
    }

    // FAB menu handlers
    const fabMain = root.querySelector(".wa-fab-main");
    const aiButton = root.querySelector(".wa-ai-button");

    if (fabMain) {
      fabMain.addEventListener("click", () => {
        this._toggleFabMenu();
      });
    }

    if (sendButton) {
      sendButton.addEventListener("click", () => {
        this._sendMessage();
        this._fabMenuOpen = false;
        if (this._currentEntityState) {
          this._render(this._currentEntityState);
        }
      });
    }

    if (aiButton) {
      aiButton.addEventListener("click", () => {
        this._suggestionsExpanded = !this._suggestionsExpanded;
        this._fabMenuOpen = false;

        // Clear selection when hiding
        if (!this._suggestionsExpanded) {
          this._selectedSuggestion = null;
        }

        if (this._currentEntityState) {
          this._render(this._currentEntityState);
        }
      });
    }

    if (translatorButton) {
      translatorButton.addEventListener("click", () => {
        this._toggleTranslator();
      });
    }

    if (toggleButton) {
      toggleButton.addEventListener("click", () => {
        this._toggleChat();
      });
    }

    if (minimizeButton) {
      minimizeButton.addEventListener("click", () => {
        this._toggleChat();
      });
    }

    if (contactButton) {
      contactButton.addEventListener("click", () => {
        this._toggleContactMenu();
      });
    }

    if (contactMenu) {
      contactMenu.querySelectorAll(".wa-contact-menu-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          const contact = e.currentTarget.getAttribute("data-contact");
          if (contact) {
            this._selectContact(contact);
          }
        });
      });
    }

    const onClickOutside = (ev) => {
      if (!this._contactMenuOpen) return;
      if (!this.shadowRoot) return;
      const path = ev.composedPath ? ev.composedPath() : [];
      const inside = path.includes(contactMenu) || path.includes(contactButton);
      if (!inside) {
        this._contactMenuOpen = false;
        // Just update the CSS class instead of re-rendering
        if (contactMenu) {
          contactMenu.classList.remove("open");
        }
        if (contactButton) {
          contactButton.classList.remove("menu-open");
        }
      }
    };

    if (!this._outsideClickHandlerAttached) {
      this._outsideClickHandlerAttached = true;
      this._outsideClickHandler = onClickOutside;
      window.addEventListener("click", onClickOutside);
    }

    // Attach suggestion card handlers
    const suggestionCards = root.querySelectorAll(".wa-suggestion-card");
    suggestionCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        // Don't trigger if clicking on the send button
        if (e.target.closest(".suggestion-send-btn")) {
          return;
        }
        const optionNumber = e.currentTarget.getAttribute("data-option");
        this._selectSuggestion(optionNumber);
      });
    });

    // Attach send button handlers
    const sendButtons = root.querySelectorAll(".suggestion-send-btn");
    sendButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent card click
        const optionNumber = e.currentTarget.getAttribute("data-option");
        this._sendSuggestion(optionNumber);
      });
    });

    // Attach close suggestions handler
    const closeButton = root.querySelector(".wa-close-suggestions");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        this._suggestionsExpanded = false;
        if (this._currentEntityState) {
          this._render(this._currentEntityState);
        }
      });
    }

    // Attach refresh button handler
    const refreshButton = root.querySelector(".wa-refresh-suggestions");
    if (refreshButton) {
      refreshButton.addEventListener("click", () => {
        this._generateReplies();
      });
    }
  }

  _sendMessage() {
    if (!this._hass || !this._config?.message_entity) return;
    const text = (this._messageText || "").trim();
    if (!text) return;

    this._hass.callService("input_text", "set_value", {
      entity_id: this._config.message_entity,
      value: text,
    });

    this._messageText = "";
    if (this._currentEntityState) {
      this._render(this._currentEntityState);
    }
  }

  _toggleChat() {
    this._isExpanded = !this._isExpanded;

    // Clear unread count when opening chat
    if (this._isExpanded && this._hass) {
      // Clear global unread count
      this._hass.callService("input_number", "set_value", {
        entity_id: "input_number.whatsapp_c_unread_count",
        value: 0,
      });

      // Clear unread boolean
      this._hass.callService("input_boolean", "turn_off", {
        entity_id: "input_boolean.whatsapp_c_unread_exists",
      });

      // Clear contact-specific unread count and boolean
      const selectedContact = this._selectedContact;
      if (selectedContact && this._config?.entity_map) {
        const contactsConfig = this._hass.states["sensor.whatsapp_contacts_config"];
        if (contactsConfig?.attributes?.contacts_by_name) {
          try {
            const contacts = JSON.parse(contactsConfig.attributes.contacts_by_name);
            const contact = contacts[selectedContact];
            if (contact) {
              this._hass.callService("input_number", "set_value", {
                entity_id: contact.unread_count,
                value: 0,
              });
              this._hass.callService("input_boolean", "turn_off", {
                entity_id: contact.unread_boolean,
              });
            }
          } catch (e) {
            console.warn("Failed to parse contacts config:", e);
          }
        }
      }
    }

    if (this._currentEntityState) {
      this._render(this._currentEntityState);
    }
    // Scroll to bottom when expanding
    if (this._isExpanded) {
      requestAnimationFrame(() => {
        this._scrollToBottom();
      });
    }
  }

  _toggleTranslator() {
    if (!this._hass || !this._config?.translator_entity) return;
    const entityId = this._config.translator_entity;
    const state = this._hass.states[entityId]?.state || "off";
    const turnOn = state !== "on";

    this._hass.callService(
      "input_boolean",
      turnOn ? "turn_on" : "turn_off",
      {
        entity_id: entityId,
      }
    );
  }

  _toggleContactMenu() {
    this._contactMenuOpen = !this._contactMenuOpen;
    // Instead of re-rendering, just toggle the CSS class
    const contactMenu = this.shadowRoot?.querySelector(".wa-contact-menu");
    const contactButton = this.shadowRoot?.querySelector(".wa-contact-button");
    if (contactMenu) {
      if (this._contactMenuOpen) {
        contactMenu.classList.add("open");
      } else {
        contactMenu.classList.remove("open");
      }
    }
    if (contactButton) {
      if (this._contactMenuOpen) {
        contactButton.classList.add("menu-open");
      } else {
        contactButton.classList.remove("menu-open");
      }
    }
  }

  _selectContact(option) {
    if (!this._hass || !this._config?.input_select) return;
    this._contactMenuOpen = false;
    this._hass.callService("input_select", "select_option", {
      entity_id: this._config.input_select,
      option,
    });
  }

  _selectSuggestion(optionNumber) {
    // Toggle selection: if already selected, deselect it
    if (this._selectedSuggestion === optionNumber) {
      this._selectedSuggestion = null;
    } else {
      this._selectedSuggestion = optionNumber;
    }

    if (this._currentEntityState) {
      this._render(this._currentEntityState);
    }
  }

  _sendSuggestion(optionNumber) {
    if (!this._hass || !this._config?.message_entity) return;

    let suggestionText = "";
    if (optionNumber === "1") {
      suggestionText = this._replyOption1;
    } else if (optionNumber === "2") {
      suggestionText = this._replyOption2;
    } else if (optionNumber === "3") {
      suggestionText = this._replyOption3;
    }

    if (suggestionText) {
      // Send the message directly
      this._hass.callService("input_text", "set_value", {
        entity_id: this._config.message_entity,
        value: suggestionText,
      });

      // Clear selection and hide suggestions
      this._selectedSuggestion = null;
      this._suggestionsExpanded = false;

      if (this._currentEntityState) {
        this._render(this._currentEntityState);
      }
    }
  }

  _toggleFabMenu() {
    this._fabMenuOpen = !this._fabMenuOpen;
    if (this._currentEntityState) {
      this._render(this._currentEntityState);
    }
  }

  _generateReplies() {
    if (!this._hass) return;

    this._hass.callService("script", "generate_whatsapp_replies", {});

    // Clear selection and auto-expand suggestions after generation starts
    this._selectedSuggestion = null;
    this._suggestionsExpanded = true;
    if (this._currentEntityState) {
      this._render(this._currentEntityState);
    }
  }

  _toggleSuggestions() {
    this._suggestionsExpanded = !this._suggestionsExpanded;

    // Clear selection when hiding
    if (!this._suggestionsExpanded) {
      this._selectedSuggestion = null;
    }

    if (this._currentEntityState) {
      this._render(this._currentEntityState);
    }
  }

  _scrollToBottom() {
    const container = this.shadowRoot?.querySelector(".chat-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  _groupMessages(messages) {
    const grouped = [];
    let currentGroup = null;
    for (const msg of messages) {
      if (!currentGroup || currentGroup.isMe !== msg.isMe) {
        currentGroup = { isMe: msg.isMe, lines: [] };
        grouped.push(currentGroup);
      }
      currentGroup.lines.push(msg);
    }
    return grouped;
  }

  _renderGroup(group, isNewest, isUnread) {
    const bubbleAlign = group.isMe ? "bubble-right" : "bubble-left";
    const lastLine = group.lines[group.lines.length - 1];

    const allText = group.lines
      .map((l) => {
        if (l.quotedText && l.text.length === 0) {
          return `<div class="quoted-message">${this._escapeHTML(
            l.quotedText
          )}</div>`;
        } else if (l.quotedText) {
          return `<div class="quoted-message">${this._escapeHTML(
            l.quotedText
          )}</div>${this._escapeHTML(l.text)}`;
        } else {
          return this._escapeHTML(l.text);
        }
      })
      .join("<br>");

    const stamp = this._escapeHTML(lastLine.timestamp);
    const animationClass = isNewest ? "new-message" : "";
    const unreadClass = isUnread ? "unread-message" : "";

    return `
      <div class="bubble-row ${bubbleAlign} ${animationClass} ${unreadClass}" role="listitem" aria-label="${
      group.isMe ? "Sent" : "Received"
    } messages">
        <div class="bubble-shape">
          <div class="glass-effect"></div>
          <div class="bubble-text">
            <span class="message-main">
              ${allText}
            </span>
            <div class="timestamp" aria-label="Sent at ${stamp}">
              ${stamp}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderSuggestionsBar() {
    const hasAnyOptions = this._replyOption1 || this._replyOption2 || this._replyOption3;
    const loadingClass = this._generatingReplies ? "loading" : "";
    const refreshIcon = this._generatingReplies ? "mdi:loading" : "mdi:refresh";

    const suggestions = [
      { text: this._replyOption1, num: "1" },
      { text: this._replyOption2, num: "2" },
      { text: this._replyOption3, num: "3" }
    ].filter(s => s.text);

    const suggestionsHTML = suggestions.map(s => {
      const preview = s.text.length > 40 ? s.text.substring(0, 40) + "..." : s.text;
      const isSelected = this._selectedSuggestion === s.num;
      const selectedClass = isSelected ? "selected" : "";
      return `
        <div class="wa-suggestion-card ${selectedClass}" data-option="${s.num}">
          <div class="suggestion-content">
            <span class="suggestion-preview">${this._escapeHTML(preview)}</span>
            <span class="suggestion-full">${this._escapeHTML(s.text)}</span>
          </div>
          ${isSelected ? `
            <button class="suggestion-send-btn" data-option="${s.num}">
              Send
            </button>
          ` : ''}
        </div>
      `;
    }).join("");

    // If no suggestions, show a message encouraging user to generate them
    const emptyMessage = !hasAnyOptions ? `
      <div class="wa-suggestions-empty">
        <ha-icon icon="mdi:lightbulb-outline"></ha-icon>
        <span>Click the refresh button to generate AI reply suggestions</span>
      </div>
    ` : "";

    const visibleClass = this._suggestionsExpanded ? "visible" : "";

    return `
      <div class="wa-suggestions-container ${visibleClass}" role="group" aria-label="AI reply suggestions">
        <div class="wa-suggestions-header">
          <button class="wa-refresh-suggestions ${loadingClass}" title="Generate AI replies" aria-label="Generate AI replies">
            <ha-icon icon="${refreshIcon}"></ha-icon>
          </button>
          <button class="wa-close-suggestions" title="Close suggestions" aria-label="Close suggestions">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="wa-suggestions-cards">
          ${hasAnyOptions ? suggestionsHTML : emptyMessage}
        </div>
      </div>
    `;
  }

  _animateNewMessages() {
    if (typeof gsap === "undefined") {
      console.warn("my-chat-bubble-card. GSAP not found. Advanced animations will not run.");
      return;
    }
    const newMessageElements = this.shadowRoot.querySelectorAll(
      ".new-message .message-main"
    );
    newMessageElements.forEach((element) => {
      if (element.getAttribute("data-animated")) return;

      // Check if the message contains quoted text (has HTML structure)
      if (element.querySelector(".quoted-message")) {
        // Skip animation for messages with quoted content to preserve HTML structure
        element.setAttribute("data-animated", "true");
        return;
      }

      const text = element.textContent;
      element.innerHTML = "";
      text.split("").forEach((letter) => {
        const span = document.createElement("span");
        span.textContent = letter;
        element.appendChild(span);
      });
      gsap.fromTo(
        element.querySelectorAll("span"),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "back.out(1.7)",
        }
      );
      element.setAttribute("data-animated", "true");
    });
  }

  _escapeHTML(str) {
    if (!str || typeof str !== "string") return "";

    return str
      .replace(/&/g, "&amp;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\\'/g, "&#39;");
  }

  getCardSize() {
    return 8;
  }
}

customElements.define("my-chat-bubble-card", MyChatBubbleCard);
