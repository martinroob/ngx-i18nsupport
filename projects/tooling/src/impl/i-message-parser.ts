import {INormalizedMessage} from '../api/i-normalized-message';
/**
 * Created by roobm on 16.05.2017.
 * Interface for message parser.
 */

export interface IMessageParser {

    /**
     * Parse XML to ParsedMessage.
     * @param xmlElement the xml representation
     * @param sourceMessage optional original message that will be translated by normalized new one
     * Throws an error if normalized xml is not well formed.
     */
    createNormalizedMessageFromXML(xmlElement: Element, sourceMessage: INormalizedMessage): INormalizedMessage;

    /**
     * Parse XML string to ParsedMessage.
     * @param xmlString the xml representation without root element, e.g. this is <ph x></ph> an example.
     * @param sourceMessage optional original message that will be translated by normalized new one
     * Throws an error if normalized xml is not well formed.
     */
    createNormalizedMessageFromXMLString(xmlString: string, sourceMessage: INormalizedMessage): INormalizedMessage;

    /**
     * Parse normalized string to ParsedMessage.
     * @param normalizedString normalized string
     * @param sourceMessage optional original message that will be translated by normalized new one
     * @return a new parsed message.
     * Throws an error if normalized string is not well formed.
     */
    parseNormalizedString(normalizedString: string, sourceMessage: INormalizedMessage): INormalizedMessage;

    /**
     * Parse a string, that is an ICU message, to ParsedMessage.
     * @param icuMessageString the message, like '{x, plural, =0 {nothing} =1 {one} other {many}}'.
     * @param sourceMessage optional original message that will be translated by normalized new one
     * @return a new parsed message.
     * Throws an error if icuMessageString has not the correct syntax.
     */
    parseICUMessage(icuMessageString: string, sourceMessage: INormalizedMessage): INormalizedMessage;
}