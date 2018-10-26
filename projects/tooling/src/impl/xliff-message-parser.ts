import {AbstractMessageParser} from './abstract-message-parser';
import {ParsedMessage} from './parsed-message';
import {ParsedMessagePartStartTag} from './parsed-message-part-start-tag';
import {ParsedMessagePartEndTag} from './parsed-message-part-end-tag';
import {ParsedMessagePartPlaceholder} from './parsed-message-part-placeholder';
import {TagMapping} from './tag-mapping';
import {ParsedMessagePartEmptyTag} from './parsed-message-part-empty-tag';
import {ParsedMessagePartICUMessageRef} from './parsed-message-part-icu-message-ref';
import {isNullOrUndefined} from 'util';
import {ParsedMessagePartType} from './parsed-message-part';
import {ParsedMessagePartText} from './parsed-message-part-text';
/**
 * Created by roobm on 10.05.2017.
 * A message parser for XLIFF 1.2
 */
export class XliffMessageParser extends AbstractMessageParser {

    /**
     * Handle this element node.
     * This is called before the children are done.
     * @param elementNode
     * @param message message to be altered
     * @return true, if children should be processed too, false otherwise (children ignored then)
     */
    protected processStartElement(elementNode: Element, message: ParsedMessage): boolean {
        const tagName = elementNode.tagName;
        const tagMapping = new TagMapping();
        if (tagName === 'x') {
            // placeholder are like <x id="INTERPOLATION"/> or <x id="INTERPOLATION_1">
            let id = elementNode.getAttribute('id');
            if (!id) {
                return; // should not happen
            }
            if (id.startsWith('INTERPOLATION')) {
                const index = this.parsePlaceholderIndexFromId(id);
                message.addPlaceholder(index, null);
            } else if (id.startsWith('ICU')) {
                const index = this.parseICUMessageRefIndexFromId(id);
                message.addICUMessageRef(index, null);
            } else if (id.startsWith('START_')) {
                let normalizedTagName = tagMapping.getTagnameFromStartTagPlaceholderName(id);
                if (normalizedTagName) {
                    const idcount = this.parseIdCountFromName(id);
                    message.addStartTag(normalizedTagName, idcount);
                }
            } else if (id.startsWith('CLOSE_')) {
                let normalizedTagName = tagMapping.getTagnameFromCloseTagPlaceholderName(id);
                if (normalizedTagName) {
                    message.addEndTag(normalizedTagName);
                }
            } else if (tagMapping.isEmptyTagPlaceholderName(id)) {
                let normalizedTagName = tagMapping.getTagnameFromEmptyTagPlaceholderName(id);
                if (normalizedTagName) {
                    const idcount = this.parseIdCountFromName(id);
                    message.addEmptyTag(normalizedTagName, idcount);
                }
            }
        }
        return true;
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
     * @param id
     * @return {number}
     */
    private parsePlaceholderIndexFromId(id: string): number {
        let indexString = '';

        if (id === 'INTERPOLATION') {
            indexString = '0';
        } else {
            indexString = id.substring('INTERPOLATION_'.length);
        }
        return Number.parseInt(indexString);
    }

    /**
     * Parse id attribute of x element as placeholder index.
     * id can be "INTERPOLATION" or "INTERPOLATION_n"
     * @param id
     * @return {number}
     */
    private parseICUMessageRefIndexFromId(id: string): number {
        let indexString = '';

        if (id === 'ICU') {
            indexString = '0';
        } else {
            indexString = id.substring('ICU_'.length);
        }
        return Number.parseInt(indexString);
    }

    protected addXmlRepresentationToRoot(message: ParsedMessage, rootElem: Element) {
        message.parts().forEach((part) => {
            let child: Node;
            switch (part.type) {
                case ParsedMessagePartType.TEXT:
                    child = this.createXmlRepresentationOfTextPart(<ParsedMessagePartText> part, rootElem);
                    break;
                case ParsedMessagePartType.START_TAG:
                    child = this.createXmlRepresentationOfStartTagPart((<ParsedMessagePartStartTag>part), rootElem);
                    break;
                case ParsedMessagePartType.END_TAG:
                    child = this.createXmlRepresentationOfEndTagPart((<ParsedMessagePartEndTag>part), rootElem);
                    break;
                case ParsedMessagePartType.EMPTY_TAG:
                    child = this.createXmlRepresentationOfEmptyTagPart((<ParsedMessagePartEmptyTag>part), rootElem);
                    break;
                case ParsedMessagePartType.PLACEHOLDER:
                    child = this.createXmlRepresentationOfPlaceholderPart((<ParsedMessagePartPlaceholder>part), rootElem);
                    break;
                case ParsedMessagePartType.ICU_MESSAGE_REF:
                    child = this.createXmlRepresentationOfICUMessageRefPart((<ParsedMessagePartICUMessageRef>part), rootElem);
                    break;
            }
            if (child) {
                rootElem.appendChild(child);
            }
        });
    }

    /**
     * the xml used for start tag in the message.
     * Returns an empty <x/>-Element with attributes id and ctype
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfStartTagPart(part: ParsedMessagePartStartTag, rootElem: Element): Node {
        let xElem = rootElem.ownerDocument.createElement('x');
        const tagMapping = new TagMapping();
        const idAttrib = tagMapping.getStartTagPlaceholderName(part.tagName(), part.idCounter());
        const ctypeAttrib = tagMapping.getCtypeForTag(part.tagName());
        const equivTextAttr = '<' + part.tagName() + '>';
        xElem.setAttribute('id', idAttrib);
        xElem.setAttribute('ctype', ctypeAttrib);
        xElem.setAttribute('equiv-text', equivTextAttr);
        return xElem;
    }

    /**
     * the xml used for end tag in the message.
     * Returns an empty <x/>-Element with attributes id and ctype
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfEndTagPart(part: ParsedMessagePartEndTag, rootElem: Element): Node {
        let xElem = rootElem.ownerDocument.createElement('x');
        const tagMapping = new TagMapping();
        let idAttrib = tagMapping.getCloseTagPlaceholderName(part.tagName());
        let ctypeAttrib = 'x-' + part.tagName();
        xElem.setAttribute('id', idAttrib);
        xElem.setAttribute('ctype', ctypeAttrib);
        return xElem;
    }

    /**
     * the xml used for empty tag in the message.
     * Returns an empty <x/>-Element with attributes id and ctype
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfEmptyTagPart(part: ParsedMessagePartEmptyTag, rootElem: Element): Node {
        let xElem = rootElem.ownerDocument.createElement('x');
        const tagMapping = new TagMapping();
        const idAttrib = tagMapping.getEmptyTagPlaceholderName(part.tagName(), part.idCounter());
        const ctypeAttrib = tagMapping.getCtypeForTag(part.tagName());
        const equivTextAttr = '<' + part.tagName() + '/>';
        xElem.setAttribute('id', idAttrib);
        xElem.setAttribute('ctype', ctypeAttrib);
        xElem.setAttribute('equiv-text', equivTextAttr);
        return xElem;
    }

    /**
     * the xml used for placeholder in the message.
     * Returns an empty <x/>-Element with attribute id="INTERPOLATION" or id="INTERPOLATION_n"
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfPlaceholderPart(part: ParsedMessagePartPlaceholder, rootElem: Element): Node {
        let xElem = rootElem.ownerDocument.createElement('x');
        let idAttrib = 'INTERPOLATION';
        if (part.index() > 0) {
            idAttrib = 'INTERPOLATION_' + part.index().toString(10);
        }
        const equivTextAttr = part.disp();
        xElem.setAttribute('id', idAttrib);
        if (equivTextAttr) {
            xElem.setAttribute('equiv-text', equivTextAttr);
        }
        return xElem;
    }

    /**
     * the xml used for icu message refs in the message.
     * @param part
     * @param rootElem
     */
    protected createXmlRepresentationOfICUMessageRefPart(part: ParsedMessagePartICUMessageRef, rootElem: Element): Node {
        let xElem = rootElem.ownerDocument.createElement('x');
        let idAttrib = 'ICU';
        if (part.index() > 0) {
            idAttrib = 'ICU_' + part.index().toString(10);
        }
        xElem.setAttribute('id', idAttrib);
        return xElem;
    }

}
