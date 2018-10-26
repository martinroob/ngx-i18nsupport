import {ParsedMessage} from './parsed-message';
import {
    EMPTY_TAG,
    END_TAG, ICU_MESSAGE, ICU_MESSAGE_REF, ParsedMesageTokenizer, PLACEHOLDER, START_TAG, TEXT,
    Token
} from './parsed-message-tokenizer';
import {ParsedMessagePartText} from './parsed-message-part-text';
import {DOMParser} from 'xmldom';
import {ParsedMessagePartStartTag} from './parsed-message-part-start-tag';
import {ParsedMessagePartPlaceholder} from './parsed-message-part-placeholder';
import {ParsedMessagePartEndTag} from './parsed-message-part-end-tag';
import {IMessageParser} from './i-message-parser';
import {format, isNullOrUndefined} from 'util';
import {DOMUtilities} from './dom-utilities';
import {ParsedMessagePartEmptyTag} from './parsed-message-part-empty-tag';
import {ParsedMessagePartICUMessageRef} from './parsed-message-part-icu-message-ref';
import {ParsedMessagePartICUMessage} from './parsed-message-part-icu-message';
/**
 * Created by roobm on 10.05.2017.
 * A message parser can parse the xml content of a translatable message.
 * It generates a ParsedMessage from it.
 */
export abstract class AbstractMessageParser implements IMessageParser {

    /**
     * Parse XML to ParsedMessage.
     * @param xmlElement the xml representation
     * @param sourceMessage optional original message that will be translated by normalized new one
     * Throws an error if normalized xml is not well formed.
     */
    public createNormalizedMessageFromXML(xmlElement: Element, sourceMessage: ParsedMessage): ParsedMessage {
        const message: ParsedMessage = new ParsedMessage(this, sourceMessage);
        if (xmlElement) {
            message.setXmlRepresentation(xmlElement);
            this.addPartsOfNodeToMessage(xmlElement, message, false);
        }
        return message;
    }

    /**
     * Parse XML string to ParsedMessage.
     * @param xmlString the xml representation without root element, e.g. this is <ph x></ph> an example.
     * @param sourceMessage optional original message that will be translated by normalized new one
     * Throws an error if normalized xml is not well formed.
     */
    createNormalizedMessageFromXMLString(xmlString: string, sourceMessage: ParsedMessage): ParsedMessage {
        let doc: Document = new DOMParser().parseFromString('<dummy>' + xmlString + '</dummy>', 'text/xml');
        let xmlElement: Element = <Element> doc.childNodes.item(0);
        return this.createNormalizedMessageFromXML(xmlElement, sourceMessage);
    }

    /**
     * recursively run through a node and add all identified parts to the message.
     * @param node
     * @param message message to be generated.
     * @param includeSelf if true, add node by itself, otherwise only children.
     */
    private addPartsOfNodeToMessage(node: Node, message: ParsedMessage, includeSelf: boolean) {
        let processChildren = true;
        if (includeSelf) {
            if (node.nodeType === node.TEXT_NODE) {
                message.addText(node.textContent);
                return;
            }
            if (node.nodeType === node.ELEMENT_NODE) {
                processChildren = this.processStartElement(<Element> node, message);
            }
        }
        if (processChildren) {
            const icuMessageText = this.getICUMessageText(node);
            let isICU = !isNullOrUndefined(icuMessageText);
            if (isICU) {
                try {
                    message.addICUMessage(icuMessageText);
                } catch (error) {
                    // if it is not parsable, handle it as non ICU
                    console.log('non ICU message: ', icuMessageText, error);
                    isICU = false;
                }
            }
            if (!isICU) {
                const children = node.childNodes;
                for (let i = 0; i < children.length; i++) {
                    this.addPartsOfNodeToMessage(children.item(i), message, true);
                }
            }
        }
        if (node.nodeType === node.ELEMENT_NODE) {
            this.processEndElement(<Element> node, message);
        }
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
        const firstChild = children.item(0);
        if (firstChild.nodeType === firstChild.TEXT_NODE) {
            if (this.isICUMessageStart(firstChild.textContent)) {
                return DOMUtilities.getXMLContent(<Element> node);
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Test, wether text is beginning of ICU Message.
     * @param text
     */
    public isICUMessageStart(text: string): boolean {
        return ParsedMessagePartICUMessage.looksLikeICUMessage(text);
//        return text.startsWith('{VAR_PLURAL') || text.startsWith('{VAR_SELECT');
    }

    /**
     * Handle this node.
     * This is called before the children are done.
     * @param elementNode
     * @param message message to be altered
     * @return true, if children should be processed too, false otherwise (children ignored then)
     */
    protected abstract processStartElement(elementNode: Element, message: ParsedMessage): boolean;

    /**
     * Handle end of this node.
     * This is called after all children are processed.
     * @param elementNode
     * @param message message to be altered
     */
    protected abstract processEndElement(elementNode: Element, message: ParsedMessage);

    /**
     * Parse normalized string to ParsedMessage.
     * @param normalizedString normalized string
     * @param sourceMessage optional original message that will be translated by normalized new one
     * @return a new parsed message.
     * Throws an error if normalized string is not well formed.
     */
    public parseNormalizedString(normalizedString: string, sourceMessage: ParsedMessage): ParsedMessage {
        const message: ParsedMessage = new ParsedMessage(this, sourceMessage);
        let openTags = [];
        let tokens: Token[];
        try {
            tokens = new ParsedMesageTokenizer().tokenize(normalizedString);
        } catch (error) {
            throw new Error(format('unexpected error while parsing message: "%s" (parsed "%")', error.message, normalizedString));
        }
        tokens.forEach((token: Token) => {
            let disp: string = null;
            switch (token.type) {
                case TEXT:
                    message.addText(token.value.text);
                    break;
                case START_TAG:
                    message.addStartTag(token.value.name, token.value.idcounter);
                    openTags.push(token.value.name);
                    break;
                case END_TAG:
                    message.addEndTag(token.value.name);
                    if (openTags.length === 0 || openTags[openTags.length - 1] !== token.value.name) {
                        // oops, not well formed
                        throw new Error(format('unexpected close tag "%s" (parsed "%s")', token.value.name, normalizedString));
                    }
                    openTags.pop();
                    break;
                case EMPTY_TAG:
                    message.addEmptyTag(token.value.name, token.value.idcounter);
                    break;
                case PLACEHOLDER:
                    disp = (sourceMessage) ? sourceMessage.getPlaceholderDisp(token.value.idcounter) : null;
                    message.addPlaceholder(token.value.idcounter, disp);
                    break;
                case ICU_MESSAGE_REF:
                    disp = (sourceMessage) ? sourceMessage.getICUMessageRefDisp(token.value.idcounter) : null;
                    message.addICUMessageRef(token.value.idcounter, disp);
                    break;
                case ICU_MESSAGE:
                    throw new Error(format('<ICUMessage/> not allowed here, use parseICUMessage instead (parsed "%")', normalizedString));
                default:
                    break;
            }
        });
        if (openTags.length > 0) {
            // oops, not well closed tags
            throw new Error(format('missing close tag "%s" (parsed "%s")', openTags[openTags.length - 1], normalizedString));
        }
        message.setXmlRepresentation(this.createXmlRepresentation(message));
        return message;
    }

    /**
     * Parse a string, that is an ICU message, to ParsedMessage.
     * @param icuMessageString the message, like '{x, plural, =0 {nothing} =1 {one} other {many}}'.
     * @param sourceMessage optional original message that will be translated by normalized new one
     * @return a new parsed message.
     * Throws an error if icuMessageString has not the correct syntax.
     */
    parseICUMessage(icuMessageString: string, sourceMessage: ParsedMessage): ParsedMessage {
        const message: ParsedMessage = new ParsedMessage(this, sourceMessage);
        message.addICUMessage(icuMessageString);
        return message;
    }

    /**
     * Helper function: Parse ID from a name.
     * name optionally ends with _<number>. This is the idcount.
     * E.g. name="TAG_IMG" returns 0
     * name = "TAG_IMG_1" returns 1
     * @param {string} name
     * @return {number}
     */
    protected parseIdCountFromName(name: string): number {
        const regex = /.*_([0-9]*)/;
        const match = regex.exec(name);
        if (isNullOrUndefined(match) || match[1] === '') {
            return 0;
        } else {
            const num = match[1];
            return parseInt(num, 10);
        }
    }

    /**
     * Create the native xml for a message.
     * Parts are already set here.
     * @param message
     */
    protected createXmlRepresentation(message: ParsedMessage): Element {
        let root: Document = new DOMParser().parseFromString('<dummy/>', 'text/xml');
        let rootElem: Element = root.getElementsByTagName('dummy').item(0);
        this.addXmlRepresentationToRoot(message, rootElem);
        return rootElem;
    }

    protected abstract addXmlRepresentationToRoot(message: ParsedMessage, rootElem: Element);

    protected createXmlRepresentationOfTextPart(part: ParsedMessagePartText, rootElem: Element): Node {
        return rootElem.ownerDocument.createTextNode(part.asDisplayString());
    }

    /**
     * the xml used for start tag in the message.
     * @param part
     * @param rootElem
     * @param id id number in xliff2
     */
    protected abstract createXmlRepresentationOfStartTagPart(part: ParsedMessagePartStartTag, rootElem: Element, id?: number): Node;

    /**
     * the xml used for end tag in the message.
     * @param part
     * @param rootElem
     */
    protected abstract createXmlRepresentationOfEndTagPart(part: ParsedMessagePartEndTag, rootElem: Element): Node;

    /**
     * the xml used for empty tag in the message.
     * @param part
     * @param rootElem
     * @param id id number in xliff2
     */
    protected abstract createXmlRepresentationOfEmptyTagPart(part: ParsedMessagePartEmptyTag, rootElem: Element, id?: number): Node;

    /**
     * the xml used for placeholder in the message.
     * @param part
     * @param rootElem
     * @param id id number in xliff2
     */
    protected abstract createXmlRepresentationOfPlaceholderPart(part: ParsedMessagePartPlaceholder, rootElem: Element, id?: number): Node;

    /**
     * the xml used for icu message refs in the message.
     * @param part
     * @param rootElem
     */
    protected abstract createXmlRepresentationOfICUMessageRefPart(part: ParsedMessagePartICUMessageRef, rootElem: Element): Node;
}