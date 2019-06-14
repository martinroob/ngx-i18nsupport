import {Xliff2MessageParser} from './xliff2-message-parser';
import {ParsedMessage} from './parsed-message';
import {INormalizedMessage} from '../api/index';
import {IMessageParser} from './i-message-parser';
import {XliffMessageParser} from './xliff-message-parser';
import {XmbMessageParser} from './xmb-message-parser';
/**
 * Created by martin on 17.05.2017.
 * Testcases for parsed messages.
 */

describe('normalized message test spec', () => {

    /**
     * Helperfunction to create a parsed message from normalized string.
     * @param normalizedString normalizedString
     * @param sourceMessage sourceMessage
     * @return new parsed message
     */
    function parsedMessageFor(normalizedString: string, sourceMessage?: ParsedMessage): ParsedMessage {
        const parser = new Xliff2MessageParser(); // parser does not matter here, every format should be the same.
        return parser.parseNormalizedString(normalizedString, sourceMessage);
    }

    /**
     * Helperfunction to create an ICU Message.
     * @param icuMessageString icuMessageString
     * @param sourceMessage sourceMessage
     * @param parserType (optional) xlf or xlf2 or xmb, default xlf2
     * @return new isu message
     */
    function parsedICUMessage(icuMessageString: string, sourceMessage?: ParsedMessage, parserType?: string): INormalizedMessage {
        let parser: IMessageParser;
        if (sourceMessage) {
            parser = sourceMessage.getParser();
        } else {
            if (parserType) {
                switch (parserType) {
                    case 'xlf':
                        parser = new XliffMessageParser();
                        break;
                    case 'xlf':
                        parser = new XmbMessageParser();
                        break;
                    case 'xlf2':
                        parser = new Xliff2MessageParser();
                        break;
                }
            } else {
                parser = new Xliff2MessageParser(); // parser does not matter here, every format should be the same.
            }
        }
        return parser.parseICUMessage(icuMessageString, sourceMessage);
    }

    describe('validation test cases ', () => {

        it('should find nothing wrong with simple text message', () => {
            const translation = 'a text without anything special';
            const parsedMessage = parsedMessageFor(translation);
            expect(parsedMessage.validate()).toBeFalsy();
            expect(parsedMessage.validateWarnings()).toBeFalsy();
        });

        it('should find nothing wrong with simple text as translation of simple text', () => {
            const original = 'any text';
            const translation = 'a text without anything special';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            expect(translatedMessage.validateWarnings()).toBeFalsy();
        });

        it('should warn if you remove a placeholder in the translation', () => {
            const original = 'a text with placeholder: {{0}}';
            const translation = 'a text without anything special';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            const warnings = translatedMessage.validateWarnings();
            expect(warnings).toBeTruthy();
            expect(warnings.placeholderRemoved).toBe('removed placeholder 0 from original message');
        });

        it('should warn if you remove 2 placeholders in the translation', () => {
            const original = 'a text with placeholders: {{0}} and {{1}}';
            const translation = 'a text without anything special';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            const warnings = translatedMessage.validateWarnings();
            expect(warnings).toBeTruthy();
            expect(warnings.placeholderRemoved).toBe('removed placeholders 0, 1 from original message');
        });

        it('should report an error if you add a new placeholder in the translation', () => {
            const original = 'a text with placeholder: {{0}}';
            const translation = 'a text with 2 placeholders: {{0}} and {{1}}';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validateWarnings()).toBeFalsy();
            const errors = translatedMessage.validate();
            expect(errors).toBeTruthy();
            expect(errors.placeholderAdded).toBe('added placeholder 1, which is not in original message');
        });

        it('should report an error if you add 2 new placeholders in the translation', () => {
            const original = 'a text with placeholder: {{0}}';
            const translation = 'a text with 3 placeholders: {{0}} and {{1}} and {{2}}';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validateWarnings()).toBeFalsy();
            const errors = translatedMessage.validate();
            expect(errors).toBeTruthy();
            expect(errors.placeholderAdded).toBe('added placeholders 1, 2, which are not in original message');
        });

        it('should not report an error if you duplicate a placeholder in the translation', () => {
            const original = 'a text with placeholder: {{0}}';
            const translation = 'a text with a duplicated placeholders: {{0}} and {{0}}';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            expect(translatedMessage.validateWarnings()).toBeFalsy();
        });

        it('should warn if you remove a tag in the translation', () => {
            const original = 'a <b>bold</b> text';
            const translation = 'a non bold text';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            const warnings = translatedMessage.validateWarnings();
            expect(warnings).toBeTruthy();
            expect(warnings.tagRemoved).toBe('removed tag <b> from original message');
        });

        it('should warn if you add a tag in the translation', () => {
            const original = 'a normal text';
            const translation = 'a <strange>text</strange>';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            const warnings = translatedMessage.validateWarnings();
            expect(warnings).toBeTruthy();
            expect(warnings.tagAdded).toBe('added tag <strange>, which is not in original message');
        });

        it('should warn if you remove an empty tag in the translation', () => {
            const original = 'a text with <br>line break and <img>';
            const translation = 'a text';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            const warnings = translatedMessage.validateWarnings();
            expect(warnings).toBeTruthy();
            expect(warnings.tagRemoved).toBe('removed tags <br>, <img> from original message');
        });

        it('should warn if you add an empty tag in the translation', () => {
            const original = 'a normal text';
            const translation = 'a normal text with <br> line break';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            const warnings = translatedMessage.validateWarnings();
            expect(warnings).toBeTruthy();
            expect(warnings.tagAdded).toBe('added tag <br>, which is not in original message');
        });

        it('should warn if you add 2 empty tags in the translation', () => {
            const original = 'a normal text';
            const translation = 'a normal text with <br> line break and <img>';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            const warnings = translatedMessage.validateWarnings();
            expect(warnings).toBeTruthy();
            expect(warnings.tagAdded).toBe('added tags <br>, <img>, which are not in original message');
        });

        it('should find nothing wrong with text containing line breaks', () => {
            const original = 'a text without\na line break';
            const translation = 'a text without\na line break';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.asDisplayString()).toBe(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            expect(translatedMessage.validateWarnings()).toBeFalsy();
        });

        it('should find nothing wrong in complex nested tags', () => {
            const original = '<span>a <b>bold</b> text</span> and <span>a <b>bold</b> text</span>';
            const translation = '<span>a <b>bold</b> text</span> and <span>a <b>bold</b> text</span>';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.asDisplayString()).toBe(translation);
            expect(translatedMessage.validate()).toBeFalsy();
            expect(translatedMessage.validateWarnings()).toBeFalsy();
        });

        it('should parse and detect ICU message refs', () => {
            const original = 'a text with <ICU-Message-Ref_0/>';
            const sourceMessage = parsedMessageFor(original);
            expect(sourceMessage.containsICUMessageRef());
            expect(parsedMessageFor('no ICU message ref').containsICUMessageRef()).toBeFalsy();
        });

        it('should report an error if you remove an ICU ref in the translation', () => {
            const original = 'a text with <ICU-Message-Ref_0/>';
            const translation = 'a text without icu-ref';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validateWarnings()).toBeFalsy();
            const errors = translatedMessage.validate();
            expect(errors).toBeTruthy();
            expect(errors.icuMessageRefRemoved).toBe('removed ICU message reference 0 from original message');
        });

        it('should report an error if you remove 2 ICU refs in the translation', () => {
            const original = 'a text with <ICU-Message-Ref_0/> and <ICU-Message-Ref_1/>';
            const translation = 'a text without icu-ref';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validateWarnings()).toBeFalsy();
            const errors = translatedMessage.validate();
            expect(errors).toBeTruthy();
            expect(errors.icuMessageRefRemoved).toBe('removed ICU message references 0, 1 from original message');
        });

        it('should report an error if you add an ICU ref in the translation', () => {
            const original = 'a text with <ICU-Message-Ref_0/>';
            const translation = 'a text with <ICU-Message-Ref_0/> and  <ICU-Message-Ref_1/>';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validateWarnings()).toBeFalsy();
            const errors = translatedMessage.validate();
            expect(errors).toBeTruthy();
            expect(errors.icuMessageRefAdded).toBe('added ICU message reference 1, which is not in original message');
        });

        it('should report an error if you add 2 ICU refs in the translation', () => {
            const original = 'a text with <ICU-Message-Ref_0/>';
            const translation = 'a text with <ICU-Message-Ref_0/> and  <ICU-Message-Ref_1/> and  <ICU-Message-Ref_2/>';
            const sourceMessage = parsedMessageFor(original);
            const translatedMessage = sourceMessage.translate(translation);
            expect(translatedMessage.validateWarnings()).toBeFalsy();
            const errors = translatedMessage.validate();
            expect(errors).toBeTruthy();
            expect(errors.icuMessageRefAdded).toBe('added ICU message references 1, 2, which are not in original message');
        });

        it('should parse tags with - and [0-9]', () => {
            const original = '<h1><md-icon>info</md-icon></h1>';
            const sourceMessage = parsedMessageFor(original);
            expect(sourceMessage.parts().length).toBe(5);
        });

    });

    describe('ICU test cases', () => {
        it('should parse ICU plural message', () => {
            const original = '{n, plural, =0 {kein Schaf} =1 {ein Schaf} other {Schafe}}';
            const sourceICUMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            expect(sourceICUMessage.isICUMessage);
            expect(sourceICUMessage.getICUMessage()).toBeTruthy();
            expect(sourceICUMessage.getICUMessage().isPluralMessage()).toBeTruthy();
            expect(sourceICUMessage.getICUMessage().getCategories().length).toBe(3);
            expect(sourceICUMessage.getICUMessage().getCategories()[0].getCategory()).toBe('=0');
            expect(sourceICUMessage.getICUMessage().getCategories()[0].getMessageNormalized().asDisplayString()).toBe('kein Schaf');
            expect(sourceICUMessage.getICUMessage().asNativeString())
                .toBe('{VAR_PLURAL, plural, =0 {kein Schaf} =1 {ein Schaf} other {Schafe}}');
        });

        it('should parse ICU select message', () => {
            const original = '{gender, select, m {männlich} f {weiblich}}';
            const sourceICUMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            expect(sourceICUMessage.isICUMessage);
            expect(sourceICUMessage.getICUMessage()).toBeTruthy();
            expect(sourceICUMessage.getICUMessage().isPluralMessage()).toBeFalsy();
            expect(sourceICUMessage.getICUMessage().getCategories().length).toBe(2);
            expect(sourceICUMessage.getICUMessage().getCategories()[0].getCategory()).toBe('m');
            expect(sourceICUMessage.getICUMessage().getCategories()[0].getMessageNormalized().asDisplayString()).toBe('männlich');
            expect(sourceICUMessage.getICUMessage().asNativeString()).toBe('{VAR_SELECT, select, m {männlich} f {weiblich}}');
        });

        it('should parse ICU select message with select or plural in message text', () => {
            const original = '{VAR_SELECT, select, wert0 {value0 selected} wert1 {plural selected} wert2 {anything else selected} }';
            const sourceICUMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            expect(sourceICUMessage.getICUMessage()).toBeTruthy();
            expect(sourceICUMessage.getICUMessage().isPluralMessage()).toBeFalsy();
            expect(sourceICUMessage.getICUMessage().getCategories().length).toBe(3);
            expect(sourceICUMessage.getICUMessage().getCategories()[0].getCategory()).toBe('wert0');
            expect(sourceICUMessage.getICUMessage().getCategories()[0].getMessageNormalized().asDisplayString()).toBe('value0 selected');
        });

        it('should parse ICU select message with masked } {', () => {
            const original = '{VAR_SELECT, select, wert0 {value0 \'}\'\'\'\'{\'}}';
            const sourceICUMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            expect(sourceICUMessage.getICUMessage()).toBeTruthy();
            expect(sourceICUMessage.getICUMessage().isPluralMessage()).toBeFalsy();
            expect(sourceICUMessage.getICUMessage().getCategories().length).toBe(1);
            expect(sourceICUMessage.getICUMessage().getCategories()[0].getCategory()).toBe('wert0');
            expect(sourceICUMessage.getICUMessage().getCategories()[0].getMessageNormalized().asDisplayString()).toBe('value0 }\'{');
        });

        it('should translate ICU plural message', () => {
            const original = '{n, plural, =0 {kein Schaf} =1 {ein Schaf} other {Schafe}}';
            const sourceICUMessage: INormalizedMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            const translatedICUMessage = sourceICUMessage.translateICUMessage({
                '=0': 'no sheep',
                '=1': 'one sheep',
                'other': 'sheep'
            });
            expect(translatedICUMessage.asNativeString()).toBe('{VAR_PLURAL, plural, =0 {no sheep} =1 {one sheep} other {sheep}}');
        });

        it('should translate ICU plural message with new categories', () => {
            const original = '{n, plural, =0 {kein Schaf} =1 {ein Schaf} other {Schafe}}';
            const sourceICUMessage: INormalizedMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            const translatedICUMessage = sourceICUMessage.translateICUMessage({
                '=0': 'no sheep',
                'many': 'a lot of sheep'
            });
            expect(translatedICUMessage.asNativeString())
                .toBe('{VAR_PLURAL, plural, =0 {no sheep} =1 {ein Schaf} other {Schafe} many {a lot of sheep}}');
        });

        it('should throw an error when translation of ICU plural message adds invalid category', () => {
            const original = '{n, plural, =0 {kein Schaf} =1 {ein Schaf} other {Schafe}}';
            const sourceICUMessage: INormalizedMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            try {
                const translatedICUMessage = sourceICUMessage.translateICUMessage({
                    '=0': 'no sheep',
                    'verdammtviele': 'a lot of sheep'
                });
                expect('').toBe('should have thrown an error "invalid category"');
            } catch (error) {
                expect(error.toString())
                    .toBe('Error: invalid plural category "verdammtviele", allowed are =<n> and zero,one,two,few,many,other');
            }
        });

        it('should translate ICU select message', () => {
            const original = '{gender, select, m {männlich} f {weiblich}}';
            const sourceICUMessage: INormalizedMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            const translatedICUMessage = sourceICUMessage.translateICUMessage({
                'm': 'male',
                'f': 'female'
            });
            expect(translatedICUMessage.asNativeString()).toBe('{VAR_SELECT, select, m {male} f {female}}');
        });

        it('should partially translate ICU select message', () => {
            const original = '{gender, select, m {männlich} f {weiblich}}';
            const sourceICUMessage: INormalizedMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            // only translate one part of message
            const translatedICUMessage = sourceICUMessage.translateICUMessage({
                'f': 'female'
            });
            expect(translatedICUMessage.asNativeString()).toBe('{VAR_SELECT, select, m {männlich} f {female}}');
        });

        it('should throw an error if translation of ICU select message contains additional categories', () => {
            const original = '{gender, select, m {männlich} f {weiblich}}';
            const sourceICUMessage: INormalizedMessage = parsedICUMessage(original);
            expect(sourceICUMessage).toBeTruthy();
            try {
                // a category not part of the message
                const translatedICUMessage = sourceICUMessage.translateICUMessage({
                    'u': 'unknown'
                });
                expect('').toBe('should have thrown an error "unknown category"');
            } catch (error) {
                expect(error.toString()).toBe('Error: adding a new category not allowed for select messages ("u" is not part of message)');
            }
        });

        it('should parse plural ICU message with placeholder in xlf format', () => {
            const original = '{minutes, plural, =0 {just now} =1 {one minute ago} other {<x id="INTERPOLATION" equiv-text="{{minutes}}"/> minutes ago} }';
            const parsedMessage: INormalizedMessage = parsedICUMessage(original, null, 'xlf');
            expect(parsedMessage.asDisplayString()).toBe('<ICU-Message/>');
            expect(parsedMessage.getICUMessage()).toBeTruthy();
            const icuMessage = parsedMessage.getICUMessage();
            expect(icuMessage.getCategories().length).toBe(3);
            expect(icuMessage.getCategories()[2].getMessageNormalized().asDisplayString()).toBe('{{0}} minutes ago');
        });

        it('should parse plural ICU message with placeholder in xlf2 format', () => {
            const original = '{minutes, plural, =0 {just now} =1 {one minute ago} other {<ph id="3" equiv="INTERPOLATION" disp="{{minutes}}"/> minutes ago} }';
            const parsedMessage: INormalizedMessage = parsedICUMessage(original);
            expect(parsedMessage.asDisplayString()).toBe('<ICU-Message/>');
            expect(parsedMessage.getICUMessage()).toBeTruthy();
            const icuMessage = parsedMessage.getICUMessage();
            expect(icuMessage.getCategories().length).toBe(3);
            expect(icuMessage.getCategories()[2].getMessageNormalized().asDisplayString()).toBe('{{0}} minutes ago');
        });

        it('should parse nested ICU messages', () => {
            const original = `{gender_of_host, select, 
  female {
    {num_guests, plural, 
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to her party.}
      =2 {{host} invites {guest} and one other person to her party.}
      other {{host} invites {guest} and # other people to her party.}}}
  male {
    {num_guests, plural, 
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to his party.}
      =2 {{host} invites {guest} and one other person to his party.}
      other {{host} invites {guest} and # other people to his party.}}}
  other {
    {num_guests, plural, 
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to their party.}
      =2 {{host} invites {guest} and one other person to their party.}
      other {{host} invites {guest} and # other people to their party.}}}}`;

            const parsedMessage: INormalizedMessage = parsedICUMessage(original, null, 'xlf');
            expect(parsedMessage.asDisplayString()).toBe('<ICU-Message/>');
            expect(parsedMessage.getICUMessage()).toBeTruthy();
            const outerIcuMessage = parsedMessage.getICUMessage();
            expect(outerIcuMessage.getCategories().length).toBe(3);
            expect(outerIcuMessage.getCategories()[0].getCategory()).toBe('female');
            expect(outerIcuMessage.getCategories()[1].getCategory()).toBe('male');
            expect(outerIcuMessage.getCategories()[2].getCategory()).toBe('other');
            const innerMessage = outerIcuMessage.getCategories()[1].getMessageNormalized();
            expect(innerMessage.asDisplayString()).toBe('<ICU-Message/>');
            const innerIcuMessage = innerMessage.getICUMessage();
            expect(innerIcuMessage).toBeTruthy();
            expect(innerIcuMessage.getCategories().length).toBe(4);
            expect(innerIcuMessage.getCategories()[0].getCategory()).toBe('=0');
            expect(innerIcuMessage.getCategories()[1].getCategory()).toBe('=1');
            expect(innerIcuMessage.getCategories()[2].getCategory()).toBe('=2');
            expect(innerIcuMessage.getCategories()[3].getCategory()).toBe('other');
        });

        it('should parse nested ICU messages with placeholder', () => {
            const original = `{gender_of_host, select, 
  female {
    {num_guests, plural, 
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to her party.}
      =2 {{host} invites {guest} and one other person to her party.}
      other {{host} invites {guest} and # other people to her party.}}}
  male {
    {num_guests, plural, 
      =0 {<x id="INTERPOLATION" equiv-text="{{host}}"/> does not give a party.}
      =1 {<x id="INTERPOLATION" equiv-text="{{host}}"/> invites {guest} to his party.}
      =2 {<x id="INTERPOLATION" equiv-text="{{host}}"/> invites {guest} and one other person to his party.}
      other {<x id="INTERPOLATION" equiv-text="{{host}}"/> invites {guest} and # other people to his party.}}}
  other {
    {num_guests, plural, 
      =0 {{host} does not give a party.}
      =1 {{host} invites {guest} to their party.}
      =2 {{host} invites {guest} and one other person to their party.}
      other {{host} invites {guest} and # other people to their party.}}}}`;

            const parsedMessage: INormalizedMessage = parsedICUMessage(original, null, 'xlf');
            expect(parsedMessage.asDisplayString()).toBe('<ICU-Message/>');
            expect(parsedMessage.getICUMessage()).toBeTruthy();
            const outerIcuMessage = parsedMessage.getICUMessage();
            expect(outerIcuMessage.getCategories().length).toBe(3);
            expect(outerIcuMessage.getCategories()[0].getCategory()).toBe('female');
            expect(outerIcuMessage.getCategories()[1].getCategory()).toBe('male');
            expect(outerIcuMessage.getCategories()[2].getCategory()).toBe('other');
            const innerMessage = outerIcuMessage.getCategories()[1].getMessageNormalized();
            expect(innerMessage.asDisplayString()).toBe('<ICU-Message/>');
            const innerIcuMessage = innerMessage.getICUMessage();
            expect(innerIcuMessage).toBeTruthy();
            expect(innerIcuMessage.getCategories().length).toBe(4);
            expect(innerIcuMessage.getCategories()[0].getCategory()).toBe('=0');
            expect(innerIcuMessage.getCategories()[0].getMessageNormalized().asDisplayString()).toBe('{{0}} does not give a party.');
        });

    });
});
