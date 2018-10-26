import * as Tokenizr from 'tokenizr';

/**
 * Created by martin on 04.06.2017.
 * A tokenizer for ICU messages.
 */

// Tokens
export const TEXT = 'TEXT';
export const CURLY_BRACE_OPEN = 'CURLY_BRACE_OPEN';
export const CURLY_BRACE_CLOSE = 'CURLY_BRACE_CLOSE';
export const COMMA = 'COMMA';
export const PLURAL = 'PLURAL';
export const SELECT = 'SELECT';

export interface ICUToken {
    type: string;
    value: any;
}

// states: default normal in_message
const STATE_DEFAULT = 'default';
const STATE_NORMAL = 'normal';
const STATE_IN_MESSAGE = 'in_message';

export class ICUMessageTokenizer {
    private lexer: Tokenizr;

    private getLexer(): Tokenizr {
        const lexer = new Tokenizr();
        let plaintext = '';
        let openedCurlyBracesInTextCounter = 0;
        lexer.before((ctx, match, rule) => {
            if (rule.name !== TEXT) {
                if (this.containsNonWhiteSpace(plaintext)) {
                    ctx.accept(TEXT, plaintext);
                    plaintext = '';
                } else {
                    ctx.ignore();
                }
            }
        });
        lexer.finish((ctx) => {
            if (this.containsNonWhiteSpace(plaintext)) {
                ctx.accept(TEXT, plaintext)
            }
         });
        // curly brace
        lexer.rule(STATE_DEFAULT, /{/, (ctx, match) => {
            ctx.accept(CURLY_BRACE_OPEN, match[0]);
            ctx.push(STATE_NORMAL);
        }, CURLY_BRACE_OPEN);
        lexer.rule(STATE_NORMAL, /{/, (ctx, match) => {
            ctx.accept(CURLY_BRACE_OPEN, match[0]);
            ctx.push(STATE_IN_MESSAGE);
        }, CURLY_BRACE_OPEN);
        lexer.rule(STATE_NORMAL, /}/, (ctx, match) => {
            ctx.pop();
            ctx.accept(CURLY_BRACE_CLOSE, match[0]);
        }, CURLY_BRACE_CLOSE);
        // masked ' { and }
        lexer.rule(STATE_IN_MESSAGE, /'[{}]?'/, (ctx, match) => {
            if (match[0] === '\'\'') {
                plaintext += '\'';
            } else if (match[0] === '\'{\'') {
                plaintext += '{';
            } else if (match[0] === '\'}\'') {
                plaintext += '}';
            }
            ctx.ignore();
        }, TEXT);
        lexer.rule(STATE_IN_MESSAGE, /./, (ctx, match) => {
            const char = match[0];
            if (char === '{') {
                openedCurlyBracesInTextCounter++;
                plaintext += match[0];
                ctx.ignore();
            } else if (char === '}') {
                if (openedCurlyBracesInTextCounter > 0) {
                    openedCurlyBracesInTextCounter--;
                    plaintext += match[0];
                    ctx.ignore();
                } else {
                    ctx.pop();
                    ctx.accept(TEXT, plaintext);
                    plaintext = '';
                    ctx.accept(CURLY_BRACE_CLOSE, match[0]);
                }
            } else {
                plaintext += match[0];
                ctx.ignore();
            }
        }, TEXT);
        // comma
        lexer.rule(STATE_NORMAL, /,/, (ctx, match) => {
            ctx.accept(COMMA, match[0]);
        }, COMMA);
        // keywords plural and select
        lexer.rule(STATE_NORMAL, /plural/, (ctx, match) => {
            ctx.accept(PLURAL, match[0]);
        }, PLURAL);
        lexer.rule(STATE_NORMAL, /select/, (ctx, match) => {
            ctx.accept(SELECT, match[0]);
        }, SELECT);
        // text
        lexer.rule(/./, (ctx, match) => {
            plaintext += match[0];
            ctx.ignore();
        }, TEXT);
        lexer.rule(/[\s]+/, (ctx, match) => {
            plaintext += match[0];
            ctx.ignore();
        }, TEXT);
        return lexer;
    }

    private containsNonWhiteSpace(text: string): boolean {
        for (let i = 0; i < text.length; i++) {
            if (!/\s/.test(text.charAt(i))) {
                return true;
            }
        }
        return false;
    }

    tokenize(normalizedMessage: string): ICUToken[] {
        const lexer: Tokenizr = this.getLexer();
        lexer.input(normalizedMessage);
        return lexer.tokens();
    }

    input(normalizedMessage: string) {
        this.lexer = this.getLexer();
        this.lexer.input(normalizedMessage);
    }

    next(): ICUToken {
        return this.lexer.token();
    }

    peek(): ICUToken {
        return this.lexer.peek();
    }
}