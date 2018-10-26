import {TranslationMessagesFileFactory, ITranslationMessagesFile, ITransUnit, INormalizedMessage, STATE_NEW, STATE_TRANSLATED, STATE_FINAL, FILETYPE_XTB} from '../api';
import * as fs from "fs";

/**
 * Created by martin on 28.04.2017.
 * Testcases for xmb files.
 */

describe('ngx-i18nsupport-lib xmb test spec', () => {

    let SRCDIR = 'test/testdata/i18n/';

    let ENCODING = 'UTF-8';

    /**
     * Helper function to read Xmb from File
     * @type {string}
     */
    function readFile(path: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        return TranslationMessagesFileFactory.fromFileContent('xmb', content, path, ENCODING);
    }

    describe('xmb format tests', () => {
        let MASTER1SRC = SRCDIR + 'ngExtractedMaster1.xmb';
        let MASTER_DE_XMB = SRCDIR + 'ngExtractedMaster1.de.xmb';
        let TRANSLATED_FILE_SRC = SRCDIR + 'ngExtractedMaster1.en.xtb';

        let ID_MY_FIRST = '2047558209369508311'; // an ID from ngExtractedMaster1.xmb
        let ID_WITH_PLACEHOLDER = '9030312858648510700';
        let ID_WITH_MEANING_AND_DESCRIPTION = '3274258156935474372'; // ID with placeholders and source element
        let ID_WITH_NO_SOURCEREFS = 'no_sourceref_test'; // an ID with no source elements
        let ID_WITH_TWO_SOURCEREFS = '4371668001355139802'; // an ID with 2 source elements
        let ID_WITH_LINEBREAK = '7149517499881679376';
        let ID_WITH_TAGS = '7609655310648429098';
        let ID_WITH_TAG_STRANGE = '7610784844464920497';
        let ID_TO_MERGE = 'unittomerge';
        let ID_ICU_PLURAL = '157616252019374389';
        let ID_ICU_SELECT = '4002068837191765530';
        let ID_ICU_EMBEDDED_TAGS = '6710804210857077393';
        let ID_CONTAINS_ICU = '2747218257718409559';
        let ID_CONTAINS_TWO_ICU = 'complextags.icuTwoICU';

        it('should read xmb file', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file).toBeTruthy();
            expect(file.fileType()).toBe('XMB');
            const tu: ITransUnit = file.transUnitWithId(ID_MY_FIRST);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Meine erste I18N-Anwendung');
        });

        it('should emit warnings', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.warnings().length).toBe(1);
            expect(file.warnings()[0]).toContain('msg without "id"');
        });

        it('should count units', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.numberOfTransUnits()).toBe(21);
            expect(file.numberOfTransUnitsWithMissingId()).toBe(1);
            expect(file.numberOfUntranslatedTransUnits()).toBe(file.numberOfTransUnits());
            expect(file.numberOfReviewedTransUnits()).toBe(0);
        });

        it('should return source language (by guessing from file name)', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.sourceLanguage()).toBeFalsy();
            const file2: ITranslationMessagesFile = readFile(MASTER_DE_XMB);
            expect(file2.sourceLanguage()).toBe('de');
        });

        it('should return target language null', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            expect(file.targetLanguage()).toBeFalsy();
        });

        it('should loop over all trans units', () => {
            const translatedFile: ITranslationMessagesFile = readFile(MASTER_DE_XMB);
            let count = 0;
            translatedFile.forEachTransUnit((tu: ITransUnit) => {
                expect(tu).toBeTruthy();
                count++;
            });
            expect(count).toBeGreaterThan(4);
        });

        it('should ignore change source content', () => {
            const file: ITranslationMessagesFile = readFile(MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBeTruthy();
            const oldValue = tu.sourceContent();
            expect(tu.supportsSetSourceContent()).toBeFalsy();
            const changedMessage = 'a changed source';
            tu.setSourceContent(changedMessage);
            expect(tu.sourceContent()).toBe(oldValue);
        });

        it('should read meaning and description of tu', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.meaning()).toBe('dateservice.monday');
            expect(tu.description()).toBe('ngx-translate');
        });

        it('should ignore change description', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.description()).toBeTruthy();
            const oldValue = tu.description();
            expect(tu.supportsSetDescriptionAndMeaning()).toBeFalsy();
            const changedMessage = 'a changed description';
            tu.setDescription(changedMessage);
            expect(tu.description()).toBe(oldValue);
        });

        it('should ignore change meaning', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.meaning()).toBeTruthy();
            const oldValue = tu.meaning();
            expect(tu.supportsSetDescriptionAndMeaning()).toBeFalsy();
            const changedMessage = 'a changed description';
            tu.setMeaning(changedMessage);
            expect(tu.meaning()).toBe(oldValue);
        });

        it('should ignore source attribute in sourceContent', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Eintrag <ph name="INTERPOLATION"><ex>INTERPOLATION</ex></ph> von <ph name="INTERPOLATION_1"><ex>INTERPOLATION_1</ex></ph> hinzugefügt.');
        });

        it('should return empty source references array if source not set', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_NO_SOURCEREFS);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(0);
        });

        it('should return source reference', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(1);
            expect(tu.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[0].linenumber).toBe(6);
        });

        it('should return more than one source references', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(2);
            expect(tu.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[0].linenumber).toBe(2);
            expect(tu.sourceReferences()[1].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[1].linenumber).toBe(3);
        });

        it('should return source reference with more than 1 linenumber', () => {
            // if the text in template spreads over more than 1 line, there is a linenumber format like 7,8 used
            // in this case, linenumber is the first line (here 7).
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_LINEBREAK);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(1);
            expect(tu.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[0].linenumber).toBe(7);
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

        it('should normalize placeholders to {{0}} etc', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('Eintrag {{0}} von {{1}} hinzugefügt.');
        });

        it('should normalize embedded html tags', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TAGS);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('Diese Nachricht ist <b><strong>SEHR WICHTIG</strong></b>');
        });

        it('should normalize embedded html tags', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TAG_STRANGE);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('Diese Nachricht ist <strange>{{0}}</strange>');
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

        it ('should copy a transunit from file a to file b', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = file.createTranslationFileForLang('de', null, false, true);
            expect(targetFile.fileType()).toBe(FILETYPE_XTB);
            targetFile.removeTransUnitWithId(ID_TO_MERGE);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeFalsy();
            const newTu = targetFile.importNewTransUnit(tu, false, true);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toEqual(newTu);
            let changedTargetFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(targetFile.editedContent(), null, null);
            let targetTu = changedTargetFile.transUnitWithId(ID_TO_MERGE);
            expect(targetTu.targetContent()).toBe('Test for merging units');
        });

        it ('should copy source to target and set a praefix and suffix', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            file.setNewTransUnitTargetPraefix('%%');
            file.setNewTransUnitTargetSuffix('!!');
            let isDefaultLang: boolean = false;
            let copyContent: boolean = true;
            const file2: ITranslationMessagesFile = file.createTranslationFileForLang('xy', null, isDefaultLang, copyContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_TO_MERGE);
            expect(tu2.targetState()).toBe(STATE_FINAL); // FINAL because source is different than target
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

        it ('should preserve line end at end of file while editing', () => {
            const content = fs.readFileSync(MASTER1SRC, ENCODING);
            expect(content.endsWith('\n')).toBeTruthy('Master should end with EOL');
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = file.createTranslationFileForLang('de', null, false, true);
            targetFile.removeTransUnitWithId(ID_TO_MERGE);
            targetFile.importNewTransUnit(tu, false, true);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            expect(targetFile.editedContent().endsWith('\n')).toBeTruthy('Edited content should end with EOL');
        });

        it ('should not be translatable at all', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_MY_FIRST);
            expect(tu).toBeTruthy();
            const translationString = 'Anwendung läuft';
            // try to translate
            try {
                let translation: INormalizedMessage = tu.sourceContentNormalized().translate(translationString);
                tu.translate(translation);
                fail('expected error not thrown');
            } catch (error) {
                expect(error.toString()).toContain('cannot translate xmb files');
            }
        });

        it('should contain ICU reference in sourceContentNormalized', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_CONTAINS_ICU);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Zum Wert <ph name="INTERPOLATION"><ex>INTERPOLATION</ex></ph> gehört der Text <ph name="ICU"><ex>ICU</ex></ph>');
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('Zum Wert {{0}} gehört der Text <ICU-Message-Ref_0/>');
        });

        it('should contain 2 ICU references in sourceContentNormalized', () => {
            const file: ITranslationMessagesFile = readFile(MASTER1SRC);
            const tu: ITransUnit = file.transUnitWithId(ID_CONTAINS_TWO_ICU);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('first: <ph name="ICU"><ex>ICU</ex></ph>, second <ph name="ICU_1"><ex>ICU_1</ex></ph>');
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

    });
});
