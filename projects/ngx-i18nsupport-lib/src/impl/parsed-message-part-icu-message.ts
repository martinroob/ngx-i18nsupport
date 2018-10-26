import {ParsedMessagePart, ParsedMessagePartType} from './parsed-message-part';
import {IICUMessage} from '../api/i-icu-message';
import {
    COMMA, CURLY_BRACE_CLOSE, CURLY_BRACE_OPEN, ICUMessageTokenizer, ICUToken, PLURAL, SELECT,
    TEXT
} from './icu-message-tokenizer';
import {ICUMessage} from './icu-message';
import {format} from 'util';
import {INormalizedMessage} from '../api/i-normalized-message';
import {IMessageParser} from './i-message-parser';

/**
 * Created by martin on 02.06.2017.
 * A message part consisting of an icu message.
 * There can only be one icu message in a parsed message.
 * Syntax of ICU message is '{' <keyname> ',' 'select'|'plural' ',' (<category> '{' text '}')+ '}'
 */

export class ParsedMessagePartICUMessage extends ParsedMessagePart {

    private _message: ICUMessage;
    private _messageText: string;
    private _tokenizer: ICUMessageTokenizer;

    constructor(icuMessageText: string, private _parser: IMessageParser) {
        super(ParsedMessagePartType.ICU_MESSAGE);
        if (icuMessageText) {
            this.parseICUMessage(icuMessageText);
        }
    }

    /**
     * Test wether text might be an ICU message.
     * Should at least start with something like '{<name>, select, ..' or '{<name>, plural, ...'
     * @param {string} icuMessageText
     * @return {boolean}
     */
    static looksLikeICUMessage(icuMessageText: string): boolean {
        const part = new ParsedMessagePartICUMessage(null, null);
        return part.looksLikeICUMessage(icuMessageText);
    }

    public asDisplayString(format?: string) {
        return '<ICU-Message/>';
    }

    /**
     * return the parsed message.
     * @return {ICUMessage}
     */
    public getICUMessage(): IICUMessage {
        return this._message;
    }

    /**
     * Parse the message.
     * @param text message text to parse
     * @throws an error if the syntax is not ok in any way.
     */
    private parseICUMessage(text: string) {
        // console.log('message ', text);
        // const tokens = new ICUMessageTokenizer().tokenize(text);
        // tokens.forEach((tok) => {
        //     console.log('Token', tok.type, tok.value);
        // });
        this._messageText = text;
        this._tokenizer = new ICUMessageTokenizer();
        this._tokenizer.input(text);
        this.expectNext(CURLY_BRACE_OPEN);
        this.expectNext(TEXT); // varname, not used currently, ng always used VAR_PLURAL or VAR_SELECT
        this.expectNext(COMMA);
        let token: ICUToken = this._tokenizer.next();
        if (token.type === PLURAL) {
            this._message = new ICUMessage(this._parser, true);
        } else if (token.type === SELECT) {
            this._message = new ICUMessage(this._parser, false);
        }
        this.expectNext(COMMA);
        token = this._tokenizer.peek();
        while (token.type !== CURLY_BRACE_CLOSE) {
            let category = this.expectNext(TEXT).value.trim();
            this.expectNext(CURLY_BRACE_OPEN);
            let message = this.expectNext(TEXT).value;
            this._message.addCategory(category, this.parseNativeSubMessage(message));
            this.expectNext(CURLY_BRACE_CLOSE);
            token = this._tokenizer.peek();
        }
        this.expectNext(CURLY_BRACE_CLOSE);
        this.expectNext('EOF');
    }

    /**
     * Parse the message to check, wether it might be an ICU message.
     * Should at least start with something like '{<name>, select, ..' or '{<name>, plural, ...'
     * @param text message text to parse
     */
    private looksLikeICUMessage(text: string): boolean {
        // console.log('message ', text);
        // const tokens = new ICUMessageTokenizer().tokenize(text);
        // tokens.forEach((tok) => {
        //     console.log('Token', tok.type, tok.value);
        // });
        this._tokenizer = new ICUMessageTokenizer();
        this._tokenizer.input(text);
        try {
            this.expectNext(CURLY_BRACE_OPEN);
            this.expectNext(TEXT); // varname, not used currently, ng always used VAR_PLURAL or VAR_SELECT
            this.expectNext(COMMA);
            let token: ICUToken = this._tokenizer.next();
            if (token.type !== PLURAL && token.type !== SELECT) {
                return false;
            }
            this.expectNext(COMMA);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Read next token and expect, that it is of the given type.
     * @param tokentype expected type.
     * @return {ICUToken} Token
     * @throws error, if next token has wrong type.
     */
    private expectNext(tokentype: string): ICUToken {
        const token = this._tokenizer.next();
        if (token.type !== tokentype) {
            throw new Error(format('Error parsing ICU Message: expected %s, found %s (%s) (message %s)',
                tokentype, token.type, token.value, this._messageText));
        }
        return token;
    }

    /**
     * Parse XML text to normalozed message.
     * @param message message in format dependent xml syntax.
     * @return {INormalizedMessage}
     */
    private parseNativeSubMessage(message: string): INormalizedMessage {
        return this._parser.createNormalizedMessageFromXMLString(message, null);
    }
}