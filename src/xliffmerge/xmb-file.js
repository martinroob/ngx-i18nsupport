"use strict";
var xml_reader_1 = require("./xml-reader");
var util_1 = require("util");
var file_util_1 = require("../common/file-util");
/**
 * Created by martin on 10.03.2017.
 * xmb-File access.
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
    function TransUnit(_msg, _id) {
        this._msg = _msg;
        this._id = _id;
    }
    Object.defineProperty(TransUnit.prototype, "_transUnitElement", {
        get: function () {
            return this._msg;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TransUnit.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    TransUnit.prototype.sourceContent = function () {
        return cheerio(this._msg).html();
    };
    TransUnit.prototype.targetContent = function () {
        // in fact, target and source are just the same in xmb
        return cheerio(this._msg).html();
    };
    TransUnit.prototype.targetState = function () {
        return null; // not supported in xmb
    };
    /**
     * the real xml element used for trans unit.
     * Here it is a <msg> element.
     * @return {CheerioElement}
     */
    TransUnit.prototype.asXmlElement = function () {
        return this._msg;
    };
    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     * In xmb there is nothing to do, because there is only a target, no source.
     */
    TransUnit.prototype.useSourceAsTarget = function (isDefaultLang) {
    };
    /**
     * Translate trans unit.
     * (very simple, just for tests)
     * @param translation the translated string
     */
    TransUnit.prototype.translate = function (translation) {
        var target = cheerio(this._msg);
        target.html(translation);
    };
    return TransUnit;
}());
var XmbFile = (function () {
    function XmbFile() {
        this._warnings = [];
        this._numberOfTransUnitsWithMissingId = 0;
    }
    /**
     * Read an xmb-File.
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @return {XmbFile}
     */
    XmbFile.fromFile = function (path, encoding) {
        var xmb = new XmbFile();
        var xmlContent = xml_reader_1.XmlReader.readXmlFileContent(path, encoding);
        xmb.initializeFromContent(xmlContent.content, path, xmlContent.encoding);
        return xmb;
    };
    XmbFile.prototype.initializeFromContent = function (xmlString, path, encoding) {
        this.filename = path;
        this.encoding = encoding;
        this.xmbContent = cheerio.load(xmlString, CheerioOptions);
        return this;
    };
    XmbFile.prototype.initializeTransUnits = function () {
        var _this = this;
        if (util_1.isNullOrUndefined(this.transUnits)) {
            this.transUnits = [];
            var transUnitsInFile = this.xmbContent('msg');
            transUnitsInFile.each(function (index, msg) {
                var id = cheerio(msg).attr('id');
                if (!id) {
                    _this._warnings.push(util_1.format('oops, msg without "id" found in master, please check file %s', _this.filename));
                    _this._numberOfTransUnitsWithMissingId++;
                }
                _this.transUnits.push(new TransUnit(msg, id));
            });
        }
    };
    XmbFile.prototype.forEachTransUnit = function (callback) {
        this.initializeTransUnits();
        this.transUnits.forEach(function (tu) { return callback(tu); });
    };
    /**
     * Get trans-unit with given id.
     * @param id
     * @return {Cheerio}
     */
    XmbFile.prototype.transUnitWithId = function (id) {
        this.initializeTransUnits();
        return this.transUnits.find(function (tu) { return tu.id == id; });
    };
    XmbFile.prototype.warnings = function () {
        this.initializeTransUnits();
        return this._warnings;
    };
    XmbFile.prototype.numberOfTransUnits = function () {
        this.initializeTransUnits();
        return this.transUnits.length;
    };
    XmbFile.prototype.numberOfTransUnitsWithMissingId = function () {
        this.initializeTransUnits();
        return this._numberOfTransUnitsWithMissingId;
    };
    /**
     * Get source language.
     * Unsupported in xmb.
     * @return {string}
     */
    XmbFile.prototype.sourceLanguage = function () {
        return null;
    };
    /**
     * Edit the source language.
     * Unsupported in xmb.
     * @param language
     */
    XmbFile.prototype.setSourceLanguage = function (language) {
        // do nothing, xmb has no notation for this.
    };
    /**
     * Get target language.
     * Unsupported in xmb.
     * @return {string}
     */
    XmbFile.prototype.targetLanguage = function () {
        return null;
    };
    /**
     * Edit the target language.
     * Unsupported in xmb.
     * @param language
     */
    XmbFile.prototype.setTargetLanguage = function (language) {
        // do nothing, xmb has no notation for this.
    };
    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     * In xmb there is nothing to do, because there is only a target, no source.
     */
    XmbFile.prototype.useSourceAsTarget = function (transUnit, isDefaultLang) {
        transUnit.useSourceAsTarget(isDefaultLang);
    };
    /**
     * Translate a given trans unit.
     * (very simple, just for tests)
     * @param transUnit
     * @param translation the translated string
     */
    XmbFile.prototype.translate = function (transUnit, translation) {
        transUnit.translate(translation);
    };
    /**
     * Add a new trans-unit.
     * @param transUnit
     */
    XmbFile.prototype.addNewTransUnit = function (transUnit) {
        this.xmbContent('messagebundle').append(cheerio(transUnit.asXmlElement()));
        this.initializeTransUnits();
        this.transUnits.push(transUnit);
    };
    /**
     * Remove the trans-unit with the given id.
     * @param id
     */
    XmbFile.prototype.removeTransUnitWithId = function (id) {
        this.xmbContent('#' + id).remove();
        this.initializeTransUnits();
        this.transUnits = this.transUnits.filter(function (tu) { return tu.id != id; });
    };
    /**
     * Save edited content to file.
     */
    XmbFile.prototype.save = function () {
        file_util_1.FileUtil.replaceContent(this.filename, this.xmbContent.xml(), this.encoding);
    };
    return XmbFile;
}());
exports.XmbFile = XmbFile;
