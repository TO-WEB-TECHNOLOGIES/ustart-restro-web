import { useEffect } from "react";

const CANDIDATE_SELECTORS = [
  'input[aria-invalid="true"]',
  'select[aria-invalid="true"]',
  'textarea[aria-invalid="true"]',
  '[aria-invalid="true"]',
  'input.border-red-500',
  'input.border-red-400',
  'input.border-red-600',
  'select.border-red-500',
  'select.border-red-400',
  'textarea.border-red-500',
  'textarea.border-red-400',
  '.border-red-500',
  'p.text-red-500',
  'p.text-red-600',
  'p.text-red-400',
  'p.text-red-300',
  'span.text-red-500',
  'span.text-red-600',
  'span.text-red-400',
  '[role="alert"]',
].join(", ");

/**
 * Searches the target container or document for the first validation error
 * element, smoothly scrolls to center it in the viewport, and focuses the input.
 */
export const scrollToFirstError = (
  container: HTMLElement | Document = document
): boolean => {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(CANDIDATE_SELECTORS)
  );

  const errorEl = elements.find((el) => {
    // Exclude buttons or action items that just happen to be styled red (e.g. Delete, Change File)
    if (
      el.tagName === "BUTTON" ||
      el.closest("button") ||
      el.getAttribute("role") === "button"
    ) {
      return false;
    }
    // If it's a text element (p, span, div, role="alert"), ensure it has actual text content
    if (
      ["P", "SPAN", "DIV"].includes(el.tagName) &&
      !el.matches('input, select, textarea, [aria-invalid="true"], .border-red-500, .border-red-400')
    ) {
      const text = el.textContent?.trim() || "";
      if (!text) return false;
      // Exclude mere single symbols or asterisks
      if (text === "*" || text.length < 2) return false;
    }
    return true;
  });

  if (!errorEl) return false;

  // Find the enclosing field block (label + input + error message)
  const fieldContainer =
    errorEl.closest<HTMLElement>(
      ".space-y-1, .space-y-1.5, .space-y-2, .space-y-4, .space-y-6, fieldset"
    ) ||
    errorEl.parentElement ||
    errorEl;

  // Focus the input/select/control without disrupting smooth scroll
  const input =
    (errorEl.matches("input, select, textarea") ? errorEl : null) ||
    fieldContainer.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button[role="combobox"]'
    );

  // If the error is inside a collapsed accordion or details, expand it first
  const collapsedAccordion = errorEl.closest('[data-state="closed"]');
  if (collapsedAccordion) {
    const parentItem =
      collapsedAccordion.closest('[data-state="closed"]') ||
      collapsedAccordion.parentElement;
    const trigger = parentItem?.querySelector(
      'button[data-state="closed"]'
    ) as HTMLElement | null;
    trigger?.click();

    setTimeout(() => {
      try {
        fieldContainer.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        fieldContainer.scrollIntoView();
      }
      if (input && typeof input.focus === "function") {
        input.focus({ preventScroll: true });
      }
    }, 120);
  }

  // Scroll smoothly to the field
  try {
    fieldContainer.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    fieldContainer.scrollIntoView();
  }

  if (input && typeof input.focus === "function") {
    input.focus({ preventScroll: true });
  }

  return true;
};

/**
 * React hook that sets up an event and mutation observer on onboarding forms.
 * When a form submission is attempted and validation errors appear in the DOM,
 * it automatically scrolls to the first invalid field.
 */
export const useErrorScrollObserver = (
  containerRef?: React.RefObject<HTMLElement | null>
) => {
  useEffect(() => {
    let observer: MutationObserver | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const getRoot = (): HTMLElement | Document =>
      containerRef?.current || document;

    const attemptScroll = (): boolean => {
      const root = getRoot();
      return scrollToFirstError(root);
    };

    const triggerObservation = () => {
      observer?.disconnect();
      if (fallbackTimer) clearTimeout(fallbackTimer);

      const root = getRoot();
      const observeTarget = root instanceof Document ? root.body : root;
      if (!observeTarget) return;

      // 1. If errors are already present in the DOM (e.g. re-clicking submit)
      if (attemptScroll()) return;

      // 2. Observe DOM mutations when React renders error elements
      observer = new MutationObserver(() => {
        if (attemptScroll()) {
          observer?.disconnect();
          if (fallbackTimer) clearTimeout(fallbackTimer);
        }
      });

      observer.observe(observeTarget, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "aria-invalid"],
      });

      // 3. Fallback checks via requestAnimationFrame and short timeouts
      requestAnimationFrame(() => {
        if (attemptScroll()) {
          observer?.disconnect();
          return;
        }

        fallbackTimer = setTimeout(() => {
          attemptScroll();
          observer?.disconnect();
        }, 150);
      });
    };

    const handleSubmit = () => {
      triggerObservation();
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;

      // Check if clicked button is a submit trigger or form action button
      if (
        button.type === "submit" ||
        button.hasAttribute("form") ||
        button.getAttribute("role") === "button" ||
        /submit|continue|save|verify|next/i.test(button.textContent || "")
      ) {
        triggerObservation();
      }
    };

    const rootTarget = containerRef?.current || document;
    rootTarget.addEventListener("submit", handleSubmit, true);
    rootTarget.addEventListener("click", handleClick as EventListener, true);

    return () => {
      rootTarget.removeEventListener("submit", handleSubmit, true);
      rootTarget.removeEventListener(
        "click",
        handleClick as EventListener,
        true
      );
      observer?.disconnect();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [containerRef]);
};
