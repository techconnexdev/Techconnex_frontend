"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (
    el: HTMLElement,
    opts: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      width?: number;
    },
  ) => void;
};

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/**
 * Renders the Google Identity "Sign in with Google" button into `containerRef` when `active`
 * and loads the GSI script if needed. Used for delete-account confirmation when users
 * signed up with Google and do not have a known password.
 */
export function useGoogleDeleteAccountButton(
  containerRef: RefObject<HTMLDivElement | null>,
  active: boolean,
  clientId: string | undefined,
  onCredential: (idToken: string) => void,
) {
  const onCredRef = useRef(onCredential);
  onCredRef.current = onCredential;

  useEffect(() => {
    if (!active || !clientId) return;
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const mountButton = () => {
      const container = containerRef.current;
      if (!container || cancelled) return;

      const init = () => {
        const win = window as unknown as {
          google?: { accounts?: { id?: GoogleAccountsId } };
        };
        const g = win.google?.accounts?.id;
        if (!g || cancelled) return;
        g.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) onCredRef.current(response.credential);
          },
        });
        container.innerHTML = "";
        g.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: Math.min(320, container.clientWidth || 320),
        });
      };

      const win = window as unknown as {
        google?: { accounts?: { id?: GoogleAccountsId } };
      };
      if (win.google?.accounts?.id) {
        init();
        return;
      }

      const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
      if (existing) {
        if (win.google?.accounts?.id) init();
        else existing.addEventListener("load", init, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    };

    timeouts.push(
      setTimeout(() => {
        if (containerRef.current) {
          mountButton();
        } else {
          timeouts.push(
            setTimeout(() => {
              if (!cancelled) mountButton();
            }, 100),
          );
        }
      }, 0),
    );

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
      const el = containerRef.current;
      if (el) el.innerHTML = "";
    };
  }, [active, clientId]);
}
