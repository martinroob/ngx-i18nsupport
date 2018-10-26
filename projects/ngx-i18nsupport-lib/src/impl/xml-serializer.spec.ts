/**
 * Created by martin on 04.08.2018.
 * Testcases for the XmlSerializer.
 */

import {DOMParser} from 'xmldom';
import {XmlSerializer, XmlSerializerOptions} from './xml-serializer';
import {fail} from 'assert';

describe('XmlSerializer test spec', () => {

    let serializer: XmlSerializer;

    /**
     * Helper. Parse an XML string.
     * @param xmlstring
     */
    function parseXmlString(xmlstring: string): Document {
        return new DOMParser().parseFromString(xmlstring);
    }

    beforeEach(() => {
        serializer = new XmlSerializer();
    });

    it("should serialize a simple document without any changes in output", () => {
        let doc1string = `<test><elem>a test</elem></test>`;
        const doc1: Document = parseXmlString(doc1string);
        const serializedDoc = serializer.serializeToString(doc1);
        expect(serializedDoc).toEqual(doc1string);
    });

    it("should serialize a complex document with attributes etc. without any changes in output", () => {
        let doc1string = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" datatype="plaintext" original="ng2.template">
  </file>
</xliff>`;
        const doc1: Document = parseXmlString(doc1string);
        const serializedDoc = serializer.serializeToString(doc1);
        expect(serializedDoc).toEqual(doc1string);
    });

    it("should beautify output using 2 spaces for indentation", () => {
        let doc1string = `<?xml version="1.0" encoding="UTF-8"?>
<x a="1" b="&amp;"><y>a simple pcdata element</y></x>`;
        const doc1: Document = parseXmlString(doc1string);
        const beautifyOptions: XmlSerializerOptions = {
          beautify: true
        };
        const serializedDoc = serializer.serializeToString(doc1, beautifyOptions);
        const expectedResult = `<?xml version="1.0" encoding="UTF-8"?>
<x a="1" b="&amp;">
  <y>a simple pcdata element</y>
</x>`;
        expect(serializedDoc).toEqual(expectedResult);
    });

    it("should beautify output using e.g. tab for indentation", () => {
        let doc1string = `<?xml version="1.0" encoding="UTF-8"?>
<x a="1" b="&amp;"><y>a simple pcdata element</y></x>`;
        const doc1: Document = parseXmlString(doc1string);
        const beautifyOptions: XmlSerializerOptions = {
            beautify: true,
            indentString: '\t'
        };
        const serializedDoc = serializer.serializeToString(doc1, beautifyOptions);
        const expectedResult = `<?xml version="1.0" encoding="UTF-8"?>
<x a="1" b="&amp;">
\t<y>a simple pcdata element</y>
</x>`;
        expect(serializedDoc).toEqual(expectedResult);
    });

    it("should throw an error if a non whitespace char is used for indentation", () => {
        let doc1string = `<?xml version="1.0" encoding="UTF-8"?>
<x a="1" b="&amp;"><y>a simple pcdata element</y></x>`;
        const doc1: Document = parseXmlString(doc1string);
        const beautifyOptions: XmlSerializerOptions = {
            beautify: true,
            indentString: '\tx'
        };
        try {
            serializer.serializeToString(doc1, beautifyOptions);
            fail('oops, error expected here');
        } catch (err) {
            expect(err.message).toBe('indentString must not contain non white characters');
        }
    });

    it("should beautify output with mixed content", () => {
        let doc1string = `<?xml version="1.0" encoding="UTF-8"?>
<x a="1" b="&amp;"><y>a <b><it>mixed</it> content</b> element</y></x>`;
        const doc1: Document = parseXmlString(doc1string);
        const beautifyOptions: XmlSerializerOptions = {
            beautify: true,
            mixedContentElements: ['y']
        };
        const serializedDoc = serializer.serializeToString(doc1, beautifyOptions);
        const expectedResult = `<?xml version="1.0" encoding="UTF-8"?>
<x a="1" b="&amp;">
  <y>a <b><it>mixed</it> content</b> element</y>
</x>`;
        expect(serializedDoc).toEqual(expectedResult);
    });

});
