import {ITranslationMessagesFile, ITransUnit, INormalizedMessage, STATE_TRANSLATED} from '../api';
import {AbstractTranslationMessagesFile} from './abstract-translation-messages-file';
import {isNullOrUndefined, isString} from 'util';
import {ParsedMessage} from './parsed-message';
import {AbstractMessageParser} from './abstract-message-parser';
/**
 * Created by roobm on 10.05.2017.
 * Abstract superclass for all implementations of ITransUnit.
 */

export abstract class AbstractTransUnit implements ITransUnit {

    private _sourceContentNormalized: ParsedMessage;

    constructor(protected _element: Element, protected _id: string, protected _translationMessagesFile: ITranslationMessagesFile) {

    }

    public get id(): string {
        return this._id;
    }

    /**
     * The file the unit belongs to.,
     */
    translationMessagesFile(): ITranslationMessagesFile {
        return this._translationMessagesFile;
    }

    /**
     * The original text value, that is to be translated.
     * Contains all markup, depends on the concrete format used.
     */
    abstract sourceContent(): string;

    /**
     * Test, wether setting of source content is supported.
     * If not, setSourceContent in trans-unit will do nothing.
     * xtb does not support this, all other formats do.
     */
    supportsSetSourceContent(): boolean {
        return true;
    }

    /**
     * Set new source content in the transunit.
     * Normally, this is done by ng-extract.
     * Method only exists to allow xliffmerge to merge missing changed source content.
     * @param newContent the new content.
     */
    abstract setSourceContent(newContent: string);

    /**
     * The original text value, that is to be translated, as normalized message.
     */
    public sourceContentNormalized(): ParsedMessage {
        if (isNullOrUndefined(this._sourceContentNormalized)) {
            this._sourceContentNormalized = this.createSourceContentNormalized();
        }
        return this._sourceContentNormalized;
    }

    /**
     * The original text value, that is to be translated, as normalized message.
     */
    abstract createSourceContentNormalized(): ParsedMessage;

    /**
     * The translated value.
     * Contains all markup, depends on the concrete format used.
     */
    abstract targetContent(): string;

    /**
     * The translated value as normalized message.
     * All placeholders are replaced with {{n}} (starting at 0)
     * and all embedded html is replaced by direct html markup.
     */
    abstract targetContentNormalized(): INormalizedMessage;

    /**
     * State of the translation as stored in the xml.
     */
    abstract nativeTargetState(): string;

    /**
     * State of the translation.
     * (on of new, translated, final)
     * Return values are defined as Constants STATE_...
     */
    public targetState(): string {
        const nativeState = this.nativeTargetState();
        return this.mapNativeStateToState(nativeState);
    }

    /**
     * Map an abstract state (new, translated, final) to a concrete state used in the xml.
     * Returns the state to be used in the xml.
     * @param state one of Constants.STATE...
     * @returns a native state (depends on concrete format)
     * @throws error, if state is invalid.
     */
    protected abstract mapStateToNativeState(state: string): string;

    /**
     * Map a native state (found in the document) to an abstract state (new, translated, final).
     * Returns the abstract state.
     * @param nativeState
     */
    protected abstract mapNativeStateToState(nativeState: string): string;

    /**
     * set state in xml.
     * @param nativeState
     */
    protected abstract setNativeTargetState(nativeState: string);

    /**
     * Modify the target state.
     * @param newState one of the 3 allowed target states new, translated, final.
     * Constants STATE_...
     * Invalid states throw an error.
     */
    setTargetState(newState: string) {
        this.setNativeTargetState(this.mapStateToNativeState(newState));
        if (this.translationMessagesFile() instanceof AbstractTranslationMessagesFile) {
            (<AbstractTranslationMessagesFile> this.translationMessagesFile()).countNumbers();
        }
    }

    /**
     * All the source elements in the trans unit.
     * The source element is a reference to the original template.
     * It contains the name of the template file and a line number with the position inside the template.
     * It is just a help for translators to find the context for the translation.
     * This is set when using Angular 4.0 or greater.
     * Otherwise it just returns an empty array.
     */
    abstract sourceReferences(): {sourcefile: string, linenumber: number}[];

    /**
     * Test, wether setting of source refs is supported.
     * If not, setSourceReferences will do nothing.
     * xtb does not support this, all other formats do.
     */
    public supportsSetSourceReferences(): boolean {
        return true;
    }

    /**
     * Set source ref elements in the transunit.
     * Normally, this is done by ng-extract.
     * Method only exists to allow xliffmerge to merge missing source refs.
     * @param sourceRefs the sourcerefs to set. Old ones are removed.
     */
    abstract setSourceReferences(sourceRefs: {sourcefile: string, linenumber: number}[]);

    /**
     * The description set in the template as value of the i18n-attribute.
     * e.g. i18n="mydescription".
     */
    abstract description(): string;

    /**
     * The meaning (intent) set in the template as value of the i18n-attribute.
     * This is the part in front of the | symbol.
     * e.g. i18n="meaning|mydescription".
     */
    abstract meaning(): string;

    /**
     * Test, wether setting of description and meaning is supported.
     * If not, setDescription and setMeaning will do nothing.
     * xtb does not support this, all other formats do.
     */
    public supportsSetDescriptionAndMeaning(): boolean {
        return true;
    }

    /**
     * Change description property of trans-unit.
     * @param {string} description
     */
    abstract setDescription(description: string);

    /**
     * Change meaning property of trans-unit.
     * @param {string} meaning
     */
    abstract setMeaning(meaning: string);

    /**
     * The real xml element used for the trans unit.
     * (internal usage only, a client should never need this)
     * @return {Element}
     */
    public asXmlElement(): Element {
        return this._element;
    }

    /**
     * Copy source to target to use it as dummy translation.
     * Returns a changed copy of this trans unit.
     * receiver is not changed.
     * (internal usage only, a client should call importNewTransUnit on ITranslationMessageFile)
     */
    abstract cloneWithSourceAsTarget(isDefaultLang: boolean, copyContent: boolean, targetFile: ITranslationMessagesFile): AbstractTransUnit;

    /**
     * Copy source to target to use it as dummy translation.
     * (internal usage only, a client should call createTranslationFileForLang on ITranslationMessageFile)
     */
    abstract useSourceAsTarget(isDefaultLang: boolean, copyContent: boolean);

    /**
     * Translate the trans unit.
     * @param translation the translated string or (preferred) a normalized message.
     * The pure string can contain any markup and will not be checked.
     * So it can damage the document.
     * A normalized message prevents this.
     */
    public translate(translation: string | INormalizedMessage) {
        let translationNative: string;
        if (isString(translation)) {
            translationNative = <string> translation;
        } else {
            translationNative = (<INormalizedMessage> translation).asNativeString();
        }
        this.translateNative(translationNative);
        this.setTargetState(STATE_TRANSLATED);
    }

    /**
     * Return a parser used for normalized messages.
     */
    protected abstract messageParser(): AbstractMessageParser;

    /**
     * Test, wether message looks like ICU message.
     * @param {string} message
     * @return {boolean}
     */
    public isICUMessage(message: string): boolean {
        return this.messageParser().isICUMessageStart(message);
    }

    /**
     * Set the translation to a given string (including markup).
     * @param translation
     */
    protected abstract translateNative(translation: string);
}