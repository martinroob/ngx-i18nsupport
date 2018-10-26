/**
 * Created by martin on 05.05.2017.
 * A part of a parsed message.
 * Can be a text, a placeholder, a tag
 */

export enum ParsedMessagePartType {
    TEXT,
    PLACEHOLDER,
    START_TAG,
    END_TAG,
    EMPTY_TAG,
    ICU_MESSAGE,
    ICU_MESSAGE_REF
}

export abstract class ParsedMessagePart {

    constructor(public type: ParsedMessagePartType) {

    }

    /**
     * String representation of the part.
     * @param format optional way to determine the exact syntax.
     * Allowed formats are defined as constants NORMALIZATION_FORMAT...
     */
    public abstract asDisplayString(format?: string): string;

}