import {isNullOrUndefined} from 'util';
import {Observable} from 'rxjs/Observable';
import {
    IICUMessage, IICUMessageTranslation, INormalizedMessage, ITranslationMessagesFile, ITransUnit,
    STATE_NEW
} from 'ngx-i18nsupport-lib/dist';
import {AutoTranslateService} from './auto-translate-service';
import {AutoTranslateResult} from './auto-translate-result';
import {AutoTranslateSummaryReport} from './auto-translate-summary-report';
/**
 * Created by martin on 07.07.2017.
 * Service to autotranslate Transunits via Google Translate.
 */

export class XliffMergeAutoTranslateService {

    private autoTranslateService: AutoTranslateService;

    constructor(apikey: string) {
        this.autoTranslateService = new AutoTranslateService(apikey);
    }

    /**
     * Auto translate file via Google Translate.
     * Will translate all new units in file.
     * @param from
     * @param to
     * @param languageSpecificMessagesFile
     * @return a promise with the execution result as a summary report.
     */
    public autoTranslate(from: string, to: string, languageSpecificMessagesFile: ITranslationMessagesFile): Observable<AutoTranslateSummaryReport> {
        return Observable.forkJoin([
            this.doAutoTranslateNonICUMessages(from, to, languageSpecificMessagesFile),
            ...this.doAutoTranslateICUMessages(from, to, languageSpecificMessagesFile)])
            .map((summaries: AutoTranslateSummaryReport[]) => {
                const summary = summaries[0];
                for (let i = 1; i < summaries.length; i++) {
                    summary.merge(summaries[i]);
                }
                return summary;
        });
    }

    /**
     * Collect all units that are untranslated.
     * @param languageSpecificMessagesFile
     * @return {ITransUnit[]}
     */
    private allUntranslatedTUs(languageSpecificMessagesFile: ITranslationMessagesFile): ITransUnit[] {
        // collect all units, that should be auto translated
        const allUntranslated: ITransUnit[] = [];
        languageSpecificMessagesFile.forEachTransUnit((tu) => {
            if (tu.targetState() === STATE_NEW) {
                allUntranslated.push(tu);
            }
        });
        return allUntranslated;
    }

    private doAutoTranslateNonICUMessages(from: string, to: string, languageSpecificMessagesFile: ITranslationMessagesFile): Observable<AutoTranslateSummaryReport> {
        const allUntranslated: ITransUnit[] = this.allUntranslatedTUs(languageSpecificMessagesFile);
        const allTranslatable = allUntranslated.filter((tu) => isNullOrUndefined(tu.sourceContentNormalized().getICUMessage()));
        const allMessages: string[] = allTranslatable.map((tu) => {
            return tu.sourceContentNormalized().asDisplayString();
        });
        return this.autoTranslateService.translateMultipleStrings(allMessages, from, to)
            .map((translations: string[]) => {
                const summary = new AutoTranslateSummaryReport(from, to);
                summary.setIgnored(allUntranslated.length - allTranslatable.length);
                for (let i = 0; i < translations.length; i++) {
                    const tu = allTranslatable[i];
                    const translationText = translations[i];
                    const result = this.autoTranslateNonICUUnit(tu, translationText);
                    summary.addSingleResult(tu, result);
                }
                return summary;
            }).catch((err) => {
                const failSummary = new AutoTranslateSummaryReport(from, to);
                failSummary.setError(err.message, allMessages.length);
                return Observable.of(failSummary);
            });
    }

    private doAutoTranslateICUMessages(from: string, to: string, languageSpecificMessagesFile: ITranslationMessagesFile): Observable<AutoTranslateSummaryReport>[] {
        const allUntranslated: ITransUnit[] = this.allUntranslatedTUs(languageSpecificMessagesFile);
        const allTranslatableICU = allUntranslated.filter((tu) => !isNullOrUndefined(tu.sourceContentNormalized().getICUMessage()));
        return allTranslatableICU.map((tu) => {
            return this.doAutoTranslateICUMessage(from, to, tu);
        });
    }

    /**
     * Translate single ICU Messages.
     * @param from
     * @param to
     * @param tu transunit to translate (must contain ICU Message)
     * @return {Observable<AutoTranslateSummaryReport>}
     */
    private doAutoTranslateICUMessage(from: string, to: string, tu: ITransUnit): Observable<AutoTranslateSummaryReport> {
        const icuMessage: IICUMessage = tu.sourceContentNormalized().getICUMessage();
        const categories = icuMessage.getCategories();
        // check for nested ICUs, we do not support that
        if (categories.find((category) => !isNullOrUndefined(category.getMessageNormalized().getICUMessage()))) {
            const summary = new AutoTranslateSummaryReport(from, to);
            summary.setIgnored(1);
            return Observable.of(summary);
        }
        const allMessages: string[] = categories.map((category) => category.getMessageNormalized().asDisplayString());
        return this.autoTranslateService.translateMultipleStrings(allMessages, from, to)
            .map((translations: string[]) => {
                const summary = new AutoTranslateSummaryReport(from, to);
                const icuTranslation: IICUMessageTranslation = {};
                for (let i = 0; i < translations.length; i++) {
                    const translationText = translations[i];
                    icuTranslation[categories[i].getCategory()] = translationText;
                }
                const result = this.autoTranslateICUUnit(tu, icuTranslation);
                summary.addSingleResult(tu, result);
                return summary;
            }).catch((err) => {
                const failSummary = new AutoTranslateSummaryReport(from, to);
                failSummary.setError(err.message, allMessages.length);
                return Observable.of(failSummary);
            });
    }

    private autoTranslateNonICUUnit(tu: ITransUnit, translatedMessage: string): AutoTranslateResult {
        return this.autoTranslateUnit(tu, tu.sourceContentNormalized().translate(translatedMessage));
    }

    private autoTranslateICUUnit(tu: ITransUnit, translation: IICUMessageTranslation): AutoTranslateResult {
        return this.autoTranslateUnit(tu, tu.sourceContentNormalized().translateICUMessage(translation));
    }

    private autoTranslateUnit(tu: ITransUnit, translatedMessage: INormalizedMessage): AutoTranslateResult {
        const errors = translatedMessage.validate();
        const warnings = translatedMessage.validateWarnings();
        if (!isNullOrUndefined(errors)) {
            return new AutoTranslateResult(false, 'errors detected, not translated');
        } else if (!isNullOrUndefined(warnings)) {
            return new AutoTranslateResult(false, 'warnings detected, not translated');
        } else {
            tu.translate(translatedMessage);
            return new AutoTranslateResult(true, null); // success
        }
    }
}