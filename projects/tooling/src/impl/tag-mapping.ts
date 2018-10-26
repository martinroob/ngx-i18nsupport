/**
 * Created by roobm on 16.05.2017.
 * Mapping from normalized tag names to placeholder names.
 */

/*
copied from https://github.com/angular/angular/blob/master/packages/compiler/src/i18n/serializers/placeholder.ts
 */
const TAG_TO_PLACEHOLDER_NAMES: {[k: string]: string} = {
    'A': 'LINK',
    'B': 'BOLD_TEXT',
    'BR': 'LINE_BREAK',
    'EM': 'EMPHASISED_TEXT',
    'H1': 'HEADING_LEVEL1',
    'H2': 'HEADING_LEVEL2',
    'H3': 'HEADING_LEVEL3',
    'H4': 'HEADING_LEVEL4',
    'H5': 'HEADING_LEVEL5',
    'H6': 'HEADING_LEVEL6',
    'HR': 'HORIZONTAL_RULE',
    'I': 'ITALIC_TEXT',
    'LI': 'LIST_ITEM',
    'LINK': 'MEDIA_LINK',
    'OL': 'ORDERED_LIST',
    'P': 'PARAGRAPH',
    'Q': 'QUOTATION',
    'S': 'STRIKETHROUGH_TEXT',
    'SMALL': 'SMALL_TEXT',
    'SUB': 'SUBSTRIPT',
    'SUP': 'SUPERSCRIPT',
    'TBODY': 'TABLE_BODY',
    'TD': 'TABLE_CELL',
    'TFOOT': 'TABLE_FOOTER',
    'TH': 'TABLE_HEADER_CELL',
    'THEAD': 'TABLE_HEADER',
    'TR': 'TABLE_ROW',
    'TT': 'MONOSPACED_TEXT',
    'U': 'UNDERLINED_TEXT',
    'UL': 'UNORDERED_LIST',
};

/**
 * HTML Tags (in uppercase) that are empty, they have no content, but do not need a close tag, e.g. <br>, <img>, <hr>.
 * @type {Array}
 */
const VOID_TAGS = ['BR', 'HR', 'IMG', 'AREA', 'LINK', 'WBR'];

export class TagMapping {

    public getStartTagPlaceholderName(tag: string, id: number): string {
        const upperTag = tag.toUpperCase();
        const baseName = TAG_TO_PLACEHOLDER_NAMES[upperTag] || `TAG_${upperTag}`;
        return `START_${baseName}` + this.counterString(id);
    }

    public getCloseTagPlaceholderName(tag: string): string {
        const upperTag = tag.toUpperCase();
        const baseName = TAG_TO_PLACEHOLDER_NAMES[upperTag] || `TAG_${upperTag}`;
        return `CLOSE_${baseName}`;
    }

    public getEmptyTagPlaceholderName(tag: string, id: number): string {
        const upperTag = tag.toUpperCase();
        const baseName =  TAG_TO_PLACEHOLDER_NAMES[upperTag] || `TAG_${upperTag}`;
        return baseName + this.counterString(id);
    }

    public getCtypeForTag(tag: string): string {
        switch (tag.toLowerCase()) {
            case 'br':
                return 'lb';
            case 'img':
                return 'image';
            default:
                return `x-${tag}`;
        }
    }

    public getTagnameFromStartTagPlaceholderName(placeholderName: string): string {
        if (placeholderName.startsWith('START_TAG_')) {
            return this.stripCounter(placeholderName.substring('START_TAG_'.length)).toLowerCase();
        } else if (placeholderName.startsWith('START_')) {
            const ph = this.stripCounter(placeholderName.substring('START_'.length));
            let matchKey = Object.keys(TAG_TO_PLACEHOLDER_NAMES).find((key) => TAG_TO_PLACEHOLDER_NAMES[key] === ph);
            return matchKey ? matchKey.toLowerCase() : null;
        }
        return null;
    }

    public getTagnameFromCloseTagPlaceholderName(placeholderName: string): string {
        if (placeholderName.startsWith('CLOSE_TAG_')) {
            return this.stripCounter(placeholderName.substring('CLOSE_TAG_'.length)).toLowerCase();
        } else if (placeholderName.startsWith('CLOSE_')) {
            const ph = this.stripCounter(placeholderName.substring('CLOSE_'.length));
            let matchKey = Object.keys(TAG_TO_PLACEHOLDER_NAMES).find((key) => TAG_TO_PLACEHOLDER_NAMES[key] === ph);
            return matchKey ? matchKey.toLowerCase() : null;
        }
        return null;
    }

    /**
     * Test, wether placeholder name stands for empty html tag.
     * @param placeholderName can be TAG_<name> or just <name>
     */
    public isEmptyTagPlaceholderName(placeholderName: string): boolean {
        let ph = this.stripCounter(placeholderName);
        let matchKey;
        if (ph.startsWith('TAG_')) {
            matchKey = ph.substring(4).toUpperCase();
        } else {
            matchKey = Object.keys(TAG_TO_PLACEHOLDER_NAMES).find((key) => TAG_TO_PLACEHOLDER_NAMES[key] === ph);
        }
        if (matchKey) {
            if (VOID_TAGS.indexOf(matchKey) >= 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * tagname of empty tag placeholder.
     * @param placeholderName can be TAG_<name> or just <name>
     */
    public getTagnameFromEmptyTagPlaceholderName(placeholderName: string): string {
        let ph = this.stripCounter(placeholderName);
        let matchKey;
        if (ph.startsWith('TAG_')) {
            matchKey = ph.substring(4).toUpperCase();
        } else {
            matchKey = Object.keys(TAG_TO_PLACEHOLDER_NAMES).find((key) => TAG_TO_PLACEHOLDER_NAMES[key] === ph);
        }
        if (matchKey) {
            if (VOID_TAGS.indexOf(matchKey) >= 0) {
                return matchKey.toLowerCase();
            } else {
                return null;
            }
        }
        return null;
    }

    /**
     * If placeholder ends with _[0-9]+, strip that number.
     * @param placeholderName
     * @return placeholderName without counter at end.
     */
    private stripCounter(placeholderName: string): string {
        if (placeholderName) {
            const re = /(.*)_[0-9]+$/;
            if (placeholderName.match(re)) {
                return placeholderName.replace(re, '$1');
            }
        }
        return placeholderName;
    }

    /**
     * String suffix for counter.
     * If counter is 0, it is empty, otherwise _<id>.
     * @param {number} id
     * @return {string}
     */
    private counterString(id: number) {
        if (id === 0) {
            return '';
        } else {
            return '_' + id.toString(10);
        }
    }
}