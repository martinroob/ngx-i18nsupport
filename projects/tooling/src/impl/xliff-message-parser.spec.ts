import {XliffMessageParser} from './xliff-message-parser';
import {ParsedMessage} from './parsed-message';
import {DOMParser} from 'xmldom';
import {INormalizedMessage} from '../api';
/**
 * Created by martin on 17.05.2017.
 * Testcases for parsing normalized messages to XLIFF 1.2 and vive versa.
 */

describe('message parse XLIFF 1.2 test spec', () => {

    /**
     * Helperfunction to create a parsed message from normalized string.
     * @param normalizedString
     * @param sourceMessage
     * @return {ParsedMessage}
     */
    function parsedMessageFor(normalizedString: string, sourceMessage?: ParsedMessage): ParsedMessage {
        let parser = new XliffMessageParser();
        return parser.parseNormalizedString(normalizedString, sourceMessage);
    }

    /**
     * Helperfunction to create a parsed message from native xml.
     * @param xmlContent
     * @param sourceMessage
     * @return {ParsedMessage}
     */
    function parsedMessageFromXML(xmlContent: string, sourceMessage?: ParsedMessage): ParsedMessage {
        let parser = new XliffMessageParser();
        return parser.createNormalizedMessageFromXMLString(xmlContent, sourceMessage);
    }

    /**
     * create normalized message from string, then create one from generated xml.
     * Check that it is the same.
     * @param normalizedMessage
     */
    function checkToXmlAndBack(normalizedMessage: string) {
        const xml = parsedMessageFor(normalizedMessage).asNativeString();
        expect(parsedMessageFromXML('<source>' + xml + '</source>').asDisplayString()).toBe(normalizedMessage);
    }

    describe('normalized message to xml', () => {

        it('should parse plain text', () => {
            let normalizedMessage = 'a text without anything special';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe(normalizedMessage);
        });

        it('should parse text with placeholder', () => {
            let normalizedMessage = 'a placeholder: {{0}}';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a placeholder: <x id="INTERPOLATION"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse text with 2 placeholders', () => {
            let normalizedMessage = '{{1}}: a placeholder: {{0}}';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('<x id="INTERPOLATION_1"/>: a placeholder: <x id="INTERPOLATION"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse simple bold tag', () => {
            let normalizedMessage = 'a text <b>with</b> a bold text';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a text <x id="START_BOLD_TEXT" ctype="x-b" equiv-text="&lt;b>"/>with<x id="CLOSE_BOLD_TEXT" ctype="x-b"/> a bold text');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse simple italic tag', () => {
            let normalizedMessage = 'a text <i>with</i> emphasis';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a text <x id="START_ITALIC_TEXT" ctype="x-i" equiv-text="&lt;i>"/>with<x id="CLOSE_ITALIC_TEXT" ctype="x-i"/> emphasis');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse unknown tag', () => {
            let normalizedMessage = 'a text with <strange>strange emphasis</strange>';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a text with <x id="START_TAG_STRANGE" ctype="x-strange" equiv-text="&lt;strange>"/>strange emphasis<x id="CLOSE_TAG_STRANGE" ctype="x-strange"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse embedded tags with placeholder inside', () => {
            let normalizedMessage = '<b><i><strange>Placeholder {{0}}</strange></i></b>';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('<x id="START_BOLD_TEXT" ctype="x-b" equiv-text="&lt;b>"/><x id="START_ITALIC_TEXT" ctype="x-i" equiv-text="&lt;i>"/><x id="START_TAG_STRANGE" ctype="x-strange" equiv-text="&lt;strange>"/>Placeholder <x id="INTERPOLATION"/><x id="CLOSE_TAG_STRANGE" ctype="x-strange"/><x id="CLOSE_ITALIC_TEXT" ctype="x-i"/><x id="CLOSE_BOLD_TEXT" ctype="x-b"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse empty tag like <br>', () => {
            let normalizedMessage = 'one line<br>second line';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('one line<x id="LINE_BREAK" ctype="lb" equiv-text="&lt;br/>"/>second line');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse ICU Refs', () => {
            let normalizedMessage = 'a text with <ICU-Message-Ref_0/>';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a text with <x id="ICU"/>');
            checkToXmlAndBack(normalizedMessage);
        });

    });

    describe('xml to normalized message', () => {

        it('should parse simple text content', () => {
           let parsedMessage = parsedMessageFromXML('a simple content');
           expect(parsedMessage.asDisplayString()).toBe('a simple content');
        });

        it('should parse strange tag with placeholder content', () => {
            let parsedMessage = parsedMessageFromXML('Diese Nachricht ist <x id="START_TAG_STRANGE" ctype="x-strange"/><x id="INTERPOLATION"/><x id="CLOSE_TAG_STRANGE" ctype="x-strange"/>');
            expect(parsedMessage.asDisplayString()).toBe('Diese Nachricht ist <strange>{{0}}</strange>');
        });

        it('should parse embedded tags', () => {
            let parsedMessage = parsedMessageFromXML('Diese Nachricht ist <x id="START_BOLD_TEXT" ctype="x-b"/><x id="START_TAG_STRANGE" ctype="x-strange"/>SEHR WICHTIG<x id="CLOSE_TAG_STRANGE" ctype="x-strange"/><x id="CLOSE_BOLD_TEXT" ctype="x-b"/>');
            expect(parsedMessage.asDisplayString()).toBe('Diese Nachricht ist <b><strange>SEHR WICHTIG</strange></b>');
        });

        it('should parse complex message with embedded placeholder', () => {
            let parsedMessage = parsedMessageFromXML('<x id="START_LINK" ctype="x-a"/>link1 with placeholder <x id="INTERPOLATION"/><x id="CLOSE_LINK" ctype="x-a"/>');
            expect(parsedMessage.asDisplayString()).toBe('<a>link1 with placeholder {{0}}</a>');
        });

        it('should throw an error due to not well formed elements <b><strange></b>', () => {
            try {
                let parsedMessage = parsedMessageFromXML('Diese Nachricht ist falsch geschachtelt: <x id="START_BOLD_TEXT" ctype="x-b"/><x id="START_TAG_STRANGE" ctype="x-strange"/>FALSCH<x id="CLOSE_BOLD_TEXT" ctype="x-b"/><x id="CLOSE_TAG_STRANGE" ctype="x-strange"/>');
                expect('parsedMessage').toBe('should throw an error');
            } catch (e) {
                expect(e.message).toContain('unexpected close tag b');
            }
        });

        it('should parse message with embedded ICU message reference', () => {
            let parsedMessage = parsedMessageFromXML('first: <x id="ICU"/>');
            expect(parsedMessage.asDisplayString()).toBe('first: <ICU-Message-Ref_0/>');
        });

        it('should parse message with 2 embedded ICU message reference', () => {
            let parsedMessage = parsedMessageFromXML('first: <x id="ICU"/>, second <x id="ICU_1"/>');
            expect(parsedMessage.asDisplayString()).toBe('first: <ICU-Message-Ref_0/>, second <ICU-Message-Ref_1/>');
        });

        it('should set correct placeholer index (issue #84 ngx-i18nsupport) ', () => {
            const messageWith2Indexes = 'New <x id="START_TAG_XY" ctype="x-xy" equiv-text="&lt;xy&gt;"/><x id="CLOSE_TAG_XY" ctype="x-xy" equiv-text="&lt;/xy&gt;"/> was reported by <x id="START_TAG_XY_1" ctype="x-xy" equiv-text="&lt;xy&gt;"/><x id="CLOSE_TAG_XY" ctype="x-xy" equiv-text="&lt;/xy&gt;"/>';
            let parsedMessage = parsedMessageFromXML(messageWith2Indexes);
            const normalizedMessageString = parsedMessage.asDisplayString();
            expect(normalizedMessageString).toBe('New <xy></xy> was reported by <xy id="1"></xy>');
            const translatedMessage: INormalizedMessage = parsedMessage.translate('New <xy></xy> was reported by <xy id="1"></xy>');
            expect(translatedMessage.asNativeString()).toBe('New <x id="START_TAG_XY" ctype="x-xy" equiv-text="&lt;xy>"/><x id="CLOSE_TAG_XY" ctype="x-xy"/> was reported by <x id="START_TAG_XY_1" ctype="x-xy" equiv-text="&lt;xy>"/><x id="CLOSE_TAG_XY" ctype="x-xy"/>');
        });

        it('should parse simple plural ICU message', () => {
            let parsedMessage = parsedMessageFromXML('{VAR_PLURAL, plural, =0 {just now} =1 {one minute ago} other {a few minutes ago} }');
            expect(parsedMessage.asDisplayString()).toBe('<ICU-Message/>');
            expect(parsedMessage.getICUMessage()).toBeTruthy();
            const icuMessage = parsedMessage.getICUMessage();
            expect(icuMessage.getCategories().length).toBe(3);
        });

        it('should parse plural ICU message with placeholder', () => {
            let parsedMessage = parsedMessageFromXML('{VAR_PLURAL, plural, =0 {just now} =1 {one minute ago} other {<x id="INTERPOLATION" equiv-text="{{minutes}}"/> minutes ago} }');
            expect(parsedMessage.asDisplayString()).toBe('<ICU-Message/>');
            expect(parsedMessage.getICUMessage()).toBeTruthy();
            const icuMessage = parsedMessage.getICUMessage();
            expect(icuMessage.getCategories().length).toBe(3);
            expect(icuMessage.getCategories()[2].getMessageNormalized().asDisplayString()).toBe('{{0}} minutes ago');
        });

    });

});