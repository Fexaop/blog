"use client";

import { useEffect } from "react";

/**
 * Adds a hover/focus copy button to every <pre> inside blog prose.
 * Works with rehype-pretty-code figures and plain markdown code blocks.
 */
export function CodeCopyEnhancer({
  containerSelector = ".prose-sketch",
}: {
  containerSelector?: string;
}) {
  useEffect(() => {
    const root = document.querySelector(containerSelector);
    if (!root) return;

    const pres = root.querySelectorAll("pre");
    const cleanups: Array<() => void> = [];

    pres.forEach((pre) => {
      if (pre.closest(".code-block-wrap")) return;

      const wrap = document.createElement("div");
      wrap.className = "code-block-wrap";
      pre.parentNode?.insertBefore(wrap, pre);
      wrap.appendChild(pre);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy-btn";
      btn.setAttribute("aria-label", "Copy code");
      btn.dataset.copied = "false";
      btn.innerHTML = `<span class="code-copy-label">copy</span>`;
      wrap.appendChild(btn);

      let resetTimer: ReturnType<typeof setTimeout> | undefined;

      const onClick = async () => {
        const code = pre.querySelector("code");
        const text = code?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          btn.dataset.copied = "true";
          const label = btn.querySelector(".code-copy-label");
          if (label) label.textContent = "copied";
          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            btn.dataset.copied = "false";
            if (label) label.textContent = "copy";
          }, 1600);
        } catch {
          const label = btn.querySelector(".code-copy-label");
          if (label) label.textContent = "fail";
          resetTimer = setTimeout(() => {
            if (label) label.textContent = "copy";
          }, 1200);
        }
      };

      btn.addEventListener("click", onClick);
      cleanups.push(() => {
        clearTimeout(resetTimer);
        btn.removeEventListener("click", onClick);
        // unwrap if still in DOM
        if (wrap.parentNode) {
          wrap.parentNode.insertBefore(pre, wrap);
          wrap.remove();
        }
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [containerSelector]);

  return null;
}
