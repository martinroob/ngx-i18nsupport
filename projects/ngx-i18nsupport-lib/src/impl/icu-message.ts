import {IICUMessage, IICUMessageCategory, IICUMessageTranslation} from '../api/i-icu-message';
import {INormalizedMessage} from '../api/i-normalized-message';
import {format, isNullOrUndefined, isString} from 'util';
import {IMessageParser} from './i-message-parser';

class MessageCategory implements IICUMessageCategory {

    constructor(private _category: string, private _message: INormalizedMessage) {}

    public getCategory(): string {
        return this._category;
    }

    public getMessageNormalized(): INormalizedMessage {
        return this._message;
    }
}

/**
 * Implementation of an ICU Message.
 * Created by martin on 05.06.2017.
 */
export class ICUMessage implements IICUMessage {

    private _isPluralMessage: boolean;

    private _categories: IICUMessageCategory[];

    constructor(private _parser: IMessageParser, isPluralMessage: boolean) {
        this._isPluralMessage = isPluralMessage;
        this._categories = [];
    }

    addCategory(category: string, message: INormalizedMessage) {
        this._categories.push(new MessageCategory(category, message));
    }

    /**
     * ICU message as native string.
     * This is, how it is stored, something like '{x, plural, =0 {..}'
     * @return {string}
     */
    public asNativeString(): string {
        const varname = (this.isPluralMessage()) ? 'VAR_PLURAL' : 'VAR_SELECT';
        const type = (this.isPluralMessage()) ? 'plural' : 'select';
        let choiceString = '';
        this._categories.forEach((category: IICUMessageCategory) => {
            choiceString = choiceString + format(' %s {%s}', category.getCategory(), category.getMessageNormalized().asNativeString());
        });
        return format('{%s, %s,%s}', varname, type, choiceString);
    }

    /**
     * Is it a plural message?
     */
    isPluralMessage(): boolean {
        return this._isPluralMessage;
    }

    /**
     * Is it a select message?
     */
    isSelectMessage(): boolean {
        return !this._isPluralMessage;
    }

    /**
     * All the parts of the message.
     * E.g. the ICU message {wolves, plural, =0 {no wolves} =1 {one wolf} =2 {two wolves} other {a wolf pack}}
     * has 4 category objects with the categories =0, =1, =2, other.
     */
    getCategories(): IICUMessageCategory[] {
        return this._categories;
    }

    /**
     * Translate message and return a new, translated message
     * @param translation the translation (hashmap of categories and translations).
     * @return new message wit translated content.
     * @throws an error if translation does not match the message.
     * This is the case, if there are categories not contained in the original message.
     */
    translate(translation: IICUMessageTranslation): IICUMessage {
        const message = new ICUMessage(this._parser, this.isPluralMessage());
        let translatedCategories: Set<string> = new Set<string>();
        this._categories.forEach((category) => {
            let translatedMessage: INormalizedMessage;
            const translationForCategory: string|IICUMessageTranslation = translation[category.getCategory()];
            if (isNullOrUndefined(translationForCategory)) {
                translatedMessage = category.getMessageNormalized();
            } else if (isString(translationForCategory)) {
                translatedCategories.add(category.getCategory());
                translatedMessage = this._parser.parseNormalizedString(<string> translationForCategory, null);
            } else {
                // TODO embedded ICU Message
                translatedMessage = null;
            }
            message.addCategory(category.getCategory(), translatedMessage);
        });
        // new categories, which are not part of the original message
        Object.keys(translation).forEach((categoryName) => {
            if (!translatedCategories.has(categoryName)) {
                if (this.isSelectMessage()) {
                    throw new Error(format('adding a new category not allowed for select messages ("%s" is not part of message)', categoryName));
                } else {
                    this.checkValidPluralCategory(categoryName);
                    // TODO embedded ICU Message
                    let translatedMessage = this._parser.parseNormalizedString(<string> translation[categoryName], null);
                    message.addCategory(categoryName, translatedMessage);
                }
            }
        });
        return message;
    }

    /**
     * Check, wether category is valid plural category.
     * Allowed are =n, 'zero', 'one', 'two', 'few', 'many' and 'other'
     * @param categoryName category
     * @throws an error, if it is not a valid category name
     */
    private checkValidPluralCategory(categoryName: string) {
        const allowedKeywords = ['zero', 'one', 'two', 'few', 'many', 'other'];
        if (categoryName.match(/=\d+/)) {
            return;
        }
        if (allowedKeywords.find((key) => key === categoryName)) {
            return;
        }
        throw new Error(format('invalid plural category "%s", allowed are =<n> and %s', categoryName, allowedKeywords));
    }
}