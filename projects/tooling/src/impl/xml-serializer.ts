/**
 * An XmlSerializer that supports formatting.
 * Original code is based on [xmldom](https://www.npmjs.com/package/xmldom)
 * It is extended to support formatting including handling of elements with mixed content.
 * Example formatted output:
 * <pre>
 *     <doc>
 *         <element>An element with
 *             <b>mixed</b>
 *              content
 *         </element>
 *     </doc>
 * </pre>
 * Same when "element" is indicated as "mixedContentElement":
 * <pre>
 *     <doc>
 *         <element>An element with <b>mixed</b> content</element>
 *     </doc>
 * </pre>
 */

interface Namespace {
    prefix: string;
    namespace: string;
}

/**
 * Options used to control the formatting
 */
export interface XmlSerializerOptions {
    beautify?: boolean; // set to activate beautify
    indentString?: string; // Sequence uses for indentation, must only contain white space chars, e.g. "  " or "    " or "\t"
    mixedContentElements?: string[]; // Names of elements containing mixed content (these are not beautified)
}

const DEFAULT_INDENT_STRING = '  ';

export class XmlSerializer {

    constructor() {

    }

    /**
     * Serialze xml document to string.
     * @param document the document
     * @param options can be used to activate beautifying.
     */
    serializeToString(document: Document, options?: XmlSerializerOptions): string {
        let buf = [];
        let visibleNamespaces: Namespace[] = [];
        const refNode = document.documentElement;
        let prefix = refNode.prefix;
        const uri = refNode.namespaceURI;

        if (uri && prefix == null) {
            prefix = refNode.lookupPrefix(uri);
            if (prefix == null) {
                visibleNamespaces = [
                    {namespace: uri, prefix: null}
                    //{namespace:uri,prefix:''}
                ]
            }
        }
        if (!options) {
            options = {};
        }
        if (options.indentString) {
            if (!this.containsOnlyWhiteSpace(options.indentString)) {
                throw new Error('indentString must not contain non white characters');
            }
        }
        this.doSerializeToString(document, options, buf, 0, false, visibleNamespaces);
        return buf.join('');
    }

    /**
     * Main format method that does all the work.
     * Outputs a node to the outputbuffer.
     * @param node the node to be formatted.
     * @param options
     * @param buf outputbuffer, new output will be appended to this array.
     * @param indentLevel Lever of indentation for formatted output.
     * @param partOfMixedContent true, if node is a subelement of an element containind mixed content.
     * @param visibleNamespaces
     */
    private doSerializeToString(node: Node, options: XmlSerializerOptions, buf: string[], indentLevel: number, partOfMixedContent: boolean, visibleNamespaces: Namespace[]) {
        let child: Node;
        switch (node.nodeType) {
            case node.ELEMENT_NODE:
                const elementNode: Element = <Element> node;
                const attrs = elementNode.attributes;
                const len = attrs.length;
                child = elementNode.firstChild;
                const nodeName = elementNode.tagName;
                const elementHasMixedContent = this.isMixedContentElement(nodeName, options);
                if (partOfMixedContent) {
                    buf.push('<' , nodeName);
                } else {
                    this.outputIndented(options, buf, indentLevel, '<' , nodeName);
                }

                for (let i = 0; i < len; i++) {
                    // add namespaces for attributes
                    let attr = attrs.item(i);
                    if (attr.prefix === 'xmlns') {
                        visibleNamespaces.push({prefix: attr.localName, namespace: attr.value});
                    } else if (attr.nodeName === 'xmlns') {
                        visibleNamespaces.push({prefix: '', namespace: attr.value});
                    }
                }
                for (let i = 0; i < len; i++) {
                    let attr = attrs.item(i);
                    if (this.needNamespaceDefine(attr, visibleNamespaces)) {
                        const prefix = attr.prefix || '';
                        const uri = attr.namespaceURI;
                        const ns = prefix ? ' xmlns:' + prefix : " xmlns";
                        buf.push(ns, '="', uri, '"');
                        visibleNamespaces.push({prefix: prefix, namespace: uri});
                    }
                    this.doSerializeToString(attr, options, buf, indentLevel, false, visibleNamespaces);
                }
                // add namespace for current node
                if (this.needNamespaceDefine(elementNode, visibleNamespaces)) {
                    const prefix = elementNode.prefix || '';
                    const uri = node.namespaceURI;
                    const ns = prefix ? ' xmlns:' + prefix : " xmlns";
                    buf.push(ns, '="', uri, '"');
                    visibleNamespaces.push({prefix: prefix, namespace: uri});
                }

                if (child) {
                    buf.push('>');
                    //if is cdata child node
                    let hasComplexContent = false;
                    while (child) {
                        if (child.nodeType === child.ELEMENT_NODE) {
                            hasComplexContent = true;
                        }
                        this.doSerializeToString(child, options, buf, indentLevel + 1, partOfMixedContent || elementHasMixedContent, visibleNamespaces);
                        child = child.nextSibling;
                    }
                    if (!partOfMixedContent && !elementHasMixedContent && hasComplexContent) {
                        this.outputIndented(options, buf, indentLevel, '</', nodeName, '>');
                    } else {
                        buf.push('</', nodeName, '>');
                    }
                } else {
                    buf.push('/>');
                }
                return;
            case node.DOCUMENT_NODE:
            case node.DOCUMENT_FRAGMENT_NODE:
                child = node.firstChild;
                while (child) {
                    this.doSerializeToString(child, options, buf, indentLevel, false, visibleNamespaces);
                    child = child.nextSibling;
                }
                return;
            case node.ATTRIBUTE_NODE:
                const attrNode = <Attr> node;
                return buf.push(' ', attrNode.name, '="', attrNode.value.replace(/[<&"]/g, this._xmlEncoder), '"');
            case node.TEXT_NODE:
                const textNode = <Text> node;
                if (!options.beautify || partOfMixedContent || !this.containsOnlyWhiteSpace(textNode.data)) {
                    return buf.push(textNode.data.replace(/[<&]/g, this._xmlEncoder));
                }
                return;
            case node.CDATA_SECTION_NODE:
                const cdatasectionNode = <CDATASection> node;
                return buf.push('<![CDATA[', cdatasectionNode.data, ']]>');
            case node.COMMENT_NODE:
                const commentNode = <Comment> node;
                return buf.push("<!--", commentNode.data, "-->");
            case node.DOCUMENT_TYPE_NODE:
                const documenttypeNode = <DocumentType> node;
                const pubid = documenttypeNode.publicId;
                const sysid = documenttypeNode.systemId;
                buf.push('<!DOCTYPE ', documenttypeNode.name);
                if (pubid) {
                    buf.push(' PUBLIC "', pubid);
                    if (sysid && sysid !== '.') {
                        buf.push('" "', sysid);
                    }
                    buf.push('">');
                } else if (sysid && sysid !== '.') {
                    buf.push(' SYSTEM "', sysid, '">');
                } else {
                    var sub = documenttypeNode.internalSubset;
                    if (sub) {
                        buf.push(" [", sub, "]");
                    }
                    buf.push(">");
                }
                return;
            case node.PROCESSING_INSTRUCTION_NODE:
                const piNode = <ProcessingInstruction> node;
                return buf.push("<?", piNode.target, " ", piNode.data, "?>");
            case node.ENTITY_REFERENCE_NODE:
                return buf.push('&', node.nodeName, ';');
            //case ENTITY_NODE:
            //case NOTATION_NODE:
            default:
                buf.push('??', node.nodeName);
        }
    }

    private needNamespaceDefine(node: Element | Attr, visibleNamespaces: Namespace[]): boolean {
        const prefix = node.prefix || '';
        const uri = node.namespaceURI;
        if (!prefix && !uri) {
            return false;
        }
        if (prefix === "xml" && uri === "http://www.w3.org/XML/1998/namespace"
            || uri === 'http://www.w3.org/2000/xmlns/') {
            return false;
        }

        let i = visibleNamespaces.length;
        while (i--) {
            const ns = visibleNamespaces[i];
            // get namespace prefix
            if (ns.prefix === prefix) {
                return ns.namespace !== uri;
            }
        }
        return true;
    }

    private _xmlEncoder(c: string): string {
        return c === '<' && '&lt;' ||
            c === '>' && '&gt;' ||
            c === '&' && '&amp;' ||
            c === '"' && '&quot;' ||
            '&#'+ c.charCodeAt(0)+';'
    }

    private outputIndented(options: XmlSerializerOptions, buf: string[], indentLevel: number, ...outputParts: string[]) {
        if (options.beautify) {
            buf.push('\n');
            if (indentLevel > 0) {
                buf.push(this.indentationString(options, indentLevel));
            }
        }
        buf.push(...outputParts);
    }

    private indentationString(options: XmlSerializerOptions, indentLevel: number): string {
        const indent = (options.indentString) ? options.indentString : DEFAULT_INDENT_STRING;
        let result = '';
        for (let i = 0; i < indentLevel; i++) {
            result = result + indent;
        }
        return result;
    }

    /**
     * Test, wether tagName is an element containing mixed content.
     * @param tagName
     * @param options
     */
    private isMixedContentElement(tagName: string, options: XmlSerializerOptions): boolean {
        if (options && options.mixedContentElements) {
            return !!options.mixedContentElements.find((tag) => tag === tagName);
        } else {
            return false;
        }
    }

    private containsOnlyWhiteSpace(text: string): boolean {
        for (let i = 0; i < text.length; i++) {
            const c = text.charAt(i);
            if (!(c === ' ' || c === '\t' || c === '\r' || c === '\n')) {
                return false;
            }
        }
        return true;
    }
}