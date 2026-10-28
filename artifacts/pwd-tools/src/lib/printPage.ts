import { useEffect } from "react";

type Size = "portrait" | "landscape";
const STYLE_ID = "pwd-page-setup";

export function usePrintPage(size: Size = "portrait") {
  useEffect(() => {
    document.getElementById(STYLE_ID)?.remove();
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      @page {
        size: A4 ${size};
        margin: 0;
        @bottom-center {
          content: "DRAFTED BY PRIYANKA JAIN, PWD UDAIPUR";
          font-size: 8pt; font-family: Arial, sans-serif; color: #000;
        }
      }
    `;
    document.head.appendChild(el);
    return () => el.remove();
  }, [size]);
}
