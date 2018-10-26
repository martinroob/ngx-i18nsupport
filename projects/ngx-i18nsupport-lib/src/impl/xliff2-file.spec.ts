import {TranslationMessagesFileFactory, ITranslationMessagesFile, ITransUnit, INormalizedMessage, STATE_NEW, STATE_TRANSLATED, STATE_FINAL} from '../api';
import * as fs from "fs";
import {AbstractTransUnit} from './abstract-trans-unit';
import {DOMUtilities} from './dom-utilities';
import {DOMParser} from 'xmldom';

/**
 * Created by martin on 05.05.2017.
 * Testcases for XLIFF 2.0 files.
 */

describe('ngx-i18nsupport-lib XLIFF 2.0 test spec', () => {

    let SRCDIR = 'test/testdata/i18n/';

    let ENCODING = 'UTF-8';

    /**
     * Helper function to read Xliff 2.0 from File
     * @type {string}
     */
    function readFile(path: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        return TranslationMessagesFileFactory.fromFileContent('xlf2', content, path, ENCODING);
    }

    describe('XLIFF 2.0 format tests', () => {
        let MASTER1SRC = SRCDIR + 'ngExtractedMaster1.xlf2';
        let TRANSLATED_FILE_SRC = SRCDIR + 'translatedFile.xlf2';

        let ID_APP_RUNS = '4371668001355139802'; // an ID from ngExtractedMaster1.xlf
        let ID_WITH_PLACEHOLDER = '9030312858648510700';
        let ID_WITH_REPEATED_PLACEHOLDER = '7049669989298349710';
        let ID_WITH_MEANING_AND_DESCRIPTION = '6830980354990918030';
        let ID_WITH_NO_SOURCEREFS = '4371668001355139802'; // an ID with no source elements
        let ID_WITH_ONE_SOURCEREF = '7499557905529977371';
        let ID_WITH_TWO_SOURCEREFS = '3274258156935474372'; // an ID with 2 source elements
        let ID_WITH_TAGS = '7609655310648429098';
        let ID_WITH_STRANGE_TAG = '7610784844464920497';
        let ID_TO_MERGE = 'unittomerge';
        let ID_ICU_PLURAL = '157616252019374389';
        let ID_ICU_SELECT = '6710804210857077394';
        let ID_ICU_EMBEDDED_TAGS = '6710804210857077393';
        let ID_CONTAINS_ICU = '2747218257718409559';
        let ID_CONTAINS_TWO_ICU = 'complextags.icuTwoICU';
        let ID_CONTAINS_TWO_ICU_WITH_EQUIV = 'complextags.icuTwoICU.withEquiv'; // angular issue #17344
        let ID_WITH_BR_TAG = '3944017551463298929';
        let ID_WITH_IMG_TAG = '705837031073461246';

        it('should read xlf file', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file).toBeTruthy();
            expect(file.fileType()).toBe('XLIFF 2.0');
            const tu: ITransUnit = file.transUnitWithId(ID_APP_RUNS);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Anwendung läuft!');
        });

        it('should read xlf2 file and pretty print it and read it in again', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(file).toBeTruthy();
            const formattedXml = file.editedContent(true);
            const rereadFile: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(formattedXml, null, null);
            expect(rereadFile.numberOfTransUnits()).toBe(file.numberOfTransUnits());
        });

        it('should not add empty lines when beautifying (issue ngx-i18nsupport #97)', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(file).toBeTruthy();
            const editedContentBeautified = file.editedContent(true);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(editedContentBeautified, null, null);
            const editedContentBeautifiedAgain = file2.editedContent(true);
            expect(editedContentBeautifiedAgain).toMatch(/<source>Diese Nachricht ist <pc/);
            expect(editedContentBeautifiedAgain).not.toMatch(/<source>Diese Nachricht ist\s*\r\n?/);
        });

        it('should emit warnings', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.warnings().length).toBe(1);
            expect(file.warnings()[0]).toContain('trans-unit without "id"');
        });

        it('should count units', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.numberOfTransUnits()).toBe(39);
            expect(file.numberOfTransUnitsWithMissingId()).toBe(1);
            expect(file.numberOfUntranslatedTransUnits()).toBe(file.numberOfTransUnits());
            expect(file.numberOfReviewedTransUnits()).toBe(0);
        });

        it('should return source language', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.sourceLanguage()).toBe('de');
        });

        it('should change source language', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.sourceLanguage()).toBe('de');
            file.setSourceLanguage('en');
            expect(file.sourceLanguage()).toBe('en');
        });

        it('should return target language', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.targetLanguage()).toBeFalsy();
            const translatedFile: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(translatedFile.targetLanguage()).toBe('en');
        });

        it('should change target language', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            expect(file.targetLanguage()).toBe('en');
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
            expect(count).toBeGreaterThan(24);
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
            expect(tu2.description()).toBe(changedMessage);
            const xmlElem = (<AbstractTransUnit> tu2).asXmlElement();
            const notesElem = DOMUtilities.getFirstElementByTagName(xmlElem,'notes');
            expect(notesElem).toBeTruthy();
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
            const tu: ITransUnit = file.transUnitWithId(ID_APP_RUNS);
            expect(tu).toBeTruthy();
            expect(tu.targetState()).toBe(STATE_NEW);
            tu.translate('a translation');
            expect(tu.targetState()).toBe(STATE_TRANSLATED);
            tu.setTargetState(STATE_FINAL);
            expect(tu.targetState()).toBe(STATE_FINAL);
        });

        it('should normalize placeholders to {{0}} etc', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('Entry {{0}} of total {{1}} added.');
        });

        it('should normalize repeated placeholders to {{0}} {{1}} etc', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_REPEATED_PLACEHOLDER);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('{{0}}: A message with 2 placeholders: {{0}} {{1}}');
        });

        it('should normalize embedded html tags', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TAGS);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('This message is <b><strong>VERY IMPORTANT</strong></b>');
        });

        it('should normalize unknown embedded html tags', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATED_FILE_SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_STRANGE_TAG);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('This message is <strange>{{0}}</strange>');
        });

        it('should normalize empty html tag br', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_BR_TAG);
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('Dieser Text enthält<br>einen Zeilenumbruch per HTML-br-Element.');
            let translation = tu.sourceContentNormalized().translate('This text contains<br> a linebreak');
            tu.translate(translation);
            expect(tu.targetContent()).toBe('This text contains<ph id="0" equiv="LINE_BREAK" type="fmt" disp="&lt;br/>"/> a linebreak');
        });

        it('should normalize empty html tag img', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_IMG_TAG);
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('Dieser Text enthält ein Bild <img> mitt en in der Nachricht');
            let translation = tu.sourceContentNormalized().translate('This text contains an img <img> in the message');
            tu.translate(translation);
            expect(tu.targetContent()).toBe('This text contains an img <ph id="0" equiv="TAG_IMG" type="image" disp="&lt;img/>"/> in the message');
        });

        it('should remove a transunit by id', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            file.removeTransUnitWithId(ID_WITH_PLACEHOLDER);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu2).toBeFalsy(); // should not exist any more
        });

        it ('should translate source without or with target', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_APP_RUNS);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBeFalsy();
            // first translate
            tu.translate('Anwendung läuft');
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_APP_RUNS);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe('Anwendung läuft');
            expect(tu2.targetState()).toBe(STATE_TRANSLATED);
            // translate again
            tu2.translate('Anwendung funktioniert');
            const file3: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file2.editedContent(), null, null);
            const tu3: ITransUnit = file3.transUnitWithId(ID_APP_RUNS);
            expect(tu3.targetContentNormalized().asDisplayString()).toBe('Anwendung funktioniert');
            expect(tu3.targetState()).toBe(STATE_TRANSLATED);
        });

        it ('should copy source to target for default lang', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBeFalsy();
            let isDefaultLang: boolean = true;
            let copyContent: boolean = false;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe('Eintrag {{0}} von {{1}} hinzugefügt.');
        });

        it ('should copy source to target for non default lang if wanted', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBeFalsy();
            let isDefaultLang: boolean = false;
            let copyContent: boolean = true;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe('Eintrag {{0}} von {{1}} hinzugefügt.');
        });

        it ('should copy source to target for non default lang and set state new, native state initial, #57', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            let isDefaultLang: boolean = false;
            let copyContent: boolean = true;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe('Eintrag {{0}} von {{1}} hinzugefügt.');
            expect(tu2.targetState()).toBe(STATE_NEW);
            expect((<any>tu2).nativeTargetState()).toBe('initial');
        });

        it ('should not copy source to target for non default lang if not wanted', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBeFalsy();
            let isDefaultLang: boolean = false;
            let copyContent: boolean = false;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu2.targetContent()).toBeFalsy();
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
            const ID_EXISTING = '7499557905529977371';
            const existingTu = targetFile.transUnitWithId(ID_EXISTING);
            expect(existingTu).toBeTruthy();
            const newTu = targetFile.importNewTransUnit(tu, false, true, existingTu);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toEqual(newTu);
            const doc: Document = new DOMParser().parseFromString(targetFile.editedContent());
            const existingElem = DOMUtilities.getElementByTagNameAndId(doc, 'unit', ID_EXISTING);
            const newElem = DOMUtilities.getElementByTagNameAndId(doc, 'unit', ID_TO_MERGE);
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
            const newElem = DOMUtilities.getElementByTagNameAndId(doc, 'unit', ID_TO_MERGE);
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
            const tu: ITransUnit = file.transUnitWithId(ID_APP_RUNS);
            expect(tu).toBeTruthy();
            const translationString = 'Anwendung läuft';
            // first translate
            let translation: INormalizedMessage = tu.sourceContentNormalized().translate(translationString);
            tu.translate(translation);
            expect(tu.targetContent()).toBe(translationString);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_APP_RUNS);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe(translationString);
        });

        it('should translate placeholders without loosing disp info', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            const normalizedMessage = tu.sourceContentNormalized();
            // Eintrag <ph id="0" equiv="INTERPOLATION" disp="{{number()}}"/> von <ph id="1" equiv="INTERPOLATION_1" disp="{{total()}}"/> hinzugefügt.
            expect(normalizedMessage.asDisplayString()).toBe('Eintrag {{0}} von {{1}} hinzugefügt.');
            const translatedMessage = normalizedMessage.translate('Total {{1}}, added {{0}}');
            tu.translate(translatedMessage);
            expect(tu.targetContent()).toBe('Total <ph id="0" equiv="INTERPOLATION_1" disp="{{total()}}"/>, added <ph id="1" equiv="INTERPOLATION" disp="{{number()}}"/>');
        });

        it('should contain ICU reference in sourceContentNormalized', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_CONTAINS_ICU);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Zum Wert <ph id="0" equiv="INTERPOLATION" disp="{{auswahl}}"/> gehört der Text <ph id="1"/>');
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('Zum Wert {{0}} gehört der Text <ICU-Message-Ref_1/>');
        });

        it('should contain 2 ICU references in sourceContentNormalized (old syntax before angular #17344)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_CONTAINS_TWO_ICU);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('first: <ph id="0"/>, second <ph id="1"/>');
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('first: <ICU-Message-Ref_0/>, second <ICU-Message-Ref_1/>');
        });

        it('should contain 2 ICU references in sourceContentNormalized (new syntax after angular #17344)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_CONTAINS_TWO_ICU_WITH_EQUIV);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('first: <ph id="0" equiv="ICU" disp="{count, plural, =0 {...} =1 {...} other {...}}"/>, second <ph id="1" equiv="ICU_1" disp="{gender, select, m {...} f {...}}"/>');
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('first: <ICU-Message-Ref_0/>, second <ICU-Message-Ref_1/>');
        });

        it('should translate ICU references without loosing disp info', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_CONTAINS_TWO_ICU_WITH_EQUIV);
            expect(tu).toBeTruthy();
            const normalizedMessage = tu.sourceContentNormalized();
            expect(normalizedMessage.asDisplayString()).toBe('first: <ICU-Message-Ref_0/>, second <ICU-Message-Ref_1/>');
            const translatedMessage = normalizedMessage.translate('Zweitens <ICU-Message-Ref_1/>, Erstens: <ICU-Message-Ref_0/>');
            tu.translate(translatedMessage);
            expect(tu.targetContent()).toBe('Zweitens <ph id="1" equiv="ICU_1" disp="{gender, select, m {...} f {...}}"/>, Erstens: <ph id="0" equiv="ICU" disp="{count, plural, =0 {...} =1 {...} other {...}}"/>');
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
            expect(tu.targetContent()).toContain('wert1 {<pc id="0" equivStart="START_EMPHASISED_TEXT" equivEnd="CLOSE_EMPHASISED_TEXT" type="other" dispStart="&lt;em>" dispEnd="&lt;/em>">changed</pc>}');
            // TODO find warnings in embedded message, known limitation in the moment.
            //            const warnings = icuMessage.getCategories()[1].getMessageNormalized().validateWarnings();
            //            expect(warnings).toBeTruthy();
        });

    });
});
