import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — PWD Tools` : "PWD Tools Suite";
    return () => { document.title = prev; };
  }, [title]);
}
