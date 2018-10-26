import {INormalizedMessage} from './i-normalized-message';
/**
 * Created by martin on 02.06.2017.
 * Interfaces for handling of ICU Messages.
 */

/**
 * A message category, which is a part of an ICU message.
 * E.g. the ICU message {wolves, plural, =0 {no wolves} =1 {one wolf} =2 {two wolves} other {a wolf pack}}
 * has 4 category objects with the categories =0, =1, =2, other.
 */
export interface IICUMessageCategory {

    /**
     * Fix part.
     * For plural mesages the category is "=0" or "=1" or "few" or "other"...
     * For select messages it is the matching key.
     */
    getCategory(): string;

    /**
     * Translatable part.
     */
    getMessageNormalized(): INormalizedMessage;
}

/**
 * An ICU message.
 */
export interface IICUMessage {

    /**
     * Is it a plural message?
     */
    isPluralMessage(): boolean;

    /**
     * Is it a select message?
     */
    isSelectMessage(): boolean;

    /**
     * All the parts of the message.
     * E.g. the ICU message {wolves, plural, =0 {no wolves} =1 {one wolf} =2 {two wolves} other {a wolf pack}}
     * has 4 category objects with the categories =0, =1, =2, other.
     */
    getCategories(): IICUMessageCategory[];

    /**
     * Returns the icu message content as format dependent native string.
     * This is, how it is stored, something like '{x, plural, =0 {..}'
     */
    asNativeString(): string;

    /**
     * Translate message and return a new, translated message
     * @param translation the translation (hashmap of categories and translations).
     * @return new message wit translated content.
     */
    translate(translation: IICUMessageTranslation): IICUMessage;
}

/**
 * A translation of an ICU message.
 * Contains the translation for every category.
 * The translation can be a string, which is the normalized form of the translation.
 * Or it can be a complex translation, which is for the case of ICU messages embedded in ICU messages.
 */
export type IICUMessageTranslation = { [category: string]: string|IICUMessageTranslation};