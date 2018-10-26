import {Xliff2MessageParser} from './xliff2-message-parser';
import {ParsedMessage} from './parsed-message';
import {DOMParser} from 'xmldom';
/**
 * Created by martin on 14.05.2017.
 * Testcases for parsing normalized messages to XLIFF 2.0 and vive versa.
 */

describe('message parse XLIFF 2.0 test spec', () => {

    /**
     * Helperfunction to create a parsed message from normalized string.
     * @param normalizedString
     * @param sourceMessage
     * @return {ParsedMessage}
     */
    function parsedMessageFor(normalizedString: string, sourceMessage?: ParsedMessage): ParsedMessage {
        let parser = new Xliff2MessageParser();
        return parser.parseNormalizedString(normalizedString, sourceMessage);
    }

    /**
     * Helperfunction to create a parsed message from native xml.
     * @param xmlContent
     * @param sourceMessage
     * @return {ParsedMessage}
     */
    function parsedMessageFromXML(xmlContent: string, sourceMessage?: ParsedMessage): ParsedMessage {
        let parser = new Xliff2MessageParser();
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
            expect(parsedMessage.asNativeString()).toBe('a placeholder: <ph id="0" equiv="INTERPOLATION"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse text with 2 placeholders', () => {
            let normalizedMessage = '{{1}}: a placeholder: {{0}}';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('<ph id="0" equiv="INTERPOLATION_1"/>: a placeholder: <ph id="1" equiv="INTERPOLATION"/>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse simple bold tag', () => {
            let normalizedMessage = 'a text <b>with</b> a bold text';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a text <pc id="0" equivStart="START_BOLD_TEXT" equivEnd="CLOSE_BOLD_TEXT" type="fmt" dispStart="&lt;b>" dispEnd="&lt;/b>">with</pc> a bold text');
        });

        it('should parse simple italic tag', () => {
            let normalizedMessage = 'a text <i>with</i> emphasis';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a text <pc id="0" equivStart="START_ITALIC_TEXT" equivEnd="CLOSE_ITALIC_TEXT" type="fmt" dispStart="&lt;i>" dispEnd="&lt;/i>">with</pc> emphasis');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse unknown tag', () => {
            let normalizedMessage = 'a text with <strange>strange emphasis</strange>';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('a text with <pc id="0" equivStart="START_TAG_STRANGE" equivEnd="CLOSE_TAG_STRANGE" type="other" dispStart="&lt;strange>" dispEnd="&lt;/strange>">strange emphasis</pc>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse embedded tags with placeholder inside', () => {
            let normalizedMessage = '<b><i><strange>Placeholder {{0}}</strange></i></b>';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('<pc id="0" equivStart="START_BOLD_TEXT" equivEnd="CLOSE_BOLD_TEXT" type="fmt" dispStart="&lt;b>" dispEnd="&lt;/b>"><pc id="1" equivStart="START_ITALIC_TEXT" equivEnd="CLOSE_ITALIC_TEXT" type="fmt" dispStart="&lt;i>" dispEnd="&lt;/i>"><pc id="2" equivStart="START_TAG_STRANGE" equivEnd="CLOSE_TAG_STRANGE" type="other" dispStart="&lt;strange>" dispEnd="&lt;/strange>">Placeholder <ph id="3" equiv="INTERPOLATION"/></pc></pc></pc>');
            checkToXmlAndBack(normalizedMessage);
        });

        it('should parse ICU Refs', () => {
            let normalizedMessage = 'a text with <ICU-Message-Ref_0/>';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            // old syntax before angular #17344
            // expect(parsedMessage.asNativeString()).toBe('a text with <ph id="0"/>');
            // new syntax after angular #17344
            expect(parsedMessage.asNativeString()).toBe('a text with <ph id="0" equiv="ICU"/>');
            checkToXmlAndBack(normalizedMessage);
        });

     });

    describe('xml to normalized message', () => {

        it('should parse simple text content', () => {
           let parsedMessage = parsedMessageFromXML('a simple content');
           expect(parsedMessage.asDisplayString()).toBe('a simple content');
        });

        it('should parse strange tag with placeholder content', () => {
            let parsedMessage = parsedMessageFromXML('Diese Nachricht ist <pc id="0" equivStart="START_TAG_STRANGE" equivEnd="CLOSE_TAG_STRANGE" type="other" dispStart="&lt;strange&gt;" dispEnd="&lt;/strange&gt;"><ph id="1" equiv="INTERPOLATION" disp="{{strangeness}}"/></pc>');
            expect(parsedMessage.asDisplayString()).toBe('Diese Nachricht ist <strange>{{0}}</strange>');
        });

        it('should parse embedded tags', () => {
            let parsedMessage = parsedMessageFromXML('Diese Nachricht ist <pc id="0" equivStart="START_BOLD_TEXT" equivEnd="CLOSE_BOLD_TEXT" type="fmt" dispStart="&lt;b&gt;" dispEnd="&lt;/b&gt;"><pc id="1" equivStart="START_TAG_STRONG" equivEnd="CLOSE_TAG_STRONG" type="other" dispStart="&lt;strong&gt;" dispEnd="&lt;/strong&gt;">SEHR WICHTIG</pc></pc>');
            expect(parsedMessage.asDisplayString()).toBe('Diese Nachricht ist <b><strong>SEHR WICHTIG</strong></b>');
        });

        it('should parse complex message with embedded placeholder', () => {
            let parsedMessage = parsedMessageFromXML('<pc id="0" equivStart="START_LINK" equivEnd="CLOSE_LINK" type="link" dispStart="&lt;a>" dispEnd="&lt;/a>">link1 with placeholder <ph id="1" equiv="INTERPOLATION" disp="{{placeholder}}"/></pc>');
            expect(parsedMessage.asDisplayString()).toBe('<a>link1 with placeholder {{0}}</a>');
        });

        it('should report an error when xml string is not correct (TODO, does not work)', () => {
            let parsedMessage = parsedMessageFromXML('</dummy></dummy>');
            expect(parsedMessage.asDisplayString()).toBe(''); // TODO xmldoc does not report any error
        });

        it('should parse message with embedded ICU message reference', () => {
            let parsedMessage = parsedMessageFromXML('first: <ph id="0"/>');
            expect(parsedMessage.asDisplayString()).toBe('first: <ICU-Message-Ref_0/>');
        });

        it('should parse message with embedded ICU message reference (new syntax after angular #17344)', () => {
            let parsedMessage = parsedMessageFromXML('first: <ph id="0" equiv="ICU" disp="{count, plural, =0 {...} =1 {...} other {...}}"/>');
            expect(parsedMessage.asDisplayString()).toBe('first: <ICU-Message-Ref_0/>');
        });

        it('should parse message with 2 embedded ICU message reference', () => {
            let parsedMessage = parsedMessageFromXML('first: <ph id="0"/>, second <ph id="1"/>');
            expect(parsedMessage.asDisplayString()).toBe('first: <ICU-Message-Ref_0/>, second <ICU-Message-Ref_1/>');
        });

        it('should parse message with 2 embedded ICU message reference (new syntax after angular #17344)', () => {
            let parsedMessage = parsedMessageFromXML('first: <ph id="0" equiv="ICU" disp="{count, plural, =0 {...} =1 {...} other {...}}"/>, second <ph id="1" equiv="ICU_1" disp="{gender, select, m {...} f {...}}"/>');
            expect(parsedMessage.asDisplayString()).toBe('first: <ICU-Message-Ref_0/>, second <ICU-Message-Ref_1/>');
        });

        it('should parse empty tag like <br>', () => {
            let normalizedMessage = 'one line<br>second line';
            let parsedMessage = parsedMessageFor(normalizedMessage);
            expect(parsedMessage.asDisplayString()).toBe(normalizedMessage);
            expect(parsedMessage.asNativeString()).toBe('one line<ph id="0" equiv="LINE_BREAK" type="fmt" disp="&lt;br/>"/>second line');
            checkToXmlAndBack(normalizedMessage);
        });

    });

});