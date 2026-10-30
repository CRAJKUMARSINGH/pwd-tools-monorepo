import { useEffect } from "react";

type Size = "portrait" | "landscape";
const STYLE_ID = "pwd-page-setup";

/**
 * Injects the single document-scoped `@page` rule for the mounted route.
 *
 * `margin: 0` is deliberate — the visible margin comes from the tool's own
 * container padding, and a zero margin is also what suppresses the browser's
 * own header/footer band. The `@bottom-center` margin box is emitted only when
 * a `footer` is passed; omit it and the sheet has no running footer at all.
 */
export function usePrintPage(size: Size = "portrait", footer?: string) {
  useEffect(() => {
    const apply = () => {
      document.getElementById(STYLE_ID)?.remove();
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = `
        @page {
          size: A4 ${size};
          margin: 0;${footer ? `
          @bottom-center {
            content: "${footer}";
            font-size: 8pt; font-family: Arial, sans-serif; color: #000;
          }` : ""}
        }
      `;
      document.head.appendChild(el);
    };

    apply();
    // re-assert immediately before the print snapshot — survives anything else
    // that touches @page while the page is mounted
    window.addEventListener("beforeprint", apply);
    return () => {
      window.removeEventListener("beforeprint", apply);
      document.getElementById(STYLE_ID)?.remove();
    };
  }, [size, footer]);
}
