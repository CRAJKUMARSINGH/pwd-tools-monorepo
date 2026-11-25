/**
 * useTranslit — Roman-to-Hindi transliteration hook for input / textarea
 *
 * Usage:
 *   const tl = useTranslit(enabled, value, onChange);
 *   <input {...tl.bind} />
 *
 * Behaviour:
 *  - When `enabled` is true, pressing Space / Enter / । automatically
 *    converts the last typed Roman word to Devanagari in-place.
 *  - Ctrl+Z undoes the last conversion (restores the Roman word).
 *  - When `enabled` is false the input/textarea behaves normally.
 */

import { useRef } from "react";
import { convertAtCaret } from "./transliterate";

export interface TranslitBindings {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    lang: "hi" | undefined;
    spellCheck: boolean;
}

export function useTranslit(
    enabled: boolean,
    value: string,
    onChange: (v: string) => void,
): TranslitBindings {
    const prevRef = useRef<{ before: string; after: string; start: number; end: number } | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        prevRef.current = null;
        onChange(e.target.value);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
        if (!enabled || e.nativeEvent.isComposing) return;
        const input = e.currentTarget;
        const restore = prevRef.current;

        // Ctrl+Z → undo last conversion
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z" && restore?.after === value) {
            e.preventDefault();
            prevRef.current = null;
            onChange(restore.before);
            requestAnimationFrame(() => input.setSelectionRange(restore.start, restore.end));
            return;
        }

        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const separator = e.key === "Enter" && input.tagName === "TEXTAREA" ? "\n" : e.key;
        if (separator !== " " && separator !== "\n" && separator !== "।") return;
        const start = input.selectionStart ?? value.length;
        const end = input.selectionEnd ?? start;
        const edit = convertAtCaret(value, start, end, separator);
        if (!edit) return;
        e.preventDefault();
        prevRef.current = { before: value, after: edit.value, start, end };
        onChange(edit.value);
        requestAnimationFrame(() => input.setSelectionRange(edit.caret, edit.caret));
    }

    return {
        value,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        lang: enabled ? "hi" : undefined,
        spellCheck: false,
    };
}
