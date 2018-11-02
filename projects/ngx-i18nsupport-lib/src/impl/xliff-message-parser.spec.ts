import {XliffMessageParser} from './xliff-message-parser';
import {ParsedMessage} from './parsed-message';
import {DOMParser} from 'xmldom';
import {INormalizedMessage} from '../api/index';
/**
 * Created by martin on 17.05.2017.
 * Testcases for parsing normalized messages to XLIFF 1.2 and vive versa.
 */

describe('message parse XLIFF 1.2 test spec', () => {

    /**
     * Helperfunction to create a parsed message from normalized string.
     * @param normalizedString normalizedString
     * @param sourceMessage sourceMessage
     * @return ParsedMessage
     */
    function parsedMessageFor(normalizedString: string, sourceMessage?: ParsedMessage): ParsedMessage {
        const parser = new XliffMessageParser();
        return parser.parseNormalizedString(normalizedString, sourceMessage);
    }

    /**
     * Helperfunction to create a parsed message from native xml.
     * @param xmlContent xmlContent
     * @param sourceMessage sourceMessage
     * @return ParsedMessage
     */
    function parsedMessageFromXML(xmlContent: string, sourceMessage?: ParsedMessage): ParsedMessage {
        const parser = new XliffMessageParser();
        return parser.createNormalizedMessageFromXMLString(xmlContent, sourceMessage);
    }

    /**
     * create normalized message from string, then create one from generated xml.
     * Check that it is the same.
     * @param normalizedMessage normalizedMessage
     */
    function checkToXmlAndBack(normalizedMessage: string) {
        const xml = parsedMessageFor(normalizedMessage).asNativeString();
        expect(parsedMessageFromXML('<source>' + xml + '</source>').asDisplayString()).toBe(normalizedMessage);
    }

    describe('normalized message to xml', () => {

        it('should parse plain text', () => {
            const normalizedMessage = 'a text without anything special';
            const parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe(normalizedMessage);
        });

        it('should parse text with placeholder', () => {
            const normalizedMessage = 'a placeholder: {{0}}';
            const parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a placeholder: <x id="INTERPOLATION"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse text with 2 placeholders', () => {
            const normalizedMessage = '{{1}}: a placeholder: {{0}}';
            const parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('<x id="INTERPOLATION_1"/>: a placeholder: <x id="INTERPOLATION"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse simple bold tag', () => {
            const normalizedMessage = 'a text <b>with</b> a bold text';
            const parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString())
                .toBe('a text <x id="START_BOLD_TEXT" ctype="x-b" equiv-text="&lt;b>"/>' +
                    'with<x id="CLOSE_BOLD_TEXT" ctype="x-b"/> a bold text');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse simple italic tag', () => {
            const normalizedMessage = 'a text <i>with</i> emphasis';
            const parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString())
                .toBe('a text <x id="START_ITALIC_TEXT" ctype="x-i" equiv-text="&lt;i>"/>' +
                    'with<x id="CLOSE_ITALIC_TEXT" ctype="x-i"/> emphasis');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse unknown tag', () => {
            const normalizedMessage = 'a text with <strange>strange emphasis</strange>';
            const parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString())
                .toBe('a text with <x id="START_TAG_STRANGE" ctype="x-strange" equiv-text="&lt;strange>"/>' +
                    'strange emphasis<x id="CLOSE_TAG_STRANGE" ctype="x-strange"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse embedded tags with placeholder inside', () => {
            const normalizedMessage = '<b><i><strange>Placeholder {{0}}</strange></i></b>';
            const parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString())
                .toBe('<x id="START_BOLD_TEXT" ctype="x-b" equiv-text="&lt;b>"/><x id="START_ITALIC_TEXT"' +
                    ' ctype="x-i" equiv-text="&lt;i>"/><x id="START_TAG_STRANGE" ctype="x-strange" equiv-text="&lt;strange>"/>' +
                    'Placeholder <x id="INTERPOLATION"/><x id="CLOSE_TAG_STRANGE" ctype="x-strange"/><x id="CLOSE_ITALIC_TEXT"' +
                    ' ctype="x-i"/><x id="CLOSE_BOLD_TEXT" ctype="x-b"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse empty tag like <br>', () => {
            const normalizedMessage = 'one line<br>second line';
            const parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('one line<x id="LINE_BREAK" ctype="lb" equiv-text="&lt;br/>"/>second line');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse ICU Refs', () => {
            const normalizedMessage = 'a text with <ICU-Message-Ref_0/>';
            const parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a text with <x id="ICU"/>');
            checkToXmlAndBack(normalizedMessage);
        });

    });

    describe('xml to normalized message', () => {

        it('should parse simple text content', () => {
           const parsedMessage = parsedMessageFromXML('a simple content');
           expect(parsedMessage.asDisplayString()).toBe('a simple content');
        });

        it('should parse strange tag with placeholder content', () => {
            const parsedMessage = parsedMessageFromXML('Diese Nachricht ist <x id="START_TAG_STRANGE" ctype="x-strange"/>' +
                '<x id="INTERPOLATION"/><x id="CLOSE_TAG_STRANGE" ctype="x-strange"/>');
            expect(parsedMessage.asDisplayString()).toBe('Diese Nachricht ist <strange>{{0}}</strange>');
        });

        it('should parse embedded tags', () => {
            const parsedMessage = parsedMessageFromXML('Diese Nachricht ist <x id="START_BOLD_TEXT" ctype="x-b"/>' +
                '<x id="START_TAG_STRANGE" ctype="x-strange"/>SEHR WICHTIG<x id="CLOSE_TAG_STRANGE"' +
                ' ctype="x-strange"/><x id="CLOSE_BOLD_TEXT" ctype="x-b"/>');
            expect(parsedMessage.asDisplayString()).toBe('Diese Nachricht ist <b><strange>SEHR WICHTIG</strange></b>');
        });

        it('should parse complex message with embedded placeholder', () => {
            const parsedMessage = parsedMessageFromXML('<x id="START_LINK" ctype="x-a"/>link1 with placeholder ' +
                '<x id="INTERPOLATION"/><x id="CLOSE_LINK" ctype="x-a"/>');
            expect(parsedMessage.asDisplayString()).toBe('<a>link1 with placeholder {{0}}</a>');
        });

        it('should throw an error due to not well formed elements <b><strange></b>', () => {
            try {
                const parsedMessage = parsedMessageFromXML('Diese Nachricht ist falsch geschachtelt: ' +
                    '<x id="START_BOLD_TEXT" ctype="x-b"/><x id="START_TAG_STRANGE" ctype="x-strange"/>' +
                    'FALSCH<x id="CLOSE_BOLD_TEXT" ctype="x-b"/><x id="CLOSE_TAG_STRANGE" ctype="x-strange"/>');
                expect(parsedMessage.toString()).toBe('should throw an error');
            } catch (e) {
                expect(e.message).toContain('unexpected close tag b');
            }
        });

        it('should parse message with embedded ICU message reference', () => {
            const parsedMessage = parsedMessageFromXML('first: <x id="ICU"/>');
            expect(parsedMessage.asDisplayString()).toBe('first: <ICU-Message-Ref_0/>');
        });

        it('should parse message with 2 embedded ICU message reference', () => {
            const parsedMessage = parsedMessageFromXML('first: <x id="ICU"/>, second <x id="ICU_1"/>');
            expect(parsedMessage.asDisplayString()).toBe('first: <ICU-Message-Ref_0/>, second <ICU-Message-Ref_1/>');
        });

        it('should set correct placeholer index (issue #84 ngx-i18nsupport) ', () => {
            const messageWith2Indexes = 'New <x id="START_TAG_XY" ctype="x-xy" equiv-text="&lt;xy&gt;"/>' +
                '<x id="CLOSE_TAG_XY" ctype="x-xy" equiv-text="&lt;/xy&gt;"/> was reported by <x id="START_TAG_XY_1" ctype="x-xy"' +
                ' equiv-text="&lt;xy&gt;"/><x id="CLOSE_TAG_XY" ctype="x-xy" equiv-text="&lt;/xy&gt;"/>';
            const parsedMessage = parsedMessageFromXML(messageWith2Indexes);
            const normalizedMessageString = parsedMessage.asDisplayString();
            expect(normalizedMessageString).toBe('New <xy></xy> was reported by <xy id="1"></xy>');
            const translatedMessage: INormalizedMessage = parsedMessage.translate('New <xy></xy> was reported by <xy id="1"></xy>');
            expect(translatedMessage.asNativeString()).toBe('New <x id="START_TAG_XY" ctype="x-xy" equiv-text="&lt;xy>"/>' +
                '<x id="CLOSE_TAG_XY" ctype="x-xy"/> was reported by <x id="START_TAG_XY_1" ctype="x-xy"' +
                ' equiv-text="&lt;xy>"/><x id="CLOSE_TAG_XY" ctype="x-xy"/>');
        });

        it('should parse simple plural ICU message', () => {
            const parsedMessage =
                parsedMessageFromXML('{VAR_PLURAL, plural, =0 {just now} =1 {one minute ago} other {a few minutes ago} }');
            expect(parsedMessage.asDisplayString()).toBe('<ICU-Message/>');
            expect(parsedMessage.getICUMessage()).toBeTruthy();
            const icuMessage = parsedMessage.getICUMessage();
            expect(icuMessage.getCategories().length).toBe(3);
        });

        it('should parse plural ICU message with placeholder', () => {
            const parsedMessage = parsedMessageFromXML('{VAR_PLURAL, plural, =0 {just now} =1 {one minute ago}' +
                ' other {<x id="INTERPOLATION" equiv-text="{{minutes}}"/> minutes ago} }');
            expect(parsedMessage.asDisplayString()).toBe('<ICU-Message/>');
            expect(parsedMessage.getICUMessage()).toBeTruthy();
            const icuMessage = parsedMessage.getICUMessage();
            expect(icuMessage.getCategories().length).toBe(3);
            expect(icuMessage.getCategories()[2].getMessageNormalized().asDisplayString()).toBe('{{0}} minutes ago');
        });

    });

});
