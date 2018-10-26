import {TranslationMessagesFileFactory, ITranslationMessagesFile, ITransUnit, INormalizedMessage, STATE_NEW, STATE_TRANSLATED, STATE_FINAL} from '../api';
import * as fs from "fs";
import {AbstractTransUnit} from './abstract-trans-unit';
import {DOMUtilities} from './dom-utilities';
import {DOMParser} from 'xmldom';

/**
 * Created by martin on 28.04.2017.
 * Testcases for xliff 1.2 files.
 */

describe('ngx-i18nsupport-lib xliff 1.2 test spec', () => {

    let SRCDIR = 'test/testdata/i18n/';

    let ENCODING = 'UTF-8';

    /**
     * Helper function to read Xliff from File
     * @type {string}
     */
    function readFile(path: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        return TranslationMessagesFileFactory.fromFileContent('xlf', content, path, ENCODING);
    }

    describe('xlf 1.2 format tests', () => {
        let MASTER1SRC = SRCDIR + 'ngExtractedMaster1.xlf';
        let TRANSLATED_FILE_SRC = SRCDIR + 'translatedFile.xlf';

        let ID_TRANSLATED_SCHLIESSEN = '1ead0ad1063d0c9e005fe56c9529aef4c1ef9d21'; // an ID from ngExtractedMaster1.xlf
        let ID_WITH_PLACEHOLDER = 'af0819ea4a5db68737ebcabde2f5e432b66352e8';
        let ID_WITH_REPEATED_PLACEHOLDER = 'af0819ea4a5db68737ebcabde2f5e432b663repl';
        let ID_WITH_PLACEHOLDER_2 = 'af0819ea4a5db68737ebcabde2f5e432b66352e8xxx'; // same with </x> tags
        let ID_WITH_MEANING_AND_DESCRIPTION = '84e8cd8ba480129d90f512cc3462bb43efcf389f';
        let ID_WITH_NO_SOURCEREFS = 'no_sourceref_test'; // an ID with no source elements
        let ID_WITH_ONE_SOURCEREF = '57e605bfa130afb4de4ee40e496e854a9e8a28a7';
        let ID_WITH_TWO_SOURCEREFS = '78eab955529ba0f1817c84991d9175f55bfdf937'; // an ID with 2 source elements
        let ID_WITH_TAGS = '7e8dd1fd1c57afafc38550ce80b5bcc1ced49f85';
        let ID_WITH_TAGS_2 = '7e8dd1fd1c57afafc38550ce80b5bcc1ced49f85xxx'; // same with </x> tags
        let ID_UNTRANSLATED_DESCRIPTION = 'a52ba049c16778bdb2e5a19a41acaadf87b104dc';
        let ID_TO_MERGE = 'unittomerge';
        let ID_ICU_PLURAL = 'efec69fdcf74bd6d640b2a771558b7b09e271c28';
        let ID_ICU_SELECT = '8967ef1e10bdf8ea6d8e65ba7ffe7fc69960d1da';
        let ID_ICU_EMBEDDED_TAGS = '304b4d798bf51257538949844e121724110d37ed';
        let ID_CONTAINS_ICU = '1f3c670be000dbb6cbe05353d12ef62793d91fec';
        let ID_CONTAINS_TWO_ICU = 'complextags.icuTwoICU';
        let ID_WITH_BR_TAG = 'e05aa009b849e0a5725e819b14c77a32576513a8';
        let ID_WITH_IMG_TAG = 'ea7a3dece8868782142a70b3e1c8b064f6027e20';

        it('should read xlf file', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file).toBeTruthy();
            expect(file.fileType()).toBe('XLIFF 1.2');
            const tu: ITransUnit = file.transUnitWithId(ID_TRANSLATED_SCHLIESSEN);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Schließen');
        });

        it('should read xlf file and pretty print it', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file).toBeTruthy();
            expect(file.editedContent()).toContain('<source>Beschreibung zu <x id="INTERPOLATION"/> (<x id="INTERPOLATION_1"/>)</source>');
            expect(file.editedContent(true)).toContain(`        <source>Beschreibung zu <x id="INTERPOLATION"/> (<x id="INTERPOLATION_1"/>)</source>`);
        });

        it('should not add empty lines when beautifying (issue ngx-i18nsupport #97)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file).toBeTruthy();
            const editedContentBeautified = file.editedContent(true);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromFileContent('xlf', editedContentBeautified, null, ENCODING);
            const editedContentBeautifiedAgain = file2.editedContent(true);
            expect(editedContentBeautifiedAgain).toMatch(/Beschreibung zu <x/);
            expect(editedContentBeautifiedAgain).not.toMatch(/Beschreibung zu\s*\r\n?/);
        });

        it('should emit warnings', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.warnings().length).toBe(1);
            expect(file.warnings()[0]).toContain('trans-unit without "id"');
        });

        it('should count units', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.numberOfTransUnits()).toBe(28);
            expect(file.numberOfTransUnitsWithMissingId()).toBe(1);
            expect(file.numberOfUntranslatedTransUnits()).toBe(file.numberOfTransUnits());
            expect(file.numberOfReviewedTransUnits()).toBe(0);
        });

        it('should return source language', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.sourceLanguage()).toBe('en');
        });

        it('should change source language', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.sourceLanguage()).toBe('en');
            file.setSourceLanguage('de');
            expect(file.sourceLanguage()).toBe('de');
        });

        it('should return target language', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.targetLanguage()).toBeFalsy();
            const translatedFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(translatedFile.targetLanguage()).toBe('de');
        });

        it('should change target language', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(file.targetLanguage()).toBe('de');
            file.setTargetLanguage('suahel');
            expect(file.targetLanguage()).toBe('suahel');
        });

        it('should loop over all trans units', () => {
            const translatedFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            let count = 0;
            translatedFile.forEachTransUnit((tu: ITransUnit) => {
                expect(tu).toBeTruthy();
                count++;
            });
            expect(count).toBeGreaterThan(30);
        });

        it('should normalize source of every trans units', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            let count = 0;
            file.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.sourceContentNormalized()).toBeTruthy();
                count++;
            });
        });

        it('should change source content', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_BR_TAG);
            expect(tu).toBeTruthy();
            expect(tu.supportsSetSourceContent()).toBeTruthy();
            const changedMessage = tu.sourceContent() + 'a changed source content';
            tu.setSourceContent(changedMessage);
            expect(tu.sourceContent()).toBe(changedMessage);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_BR_TAG);
            expect(tu2.sourceContent()).toBe(changedMessage);
        });

        it('should read meaning and description of tu', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.meaning()).toBe('dateservice.monday');
            expect(tu.description()).toBe('ngx-translate');
        });

        it('should change description', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.description()).toBeTruthy();
            expect(tu.supportsSetDescriptionAndMeaning()).toBeTruthy();
            const changedMessage = 'a changed description';
            tu.setDescription(changedMessage);
            expect(tu.description()).toBe(changedMessage);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu2.description()).toBe(changedMessage);
        });

        it('should set description (creates new description)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_BR_TAG); // anyone without description
            expect(tu).toBeTruthy();
            expect(tu.description()).toBeFalsy();
            expect(tu.supportsSetDescriptionAndMeaning()).toBeTruthy();
            const changedMessage = 'a changed description';
            tu.setDescription(changedMessage);
            expect(tu.description()).toBe(changedMessage);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_BR_TAG);
            expect(tu.description()).toBe(changedMessage);
            const xmlElem = (<AbstractTransUnit> tu2).asXmlElement();
            const noteElem = DOMUtilities.getFirstElementByTagName(xmlElem,'note');
            expect(noteElem).toBeTruthy();
            expect(noteElem.getAttribute('priority')).toBe('1');
        });

        it('should remove description', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.description()).toBeTruthy();
            expect(tu.supportsSetDescriptionAndMeaning()).toBeTruthy();
            tu.setDescription(null);
            expect(tu.description()).toBeFalsy();
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu2.description()).toBeFalsy();
        });

        it('should change meaning', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.meaning()).toBeTruthy();
            expect(tu.supportsSetDescriptionAndMeaning()).toBeTruthy();
            const changedMessage = 'a changed description';
            tu.setMeaning(changedMessage);
            expect(tu.meaning()).toBe(changedMessage);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu2.meaning()).toBe(changedMessage);
        });

        it('should set meaning (creates new meaning)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_BR_TAG); // anyone without description
            expect(tu).toBeTruthy();
            expect(tu.meaning()).toBeFalsy();
            expect(tu.supportsSetDescriptionAndMeaning()).toBeTruthy();
            const changedMessage = 'a changed description';
            tu.setMeaning(changedMessage);
            expect(tu.meaning()).toBe(changedMessage);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_BR_TAG);
            expect(tu2.meaning()).toBe(changedMessage);
        });

        it('should remove meaning', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.meaning()).toBeTruthy();
            expect(tu.supportsSetDescriptionAndMeaning()).toBeTruthy();
            tu.setMeaning(null);
            expect(tu.meaning()).toBeFalsy();
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu2.meaning()).toBeFalsy();
        });

        it('should return empty source references array if source not set', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_NO_SOURCEREFS);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(0);
        });

        it('should return source reference', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_ONE_SOURCEREF);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(1);
            expect(tu.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[0].linenumber).toBe(10);
        });

        it('should return more than one source references', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(2);
            expect(tu.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[0].linenumber).toBe(20);
            expect(tu.sourceReferences()[1].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[1].linenumber).toBe(21);
        });

        it('should set source references', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(0);
            tu.setSourceReferences([{sourcefile: 'x', linenumber: 10}, {sourcefile: 'y', linenumber: 20}]);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_TO_MERGE);
            expect(tu2.sourceReferences().length).toBe(2);
            expect(tu2.sourceReferences()[0].sourcefile).toBe('x');
            expect(tu2.sourceReferences()[0].linenumber).toBe(10);
            expect(tu2.sourceReferences()[1].sourcefile).toBe('y');
            expect(tu2.sourceReferences()[1].linenumber).toBe(20);
        });

        it('should override source references', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu).toBeTruthy();
            expect(tu.supportsSetSourceReferences()).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(2);
            tu.setSourceReferences([{sourcefile: 'x:komisch', linenumber: 10}]);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu2.sourceReferences().length).toBe(1);
            expect(tu2.sourceReferences()[0].sourcefile).toBe('x:komisch');
            expect(tu2.sourceReferences()[0].linenumber).toBe(10);
        });

        it('should not change source reference when translating', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(2);
            tu.translate('a translated value');
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu2.targetContent()).toBe('a translated value');
            expect(tu2.sourceReferences().length).toBe(2);
            expect(tu2.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu2.sourceReferences()[0].linenumber).toBe(20);
            expect(tu2.sourceReferences()[1].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu2.sourceReferences()[1].linenumber).toBe(21);
        });

        it ('should run through 3 different states while translating', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.targetState()).toBe(STATE_NEW);
            tu.translate('a translation');
            expect(tu.targetState()).toBe(STATE_TRANSLATED);
            tu.setTargetState(STATE_FINAL);
            expect(tu.targetState()).toBe(STATE_FINAL);
        });

        it('should normalize placeholders to {{0}} etc', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('Eintrag {{0}} von {{1}} hinzugefügt.');
            const tu2: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER_2);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe('Eintrag {{0}} von {{1}} hinzugefügt.');
        });

        it('should normalize repeated placeholders to {{0}} {{1}} etc', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_REPEATED_PLACEHOLDER);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('{{0}}: Eine Nachricht mit 2 Platzhaltern: {{0}} {{1}}');
        });

        it('should normalize embedded html tags', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TAGS);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('Dieser Text enthält <b>eingebettetes html</b>');
            const tu2: ITransUnit = file.transUnitWithId(ID_WITH_TAGS_2);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe('Dieser Text enthält <b>eingebettetes html</b>');
        });

        it('should normalize empty html tag br', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_BR_TAG);
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('Dieser Text enthält<br>einen Zeilenumbruch per HTML-br-Element.');
            let translation = tu.sourceContentNormalized().translate('This text contains<br> a linebreak');
            tu.translate(translation);
            expect(tu.targetContent()).toBe('This text contains<x id="LINE_BREAK" ctype="lb" equiv-text="&lt;br/>"/> a linebreak');
        });

        it('should normalize empty html tag img', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_IMG_TAG);
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('Dieser Text enthält ein Bild <img> mitt en in der Nachricht');
            let translation = tu.sourceContentNormalized().translate('This text contains an img <img> in the message');
            tu.translate(translation);
            expect(tu.targetContent()).toBe('This text contains an img <x id="TAG_IMG" ctype="image" equiv-text="&lt;img/>"/> in the message');
        });

        it('should remove a transunit by id', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu).toBeTruthy();
            file.removeTransUnitWithId(ID_WITH_TWO_SOURCEREFS);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu2).toBeFalsy(); // should not exist any more
        });

        it ('should translate source without or with target', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TRANSLATED_SCHLIESSEN);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBeFalsy();
            // first translate
            tu.translate('Anwendung läuft');
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_TRANSLATED_SCHLIESSEN);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe('Anwendung läuft');
            expect(tu2.targetState()).toBe(STATE_TRANSLATED);
            // translate again
            tu2.translate('Anwendung funktioniert');
            const file3: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file2.editedContent(), null, null);
            const tu3: ITransUnit = file3.transUnitWithId(ID_TRANSLATED_SCHLIESSEN);
            expect(tu3.targetContentNormalized().asDisplayString()).toBe('Anwendung funktioniert');
            expect(tu3.targetState()).toBe(STATE_TRANSLATED);
        });

        it ('should copy source to target for default lang', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_UNTRANSLATED_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBeFalsy();
            let isDefaultLang: boolean = true;
            let copyContent: boolean = false;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_UNTRANSLATED_DESCRIPTION);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe('Beschreibung zu {{0}} ({{1}})');
        });

        it ('should copy source to target for non default lang if wanted', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_UNTRANSLATED_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBeFalsy();
            let isDefaultLang: boolean = false;
            let copyContent: boolean = true;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_UNTRANSLATED_DESCRIPTION);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe('Beschreibung zu {{0}} ({{1}})');
        });

        it ('should copy source to target for non default lang and set state new, native state initial, #57', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            let isDefaultLang: boolean = false;
            let copyContent: boolean = true;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_UNTRANSLATED_DESCRIPTION);
            expect(tu2.targetState()).toBe(STATE_NEW);
            expect((<any>tu2).nativeTargetState()).toBe('new');
        });

        it ('should not copy source to target for non default lang if not wanted', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_UNTRANSLATED_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBeFalsy();
            let isDefaultLang: boolean = false;
            let copyContent: boolean = false;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_UNTRANSLATED_DESCRIPTION);
            expect(tu2.targetContent()).toBeFalsy();
        });

        it ('should put new target element directy behind source element, #50', () => {
            const ID_NO_TARGET = 'a52ba049c16778bdb2e5a19a41acaadf87b10001';
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_NO_TARGET);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBeFalsy();
            let isDefaultLang: boolean = false;
            let copyContent: boolean = true;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_NO_TARGET);
            expect(tu2.targetContent()).toBeTruthy();
            // check the xml of file that target directly follows source
            const document: Document = new DOMParser().parseFromString(file2.editedContent(), 'text/xml');
            const targetList: NodeList = document.getElementsByTagName('target');
            for (let i = 0; i < targetList.length; i++) {
                const targetNode = targetList.item(i);
                const sibling: Element = DOMUtilities.getPreviousElementSibling(targetNode);
                const failText = 'found target element without sibling, id ' + targetNode.toString();
                expect(sibling !== null).toBeTruthy(failText);
                expect(sibling.localName).toBe('source');
            }
        });

        it ('should copy a transunit from file a to file b', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeFalsy();
            const newTu = targetFile.importNewTransUnit(tu, false, true);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toEqual(newTu);
            let changedTargetFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(targetFile.editedContent(), null, null);
            let targetTu = changedTargetFile.transUnitWithId(ID_TO_MERGE);
            expect(targetTu.sourceContent()).toBe('Test for merging units');
            expect(targetTu.targetContent()).toBe('Test for merging units');
        });

        it ('should copy a transunit from file a to file b and leave content blank (xliffmerge #103)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeFalsy();
            // flag copyContent set to false here...
            const newTu = targetFile.importNewTransUnit(tu, false, false);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toEqual(newTu);
            let changedTargetFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(targetFile.editedContent(), null, null);
            let targetTu = changedTargetFile.transUnitWithId(ID_TO_MERGE);
            expect(targetTu.sourceContent()).toBe('Test for merging units');
            expect(targetTu.targetContent()).toBe('');
        });

        it ('should copy a transunit to a specified position (#53)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeFalsy();
            const ID_EXISTING = 'f540f05dc71be88e226a3920dbf1140b2658e5ea';
            const existingTu = targetFile.transUnitWithId(ID_EXISTING);
            expect(existingTu).toBeTruthy();
            const newTu = targetFile.importNewTransUnit(tu, false, true, existingTu);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toEqual(newTu);
            const doc: Document = new DOMParser().parseFromString(targetFile.editedContent());
            const existingElem = DOMUtilities.getElementByTagNameAndId(doc, 'trans-unit', ID_EXISTING);
            const newElem = DOMUtilities.getElementByTagNameAndId(doc, 'trans-unit', ID_TO_MERGE);
            expect(DOMUtilities.getElementFollowingSibling(existingElem)).toEqual(newElem);
            let changedTargetFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(targetFile.editedContent(), null, null);
            let targetTu = changedTargetFile.transUnitWithId(ID_TO_MERGE);
            expect(targetTu.sourceContent()).toBe('Test for merging units');
        });

        it ('should copy a transunit to first position (#53)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeFalsy();
            // when importNewTransUnit is called with null, new unit will be added at first position
            const newTu = targetFile.importNewTransUnit(tu, false, true, null);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toEqual(newTu);
            const doc: Document = new DOMParser().parseFromString(targetFile.editedContent());
            const newElem = DOMUtilities.getElementByTagNameAndId(doc, 'trans-unit', ID_TO_MERGE);
            expect(newElem).toBeTruthy();
            expect(DOMUtilities.getElementPrecedingSibling(newElem)).toBeFalsy();
            let changedTargetFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(targetFile.editedContent(), null, null);
            let targetTu = changedTargetFile.transUnitWithId(ID_TO_MERGE);
            expect(targetTu.sourceContent()).toBe('Test for merging units');
        });

        it ('should copy source to target and set a praefix and suffix', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            file.setNewTransUnitTargetPraefix('%%');
            file.setNewTransUnitTargetSuffix('!!');
            let isDefaultLang: boolean = false;
            let copyContent: boolean = true;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_TO_MERGE);
            expect(tu2.targetState()).toBe(STATE_NEW);
            expect(tu2.targetContent()).toBe('%%Test for merging units!!');
        });

        it ('should copy source to target, but should not set a praefix and suffix for ICU messages', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            file.setNewTransUnitTargetPraefix('%%');
            file.setNewTransUnitTargetSuffix('!!');
            let isDefaultLang: boolean = false;
            let copyContent: boolean = true;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tuICU: ITransUnit = file2.transUnitWithId(ID_ICU_PLURAL);
            expect(tuICU.targetState()).toBe(STATE_NEW);
            expect(tuICU.targetContent()).not.toContain('%%');
            expect(tuICU.targetContent()).not.toContain('!!');
        });

        it ('should copy a transunit from file a to file b and set a praefix and suffix', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            targetFile.setNewTransUnitTargetPraefix('%%');
            targetFile.setNewTransUnitTargetSuffix('!!');
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeFalsy();
            const newTu = targetFile.importNewTransUnit(tu, false, true);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toEqual(newTu);
            let changedTargetFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(targetFile.editedContent(), null, null);
            let targetTu = changedTargetFile.transUnitWithId(ID_TO_MERGE);
            expect(targetTu.targetContent()).toBe('%%Test for merging units!!');
        });

        it ('should copy a transunit from file a to file b, but should not set a praefix and suffix for ICU messages', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_ICU_SELECT);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            targetFile.setNewTransUnitTargetPraefix('%%');
            targetFile.setNewTransUnitTargetSuffix('!!');
            expect(targetFile.transUnitWithId(ID_ICU_SELECT)).toBeFalsy();
            const newTu = targetFile.importNewTransUnit(tu, false, true);
            expect(targetFile.transUnitWithId(ID_ICU_SELECT)).toBeTruthy();
            expect(targetFile.transUnitWithId(ID_ICU_SELECT)).toEqual(newTu);
            let changedTargetFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(targetFile.editedContent(), null, null);
            let targetTu = changedTargetFile.transUnitWithId(ID_ICU_SELECT);
            expect(targetTu.targetContent()).not.toContain('%%');
            expect(targetTu.targetContent()).not.toContain('!!');
        });

        it ('should preserve line end at end of file while editing', () => {
            const content = fs.readFileSync(MASTER1SRC, ENCODING);
            expect(content.endsWith('\n')).toBeTruthy('Master should end with EOL');
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeFalsy();
            targetFile.importNewTransUnit(tu, false, true);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            expect(targetFile.editedContent().endsWith('\n')).toBeTruthy('Edited content should end with EOL');
        });

        it ('should translate using NormalizedMessage (plain text case, no placeholders, no markup)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TRANSLATED_SCHLIESSEN);
            expect(tu).toBeTruthy();
            const translationString = 'Anwendung läuft';
            // first translate
            let translation: INormalizedMessage = tu.sourceContentNormalized().translate(translationString);
            tu.translate(translation);
            expect(tu.targetContent()).toBe(translationString);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_TRANSLATED_SCHLIESSEN);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe(translationString);
        });

        it('should contain ICU reference in sourceContentNormalized', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_CONTAINS_ICU);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Zum Wert <x id="INTERPOLATION"/> gehört der Text <x id="ICU"/>');
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('Zum Wert {{0}} gehört der Text <ICU-Message-Ref_0/>');
        });

        it('should contain 2 ICU references in sourceContentNormalized', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_CONTAINS_TWO_ICU);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('first: <x id="ICU"/>, second <x id="ICU_1"/>');
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('first: <ICU-Message-Ref_0/>, second <ICU-Message-Ref_1/>');
        });

        it('should handle plural ICU', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_ICU_PLURAL);
            expect(tu).toBeTruthy();
            const normalizedMessage = tu.sourceContentNormalized();
            expect(normalizedMessage.asDisplayString()).toBe('<ICU-Message/>');
            const icuMessage = normalizedMessage.getICUMessage();
            expect(icuMessage).toBeTruthy();
            expect(icuMessage.isPluralMessage()).toBeTruthy();
            expect(icuMessage.isSelectMessage()).toBeFalsy();
            expect(icuMessage.getCategories().length).toBe(3);
            expect(icuMessage.getCategories()[0].getCategory()).toBe('=0');
            expect(icuMessage.getCategories()[0].getMessageNormalized().asDisplayString()).toBe('kein Schaf');
            expect(icuMessage.getCategories()[1].getCategory()).toBe('=1');
            expect(icuMessage.getCategories()[1].getMessageNormalized().asDisplayString()).toBe('1 Schaf');
            expect(icuMessage.getCategories()[2].getCategory()).toBe('other');
            expect(icuMessage.getCategories()[2].getMessageNormalized().asDisplayString()).toBe('x Schafe');
        });

        it('should translate plural ICU', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_ICU_PLURAL);
            expect(tu).toBeTruthy();
            const normalizedMessage = tu.sourceContentNormalized();
            expect(normalizedMessage.asDisplayString()).toBe('<ICU-Message/>');
            const translatedMessage = normalizedMessage.translateICUMessage({'=0': 'nothing'});
            tu.translate(translatedMessage);
            const icuMessage = tu.targetContentNormalized().getICUMessage();
            expect(icuMessage).toBeTruthy();
            expect(icuMessage.isPluralMessage()).toBeTruthy();
            expect(icuMessage.isSelectMessage()).toBeFalsy();
            expect(icuMessage.getCategories().length).toBe(3);
            expect(icuMessage.getCategories()[0].getCategory()).toBe('=0');
            expect(icuMessage.getCategories()[0].getMessageNormalized().asDisplayString()).toBe('nothing');
            expect(tu.targetContent()).toBe('{VAR_PLURAL, plural, =0 {nothing} =1 {1 Schaf} other {x Schafe}}');
        });

        it('should handle select ICU message', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_ICU_SELECT);
            const normalizedMessage = tu.sourceContentNormalized();
            expect(normalizedMessage.asDisplayString()).toBe('<ICU-Message/>');
            const icuMessage = normalizedMessage.getICUMessage();
            expect(icuMessage).toBeTruthy();
            expect(icuMessage.isPluralMessage()).toBeFalsy();
            expect(icuMessage.isSelectMessage()).toBeTruthy();
            expect(icuMessage.getCategories().length).toBe(3);
            expect(icuMessage.getCategories()[0].getCategory()).toBe('wert0');
            expect(icuMessage.getCategories()[0].getMessageNormalized().asDisplayString()).toBe('wert0 wurde gewählt');
            expect(icuMessage.getCategories()[1].getCategory()).toBe('wert1');
            expect(icuMessage.getCategories()[1].getMessageNormalized().asDisplayString()).toBe('ein anderer Wert (wert1) wurde gewählt');
            expect(icuMessage.getCategories()[2].getCategory()).toBe('wert2');
            expect(icuMessage.getCategories()[2].getMessageNormalized().asDisplayString()).toBe('was ganz anderes wurde gewählt');
        });

        it('should handle ICU with embedded tags', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_ICU_EMBEDDED_TAGS);
            const normalizedMessage = tu.sourceContentNormalized();
            expect(normalizedMessage.asDisplayString()).toBe('<ICU-Message/>');
            const icuMessage = normalizedMessage.getICUMessage();
            expect(icuMessage).toBeTruthy();
            expect(icuMessage.isPluralMessage()).toBeFalsy();
            expect(icuMessage.isSelectMessage()).toBeTruthy();
            expect(icuMessage.getCategories().length).toBe(3);
            expect(icuMessage.getCategories()[0].getCategory()).toBe('wert0');
            expect(icuMessage.getCategories()[0].getMessageNormalized().asDisplayString()).toBe('wert0 ausgewählt');
            expect(icuMessage.getCategories()[1].getCategory()).toBe('wert1');
            expect(icuMessage.getCategories()[1].getMessageNormalized().asDisplayString()).toBe('ein <b>anderer</b> Wert (wert1) ausgewählt');
            expect(icuMessage.getCategories()[2].getCategory()).toBe('wert2');
            expect(icuMessage.getCategories()[2].getMessageNormalized().asDisplayString()).toBe('was <em>ganz anderes</em> wurde ausgewählt');
        });

        it('should translate ICU with embedded tags', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_ICU_EMBEDDED_TAGS);
            const normalizedMessage = tu.sourceContentNormalized();
            expect(normalizedMessage.asDisplayString()).toBe('<ICU-Message/>');
            const translatedMessage = normalizedMessage.translateICUMessage({'wert1': '<em>changed</em>'});
            tu.translate(translatedMessage);
            const icuMessage = tu.targetContentNormalized().getICUMessage();
            expect(icuMessage).toBeTruthy();
            expect(icuMessage.isPluralMessage()).toBeFalsy();
            expect(icuMessage.isSelectMessage()).toBeTruthy();
            expect(icuMessage.getCategories().length).toBe(3);
            expect(icuMessage.getCategories()[1].getCategory()).toBe('wert1');
            expect(icuMessage.getCategories()[1].getMessageNormalized().asDisplayString()).toBe('<em>changed</em>');
            expect(tu.targetContent()).toContain('wert1 {<x id="START_EMPHASISED_TEXT" ctype="x-em" equiv-text="&lt;em>"/>changed<x id="CLOSE_EMPHASISED_TEXT" ctype="x-em"/>}');
            // TODO find warnings in embedded message, known limitation in the moment.
            //            const warnings = icuMessage.getCategories()[1].getMessageNormalized().validateWarnings();
            //            expect(warnings).toBeTruthy();
        });

    });
});
