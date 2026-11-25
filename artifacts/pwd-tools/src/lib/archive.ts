/**
 * Generic "last N entries" archive stored in localStorage.
 * Each tool has its own key. Entries are stamped with date/time and a label.
 */

export interface ArchiveEntry<T = unknown> {
    id: string;          // unique: timestamp ms
    label: string;       // human-readable summary shown in the list
    savedAt: string;     // ISO string
    data: T;
}

const MAX = 10;

export function archiveSave<T>(key: string, label: string, data: T): void {
    try {
        const existing: ArchiveEntry<T>[] = archiveLoad<T>(key);
        const entry: ArchiveEntry<T> = {
            id: Date.now().toString(),
            label,
            savedAt: new Date().toISOString(),
            data,
        };
        // Prepend newest, keep last MAX
        const updated = [entry, ...existing].slice(0, MAX);
        localStorage.setItem(key, JSON.stringify(updated));
    } catch {
        // localStorage quota — silently skip
    }
}

export function archiveLoad<T>(key: string): ArchiveEntry<T>[] {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function archiveDelete(key: string, id: string): void {
    try {
        const existing = archiveLoad(key);
        localStorage.setItem(key, JSON.stringify(existing.filter(e => e.id !== id)));
    } catch {
        // Storage may be unavailable. Leave the existing archive intact.
    }
}

/** Format ISO string → readable Hindi-style date */
export function formatSavedAt(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}
