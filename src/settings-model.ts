export interface ViewerSettings {
  noteClass: string;
}
export const DEFAULT_SETTINGS: ViewerSettings = { noteClass: '' };
export function validNoteClass(value: string): boolean {
  return value === '' || /^[a-zA-Z_][\w-]*$/.test(value);
}
export function normalizeSettings(value: unknown): ViewerSettings {
  const data = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const noteClass =
    typeof data.noteClass === 'string' ? data.noteClass.trim() : DEFAULT_SETTINGS.noteClass;
  return {
    noteClass: validNoteClass(noteClass) ? noteClass : DEFAULT_SETTINGS.noteClass,
  };
}
