import {isNullOrUndefined} from 'util';
import {ITranslationMessagesFile, ITransUnit} from '../api';
import {DOMUtilities} from './dom-utilities';
import {INormalizedMessage} from '../api/i-normalized-message';
import {AbstractTransUnit} from './abstract-trans-unit';
import {XmbMessageParser} from './xmb-message-parser';
import {ParsedMessage} from './parsed-message';
import {AbstractMessageParser} from './abstract-message-parser';
/**
 * Created by martin on 01.05.2017.
 * A Translation Unit in an XMB file.
 */

export class XmbTransUnit extends AbstractTransUnit implements ITransUnit {

    constructor(_element: Element, _id: string, _translationMessagesFile: ITranslationMessagesFile) {
        super(_element, _id, _translationMessagesFile);
    }

    /**
     * Get content to translate.
     * Source parts are excluded here.
     * @return {string}
     */
    public sourceContent(): string {
        let msgContent = DOMUtilities.getXMLContent(this._element);
        let reSourceElem: RegExp = /<source>.*<\/source>/g;
        msgContent = msgContent.replace(reSourceElem, '');
        return msgContent;
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
        // not supported
    }

    /**
     * Return a parser used for normalized messages.
     */
    protected messageParser(): AbstractMessageParser {
        return new XmbMessageParser();
    }

    /**
     * The original text value, that is to be translated, as normalized message.
     */
    public createSourceContentNormalized(): ParsedMessage {
        return this.messageParser().createNormalizedMessageFromXML(this._element, null);
    }

    /**
     * the translated value (containing all markup, depends on the concrete format used).
     */
    public targetContent(): string {
        // in fact, target and source are just the same in xmb
        return this.sourceContent();
    }

    /**
     * the translated value, but all placeholders are replaced with {{n}} (starting at 0)
     * and all embedded html is replaced by direct html markup.
     */
    targetContentNormalized(): INormalizedMessage {
        return new XmbMessageParser().createNormalizedMessageFromXML(this._element, this.sourceContentNormalized());
    }

    /**
     * State of the translation.
     * (not supported in xmb)
     */
    public nativeTargetState(): string {
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
        // not supported for xmb
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
        let sourceElements = this._element.getElementsByTagName('source');
        let sourceRefs: { sourcefile: string, linenumber: number }[] = [];
        for (let i = 0; i < sourceElements.length; i++) {
            let elem = sourceElements.item(i);
            const sourceAndPos: string = DOMUtilities.getPCDATA(elem);
            sourceRefs.push(XmbTransUnit.parseSourceAndPos(sourceAndPos));
        }
        return sourceRefs;
    }

    /**
     * Set source ref elements in the transunit.
     * Normally, this is done by ng-extract.
     * Method only exists to allow xliffmerge to merge missing source refs.
     * @param sourceRefs the sourcerefs to set. Old ones are removed.
     */
    public setSourceReferences(sourceRefs: {sourcefile: string, linenumber: number}[]) {
        this.removeAllSourceReferences();
        let insertPosition = this._element.childNodes.item(0);
        for (let i = sourceRefs.length - 1; i >= 0; i--) {
            let ref = sourceRefs[i];
            let source = this._element.ownerDocument.createElement('source');
            source.appendChild(this._element.ownerDocument.createTextNode(ref.sourcefile + ':' + ref.linenumber.toString(10)));
            this._element.insertBefore(source, insertPosition);
            insertPosition = source;
        }
    }

    private removeAllSourceReferences() {
        let sourceElements = this._element.getElementsByTagName('source');
        let toBeRemoved = [];
        for (let i = 0; i < sourceElements.length; i++) {
            let elem = sourceElements.item(i);
            toBeRemoved.push(elem);
        }
        toBeRemoved.forEach((elem) => {elem.parentNode.removeChild(elem);});
    }

    /**
     * Parses something like 'c:\xxx:7' and returns source and linenumber.
     * @param sourceAndPos something like 'c:\xxx:7', last colon is the separator
     * @return {{sourcefile: string, linenumber: number}}
     */
    private static parseSourceAndPos(sourceAndPos: string): { sourcefile: string, linenumber } {
        let index = sourceAndPos.lastIndexOf(':');
        if (index < 0) {
            return {
                sourcefile: sourceAndPos,
                linenumber: 0
            }
        } else {
            return {
                sourcefile: sourceAndPos.substring(0, index),
                linenumber: XmbTransUnit.parseLineNumber(sourceAndPos.substring(index + 1))
            }
        }
    }

    private static parseLineNumber(lineNumberString: string): number {
        return Number.parseInt(lineNumberString);
    }

    /**
     * The description set in the template as value of the i18n-attribute.
     * e.g. i18n="mydescription".
     * In xmb this is stored in the attribute "desc".
     */
    public description(): string {
        return this._element.getAttribute('desc');
    }

    /**
     * The meaning (intent) set in the template as value of the i18n-attribute.
     * This is the part in front of the | symbol.
     * e.g. i18n="meaning|mydescription".
     * In xmb this is stored in the attribute "meaning".
     */
    public meaning(): string {
        return this._element.getAttribute('meaning');
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
     * In xmb there is nothing to do, because there is only a target, no source.
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
     * In fact, xmb cannot be translated.
     * So this throws an error.
     * @param translation
     */
    protected translateNative(translation: string) {
        throw new Error('You cannot translate xmb files, use xtb instead.');
    }

    /**
     * convert the source refs to html.
     * Result is something like <source>c:\x:93</source>
     */
    private sourceRefsToHtml(): string {
        let result: string = '';
        this.sourceReferences().forEach((sourceRef) => {
            result = result + '<source>' + sourceRef.sourcefile + ':' + sourceRef.linenumber + '</source>';
        });
        return result;
    }
}
