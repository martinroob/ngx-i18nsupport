import {ITranslationMessagesFile, ITransUnit, STATE_NEW, STATE_TRANSLATED, STATE_FINAL} from '../api';
import {DOMUtilities} from './dom-utilities';
import {INormalizedMessage} from '../api/i-normalized-message';
import {AbstractTransUnit} from './abstract-trans-unit';
import {XliffMessageParser} from './xliff-message-parser';
import {ParsedMessage} from './parsed-message';
import {AbstractMessageParser} from './abstract-message-parser';
import {isNullOrUndefined} from 'util';
/**
 * Created by martin on 01.05.2017.
 * A Translation Unit in an XLIFF 1.2 file.
 */

export class XliffTransUnit extends AbstractTransUnit implements ITransUnit {

    constructor(_element: Element, _id: string,_translationMessagesFile: ITranslationMessagesFile) {
        super(_element, _id, _translationMessagesFile);
    }

    public sourceContent(): string {
        const sourceElement = DOMUtilities.getFirstElementByTagName(this._element, 'source');
        return DOMUtilities.getXMLContent(sourceElement);
    }

    /**
     * Set new source content in the transunit.
     * Normally, this is done by ng-extract.
     * Method only exists to allow xliffmerge to merge missing changed source content.
     * @param newContent the new content.
     */
    public setSourceContent(newContent: string) {
        let source = DOMUtilities.getFirstElementByTagName(this._element, 'source');
        if (!source) {
            // should not happen, there always has to be a source, but who knows..
            source = this._element.appendChild(this._element.ownerDocument.createElement('source'));
        }
        DOMUtilities.replaceContentWithXMLContent(source, newContent);
    }

    /**
     * Return a parser used for normalized messages.
     */
    protected messageParser(): AbstractMessageParser {
        return new XliffMessageParser();
    }

    /**
     * The original text value, that is to be translated, as normalized message.
     */
    public createSourceContentNormalized(): ParsedMessage {
        const sourceElement = DOMUtilities.getFirstElementByTagName(this._element, 'source');
        if (sourceElement) {
            return this.messageParser().createNormalizedMessageFromXML(sourceElement, null);
        } else {
            return null;
        }
    }

    /**
     * the translated value (containing all markup, depends on the concrete format used).
     */
    public targetContent(): string {
        const targetElement = DOMUtilities.getFirstElementByTagName(this._element, 'target');
        return DOMUtilities.getXMLContent(targetElement);
    }

    /**
     * the translated value, but all placeholders are replaced with {{n}} (starting at 0)
     * and all embedded html is replaced by direct html markup.
     */
    targetContentNormalized(): INormalizedMessage {
        const targetElement = DOMUtilities.getFirstElementByTagName(this._element, 'target');
        return new XliffMessageParser().createNormalizedMessageFromXML(targetElement, this.sourceContentNormalized());
    }

    /**
     * State of the translation as stored in the xml.
     */
    public nativeTargetState(): string {
        let targetElement = DOMUtilities.getFirstElementByTagName(this._element, 'target');
        if (targetElement) {
            return targetElement.getAttribute('state');
        } else {
            return null;
        }
    }

    /**
     * set state in xml.
     * @param nativeState
     */
    protected setNativeTargetState(nativeState: string) {
        let targetElement = DOMUtilities.getFirstElementByTagName(this._element, 'target');
        if (targetElement) {
            targetElement.setAttribute('state', nativeState);
        }
    }

    /**
     * Map an abstract state (new, translated, final) to a concrete state used in the xml.
     * Returns the state to be used in the xml.
     * @param state one of Constants.STATE...
     * @returns a native state (depends on concrete format)
     * @throws error, if state is invalid.
     */
    protected mapStateToNativeState(state: string): string {
        switch( state) {
            case STATE_NEW:
                return 'new';
            case STATE_TRANSLATED:
                return 'translated';
            case STATE_FINAL:
                return 'final';
            default:
                throw new Error('unknown state ' +  state);
        }
    }

    /**
     * Map a native state (found in the document) to an abstract state (new, translated, final).
     * Returns the abstract state.
     * @param nativeState
     */
    protected mapNativeStateToState(nativeState: string): string {
        switch( nativeState) {
            case 'new':
                return STATE_NEW;
            case 'needs-translation':
                return STATE_NEW;
            case 'translated':
                return STATE_TRANSLATED;
            case 'needs-adaptation':
                return STATE_TRANSLATED;
            case 'needs-l10n':
                return STATE_TRANSLATED;
            case 'needs-review-adaptation':
                return STATE_TRANSLATED;
            case 'needs-review-l10n':
                return STATE_TRANSLATED;
            case 'needs-review-translation':
                return STATE_TRANSLATED;
            case 'final':
                return STATE_FINAL;
            case 'signed-off':
                return STATE_FINAL;
            default:
                return STATE_NEW;
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
    public sourceReferences(): {sourcefile: string, linenumber: number}[] {
        let sourceElements = this._element.getElementsByTagName('context-group');
        let sourceRefs: { sourcefile: string, linenumber: number }[] = [];
        for (let i = 0; i < sourceElements.length; i++) {
            const elem = sourceElements.item(i);
            if (elem.getAttribute('purpose') === 'location') {
                let contextElements = elem.getElementsByTagName('context');
                let sourcefile = null;
                let linenumber = 0;
                for (let j = 0; j < contextElements.length; j++) {
                    const contextElem = contextElements.item(j);
                    if (contextElem.getAttribute('context-type') === 'sourcefile') {
                        sourcefile = DOMUtilities.getPCDATA(contextElem);
                    }
                    if (contextElem.getAttribute('context-type') === 'linenumber') {
                        linenumber = Number.parseInt(DOMUtilities.getPCDATA(contextElem));
                    }
                }
                sourceRefs.push({sourcefile: sourcefile, linenumber: linenumber});
            }
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
        sourceRefs.forEach((ref) => {
            let contextGroup = this._element.ownerDocument.createElement('context-group');
            contextGroup.setAttribute('purpose', 'location');
            let contextSource = this._element.ownerDocument.createElement('context');
            contextSource.setAttribute('context-type', 'sourcefile');
            contextSource.appendChild(this._element.ownerDocument.createTextNode(ref.sourcefile));
            let contextLine = this._element.ownerDocument.createElement('context');
            contextLine.setAttribute('context-type', 'linenumber');
            contextLine.appendChild(this._element.ownerDocument.createTextNode(ref.linenumber.toString(10)));
            contextGroup.appendChild(contextSource);
            contextGroup.appendChild(contextLine);
            this._element.appendChild(contextGroup);
        });
    }

    private removeAllSourceReferences() {
        let sourceElements = this._element.getElementsByTagName('context-group');
        let toBeRemoved = [];
        for (let i = 0; i < sourceElements.length; i++) {
            let elem = sourceElements.item(i);
            if (elem.getAttribute('purpose') === 'location') {
                toBeRemoved.push(elem);
            }
        }
        toBeRemoved.forEach((elem) => {elem.parentNode.removeChild(elem);});
    }

    /**
     * The description set in the template as value of the i18n-attribute.
     * e.g. i18n="mydescription".
     * In xliff this is stored as a note element with attribute from="description".
     */
    public description(): string {
        const noteElem = this.findNoteElementWithFromAttribute('description');
        if (noteElem) {
            return DOMUtilities.getPCDATA(noteElem);
        } else {
            return null;
        }
    }

    /**
     * Change description property of trans-unit.
     * @param {string} description
     */
    public setDescription(description: string) {
        let noteElem = this.findNoteElementWithFromAttribute('description');
        if (description) {
           if (isNullOrUndefined(noteElem)) {
               // create it
               noteElem = this.createNoteElementWithFromAttribute('description');
           }
           DOMUtilities.replaceContentWithXMLContent(noteElem, description);
        } else {
            if (!isNullOrUndefined(noteElem)) {
                // remove node
                this.removeNoteElementWithFromAttribute('description');
            }
        }
    }

    /**
     * Find a note element with attribute from='<attrValue>'
     * @param {string} attrValue
     * @return {Element} element or null is absent
     */
    private findNoteElementWithFromAttribute(attrValue: string): Element {
        let noteElements = this._element.getElementsByTagName('note');
        for (let i = 0; i < noteElements.length; i++) {
            const noteElem = noteElements.item(i);
            if (noteElem.getAttribute('from') === attrValue) {
                return noteElem;
            }
        }
        return null;
    }

    /**
     * Create a new note element with attribute from='<attrValue>'
     * @param {string} attrValue
     * @return the new created element
     */
    private createNoteElementWithFromAttribute(attrValue: string): Element {
        const noteElement = this._element.ownerDocument.createElement('note');
        noteElement.setAttribute('from', attrValue);
        noteElement.setAttribute('priority', '1');
        this._element.appendChild(noteElement);
        return noteElement;
    }

    /**
     * Remove note element with attribute from='<attrValue>'
     * @param {string} attrValue
     */
    private removeNoteElementWithFromAttribute(attrValue: string) {
        const noteElement = this.findNoteElementWithFromAttribute(attrValue);
        if (noteElement) {
            this._element.removeChild(noteElement);
        }
    }

    /**
     * The meaning (intent) set in the template as value of the i18n-attribute.
     * This is the part in front of the | symbol.
     * e.g. i18n="meaning|mydescription".
     * In xliff this is stored as a note element with attribute from="meaning".
     */
    public meaning(): string {
        const noteElem = this.findNoteElementWithFromAttribute('meaning');
        if (noteElem) {
            return DOMUtilities.getPCDATA(noteElem);
        } else {
            return null;
        }
    }

    /**
     * Change meaning property of trans-unit.
     * @param {string} meaning
     */
    public setMeaning(meaning: string) {
        let noteElem = this.findNoteElementWithFromAttribute('meaning');
        if (meaning) {
            if (isNullOrUndefined(noteElem)) {
                // create it
                noteElem = this.createNoteElementWithFromAttribute('meaning');
            }
            DOMUtilities.replaceContentWithXMLContent(noteElem, meaning);
        } else {
            if (!isNullOrUndefined(noteElem)) {
                // remove node
                this.removeNoteElementWithFromAttribute('meaning');
            }
        }
    }

    /**
     * Set the translation to a given string (including markup).
     * @param translation
     */
    protected translateNative(translation: string) {
        let target = DOMUtilities.getFirstElementByTagName(this._element, 'target');
        if (!target) {
            let source = DOMUtilities.getFirstElementByTagName(this._element, 'source');
            target = DOMUtilities.createFollowingSibling('target', source);
        }
        DOMUtilities.replaceContentWithXMLContent(target, <string> translation);
        this.setTargetState(STATE_TRANSLATED);
    }

    /**
     * Copy source to target to use it as dummy translation.
     * Returns a changed copy of this trans unit.
     * receiver is not changed.
     * (internal usage only, a client should call importNewTransUnit on ITranslationMessageFile)
     */
    public cloneWithSourceAsTarget(isDefaultLang: boolean, copyContent: boolean, targetFile: ITranslationMessagesFile): AbstractTransUnit {
        let element = <Element> this._element.cloneNode(true);
        let clone = new XliffTransUnit(element, this._id, targetFile);
        clone.useSourceAsTarget(isDefaultLang, copyContent);
        return clone;
    }

    /**
     * Copy source to target to use it as dummy translation.
     * (internal usage only, a client should call createTranslationFileForLang on ITranslationMessageFile)
     */
    public useSourceAsTarget(isDefaultLang: boolean, copyContent: boolean) {
        let source = DOMUtilities.getFirstElementByTagName(this._element, 'source');
        let target = DOMUtilities.getFirstElementByTagName(this._element, 'target');
        if (!target) {
            target = DOMUtilities.createFollowingSibling('target', source);
        }
        if (isDefaultLang || copyContent) {
            const sourceString = DOMUtilities.getXMLContent(source);
            let newTargetString = sourceString;
            if (!this.isICUMessage(sourceString)) {
                newTargetString = this.translationMessagesFile().getNewTransUnitTargetPraefix()
                    + sourceString
                    + this.translationMessagesFile().getNewTransUnitTargetSuffix();
            }
            DOMUtilities.replaceContentWithXMLContent(target, newTargetString);
        } else {
            DOMUtilities.replaceContentWithXMLContent(target, '');
        }
        if (isDefaultLang) {
            target.setAttribute('state', this.mapStateToNativeState(STATE_FINAL));
        } else {
            target.setAttribute('state', this.mapStateToNativeState(STATE_NEW));
        }
    }
}
