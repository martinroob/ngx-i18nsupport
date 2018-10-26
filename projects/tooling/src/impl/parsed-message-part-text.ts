import {ParsedMessagePart, ParsedMessagePartType} from './parsed-message-part';
/**
 * Created by martin on 05.05.2017.
 * A message part consisting of just simple text.
 */

export class ParsedMessagePartText extends ParsedMessagePart {

    private text: string;

    constructor(text: string) {
        super(ParsedMessagePartType.TEXT);
        this.text = text;
    }

    public asDisplayString(format?: string) {
        return this.text;
    }
}