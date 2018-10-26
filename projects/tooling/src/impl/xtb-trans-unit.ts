import {isNullOrUndefined} from 'util';
import {ITranslationMessagesFile, ITransUnit} from '../api';
import {DOMUtilities} from './dom-utilities';
import {INormalizedMessage} from '../api/i-normalized-message';
import {AbstractTransUnit} from './abstract-trans-unit';
import {XmbMessageParser} from './xmb-message-parser';
import {ParsedMessage} from './parsed-message';
import {AbstractMessageParser} from './abstract-message-parser';
/**
 * Created by martin on 23.05.2017.
 * A Translation Unit in an XTB file.
 */

export class XtbTransUnit extends AbstractTransUnit implements ITransUnit {

    private _sourceTransUnitFromMaster: AbstractTransUnit;

    constructor(_element: Element, _id: string, _translationMessagesFile: ITranslationMessagesFile, _sourceTransUnitFromMaster: AbstractTransUnit) {
        super(_element, _id, _translationMessagesFile);
        this._sourceTransUnitFromMaster = _sourceTransUnitFromMaster;
    }

    /**
     * Get content to translate.
     * Source parts are excluded here.
     * @return {string}
     */
    public sourceContent(): string {
        if (this._sourceTransUnitFromMaster) {
            return this._sourceTransUnitFromMaster.sourceContent();
        } else {
            return null;
        }
    }

    /**
     * Test, wether setting of source content is supported.
     * If not, setSourceContent in trans-unit will do nothing.
     * xtb does not support this, all other formats do.
     */
    supportsSetSourceContent(): boolean {
        return false;
    }

    /**
     * Set new source content in the transunit.
     * Normally, this is done by ng-extract.
     * Method only exists to allow xliffmerge to merge missing changed source content.
     * @param newContent the new content.
     */
    public setSourceContent(newContent: string) {
        // xtb has no source content, they are part of the master
    }

    /**
     * Return a parser used for normalized messages.
     */
    protected messageParser(): AbstractMessageParser {
        return new XmbMessageParser(); // no typo!, Same as for Xmb
    }

    /**
     * The original text value, that is to be translated, as normalized message.
     */
    public createSourceContentNormalized(): ParsedMessage {
        if (this._sourceTransUnitFromMaster) {
            return this._sourceTransUnitFromMaster.createSourceContentNormalized();
        } else {
            return null;
        }
    }

    /**
     * the translated value (containing all markup, depends on the concrete format used).
     */
    public targetContent(): string {
        return DOMUtilities.getXMLContent(this._element);
    }

    /**
     * the translated value, but all placeholders are replaced with {{n}} (starting at 0)
     * and all embedded html is replaced by direct html markup.
     */
    targetContentNormalized(): INormalizedMessage {
        return this.messageParser().createNormalizedMessageFromXML(this._element, this.sourceContentNormalized());
    }

    /**
     * State of the translation.
     * (not supported in xmb)
     * If we have a master, we assumed it is translated if the content is not the same as the masters one.
     */
    public nativeTargetState(): string {
        if (this._sourceTransUnitFromMaster) {
            let sourceContent = this._sourceTransUnitFromMaster.sourceContent();
            if (!sourceContent || sourceContent === this.targetContent() || !this.targetContent()) {
                return 'new';
            } else {
                return 'final';
            }
        }
        return null; // not supported in xmb
    }

    /**
     * Map an abstract state (new, translated, final) to a concrete state used in the xml.
     * Returns the state to be used in the xml.
     * @param state one of Constants.STATE...
     * @returns a native state (depends on concrete format)
     * @throws error, if state is invalid.
     */
    protected mapStateToNativeState(state: string): string {
        return state;
    }

    /**
     * Map a native state (found in the document) to an abstract state (new, translated, final).
     * Returns the abstract state.
     * @param nativeState
     */
    protected mapNativeStateToState(nativeState: string): string {
        return nativeState;
    }

    /**
     * set state in xml.
     * (not supported in xmb)
     * @param nativeState
     */
    protected setNativeTargetState(nativeState: string) {
        // TODO some logic to store it anywhere
    }

    /**
     * All the source elements in the trans unit.
     * The source element is a reference to the original template.
     * It contains the name of the template file and a line number with the position inside the template.
     * It is just a help for translators to find the context for the translation.
     * This is set when using Angular 4.0 or greater.
     * Otherwise it just returns an empty array.
     */
    public sourceReferences(): { sourcefile: string, linenumber: number }[] {
        if (this._sourceTransUnitFromMaster) {
            return this._sourceTransUnitFromMaster.sourceReferences();
        } else {
            return [];
        }
    }

    /**
     * Test, wether setting of source refs is supported.
     * If not, setSourceReferences will do nothing.
     * xtb does not support this, all other formats do.
     */
    public supportsSetSourceReferences(): boolean {
        return false;
    }

    /**
     * Set source ref elements in the transunit.
     * Normally, this is done by ng-extract.
     * Method only exists to allow xliffmerge to merge missing source refs.
     * @param sourceRefs the sourcerefs to set. Old ones are removed.
     */
    public setSourceReferences(sourceRefs: {sourcefile: string, linenumber: number}[]) {
        // xtb has no source refs, they are part of the master
    }

    /**
     * The description set in the template as value of the i18n-attribute.
     * e.g. i18n="mydescription".
     * In xtb only the master stores it.
     */
    public description(): string {
        if (this._sourceTransUnitFromMaster) {
            return this._sourceTransUnitFromMaster.description();
        } else {
            return null;
        }
    }

    /**
     * The meaning (intent) set in the template as value of the i18n-attribute.
     * This is the part in front of the | symbol.
     * e.g. i18n="meaning|mydescription".
     * In xtb only the master stores it.
     */
    public meaning(): string {
        if (this._sourceTransUnitFromMaster) {
            return this._sourceTransUnitFromMaster.meaning();
        } else {
            return null;
        }
    }

    /**
     * Test, wether setting of description and meaning is supported.
     * If not, setDescription and setMeaning will do nothing.
     * xtb does not support this, all other formats do.
     */
    public supportsSetDescriptionAndMeaning(): boolean {
        return false;
    }

    /**
     * Change description property of trans-unit.
     * @param {string} description
     */
    public setDescription(description: string) {
        // not supported, do nothing
    }

    /**
     * Change meaning property of trans-unit.
     * @param {string} meaning
     */
    public setMeaning(meaning: string) {
        // not supported, do nothing
    }

    /**
     * Copy source to target to use it as dummy translation.
     * Returns a changed copy of this trans unit.
     * receiver is not changed.
     * (internal usage only, a client should call importNewTransUnit on ITranslationMessageFile)
     * In xtb there is nothing to do, because there is only a target, no source.
     */
    public cloneWithSourceAsTarget(isDefaultLang: boolean, copyContent: boolean, targetFile: ITranslationMessagesFile): AbstractTransUnit {
        return this;
    }

    /**
     * Copy source to target to use it as dummy translation.
     * (internal usage only, a client should call createTranslationFileForLang on ITranslationMessageFile)
     */
    public useSourceAsTarget(isDefaultLang: boolean, copyContent: boolean) {
        // do nothing
    }

    /**
     * Set the translation to a given string (including markup).
     * @param translation
     */
    protected translateNative(translation: string) {
        let target = this._element;
        if (isNullOrUndefined(translation)) {
            translation = '';
        }
        DOMUtilities.replaceContentWithXMLContent(target, translation);
    }

}
