/**
 * Interface for notes.
 * Notes are remarks made by a translator.
 * They are associated to trans-units.
 * Angulars uses notes to store description and meaning.
 * These are handled separately by this library and are not contained in this strcuture.
 */
export interface INote {
    from?: string; // originator (e.g. "reviewer")
    text: string; // the notes text
}
