import {ParsedMessagePart, ParsedMessagePartType} from './parsed-message-part';
import {NORMALIZATION_FORMAT_NGXTRANSLATE} from '../api/constants';
/**
 * Created by martin on 05.05.2017.
 * A message part consisting of a placeholder.
 * Placeholders are numbered from 0 to n.
 */

export class ParsedMessagePartPlaceholder extends ParsedMessagePart {

    // index 0 .. n
    private _index: number;
    // optional disp-Attribute value, contains the original expression.
    private _disp?: string;

    constructor(index: number, disp: string) {
        super(ParsedMessagePartType.PLACEHOLDER);
        this._index = index;
        this._disp = disp;
    }

    public asDisplayString(format?: string) {
        if (format === NORMALIZATION_FORMAT_NGXTRANSLATE) {
            return '{{' + this._index + '}}';
        }
        return '{{' + this._index + '}}';
    }
    public index(): number {
        return this._index;
    }

    public disp(): string {
        return this._disp;
    }
}