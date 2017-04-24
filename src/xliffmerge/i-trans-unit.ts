/**
 * Created by martin on 19.03.2017.
 */

/**
 * Interface of a translation unit in a translation messages file.
 */
export interface ITransUnit {

    readonly id: string;

    sourceContent(): string;

    /**
     * the translated value (containing all markup, depends on the concrete format used).
     */
    targetContent(): string;

    /**
     * the translated value, but all placeholders are replaced with {{n}} (starting at 0)
     * and all embedded html is replaced by direct html markup.
     */
    targetContentNormalized(): string;

    /**
     * State of the translation.
     * (new, final, ...)
     */
    targetState(): string;

    /**
     * The description set in the template as value of the i18n-attribute.
     * e.g. i18n="mydescription".
     */
    description(): string;

    /**
     * The meaning (intent) set in the template as value of the i18n-attribute.
     * This is the part in front of the | symbol.
     * e.g. i18n="meaning|mydescription".
     */
    meaning(): string;

    /**
     * the real xml element used for trans unit.
     * @return {CheerioElement}
     */
    asXmlElement(): CheerioElement;

    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     */
    useSourceAsTarget(isDefaultLang: boolean, copyContent: boolean);

    /**
     * Translate trans unit.
     * (very simple, just for tests)
     * @param translation the translated string
     */
    translate(translation: string);
}
