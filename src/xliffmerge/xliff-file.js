"use strict";
var cheerio = require("cheerio");
var file_util_1 = require("../common/file-util");
var util_1 = require("util");
var xml_reader_1 = require("./xml-reader");
/**
 * Created by martin on 23.02.2017.
 * Ab xliff file read from a source file.
 * Defines some relevant get and set method for reading and modifying such a file.
 */
/**
 * Read-Options for cheerio, enable xml mode.
 * @type {{xmlMode: boolean}}
 */
var CheerioOptions = {
    xmlMode: true,
    decodeEntities: false,
};
var TransUnit = (function () {
    function TransUnit(_transUnit, _id) {
        this._transUnit = _transUnit;
        this._id = _id;
    }
    Object.defineProperty(TransUnit.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    TransUnit.prototype.sourceContent = function () {
        return cheerio('source', this._transUnit).html();
    };
    TransUnit.prototype.targetContent = function () {
        return cheerio('target', this._transUnit).html();
    };
    TransUnit.prototype.targetState = function () {
        return cheerio('target', this._transUnit).attr('state');
    };
    /**
     * the real xml element used for trans unit.
     * Here it is a <trans-unit> element defined in XLIFF Spec.
     * @return {CheerioElement}
     */
    TransUnit.prototype.asXmlElement = function () {
        return this._transUnit;
    };
    /**
     * Translate trans unit.
     * (very simple, just for tests)
     * @param translation the translated string
     */
    TransUnit.prototype.translate = function (translation) {
        var target = cheerio('target', this._transUnit);
        if (!target) {
            var source = cheerio('source', this._transUnit);
            source.parent().append('<target/>');
            target = cheerio('target', source.parent());
        }
        target.html(translation);
        target.attr('state', 'final');
    };
    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     */
    TransUnit.prototype.useSourceAsTarget = function (isDefaultLang) {
        var source = cheerio('source', this._transUnit);
        var target = cheerio('target', this._transUnit);
        if (!target) {
            source.parent().append('<target/>');
            target = cheerio('target', source.parent());
        }
        target.html(source.html());
        if (isDefaultLang) {
            target.attr('state', 'final');
        }
        else {
            target.attr('state', 'new');
        }
    };
    return TransUnit;
}());
var XliffFile = (function () {
    function XliffFile() {
        this._warnings = [];
        this._numberOfTransUnitsWithMissingId = 0;
    }
    /**
     * Read an xlf-File.
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @return {XliffFile}
     */
    XliffFile.fromFile = function (path, encoding) {
        var xlf = new XliffFile();
        var xmlContent = xml_reader_1.XmlReader.readXmlFileContent(path, encoding);
        xlf.initializeFromContent(xmlContent.content, path, xmlContent.encoding);
        return xlf;
    };
    XliffFile.prototype.initializeFromContent = function (xmlString, path, encoding) {
        this.filename = path;
        this.encoding = encoding;
        this.xliffContent = cheerio.load(xmlString, CheerioOptions);
        return this;
    };
    XliffFile.prototype.forEachTransUnit = function (callback) {
        this.initializeTransUnits();
        this.transUnits.forEach(function (tu) { return callback(tu); });
    };
    XliffFile.prototype.warnings = function () {
        this.initializeTransUnits();
        return this._warnings;
    };
    XliffFile.prototype.numberOfTransUnits = function () {
        this.initializeTransUnits();
        return this.transUnits.length;
    };
    XliffFile.prototype.numberOfTransUnitsWithMissingId = function () {
        this.initializeTransUnits();
        return this._numberOfTransUnitsWithMissingId;
    };
    /**
     * Get trans-unit with given id.
     * @param id
     * @return {Cheerio}
     */
    XliffFile.prototype.transUnitWithId = function (id) {
        this.initializeTransUnits();
        return this.transUnits.find(function (tu) { return tu.id == id; });
    };
    XliffFile.prototype.initializeTransUnits = function () {
        var _this = this;
        if (util_1.isNullOrUndefined(this.transUnits)) {
            this.transUnits = [];
            var transUnitsInFile = this.xliffContent('trans-unit');
            transUnitsInFile.each(function (index, transunit) {
                var id = cheerio(transunit).attr('id');
                if (!id) {
                    _this._warnings.push(util_1.format('oops, trans-unit without "id" found in master, please check file %s', _this.filename));
                    _this._numberOfTransUnitsWithMissingId++;
                }
                _this.transUnits.push(new TransUnit(transunit, id));
            });
        }
    };
    /**
     * Get source language.
     * @return {string}
     */
    XliffFile.prototype.sourceLanguage = function () {
        return this.xliffContent('file').attr('source-language');
    };
    /**
     * Edit the source language.
     * @param language
     */
    XliffFile.prototype.setSourceLanguage = function (language) {
        this.xliffContent('file').attr('source-language', language);
    };
    /**
     * Get target language.
     * @return {string}
     */
    XliffFile.prototype.targetLanguage = function () {
        return this.xliffContent('file').attr('target-language');
    };
    /**
     * Edit the target language.
     * @param language
     */
    XliffFile.prototype.setTargetLanguage = function (language) {
        this.xliffContent('file').attr('target-language', language);
    };
    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     */
    XliffFile.prototype.useSourceAsTarget = function (transUnit, isDefaultLang) {
        transUnit.useSourceAsTarget(isDefaultLang);
    };
    /**
     * Translate a given trans unit.
     * (very simple, just for tests)
     * @param transUnit
     * @param translation the translated string
     */
    XliffFile.prototype.translate = function (transUnit, translation) {
        transUnit.translate(translation);
    };
    /**
     * Add a new trans-unit.
     * @param transUnit
     */
    XliffFile.prototype.addNewTransUnit = function (transUnit) {
        this.xliffContent('body').append(cheerio(transUnit.asXmlElement()));
        this.initializeTransUnits();
        this.transUnits.push(transUnit);
    };
    /**
     * Remove the trans-unit with the given id.
     * @param id
     */
    XliffFile.prototype.removeTransUnitWithId = function (id) {
        this.xliffContent('#' + id).remove();
        this.initializeTransUnits();
        this.transUnits = this.transUnits.filter(function (tu) { return tu.id != id; });
    };
    /**
     * Save edited content to file.
     */
    XliffFile.prototype.save = function () {
        file_util_1.FileUtil.replaceContent(this.filename, this.xliffContent.xml(), this.encoding);
    };
    return XliffFile;
}());
exports.XliffFile = XliffFile;
