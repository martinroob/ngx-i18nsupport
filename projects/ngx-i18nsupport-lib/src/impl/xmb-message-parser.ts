import {AbstractMessageParser} from './abstract-message-parser';
import {ParsedMessage} from './parsed-message';
import {DOMUtilities} from './dom-utilities';
import {ParsedMessagePartStartTag} from './parsed-message-part-start-tag';
import {ParsedMessagePartEndTag} from './parsed-message-part-end-tag';
import {ParsedMessagePartPlaceholder} from './parsed-message-part-placeholder';
import {TagMapping} from './tag-mapping';
import {ParsedMessagePartEmptyTag} from './parsed-message-part-empty-tag';
import {ParsedMessagePartICUMessageRef} from './parsed-message-part-icu-message-ref';
import {ParsedMessagePart, ParsedMessagePartType} from './parsed-message-part';
import {ParsedMessagePartText} from './parsed-message-part-text';
import {isNullOrUndefined} from 'util';
/**
 * Created by roobm on 10.05.2017.
 * A message parser for XMB
 */
export class XmbMessageParser extends AbstractMessageParser {

    /**
     * Handle this element node.
     * This is called before the children are done.
     * @param elementNode
     * @param message message to be altered
     * @return true, if children should be processed too, false otherwise (children ignored then)
     */
    protected processStartElement(elementNode: Element, message: ParsedMessage): boolean {
        const tagName = elementNode.tagName;
        if (tagName === 'ph') {
            // There are 4 different usages of ph element:
            // 1. placeholders are like <ph name="INTERPOLATION"><ex>INTERPOLATION</ex></ph>
            // or <ph name="INTERPOLATION_1"><ex>INTERPOLATION_1</ex></ph>
            // 2. start tags:
            // <ph name="START_LINK"><ex>&lt;a&gt;</ex></ph>
            // 3. empty tags:
            // <ph name="TAG_IMG"><ex>&lt;img&gt;</ex></ph>
            // 4. ICU:
            // <ph name="ICU"><ex>ICU</ex></ph>
            let name = elementNode.getAttribute('name');
            if (!name) {
                return true; // should not happen
            }
            if (name.startsWith('INTERPOLATION')) {
                const index = this.parsePlaceholderIndexFromName(name);
                message.addPlaceholder(index, null);
                return false; // ignore children
            } else if (name.startsWith('START_')) {
                const tag = this.parseTagnameFromPhElement(elementNode);
                const idcounter = this.parseIdCountFromName(name);
                if (tag) {
                    message.addStartTag(tag, idcounter);
                }
                return false; // ignore children
            } else if (name.startsWith('CLOSE_')) {
                const tag = this.parseTagnameFromPhElement(elementNode);
                if (tag) {
                    message.addEndTag(tag);
                }
                return false; // ignore children
            } else if (new TagMapping().isEmptyTagPlaceholderName(name)) {
                const emptyTagName = new TagMapping().getTagnameFromEmptyTagPlaceholderName(name);
                const idcounter = this.parseIdCountFromName(name);
                message.addEmptyTag(emptyTagName, idcounter);
                return false; // ignore children
            } else if (name.startsWith('ICU')) {
                const index = this.parseICUMessageIndexFromName(name);
                message.addICUMessageRef(index, null);
                return false; // ignore children
            }
        } else if (tagName === 'source') {
            // ignore source
            return false;
        }
        return true;
    }

    /**
     * Return the ICU message content of the node, if it is an ICU Message.
     * @param node
     * @return message or null, if it is no ICU Message.
     */
    protected getICUMessageText(node: Node): string {
        const children = node.childNodes;
        if (children.length === 0) {
            return null;
        }
        let firstChild = null;
        // find first child that is no source element.
        let i;
        for (i = 0; i < children.length; i++) {
            const child = children.item(i);
            if (child.nodeType !== child.ELEMENT_NODE || (<Element> child).tagName !== 'source') {
                firstChild = child;
                break;
            }
        }
        if (firstChild && firstChild.nodeType === firstChild.TEXT_NODE) {
            if (this.isICUMessageStart(firstChild.textContent)) {
                let messageText = DOMUtilities.getXMLContent(<Element> node);
                if (i > 0) {
                    // drop <source> elements
                    let reSource: RegExp = new RegExp('<source[^>]*>.*</source>', 'g');
                    return messageText.replace(reSource, '');
                } else {
                    return messageText;
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Handle end of this element node.
     * This is called after all children are processed.
     * @param elementNode
     * @param message message to be altered
     */
    protected processEndElement(elementNode: Element, message: ParsedMessage) {
    }

    /**
     * Parse id attribute of x element as placeholder index.
     * id can be "INTERPOLATION" or "INTERPOLATION_n"
     * @param name
     * @return {number}
     */
    private parsePlaceholderIndexFromName(name: string): number {
        let indexString = '';

        if (name === 'INTERPOLATION') {
            indexString = '0';
        } else {
            indexString = name.substring('INTERPOLATION_'.length);
        }
        return Number.parseInt(indexString);
    }

    /**
     * Parse id attribute of x element as ICU message ref index.
     * id can be "ICU" or "ICU_n"
     * @param name
     * @return {number}
     */
    private parseICUMessageIndexFromName(name: string): number {
        let indexString = '';

        if (name === 'ICU') {
            indexString = '0';
        } else {
            indexString = name.substring('ICU_'.length);
        }
        return Number.parseInt(indexString);
    }

    /**
     * Parse the tag name from a ph element.
     * It contained in the <ex> subelements value and enclosed in <>.
     * Example: <ph name="START_BOLD_TEXT"><ex>&lt;b&gt;</ex></ph>
     * @param phElement
     */
    private parseTagnameFromPhElement(phElement: Element): string {
        const exElement = DOMUtilities.getFirstElementByTagName(phElement, 'ex');
        if (exElement) {
            const value = DOMUtilities.getPCDATA(exElement);
            if (!value || !value.startsWith('<') || !value.endsWith('>')) {
                // oops
                return null;
            }
            if (value.charAt(1) === '/') {
                return value.substring(2, value.length - 1);
            } else {
                return value.substring(1, value.length - 1);
            }
        } else {
            return null;
        }
    }

    protected addXmlRepresentationToRoot(message: ParsedMessage, rootElem: Element) {
        message.parts().forEach((part) => {
            const child = this.createXmlRepresentationOfPart(part, rootElem);
            if (child) {
                rootElem.appendChild(child);
            }
        });
    }

    protected createXmlRepresentationOfPart(part: ParsedMessagePart, rootElem: Element): Node {
        switch (part.type) {
            case ParsedMessagePartType.TEXT:
                return this.createXmlRepresentationOfTextPart(<ParsedMessagePartText> part, rootElem);
            case ParsedMessagePartType.START_TAG:
                return this.createXmlRepresentationOfStartTagPart((<ParsedMessagePartStartTag>part), rootElem);
            case ParsedMessagePartType.END_TAG:
                return this.createXmlRepresentationOfEndTagPart((<ParsedMessagePartEndTag>part), rootElem);
            case ParsedMessagePartType.EMPTY_TAG:
                return this.createXmlRepresentationOfEmptyTagPart((<ParsedMessagePartEmptyTag>part), rootElem);
            case ParsedMessagePartType.PLACEHOLDER:
                return this.createXmlRepresentationOfPlaceholderPart((<ParsedMessagePartPlaceholder>part), rootElem);
            case ParsedMessagePartType.ICU_MESSAGE_REF:
                return this.createXmlRepresentationOfICUMessageRefPart((<ParsedMessagePartICUMessageRef>part), rootElem);
        }
    }

    /**
     * the xml used for start tag in the message.
     * Returns an <ph>-Element with attribute name and subelement ex
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfStartTagPart(part: ParsedMessagePartStartTag, rootElem: Element): Node {
        let phElem = rootElem.ownerDocument.createElement('ph');
        const tagMapping = new TagMapping();
        let nameAttrib = tagMapping.getStartTagPlaceholderName(part.tagName(), part.idCounter());
        phElem.setAttribute('name', nameAttrib);
        let exElem = rootElem.ownerDocument.createElement('ex');
        exElem.appendChild(rootElem.ownerDocument.createTextNode('<' + part.tagName() + '>'));
        phElem.appendChild(exElem);
        return phElem;
    }

    /**
     * the xml used for end tag in the message.
     * Returns an <ph>-Element with attribute name and subelement ex
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfEndTagPart(part: ParsedMessagePartEndTag, rootElem: Element): Node {
        let phElem = rootElem.ownerDocument.createElement('ph');
        const tagMapping = new TagMapping();
        let nameAttrib = tagMapping.getCloseTagPlaceholderName(part.tagName());
        phElem.setAttribute('name', nameAttrib);
        let exElem = rootElem.ownerDocument.createElement('ex');
        exElem.appendChild(rootElem.ownerDocument.createTextNode('</' + part.tagName() + '>'));
        phElem.appendChild(exElem);
        return phElem;
    }

    /**
     * the xml used for empty tag in the message.
     * Returns an <ph>-Element with attribute name and subelement ex
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfEmptyTagPart(part: ParsedMessagePartEmptyTag, rootElem: Element): Node {
        let phElem = rootElem.ownerDocument.createElement('ph');
        const tagMapping = new TagMapping();
        let nameAttrib = tagMapping.getEmptyTagPlaceholderName(part.tagName(), part.idCounter());
        phElem.setAttribute('name', nameAttrib);
        let exElem = rootElem.ownerDocument.createElement('ex');
        exElem.appendChild(rootElem.ownerDocument.createTextNode('<' + part.tagName() + '>'));
        phElem.appendChild(exElem);
        return phElem;
    }

    /**
     * the xml used for placeholder in the message.
     * Returns an <ph>-Element with attribute name and subelement ex
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfPlaceholderPart(part: ParsedMessagePartPlaceholder, rootElem: Element): Node {
        let phElem = rootElem.ownerDocument.createElement('ph');
        let nameAttrib = 'INTERPOLATION';
        if (part.index() > 0) {
            nameAttrib = 'INTERPOLATION_' + part.index().toString(10);
        }
        phElem.setAttribute('name', nameAttrib);
        let exElem = rootElem.ownerDocument.createElement('ex');
        exElem.appendChild(rootElem.ownerDocument.createTextNode(nameAttrib));
        phElem.appendChild(exElem);
        return phElem;
    }

    /**
     * the xml used for icu message refs in the message.
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfICUMessageRefPart(part: ParsedMessagePartICUMessageRef, rootElem: Element): Node {
        let phElem = rootElem.ownerDocument.createElement('ph');
        let nameAttrib = 'ICU';
        if (part.index() > 0) {
            nameAttrib = 'ICU_' + part.index().toString(10);
        }
        phElem.setAttribute('name', nameAttrib);
        let exElem = rootElem.ownerDocument.createElement('ex');
        exElem.appendChild(rootElem.ownerDocument.createTextNode(nameAttrib));
        phElem.appendChild(exElem);
        return phElem;
    }
}
