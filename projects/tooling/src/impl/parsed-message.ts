import {ParsedMessagePart, ParsedMessagePartType} from './parsed-message-part';
import {ParsedMessagePartText} from './parsed-message-part-text';
import {ParsedMessagePartPlaceholder} from './parsed-message-part-placeholder';
import {ParsedMessagePartStartTag} from './parsed-message-part-start-tag';
import {ParsedMessagePartEndTag} from './parsed-message-part-end-tag';
import {INormalizedMessage, ValidationErrors} from '../api/i-normalized-message';
import {DOMUtilities} from './dom-utilities';
import {IMessageParser} from './i-message-parser';
import {format, isNullOrUndefined} from 'util';
import {IICUMessage, IICUMessageTranslation} from '../api/i-icu-message';
import {ParsedMessagePartICUMessage} from './parsed-message-part-icu-message';
import {ParsedMessagePartICUMessageRef} from './parsed-message-part-icu-message-ref';
import {ICUMessage} from './icu-message';
import {ParsedMessagePartEmptyTag} from './parsed-message-part-empty-tag';
/**
 * Created by martin on 05.05.2017.
 * A message text read from a translation file.
 * Can contain placeholders, tags, text.
 * This class is a representation independent of the concrete format.
 */
export class ParsedMessage implements INormalizedMessage {

    /**
     * Parser that created this message (determines the native format).
     */
    private _parser: IMessageParser;

    /**
     * The message where this one stems from as translation.
     * Optional, set only for messages created by calling translate.
     */
    private sourceMessage: ParsedMessage;

    /**
     * The parts of the message.
     */
    private _parts: ParsedMessagePart[];

    /**
     * messages xml representation.
     */
    private _xmlRepresentation: Element;

    constructor(parser: IMessageParser, sourceMessage: ParsedMessage) {
        this._parser = parser;
        this.sourceMessage = sourceMessage;
        this._parts = [];
    }

    /**
     * Get the parser (for tests only, not part of API)
     * @return {IMessageParser}
     */
    getParser(): IMessageParser {
        return this._parser;
    }

    /**
     * Create a new normalized message as a translation of this one.
     * @param normalizedString the translation in normalized form.
     * If the message is an ICUMessage (getICUMessage returns a value), use translateICUMessage instead.
     * @throws an error if normalized string is not well formed.
     * Throws an error too, if this is an ICU message.
     */
    translate(normalizedString: string): INormalizedMessage {
        if (isNullOrUndefined(this.getICUMessage())) {
            return this._parser.parseNormalizedString(<string> normalizedString, this);
        } else {
            throw new Error(format('cannot translate ICU message with simple string, use translateICUMessage() instead ("%s", "%s")', normalizedString, this.asNativeString()));
        }
    }

    /**
     * Create a new normalized icu message as a translation of this one.
     * @param icuTranslation the translation, this is the translation of the ICU message,
     * which is not a string, but a collections of the translations of the different categories.
     * The message must be an ICUMessage (getICUMessage returns a value)
     * @throws an error if normalized string is not well formed.
     * Throws an error too, if this is not an ICU message.
     */
    translateICUMessage(icuTranslation: IICUMessageTranslation): INormalizedMessage {
        const icuMessage: IICUMessage = this.getICUMessage();
        if (isNullOrUndefined(icuMessage)) {
            throw new Error(format('this is not an ICU message, use translate() instead ("%s", "%s")', icuTranslation,  this.asNativeString()));
        } else {
            const translatedICUMessage: IICUMessage = icuMessage.translate(icuTranslation);
            return this._parser.parseICUMessage(translatedICUMessage.asNativeString(), this);
        }
    }

    /**
     * Create a new normalized message from a native xml string as a translation of this one.
     * @param nativeString xml string in the format of the underlying file format.
     * Throws an error if native string is not acceptable.
     */
    translateNativeString(nativeString: string): INormalizedMessage {
        return this._parser.createNormalizedMessageFromXMLString(nativeString, this);
    }

    /**
     * normalized message as string.
     * @param format optional way to determine the exact syntax.
     * Allowed formats are defined as constants NORMALIZATION_FORMAT...
     */
    public asDisplayString(format?: string) {
        return this._parts.map((part) => part.asDisplayString(format)).join('');
    }

    /**
     * Returns the message content as format dependent native string.
     * Includes all format specific markup like <ph id="INTERPOLATION" ../> ..
     */
    asNativeString(): string {
        if (isNullOrUndefined(this.getICUMessage())) {
            return DOMUtilities.getXMLContent(this._xmlRepresentation);
        } else {
            return this.getICUMessage().asNativeString();
        }
    }

    /**
     * Validate the message.
     * @return null, if ok, error object otherwise.
     */
    public validate(): ValidationErrors | null {
        let hasErrors = false;
        let errors: ValidationErrors = {};
        let e;
        e = this.checkPlaceholderAdded();
        if (!isNullOrUndefined(e)) {
            errors.placeholderAdded = e;
            hasErrors = true;
        }
        e = this.checkICUMessageRefRemoved();
        if (!isNullOrUndefined(e)) {
            errors.icuMessageRefRemoved = e;
            hasErrors = true;
        }
        e = this.checkICUMessageRefAdded();
        if (!isNullOrUndefined(e)) {
            errors.icuMessageRefAdded = e;
            hasErrors = true;
        }
        return hasErrors ? errors : null;
    }

    /**
     * Validate the message, check for warnings only.
     * A warning shows, that the message is acceptable, but misses something.
     * E.g. if you remove a placeholder or a special tag from the original message, this generates a warning.
     * @return null, if no warning, warnings as error object otherwise.
     */
    validateWarnings(): ValidationErrors | null {
        let hasWarnings = false;
        let warnings: ValidationErrors = {};
        let w;
        w = this.checkPlaceholderRemoved();
        if (!isNullOrUndefined(w)) {
            warnings.placeholderRemoved = w;
            hasWarnings = true;
        }
        w = this.checkTagRemoved();
        if (!isNullOrUndefined(w)) {
            warnings.tagRemoved = w;
            hasWarnings = true;
        }
        w = this.checkTagAdded();
        if (!isNullOrUndefined(w)) {
            warnings.tagAdded = w;
            hasWarnings = true;
        }
        return hasWarnings ? warnings : null;
    }

    /**
     * If this message is an ICU message, returns its structure.
     * Otherwise this method returns null.
     * @return ICUMessage or null.
     */
    public getICUMessage(): IICUMessage {
        if (this._parts.length === 1 && this._parts[0].type === ParsedMessagePartType.ICU_MESSAGE) {
            const icuPart = <ParsedMessagePartICUMessage> this._parts[0];
            return icuPart.getICUMessage();
        } else {
            return null;
        }
    }


    /**
     * Check for added placeholder.
     * @return null or message, if fulfilled.
     */
    private checkPlaceholderAdded(): any {
        let e = null;
        let suspiciousIndexes = [];
        if (this.sourceMessage) {
            let sourcePlaceholders = this.sourceMessage.allPlaceholders();
            let myPlaceholders = this.allPlaceholders();
            myPlaceholders.forEach((index) => {
                if (!sourcePlaceholders.has(index)) {
                    suspiciousIndexes.push(index);
                }
            });
        }
        if (suspiciousIndexes.length === 1) {
            e = 'added placeholder ' + suspiciousIndexes[0] + ', which is not in original message';
        } else if (suspiciousIndexes.length > 1) {
            let allSuspiciousIndexes = '';
            let first = true;
            suspiciousIndexes.forEach((index) => {
                if (!first) {
                    allSuspiciousIndexes = allSuspiciousIndexes + ', ';
                }
                allSuspiciousIndexes = allSuspiciousIndexes + index;
                first = false;
            });
            e = 'added placeholders ' + allSuspiciousIndexes + ', which are not in original message';
        }
        return e;
    }

    /**
     * Check for removed placeholder.
     * @return null or message, if fulfilled.
     */
    private checkPlaceholderRemoved(): any {
        let w = null;
        let suspiciousIndexes = [];
        if (this.sourceMessage) {
            let sourcePlaceholders = this.sourceMessage.allPlaceholders();
            let myPlaceholders = this.allPlaceholders();
            sourcePlaceholders.forEach((index) => {
                if (!myPlaceholders.has(index)) {
                    suspiciousIndexes.push(index);
                }
            });
        }
        if (suspiciousIndexes.length === 1) {
            w = 'removed placeholder ' + suspiciousIndexes[0] + ' from original message';
        } else if (suspiciousIndexes.length > 1) {
            let allSuspiciousIndexes = '';
            let first = true;
            suspiciousIndexes.forEach((index) => {
                if (!first) {
                    allSuspiciousIndexes = allSuspiciousIndexes + ', ';
                }
                allSuspiciousIndexes = allSuspiciousIndexes + index;
                first = false;
            });
            w = 'removed placeholders ' + allSuspiciousIndexes + ' from original message';
        }
        return w;
    }

    /**
     * Check for added ICU Message Refs.
     * @return null or message, if fulfilled.
     */
    private checkICUMessageRefAdded(): any {
        let e = null;
        let suspiciousIndexes = [];
        if (this.sourceMessage) {
            let sourceICURefs = this.sourceMessage.allICUMessageRefs();
            let myICURefs = this.allICUMessageRefs();
            myICURefs.forEach((index) => {
                if (!sourceICURefs.has(index)) {
                    suspiciousIndexes.push(index);
                }
            });
        }
        if (suspiciousIndexes.length === 1) {
            e = 'added ICU message reference ' + suspiciousIndexes[0] + ', which is not in original message';
        } else if (suspiciousIndexes.length > 1) {
            let allSuspiciousIndexes = '';
            let first = true;
            suspiciousIndexes.forEach((index) => {
                if (!first) {
                    allSuspiciousIndexes = allSuspiciousIndexes + ', ';
                }
                allSuspiciousIndexes = allSuspiciousIndexes + index;
                first = false;
            });
            e = 'added ICU message references ' + allSuspiciousIndexes + ', which are not in original message';
        }
        return e;
    }

    /**
     * Check for removed ICU Message Refs.
     * @return null or message, if fulfilled.
     */
    private checkICUMessageRefRemoved(): any {
        let e = null;
        let suspiciousIndexes = [];
        if (this.sourceMessage) {
            let sourceICURefs = this.sourceMessage.allICUMessageRefs();
            let myICURefs = this.allICUMessageRefs();
            sourceICURefs.forEach((index) => {
                if (!myICURefs.has(index)) {
                    suspiciousIndexes.push(index);
                }
            });
        }
        if (suspiciousIndexes.length === 1) {
            e = 'removed ICU message reference ' + suspiciousIndexes[0] + ' from original message';
        } else if (suspiciousIndexes.length > 1) {
            let allSuspiciousIndexes = '';
            let first = true;
            suspiciousIndexes.forEach((index) => {
                if (!first) {
                    allSuspiciousIndexes = allSuspiciousIndexes + ', ';
                }
                allSuspiciousIndexes = allSuspiciousIndexes + index;
                first = false;
            });
            e = 'removed ICU message references ' + allSuspiciousIndexes + ' from original message';
        }
        return e;
    }

    /**
     * Get all indexes of placeholders used in the message.
     */
    private allPlaceholders(): Set<number> {
        let result = new Set<number>();
        this.parts().forEach((part) => {
            if (part.type === ParsedMessagePartType.PLACEHOLDER) {
                let index = (<ParsedMessagePartPlaceholder> part).index();
                result.add(index);
            }
        });
        return result;
    }

    /**
     * Return the disp-Attribute of placeholder
     * @param {number} index of placeholder
     * @return {string} disp or null
     */
    public getPlaceholderDisp(index: number): string {
        let placeHolder: ParsedMessagePartPlaceholder = null;
        this.parts().forEach((part) => {
            if (part.type === ParsedMessagePartType.PLACEHOLDER) {
                const phPart: ParsedMessagePartPlaceholder = <ParsedMessagePartPlaceholder> part;
                if (phPart.index() === index) {
                    placeHolder = phPart;
                }
            }
        });
        return placeHolder ? placeHolder.disp() : null;
    }

    /**
     * Get all indexes of ICU message refs used in the message.
     */
    private allICUMessageRefs(): Set<number> {
        let result = new Set<number>();
        this.parts().forEach((part) => {
            if (part.type === ParsedMessagePartType.ICU_MESSAGE_REF) {
                let index = (<ParsedMessagePartICUMessageRef> part).index();
                result.add(index);
            }
        });
        return result;
    }

    /**
     * Return the disp-Attribute of icu message ref
     * @param {number} index of ref
     * @return {string} disp or null
     */
    public getICUMessageRefDisp(index: number): string {
        let icuMessageRefPart: ParsedMessagePartICUMessageRef = null;
        this.parts().forEach((part) => {
            if (part.type === ParsedMessagePartType.ICU_MESSAGE_REF) {
                const refPart: ParsedMessagePartICUMessageRef = <ParsedMessagePartICUMessageRef> part;
                if (refPart.index() === index) {
                    icuMessageRefPart = refPart;
                }
            }
        });
        return icuMessageRefPart ? icuMessageRefPart.disp() : null;
    }

    /**
     * Check for added tags.
     * @return null or message, if fulfilled.
     */
    private checkTagAdded(): any {
        let e = null;
        let suspiciousTags = [];
        if (this.sourceMessage) {
            let sourceTags = this.sourceMessage.allTags();
            let myTags = this.allTags();
            myTags.forEach((tagName) => {
                if (!sourceTags.has(tagName)) {
                    suspiciousTags.push(tagName);
                }
            });
        }
        if (suspiciousTags.length === 1) {
            e = 'added tag <' + suspiciousTags[0] + '>, which is not in original message';
        } else if (suspiciousTags.length > 1) {
            let allSuspiciousTags = '';
            let first = true;
            suspiciousTags.forEach((tag) => {
                if (!first) {
                    allSuspiciousTags = allSuspiciousTags + ', ';
                }
                allSuspiciousTags = allSuspiciousTags + '<' + tag + '>';
                first = false;
            });
            e = 'added tags ' + allSuspiciousTags + ', which are not in original message';
        }
        return e;
    }

    /**
     * Check for removed tags.
     * @return null or message, if fulfilled.
     */
    private checkTagRemoved(): any {
        let w = null;
        let suspiciousTags = [];
        if (this.sourceMessage) {
            let sourceTags = this.sourceMessage.allTags();
            let myTags = this.allTags();
            sourceTags.forEach((tagName) => {
                if (!myTags.has(tagName)) {
                    suspiciousTags.push(tagName);
                }
            });
        }
        if (suspiciousTags.length === 1) {
            w = 'removed tag <' + suspiciousTags[0] + '> from original message';
        } else if (suspiciousTags.length > 1) {
            let allSuspiciousTags = '';
            let first = true;
            suspiciousTags.forEach((tag) => {
                if (!first) {
                    allSuspiciousTags = allSuspiciousTags + ', ';
                }
                allSuspiciousTags = allSuspiciousTags + '<' + tag + '>';
                first = false;
            });
            w = 'removed tags ' + allSuspiciousTags + ' from original message';
        }
        return w;
    }

    /**
     * Get all tag names used in the message.
     */
    private allTags(): Set<string> {
        let result = new Set<string>();
        this.parts().forEach((part) => {
            if (part.type === ParsedMessagePartType.START_TAG || part.type === ParsedMessagePartType.EMPTY_TAG) {
                let tagName = (<ParsedMessagePartStartTag> part).tagName();
                result.add(tagName);
            }
        });
        return result;
    }

    public parts(): ParsedMessagePart[] {
        return this._parts;
    }

    setXmlRepresentation(xmlRepresentation: Element) {
        this._xmlRepresentation = xmlRepresentation;
    }

    addText(text: string) {
        this._parts.push(new ParsedMessagePartText(text));
    }

    addPlaceholder(index: number, disp: string) {
        this._parts.push(new ParsedMessagePartPlaceholder(index, disp));
    }

    addStartTag(tagname: string, idcounter: number) {
        this._parts.push(new ParsedMessagePartStartTag(tagname, idcounter));
    }

    addEndTag(tagname: string) {
        // check if well formed
        const openTag = this.calculateOpenTagName();
        if (!openTag || openTag !== tagname) {
            // oops, not well formed
            throw new Error(format('unexpected close tag %s (currently open is %s, native xml is "%s")', tagname, openTag, this.asNativeString()));
        }
        this._parts.push(new ParsedMessagePartEndTag(tagname));
    }

    addEmptyTag(tagname: string, idcounter: number) {
        this._parts.push(new ParsedMessagePartEmptyTag(tagname, idcounter));
    }

    addICUMessageRef(index: number, disp) {
        this._parts.push(new ParsedMessagePartICUMessageRef(index, disp));
    }

    addICUMessage(text: string) {
        this._parts.push(new ParsedMessagePartICUMessage(text, this._parser));
    }

    /**
     * Determine, wether there is an open tag, that is not closed.
     * Returns the latest one or null, if there is no open tag.
     */
    private calculateOpenTagName(): string {
        let openTags = [];
        this._parts.forEach((part) => {
            switch (part.type) {
                case ParsedMessagePartType.START_TAG:
                    openTags.push((<ParsedMessagePartStartTag> part).tagName());
                    break;
                case ParsedMessagePartType.END_TAG:
                    const tagName = (<ParsedMessagePartEndTag> part).tagName();
                    if (openTags.length === 0 || openTags[openTags.length - 1] !== tagName) {
                        // oops, not well formed
                        const openTag = (openTags.length === 0) ? 'nothing' : openTags[openTags.length - 1];
                        throw new Error(format('unexpected close tag %s (currently open is %s, native xml is "%s")', tagName, openTag, this.asNativeString()));
                    }
                    openTags.pop();
            }
        });
        return openTags.length === 0 ? null : openTags[openTags.length - 1];
    }
}