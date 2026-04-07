// ══════════════════════════════════════════════════════════════════════════════
//  EVENTS MODULE
//  All event handling for catalogue navigation and interactive demos.
// ══════════════════════════════════════════════════════════════════════════════

import { getComponentsByCategory, getComponentById } from "./registry.js";
import { TOOLTIP_CONTENT, CATEGORY_TOOLTIPS } from "./constants.js";
import { showRichTooltip } from "/local/base/tooltips.js";


// ── Main Setup ───────────────────────────────────────────────────────────────

export function setupEventListeners() {
  const root = this.shadow;

  // Category tabs
  const tabs = root.getElementById("catTabs");
  if (tabs && !tabs.dataset.bound) {
    tabs.dataset.bound = "1";
    tabs.addEventListener("click", (e) => {
      const target = (e.composedPath?.() || []).find(n => n.dataset?.category);
      if (target?.dataset.category) {
        const cat = target.dataset.category;
        this.state.activeCategory = cat;
        this.state.searchTerm = "";
        // Select first component in the new category
        const comps = getComponentsByCategory(cat);
        if (comps.length > 0) {
          this.state.activeComponent = comps[0].id;
        }
        this.state.activeVariant = null;
        this.render();
      }
    });
  }

  // Sidebar component clicks + keyboard navigation
  const sidebar = root.getElementById("catSidebar");
  if (sidebar && !sidebar.dataset.bound) {
    sidebar.dataset.bound = "1";

    const selectItem = (target) => {
      if (target?.dataset.component) {
        this.state.activeComponent = target.dataset.component;
        this.state.activeVariant = null;
        this.state.sidebarOpen = false;
        const backdrop = root.getElementById("catSidebarBackdrop");
        if (backdrop) backdrop.classList.remove("is-visible");
        this.render();
      }
    };

    sidebar.addEventListener("click", (e) => {
      selectItem((e.composedPath?.() || []).find(n => n.dataset?.component));
    });

    sidebar.addEventListener("keydown", (e) => {
      const items = [...sidebar.querySelectorAll('.cat-sidebar__item')];
      const idx = items.indexOf(e.target);
      if (idx === -1) return;

      if (e.key === "ArrowDown" && idx < items.length - 1) {
        e.preventDefault();
        items[idx + 1].focus();
      } else if (e.key === "ArrowUp" && idx > 0) {
        e.preventDefault();
        items[idx - 1].focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectItem(e.target);
      }
    });
  }

  // Sidebar mobile backdrop
  const sidebarBackdrop = root.getElementById("catSidebarBackdrop");
  if (sidebarBackdrop && !sidebarBackdrop.dataset.bound) {
    sidebarBackdrop.dataset.bound = "1";
    sidebarBackdrop.addEventListener("click", () => {
      this.state.sidebarOpen = false;
      const sb = root.getElementById("catSidebar");
      if (sb) sb.classList.remove("is-open");
      sidebarBackdrop.classList.remove("is-visible");
    });
  }

  // Search input
  const search = root.getElementById("catSearch");
  if (search && !search.dataset.bound) {
    search.dataset.bound = "1";
    let debounce = null;
    search.addEventListener("input", (e) => {
      const pill = this.shadow.querySelector(".cat-search-container .ui-input__pill");
      if (pill) pill.classList.toggle("has-value", !!e.target.value);
      this._updateCatClearButton();
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.state.searchTerm = e.target.value.trim();
        this.render();
        // Re-focus and restore cursor
        const newSearch = this.shadow.getElementById("catSearch");
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      }, 200);
    });
  }

  // Search clear button
  const clearBtn = root.getElementById("catSearchClear");
  if (clearBtn && !clearBtn.dataset.bound) {
    clearBtn.dataset.bound = "1";
    clearBtn.addEventListener("click", () => {
      this.state.searchTerm = "";
      const input = this.shadow.getElementById("catSearch");
      const pill = this.shadow.querySelector(".cat-search-container .ui-input__pill");
      if (input) { input.value = ""; input.focus(); }
      if (pill) pill.classList.remove("has-value");
      this._updateCatClearButton();
      this.render();
      const newSearch = this.shadow.getElementById("catSearch");
      if (newSearch) newSearch.focus();
    });
  }

  // Sync clear button visibility on render
  this._updateCatClearButton();

  // Card header info icon — set dynamic content based on active category
  const headerInfo = root.querySelector('.ui-card-header ui-info-icon[data-tooltip-key="cardHeader"]');
  if (headerInfo) {
    const activeCat = this.state.activeCategory;
    headerInfo.tooltipContent = (activeCat && CATEGORY_TOOLTIPS[activeCat])
      ? CATEGORY_TOOLTIPS[activeCat]
      : TOOLTIP_CONTENT.cardHeader;
  }

  // Sidebar mobile toggle
  const sidebarBtn = root.getElementById("sidebarToggle");
  if (sidebarBtn && !sidebarBtn.dataset.bound) {
    sidebarBtn.dataset.bound = "1";
    sidebarBtn.addEventListener("click", () => {
      this.state.sidebarOpen = !this.state.sidebarOpen;
      const sb = this.shadow.getElementById("catSidebar");
      const bd = this.shadow.getElementById("catSidebarBackdrop");
      if (sb) sb.classList.toggle("is-open", this.state.sidebarOpen);
      if (bd) bd.classList.toggle("is-visible", this.state.sidebarOpen);
    });
  }

  // Header overflow menu
  const menuBtn = root.getElementById("catHeaderMenuBtn");
  if (menuBtn && !menuBtn.dataset.bound) {
    menuBtn.dataset.bound = "1";
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.state.headerMenuOpen = !this.state.headerMenuOpen;
      const menu = root.getElementById("catHeaderMenu");
      if (menu) menu.classList.toggle("ui-menu--open", this.state.headerMenuOpen);
    });
  }

  // Dark mode checkbox in header menu
  const darkModeItem = root.getElementById("catHeaderMenuDarkMode");
  if (darkModeItem && !darkModeItem.dataset.bound) {
    darkModeItem.dataset.bound = "1";
    darkModeItem.addEventListener("click", () => {
      this.state.headerMenuOpen = false;
      const menu = root.getElementById("catHeaderMenu");
      if (menu) menu.classList.remove("ui-menu--open");
      if (this._hass) {
        const isDark = this._hass.themes.darkMode;
        const newMode = isDark ? "light" : "dark";
        const theme = this._hass.selectedTheme?.theme || "default";
        this._hass.callService("browser_mod", "set_theme", {
          theme: theme,
          dark: newMode,
        });
      }
    });
  }

  // Playground variant chips
  const controls = root.getElementById("playgroundControls");
  if (controls && !controls.dataset.bound) {
    controls.dataset.bound = "1";
    controls.addEventListener("click", (e) => {
      const target = (e.composedPath?.() || []).find(n => n.dataset?.variant);
      if (target?.dataset.variant) {
        this.state.activeVariant = target.dataset.variant;
        this.render();
      }
    });
  }

  // Usage section copy buttons
  root.querySelectorAll('[data-usage-copy]').forEach(btn => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        const block = btn.closest('.cat-usage__block');
        const code = block?.querySelector('.cat-usage__code');
        if (!code) return;
        const text = code.textContent;

        const write = (t) =>
          navigator.clipboard?.writeText
            ? navigator.clipboard.writeText(t)
            : new Promise(res => {
                const ta = document.createElement("textarea");
                ta.value = t;
                ta.style.cssText = "position:fixed;top:-9999px;";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                res();
              });

        write(text).then(() => {
          btn.classList.add("is-copied");
          setTimeout(() => btn.classList.remove("is-copied"), 1500);
        }).catch(() => {});
      });
    }
  });
}


// ── Demo-Specific Listeners ──────────────────────────────────────────────────
// Called after render to wire up interactive elements within demos.

export function setupDemoListeners() {
  const root = this.shadow;
  const comp = getComponentById(this.state.activeComponent);
  if (!comp) return;

  // Wire up tap bounce on all buttons
  if (!root._btnBounceInit) {
    import("/local/base/helpers.js").then(({ initButtons }) => {
      initButtons(root);
    });
    root._btnBounceInit = true;
  }

  // Wire up interactive elements based on which demo is showing
  switch (comp.id) {

    case "switch": {
      root.querySelectorAll('.demo-switch-interactive .ui-switch__input, .demo-switch-interactive .ui-icon-switch .ui-switch__input').forEach(input => {
        if (!input.dataset.bound) {
          input.dataset.bound = "1";
          input.addEventListener("change", () => {
            // Switches are self-managing via native checkbox
          });
        }
      });
      break;
    }

    case "checkbox": {
      break;
    }

    case "radio": {
      break;
    }

    case "toggle-button": {
      root.querySelectorAll('.demo-toggle-interactive .ui-btn--toggle').forEach(btn => {
        if (!btn.dataset.bound) {
          btn.dataset.bound = "1";
          btn.addEventListener("click", () => {
            btn.classList.toggle("is-selected");
          });
        }
      });
      break;
    }

    case "split-button": {
      const split = root.querySelector('.demo-split-interactive .ui-split');
      if (split && !split.dataset.bound) {
        split.dataset.bound = "1";
        const arrow = split.querySelector('.ui-split__arrow');
        const menu = split.querySelector('.ui-menu');
        if (arrow && menu) {
          arrow.addEventListener("click", (e) => {
            e.stopPropagation();
            split.classList.toggle("ui-split--open");
            menu.classList.toggle("ui-menu--open");
          });
          menu.addEventListener("click", (e) => {
            const item = (e.composedPath?.() || []).find(n => n.classList?.contains("ui-menu__item"));
            if (item) {
              menu.querySelectorAll('.ui-menu__item').forEach(i => i.classList.remove("ui-menu__item--selected"));
              item.classList.add("ui-menu__item--selected");
              split.classList.remove("ui-split--open");
              menu.classList.remove("ui-menu--open");
            }
          });
        }
      }
      break;
    }

    case "fab": {
      const fabWrap = root.querySelector('.demo-fab-interactive');
      if (fabWrap && !fabWrap.dataset.bound) {
        fabWrap.dataset.bound = "1";
        const trigger = fabWrap.querySelector('.ui-fab');
        const fabMenu = fabWrap.querySelector('.ui-fab-menu');
        if (trigger && fabMenu) {
          trigger.addEventListener("click", () => {
            fabMenu.classList.toggle("ui-fab-menu--open");
          });
        }
      }
      break;
    }

    case "text-input": {
      // Import and init floating labels
      import("/local/base/helpers.js").then(({ initInputs }) => {
        const container = root.querySelector('.demo-input-interactive');
        if (container) initInputs(container);
      });
      break;
    }

    case "slider": {
      import("/local/base/helpers.js").then(({ initSliders }) => {
        const container = root.querySelector('.demo-slider-interactive');
        if (container) {
          initSliders(container);
        }
      });
      break;
    }

    case "collapsible": {
      import("/local/base/components.js").then(({ initCollapsibleSections, toggleAllSections }) => {
        const container = root.querySelector('.demo-collapsible-interactive');
        if (container) {
          initCollapsibleSections(container);
          const expandBtn = root.getElementById("demoExpandAll");
          const collapseBtn = root.getElementById("demoCollapseAll");
          if (expandBtn && !expandBtn.dataset.bound) {
            expandBtn.dataset.bound = "1";
            expandBtn.addEventListener("click", () => toggleAllSections(container, true));
          }
          if (collapseBtn && !collapseBtn.dataset.bound) {
            collapseBtn.dataset.bound = "1";
            collapseBtn.addEventListener("click", () => toggleAllSections(container, false));
          }
        }
      });
      break;
    }

    case "toast": {
      import("/local/base/toasts.js").then(({ showToast }) => {
        import("/local/base/screen-border.js").then(({ flashScreenBorder }) => {
          const basicBtn = root.getElementById("demoToastBasic");
          const iconBtn = root.getElementById("demoToastIcon");
          const borderBtn = root.getElementById("demoToastBorder");
          if (basicBtn && !basicBtn.dataset.bound) {
            basicBtn.dataset.bound = "1";
            basicBtn.addEventListener("click", () => {
              showToast({ message: "This is a basic toast notification" });
            });
          }
          if (iconBtn && !iconBtn.dataset.bound) {
            iconBtn.dataset.bound = "1";
            iconBtn.addEventListener("click", () => {
              showToast({ message: "Toast with a custom icon", icon: "mdi:check-circle" });
            });
          }
          if (borderBtn && !borderBtn.dataset.bound) {
            borderBtn.dataset.bound = "1";
            borderBtn.addEventListener("click", () => {
              showToast({ message: "Toast with screen border", icon: "mdi:alert-circle" });
              flashScreenBorder();
            });
          }
        });
      });
      break;
    }

    case "modal": {
      import("/local/base/modals.js").then(({ showModal }) => {
        import("/local/base/toasts.js").then(({ showToast }) => {
          const basicBtn = root.getElementById("demoModalBasic");
          const btnsBtn = root.getElementById("demoModalButtons");
          const smallBtn = root.getElementById("demoModalSmall");
          const medBtn = root.getElementById("demoModalMedium");
          const lgBtn = root.getElementById("demoModalLarge");
          if (basicBtn && !basicBtn.dataset.bound) {
            basicBtn.dataset.bound = "1";
            basicBtn.addEventListener("click", () => {
              showModal({ title: "Basic Modal", content: "<p>This is a basic modal dialog. Click the X or press Escape to close.</p>" });
            });
          }
          if (btnsBtn && !btnsBtn.dataset.bound) {
            btnsBtn.dataset.bound = "1";
            btnsBtn.addEventListener("click", () => {
              showModal({
                title: "Confirm Action",
                content: "<p>Are you sure you want to proceed?</p>",
                buttons: [
                  { label: "Cancel", variant: "secondary", action: (m) => m.close() },
                  { label: "Confirm", variant: "accent", action: (m) => { showToast({ message: "Confirmed!", icon: "mdi:check" }); m.close(); } },
                ]
              });
            });
          }
          if (smallBtn && !smallBtn.dataset.bound) {
            smallBtn.dataset.bound = "1";
            smallBtn.addEventListener("click", () => {
              showModal({ title: "Small Modal", content: "<p>Max width 480px.</p>", size: "s" });
            });
          }
          if (medBtn && !medBtn.dataset.bound) {
            medBtn.dataset.bound = "1";
            medBtn.addEventListener("click", () => {
              showModal({ title: "Medium Modal", content: "<p>Max width 720px.</p>", size: "m" });
            });
          }
          if (lgBtn && !lgBtn.dataset.bound) {
            lgBtn.dataset.bound = "1";
            lgBtn.addEventListener("click", () => {
              showModal({ title: "Large Modal", content: "<p>Max width 960px.</p>", size: "l" });
            });
          }
        });
      });
      break;
    }

    case "spinner": {
      const btn = root.getElementById("demoSpinnerBtn");
      if (btn && !btn.dataset.bound) {
        btn.dataset.bound = "1";
        btn.addEventListener("click", () => {
          if (btn.dataset.loading) return;
          btn.dataset.loading = "1";
          const spinner = document.createElement("span");
          spinner.className = "ui-spinner ui-icon-loading";
          btn.style.display = "none";
          btn.parentNode.insertBefore(spinner, btn);
          setTimeout(() => {
            spinner.remove();
            btn.style.display = "";
            delete btn.dataset.loading;
          }, 2000);
        });
      }
      break;
    }

    case "skeleton": {
      const reveal = root.getElementById("demoSkeletonReveal");
      if (reveal && !reveal.dataset.bound) {
        reveal.dataset.bound = "1";

        const skeletonHTML = reveal.innerHTML;

        const contentHTML = `
          <div class="ui-skeleton-reveal" style="font-size:var(--ui-font-m);font-weight:600;color:var(--ui-text);">
            Living Room
          </div>
          <div class="ui-skeleton-reveal" style="--ui-anim-delay:0.06s;display:flex;align-items:center;gap:var(--ui-space-2);">
            <span style="width:8px;height:8px;border-radius:50%;background:var(--ui-success);flex-shrink:0;"></span>
            <span style="font-size:var(--ui-font-s);color:var(--ui-text-mute);">3 lights on · 21°C · Motion detected</span>
          </div>
          <div class="ui-skeleton-reveal" style="--ui-anim-delay:0.12s;display:flex;align-items:center;gap:var(--ui-space-2);">
            <span style="width:8px;height:8px;border-radius:50%;background:var(--ui-text-mute);opacity:0.4;flex-shrink:0;"></span>
            <span style="font-size:var(--ui-font-s);color:var(--ui-text-mute);">TV off · Front door locked</span>
          </div>
        `;

        const runReveal = () => {
          if (reveal.dataset.loading) return;
          reveal.dataset.loading = "1";

          // Reset to skeletons to start the demo
          reveal.style.transition = "none";
          reveal.style.opacity = "1";
          reveal.innerHTML = skeletonHTML;

          // After 1s simulated fetch: fade skeletons out, then swap in content
          setTimeout(() => {
            reveal.style.transition = "opacity 200ms ease-out";
            reveal.style.opacity = "0";

            setTimeout(() => {
              // Content slides up into the space the skeletons occupied
              reveal.innerHTML = contentHTML;
              reveal.style.transition = "none";
              reveal.style.opacity = "1";

              // Reset after content has been visible
              setTimeout(() => {
                reveal.innerHTML = skeletonHTML;
                delete reveal.dataset.loading;
              }, 2800);
            }, 200);
          }, 1000);
        };

        runReveal();
        reveal.addEventListener("click", runReveal);
      }
      break;
    }

    case "screen-border": {
      import("/local/base/screen-border.js").then(({ flashScreenBorder }) => {
        const btn = root.getElementById("demoScreenBorder");
        if (btn && !btn.dataset.bound) {
          btn.dataset.bound = "1";
          btn.addEventListener("click", () => flashScreenBorder());
        }
      });
      break;
    }

    case "tooltip": {
      import("/local/base/tooltips.js").then(({ showTooltip, hideTooltip, initTooltips }) => {
        root.querySelectorAll('[data-demo-tooltip]').forEach(el => {
          if (!el.dataset.bound) {
            el.dataset.bound = "1";
            const text = el.dataset.demoTooltip;
            const pos = el.dataset.demoTooltipPos || "top";
            const caret = el.dataset.demoTooltipCaret === "true";
            const delay = el.dataset.demoTooltipDelay ? parseInt(el.dataset.demoTooltipDelay) : undefined;
            el.addEventListener("mouseenter", () => showTooltip(el, text, { position: pos, caret, delay }));
            el.addEventListener("mouseleave", () => hideTooltip());
            el.addEventListener("focus", () => showTooltip(el, text, { position: pos, caret, delay }));
            el.addEventListener("blur", () => hideTooltip());
          }
        });
      });
      break;
    }

    case "rich-tooltip": {
      import("/local/base/tooltips.js").then(({ showRichTooltip, hideRichTooltip }) => {
        // Hover rich tooltips
        root.querySelectorAll('[data-demo-rich-tooltip]').forEach(el => {
          if (!el.dataset.bound) {
            el.dataset.bound = "1";
            const title = el.dataset.demoRichTitle || "";
            const body = el.dataset.demoRichBody || "";
            el.addEventListener("mouseenter", () => showRichTooltip(el, { title, body }));
            el.addEventListener("mouseleave", () => hideRichTooltip());
          }
        });
        // Persistent rich tooltips
        root.querySelectorAll('[data-demo-rich-persistent]').forEach(el => {
          if (!el.dataset.bound) {
            el.dataset.bound = "1";
            const title = el.dataset.demoRichTitle || "";
            const body = el.dataset.demoRichBody || "";
            el.addEventListener("click", () => showRichTooltip(el, { title, body }, { persistent: true, delay: 0 }));
          }
        });
        // Action rich tooltips
        root.querySelectorAll('[data-demo-rich-action]').forEach(el => {
          if (!el.dataset.bound) {
            el.dataset.bound = "1";
            el.addEventListener("click", () => {
              showRichTooltip(el, {
                title: "With Action",
                body: "This tooltip has a clickable action button."
              }, {
                persistent: true,
                delay: 0,
                action: { label: "Action", onClick: () => { /* no-op for demo */ } }
              });
            });
          }
        });
      });
      break;
    }

    case "menu": {
      const menu = root.querySelector('.demo-menu-interactive .ui-menu');
      const trigger = root.getElementById("demoMenuTrigger");
      if (menu && trigger && !trigger.dataset.bound) {
        trigger.dataset.bound = "1";
        trigger.addEventListener("click", () => {
          menu.classList.toggle("ui-menu--open");
        });
        menu.addEventListener("click", (e) => {
          const item = (e.composedPath?.() || []).find(n => n.classList?.contains("ui-menu__item"));
          if (item) {
            menu.querySelectorAll('.ui-menu__item').forEach(i => i.classList.remove("ui-menu__item--selected"));
            item.classList.add("ui-menu__item--selected");
            menu.classList.remove("ui-menu--open");
          }
        });
      }
      break;
    }

    case "copy-button": {
      import("/local/base/components.js").then(({ handleCopyButton }) => {
        root.querySelectorAll('.demo-copy-interactive .ui-copy-btn').forEach(btn => {
          if (!btn.dataset.bound) {
            btn.dataset.bound = "1";
            btn.addEventListener("click", () => {
              handleCopyButton(btn, "Copied text example", {
                onSuccess: () => {},
                onError: () => {},
              });
            });
          }
        });
      });
      break;
    }

    case "tab-bar": {
      root.querySelectorAll('.demo-tabbar-interactive .ui-tab-bar').forEach(tabBar => {
        if (!tabBar.dataset.bound) {
          tabBar.dataset.bound = "1";
          tabBar.addEventListener("click", (e) => {
            const tab = (e.composedPath?.() || []).find(n => n.classList?.contains("ui-tab-bar__tab"));
            if (tab && !tab.disabled) {
              tabBar.querySelectorAll('.ui-tab-bar__tab').forEach(t => t.classList.remove("ui-tab-bar__tab--active"));
              tab.classList.add("ui-tab-bar__tab--active");
            }
          });
        }
      });
      break;
    }

    case "progress": {
      const slider = root.getElementById("demoProgressSlider");
      const fill = root.getElementById("demoProgressFill");
      if (slider && fill && !slider.dataset.bound) {
        slider.dataset.bound = "1";
        slider.addEventListener("input", () => {
          fill.style.width = slider.value + "%";
        });
      }
      break;
    }

    case "motion": {
      root.querySelectorAll('.cat-motion-bar').forEach(bar => {
        if (!bar.dataset.bound) {
          bar.dataset.bound = "1";
          const timing = bar.dataset.timing;
          bar.addEventListener("click", () => {
            bar.style.transition = `width ${timing} ease`;
            bar.classList.toggle("is-animating");
          });
        }
      });
      break;
    }

    case "animation": {
      // Keyframe cards — click to replay
      root.querySelectorAll('.cat-anim-card').forEach(card => {
        if (!card.dataset.bound) {
          card.dataset.bound = "1";
          card.addEventListener("click", () => {
            const target = card.querySelector('.cat-anim-card__target');
            if (!target) return;
            const animValue = card.dataset.animValue;
            const propsRaw = card.dataset.animProps;

            // Reset animation
            target.style.animation = "none";
            // Apply custom property overrides if any
            if (propsRaw) {
              try {
                const props = JSON.parse(propsRaw);
                for (const [k, v] of Object.entries(props)) {
                  target.style.setProperty(k, v);
                }
              } catch (e) { /* ignore */ }
            }
            // Force reflow then apply
            void target.offsetWidth;
            target.style.animation = animValue;
          });
        }
      });

      // Per-character text reveal
      root.querySelectorAll('[data-anim-text-reveal]').forEach(revealContainer => {
        if (revealContainer.dataset.bound) return;
        revealContainer.dataset.bound = "1";
        const renderReveal = () => {
          revealContainer.querySelectorAll('[data-reveal-text]').forEach(line => {
            const text = line.dataset.revealText;
            const fromX = line.dataset.revealFrom || "60px";
            const baseDelay = parseFloat(line.dataset.revealBase || "0");
            const charStep = 0.03;
            line.innerHTML = text.split("").map((char, i) => {
              const delay = baseDelay + i * charStep;
              return `<span style="display:inline-block;opacity:0;animation:ui-reveal-in 0.8s both;animation-delay:${delay.toFixed(3)}s;--ui-anim-from-x:${fromX}">${
                char === " " ? "&nbsp;" : char
              }</span>`;
            }).join("");
          });
        };
        renderReveal();
        revealContainer.addEventListener("click", () => {
          revealContainer.querySelectorAll('[data-reveal-text]').forEach(line => {
            line.innerHTML = "";
          });
          void revealContainer.offsetWidth;
          renderReveal();
        });
      });

      // Cycling text crossfade — messages auto-cycle with per-char blur in/out
      root.querySelectorAll('[data-anim-text-cycle]').forEach(container => {
        if (container.dataset.bound) return;
        container.dataset.bound = "1";

        const messages = JSON.parse(container.dataset.cycleMessages || "[]");
        const displayTime = parseInt(container.dataset.cycleDisplay || "4000", 10);
        const charDelay = parseFloat(container.dataset.cycleCharDelay || "0.025");
        const fadeDuration = parseFloat(container.dataset.cycleFadeDuration || "0.7");
        if (!messages.length) return;

        let idx = 0;
        let cycleTimer = null;
        let isAnimating = false;

        // Build per-char HTML with word-safe wrapping
        const buildChars = (text, out = false) => {
          let gi = 0;
          return text.split(/(\s+)/).map(token => {
            if (/^\s+$/.test(token)) return " ";
            const letters = [...token].map(c => {
              const d = gi * charDelay;
              gi++;
              return `<span style="display:inline-block;opacity:${out ? 1 : 0};animation:ui-reveal-${out ? "out" : "in"} ${fadeDuration}s cubic-bezier(.4,0,.2,1) both;animation-delay:${d.toFixed(3)}s;--ui-anim-from-x:${out ? "25px" : "-25px"}">${c}</span>`;
            }).join("");
            return `<span style="display:inline-block">${letters}</span>`;
          }).join("");
        };

        const showStatic = (i) => {
          container.innerHTML = `<div style="position:absolute;inset:0;padding:inherit">${messages[i]}</div>`;
        };

        const crossfade = () => {
          if (isAnimating) return;
          isAnimating = true;
          const curIdx = idx;
          const nextIdx = (idx + 1) % messages.length;
          const maxLen = Math.max(messages[curIdx].length, messages[nextIdx].length);

          container.innerHTML =
            `<div style="position:absolute;inset:0;padding:inherit;z-index:1">${buildChars(messages[curIdx], true)}</div>` +
            `<div style="position:absolute;inset:0;padding:inherit;z-index:2">${buildChars(messages[nextIdx], false)}</div>`;

          const animTime = (fadeDuration + charDelay * maxLen) * 1000;
          setTimeout(() => {
            idx = nextIdx;
            showStatic(idx);
            isAnimating = false;
          }, animTime);
        };

        const startCycle = () => {
          clearInterval(cycleTimer);
          const maxLen = messages.reduce((m, t) => Math.max(m, t.length), 0);
          const totalCycle = displayTime + (fadeDuration + charDelay * maxLen) * 1000;
          cycleTimer = setInterval(crossfade, totalCycle);
        };

        showStatic(0);
        setTimeout(() => { crossfade(); startCycle(); }, displayTime);

        container.addEventListener("click", () => {
          clearInterval(cycleTimer);
          crossfade();
          startCycle();
        });
      });

      // Easing curve rows — click to animate dot across
      root.querySelectorAll('.cat-anim-easing-row').forEach(row => {
        if (!row.dataset.bound) {
          row.dataset.bound = "1";
          const easing = row.dataset.easing;
          row.addEventListener("click", () => {
            const dot = row.querySelector('.cat-anim-easing-track__dot');
            if (!dot) return;
            dot.style.transition = "none";
            dot.style.left = "0%";
            void dot.offsetWidth;
            // Animate to 75% — spring curves visually overshoot past this point
            dot.style.transition = `left 800ms ${easing}`;
            dot.style.left = "75%";
          });
        }
      });
      break;
    }

    case "circle-slider": {
      // Live readouts for interactive sliders
      const container = root.querySelector('.demo-circle-slider-interactive');
      if (container) {
        container.querySelectorAll('ui-circle-slider').forEach((slider, i) => {
          if (!slider.dataset.readoutBound) {
            slider.dataset.readoutBound = "1";
            const readout = container.querySelector(`[data-circle-readout="${i}"]`);
            if (readout) {
              ['ui-input', 'ui-change'].forEach(evt => {
                slider.addEventListener(evt, () => {
                  const val = slider.value ?? slider.getAttribute('value');
                  readout.textContent = `Value: ${val}`;
                });
              });
            }
          }
        });

      }

      // Simulate hover state on the demo slider
      const hoverSlider = root.querySelector('[data-demo-hover]');
      if (hoverSlider && !hoverSlider.dataset.hoverInit) {
        hoverSlider.dataset.hoverInit = "1";
        requestAnimationFrame(() => {
          const inner = hoverSlider.shadowRoot?.querySelector('.ui-circle-slider');
          if (inner) {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync('.ui-circle-slider::before { background: var(--ui-state-hover) !important; }');
            hoverSlider.shadowRoot.adoptedStyleSheets = [
              ...hoverSlider.shadowRoot.adoptedStyleSheets,
              sheet,
            ];
          }
        });
      }

      // Simulate rollback visual on the demo slider
      const rollbackSlider = root.querySelector('[data-demo-rollback]');
      if (rollbackSlider && !rollbackSlider.dataset.rollbackInit) {
        rollbackSlider.dataset.rollbackInit = "1";
        requestAnimationFrame(() => {
          rollbackSlider._isDragging = true;
          rollbackSlider._showRollback = true;
          rollbackSlider._startValue = 75;
          rollbackSlider._value = 40;
          rollbackSlider.updateVisuals();
        });
      }
      break;
    }

    case "colours": {
      // Shared helper: resolve a CSS token to { r, g, b, a } via probe element
      const resolveToken = (token) => {
        const probe = document.createElement("div");
        probe.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
        probe.style.color = `var(${token})`;
        root.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        root.removeChild(probe);
        const m = resolved?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
        if (!m) return null;
        return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
      };

      // Shared helper: format { r, g, b, a } as hex or rgb string
      const formatColour = (c, format) => {
        if (format === "hex") {
          const hex = "#" + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, "0")).join("");
          return c.a < 1 ? hex + Math.round(c.a * 255).toString(16).padStart(2, "0") : hex;
        }
        return c.a < 1 ? `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})` : `rgb(${c.r}, ${c.g}, ${c.b})`;
      };

      // Shared helper: contrast text colour via YIQ
      const contrastColor = (c) => {
        const yiq = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
        return yiq >= 160 ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.92)";
      };

      // Helper: get current format from radio
      const getFormat = () => {
        const el = root.querySelector('[data-colour-format] input[name="colourFormat"]:checked');
        return el?.value || "hex";
      };

      const swatches = root.querySelectorAll('[data-swatch-token]');
      swatches.forEach(swatch => {
        if (swatch.dataset.bound) return;
        swatch.dataset.bound = "1";

        const valueEl = swatch.querySelector('.cat-swatch__value');
        const labelEl = swatch.querySelector('.cat-swatch__label');
        const origLabel = labelEl?.textContent || "";

        // Hover: resolve the colour and show the formatted value on the swatch
        swatch.addEventListener("mouseenter", () => {
          if (!valueEl) return;
          const token = swatch.dataset.swatchToken;
          const c = resolveToken(token);
          if (!c) return;
          valueEl.textContent = formatColour(c, getFormat());
          valueEl.style.color = contrastColor(c);
        });

        swatch.addEventListener("mouseleave", () => {
          if (valueEl) valueEl.textContent = "";
        });

        // Click: copy the value to clipboard
        swatch.addEventListener("click", () => {
          const token = swatch.dataset.swatchToken;
          const c = resolveToken(token);
          if (!c) return;

          const toCopy = formatColour(c, getFormat());

          const write = (t) =>
            navigator.clipboard?.writeText
              ? navigator.clipboard.writeText(t)
              : new Promise(res => {
                  const ta = document.createElement("textarea");
                  ta.value = t;
                  ta.style.cssText = "position:fixed;top:-9999px;";
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand("copy");
                  document.body.removeChild(ta);
                  res();
                });

          write(toCopy).then(() => {
            // Show tick in label and success ring
            if (labelEl) labelEl.textContent = "✓";
            swatch.classList.add("cat-swatch--copied");
            setTimeout(() => {
              swatch.classList.remove("cat-swatch--copied");
              if (labelEl) labelEl.textContent = origLabel;
            }, 1500);
          });
        });
      });

      // Update hover values when format radio changes
      const formatRadios = root.querySelectorAll('[data-colour-format] input[name="colourFormat"]');
      formatRadios.forEach(radio => {
        if (radio.dataset.bound) return;
        radio.dataset.bound = "1";
        radio.addEventListener("change", () => {
          // Refresh any currently hovered swatch
          const hovered = root.querySelector('.cat-swatch:hover .cat-swatch__value');
          if (hovered) {
            const sw = hovered.closest('[data-swatch-token]');
            if (sw) {
              const c = resolveToken(sw.dataset.swatchToken);
              if (c) {
                hovered.textContent = formatColour(c, getFormat());
                hovered.style.color = contrastColor(c);
              }
            }
          }
        });
      });
      break;
    }

    case "drawer": {
      const container = root.querySelector('.cat-playground__canvas');
      if (container && !container.dataset.drawerBound) {
        container.dataset.drawerBound = "1";
        const fab = container.querySelector('.ui-drawer-toggle');
        const backdrop = container.querySelector('.ui-drawer-backdrop');
        const drawer = container.querySelector('.ui-drawer');
        const close = container.querySelector('.ui-drawer__close');

        const open = () => {
          if (fab) fab.style.opacity = "0";
          if (backdrop) backdrop.classList.add('is-visible');
          if (drawer) drawer.classList.add('is-open');
        };
        const shut = () => {
          if (fab) fab.style.opacity = "1";
          if (backdrop) backdrop.classList.remove('is-visible');
          if (drawer) drawer.classList.remove('is-open');
        };

        if (fab) fab.addEventListener("click", open);
        if (close) close.addEventListener("click", shut);
        if (backdrop) backdrop.addEventListener("click", shut);
      }
      break;
    }

    default:
      break;
  }
}
