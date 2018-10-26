import {ParsedMessagePart, ParsedMessagePartType} from './parsed-message-part';
/**
 * Created by martin on 05.05.2017.
 * A message part consisting of an opening tag like <b> or <strange>.
 */

export class ParsedMessagePartStartTag extends ParsedMessagePart {

    private _tagname: string;
    private _idcounter: number;

    constructor(tagname: string, idcounter: number) {
        super(ParsedMessagePartType.START_TAG);
        this._tagname = tagname;
        this._idcounter = idcounter;
    }

    public asDisplayString(format?: string) {
        if (this._idcounter === 0) {
            return '<' + this._tagname + '>';
        } else {
            return '<' + this._tagname + ' id="' + this._idcounter.toString() + '">';
        }
    }

    public tagName(): string {
        return this._tagname;
    }

    public idCounter(): number {
        return this._idcounter;
    }
}