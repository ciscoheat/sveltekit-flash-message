<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/env";

  // Runes
  let mode = $state<"system" | "light" | "dark">("system");

  // Constants
  const THEME_KEY = "clipper-theme";

  function getSystemMode() {
    if (!browser) return "light"; // Default for SSR
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(newMode: typeof mode) {
    if (!browser) return;

    const html = document.documentElement;
    const resolvedMode = newMode === "system" ? getSystemMode() : newMode;

    // Toggle classes based on resolved mode
    html.classList.toggle("dark", resolvedMode === "dark");
    html.classList.toggle("light", resolvedMode === "light");
  }

  function setMode(newMode: typeof mode) {
    mode = newMode;
    localStorage.setItem(THEME_KEY, newMode);
  }

  $effect(() => {
    applyTheme(mode);
  });

  function handleIconClick(event: MouseEvent) {
    const target = event.target as Element;
    const icon = target.closest<HTMLElement>(".theme-icon");

    if (!icon) return;

    const newMode = icon.dataset.mode as typeof mode | undefined;
    if (newMode) {
      setMode(newMode);
    }
  }

  onMount(() => {
    // Recover state from localStorage
    const stored = localStorage.getItem(THEME_KEY);

    // Handle legacy theme storage
    const legacyTheme = localStorage.getItem("theme");
    if (legacyTheme) {
      localStorage.removeItem("theme");
      if (!stored && ["dark", "light", "system"].includes(legacyTheme)) {
        setMode(legacyTheme as typeof mode);
        return;
      }
    }

    if (stored && ["dark", "light", "system"].includes(stored)) {
      mode = stored as typeof mode;
    }

    // Listener for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (mode === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  });
</script>

<button
  class="theme-toggle"
  aria-label={`Theme mode ${mode}. Click an icon to set theme.`}
  title={`Theme: ${mode} (click icon to set)`}
  onclick={handleIconClick}
  aria-pressed={false}
>
  <!-- 
		The original component implemented the logic by checking which icon was clicked.
		We maintain this behavior to match the original structure.
	-->
  <span
    class="theme-icon"
    data-mode="light"
    data-active={mode === "light"}
    aria-hidden="true"
  >
    ☀️
  </span>
  <span
    class="theme-icon"
    data-mode="system"
    data-active={mode === "system"}
    aria-hidden="true"
  >
    🖥️
  </span>
  <span
    class="theme-icon"
    data-mode="dark"
    data-active={mode === "dark"}
    aria-hidden="true"
  >
    🌙
  </span>
</button>

<style>
  /* Theme toggle button */
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background-color: var(--background);
    border: 1px solid var(--border);
    border-radius: 9999px;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem 0.4rem;
    transition:
      opacity 0.2s ease,
      border-color 0.2s ease;
    color: inherit;
  }

  .theme-toggle:hover {
    opacity: 0.9;
  }

  .theme-toggle:active {
    opacity: 0.75;
  }

  .theme-icon {
    align-items: center;
    border-radius: 9999px;
    display: inline-flex;
    height: 1.8rem;
    justify-content: center;
    opacity: 0.55;
    transition:
      opacity 0.2s ease,
      background-color 0.2s ease;
    width: 1.8rem;
  }

  /* Use data-active attribute selector to match logic */
  .theme-icon[data-active="true"] {
    background-color: var(--muted);
    cursor: default;
    opacity: 1;
    pointer-events: none;
  }

  /* Use global selector for hover state to match structure */
  .theme-toggle:hover .theme-icon[data-active="false"] {
    opacity: 0.72;
  }

  .theme-toggle:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .theme-icon {
    font-size: 1em;
    line-height: 1;
  }

  .theme-toggle:focus-visible .theme-icon[data-active="true"] {
    box-shadow: inset 0 0 0 1px var(--border);
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-toggle,
    .theme-icon {
      transition: none;
    }
  }
</style>
