import * as Tokenizr from 'tokenizr';
import {isNullOrUndefined} from 'util';

/**
 * Created by martin on 14.05.2017.
 * A tokenizer for normalized messages.
 */

// Tokens
export const TEXT = 'TEXT';
export const START_TAG = 'START_TAG';
export const END_TAG = 'END_TAG';
export const EMPTY_TAG = 'EMPTY_TAG';
export const PLACEHOLDER = 'PLACEHOLDER';
export const ICU_MESSAGE_REF = 'ICU_MESSAGE_REF';
export const ICU_MESSAGE = 'ICU_MESSAGE';

export interface Token {
    type: string;
    value: any;
}

export class ParsedMesageTokenizer {

    private getLexer(): Tokenizr {
        const lexer = new Tokenizr();
        let plaintext = '';
        lexer.before((ctx, match, rule) => {
            if (rule.name !== TEXT && plaintext !== '') {
                ctx.accept(TEXT, {text: plaintext});
                plaintext = '';
            }
        });
        lexer.finish((ctx) => {
            if (plaintext !== '') {
                ctx.accept(TEXT, {text: plaintext})
            }
         });
        // empty tag, there are only a few allowed (see tag-mappings): ['BR', 'HR', 'IMG', 'AREA', 'LINK', 'WBR']
        // format is <name id="nr">, nr ist optional, z.B. <img> oder <img id="2">
        lexer.rule(/<(br|hr|img|area|link|wbr)( id="([0-9])*")?\>/, (ctx, match) => {
            const idcount = isNullOrUndefined(match[3]) ? 0 : parseInt(match[3], 10);
            ctx.accept(EMPTY_TAG, {name: match[1], idcounter: idcount});
        }, EMPTY_TAG);
        // start tag, Format <name id="nr">, nr ist optional, z.B. <mytag> oder <mytag id="2">
        lexer.rule(/<([a-zA-Z][a-zA-Z-0-9]*)( id="([0-9]*)")?>/, (ctx, match) => {
            const idcount = isNullOrUndefined(match[3]) ? 0 : parseInt(match[3], 10);
            ctx.accept(START_TAG, {name: match[1], idcounter: idcount});
        }, START_TAG);
        // end tag
        lexer.rule(/<\/([a-zA-Z][a-zA-Z-0-9]*)>/, (ctx, match) => {
            ctx.accept(END_TAG, {name: match[1]});
        }, END_TAG);
        // placeholder
        lexer.rule(/{{([0-9]+)}}/, (ctx, match) => {
            ctx.accept(PLACEHOLDER, {idcounter: parseInt(match[1], 10)});
        }, PLACEHOLDER);
        // icu message ref
        lexer.rule(/<ICU-Message-Ref_([0-9]+)\/>/, (ctx, match) => {
            ctx.accept(ICU_MESSAGE_REF, {idcounter: parseInt(match[1], 10)});
        }, ICU_MESSAGE_REF);
        // icu message
        lexer.rule(/<ICU-Message\/>/, (ctx, match) => {
            ctx.accept(ICU_MESSAGE, {message: match[0]});
        }, ICU_MESSAGE);
        // text
        lexer.rule(/./, (ctx, match) => {
            plaintext += match[0];
            ctx.ignore();
        }, TEXT);
        lexer.rule(/[\t\r\n]+/, (ctx, match) => {
            plaintext += match[0];
            ctx.ignore();
        }, TEXT);
        return lexer;
    }

    tokenize(normalizedMessage: string): Token[] {
        const lexer: Tokenizr = this.getLexer();
        lexer.reset();
        lexer.input(normalizedMessage);
        return lexer.tokens();
    }

}