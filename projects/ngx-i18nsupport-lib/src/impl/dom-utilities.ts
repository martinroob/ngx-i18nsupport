import {DOMParser, XMLSerializer} from 'xmldom';
/**
 * Created by martin on 01.05.2017.
 * Some Tool functions for XML Handling.
 */

export class DOMUtilities {

    /**
     * return the first subelement with the given tag.
     * @param element element
     * @param tagName tagName
     * @return subelement or null, if not existing.
     */
    public static getFirstElementByTagName(element: Element | Document, tagName: string): Element {
        const matchingElements = element.getElementsByTagName(tagName);
        if (matchingElements && matchingElements.length > 0) {
            return matchingElements.item(0);
        } else {
            return null;
        }
    }

    /**
     * return an element with the given tag and id attribute.
     * @param element element
     * @param tagName tagName
     * @param id id
     * @return subelement or null, if not existing.
     */
    public static getElementByTagNameAndId(element: Element | Document, tagName: string, id: string): Element {
        const matchingElements = element.getElementsByTagName(tagName);
        if (matchingElements && matchingElements.length > 0) {
            for (let i = 0; i < matchingElements.length; i++) {
                const node: Element = matchingElements.item(i);
                if (node.getAttribute('id') === id) {
                    return node;
                }
            }
        }
        return null;
    }

    /**
     * Get next sibling, that is an element.
     * @param element element
     */
    public static getElementFollowingSibling(element: Element): Element {
        if (!element) {
            return null;
        }
        let e = element.nextSibling;
        while (e) {
            if (e.nodeType === e.ELEMENT_NODE) {
                return <Element> e;
            }
            e = e.nextSibling;
        }
        return null;
    }

    /**
     * Get previous sibling, that is an element.
     * @param element element
     */
    public static getElementPrecedingSibling(element: Element): Element {
        if (!element) {
            return null;
        }
        let e = element.previousSibling;
        while (e) {
            if (e.nodeType === e.ELEMENT_NODE) {
                return <Element> e;
            }
            e = e.previousSibling;
        }
        return null;
    }

    /**
     * return content of element as string, including all markup.
     * @param element element
     * @return content of element as string, including all markup.
     */
    public static getXMLContent(element: Element): string {
        if (!element) {
            return null;
        }
        let result = new XMLSerializer().serializeToString(element);
        const tagName = element.nodeName;
        const reStartMsg: RegExp = new RegExp('<' + tagName + '[^>]*>', 'g');
        result = result.replace(reStartMsg, '');
        const reEndMsg: RegExp = new RegExp('</' + tagName + '>', 'g');
        result = result.replace(reEndMsg, '');
        return result;
    }

    /**
     * return PCDATA content of element.
     * @param element element
     * @return PCDATA content of element.
     */
    public static getPCDATA(element: Element): string {
        if (!element) {
            return null;
        }
        let result = '';
        const childNodes = element.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes.item(i);
            if (child.nodeType === child.TEXT_NODE || child.nodeType === child.CDATA_SECTION_NODE) {
                result = result + child.nodeValue;
            }
        }
        return result.length === 0 ? null : result;
    }

    /**
     * replace PCDATA content with a new one.
     * @param element element
     * @param pcdata pcdata
     */
    public static replaceContentWithXMLContent(element: Element, pcdata: string) {
        // remove all children
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        // parseICUMessage pcdata
        const pcdataFragment: Document = new DOMParser().parseFromString('<fragment>' + pcdata + '</fragment>', 'application/xml');
        const newChildren = pcdataFragment.getElementsByTagName('fragment').item(0).childNodes;
        for (let j = 0; j < newChildren.length; j++) {
            const newChild = newChildren.item(j);
            element.appendChild(element.ownerDocument.importNode(newChild, true));
        }
    }

    /**
     * find the previous sibling that is an element.
     * @param element element
     * @return the previous sibling that is an element or null.
     */
    public static getPreviousElementSibling(element: Node): Element {
        let node = element.previousSibling;
        while (node !== null) {
            if (node.nodeType === node.ELEMENT_NODE) {
                return <Element> node;
            }
            node = node.previousSibling;
        }
        return null;
    }

    /**
     * Create an Element Node that is the next sibling of a given node.
     * @param elementNameToCreate elementNameToCreate
     * @param previousSibling previousSibling
     * @return new element
     */
    public static createFollowingSibling(elementNameToCreate: string, previousSibling: Node): Element {
        const newElement = previousSibling.ownerDocument.createElement(elementNameToCreate);
        return <Element> DOMUtilities.insertAfter(newElement, previousSibling);
    }

    /**
     * Insert newElement directly after previousSibling.
     * @param newElement newElement
     * @param previousSibling previousSibling
     */
    public static insertAfter(newElement: Node, previousSibling: Node): Node {
        if (previousSibling.nextSibling !== null) {
            previousSibling.parentNode.insertBefore(newElement, previousSibling.nextSibling);
        } else {
            previousSibling.parentNode.appendChild(newElement);
        }
        return newElement;
    }

    /**
     * Insert newElement directly before nextSibling.
     * @param newElement newElement
     * @param nextSibling nextSibling
     */
    public static insertBefore(newElement: Node, nextSibling: Node): Node {
        nextSibling.parentNode.insertBefore(newElement, nextSibling);
        return newElement;
    }
}
