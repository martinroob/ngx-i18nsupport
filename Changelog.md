<a name="0.17.1"></a>
# [0.17.1](https://github.com/martinroob/ngx-i18nsupport/compare/v0.17.0...v0.17.1) (2018-09-21)

### Bug fixes
* **xmb/xtb format** Optionally do not merge source value into new translation unit value (leave blank).
([#103](https://github.com/martinroob/ngx-i18nsupport/issues/103)).
Flag `useSourceAsTarget` now works correct for xmb/xtb format.

<a name="0.17.0"></a>
# [0.17.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.16.4...v0.17.0) (2018-08-07)

### Bug fixes
* **xliffmerge** wrong empty lines were added when using beautifier.
([#96](https://github.com/martinroob/ngx-i18nsupport/issues/96)).
The beautifier is totally changed, so this might result in slightly changed outputs.


### Features
* **xliffmerge** Preserve order for newly added units.
([#96](https://github.com/martinroob/ngx-i18nsupport/issues/96)).
When merging new units from master to translation file the new units are now inserted at the same position as they were in the master.


<a name="0.16.3"></a>
# [0.16.3](https://github.com/martinroob/ngx-i18nsupport/compare/v0.16.3...v0.16.2) (2018-07-12)

### Bug fixes
* **autotranslate** HTML encoding is re-encoded - results in HTML encoding being output as text.
([#94](https://github.com/martinroob/ngx-i18nsupport/issues/94)).
Issue is caused due to the fact that google translate returns `&#36;` instead of apostrophe.
The lib expects "normal utf8 strings" as translation.
Now the returned translation will be decoded using library [he](https://github.com/mathiasbynens/he).

<a name="0.16.2"></a>
# [0.16.2](https://github.com/martinroob/ngx-i18nsupport/compare/v0.16.2...v0.16.1) (2018-06-01)

### Bug fixes
* **xliff 1.2 format:** Invalid order of target element in xlf12.
([#90](https://github.com/martinroob/ngx-i18nsupport/issues/90))

<a name="0.16.1"></a>
# [0.16.1](https://github.com/martinroob/ngx-i18nsupport/compare/v0.16.1...v0.16.0) (2018-05-25)

### Bug fixes
* **xliffmerge:** New configuration flag `beautifyOutput` now working. When set to `true`  now [pretty-data](https://github.com/vkiryukhin/pretty-data) (the library beyond pretty-xml) will be used to format the output.
([#64](https://github.com/martinroob/ngx-i18nsupport/issues/64))
([#88](https://github.com/martinroob/ngx-i18nsupport/issues/88))

<a name="0.16.0"></a>
# [0.16.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.16.0...v0.15.0) (2018-05-01)

### Bug fixes
* **xliffmerge** xliffmerge fails when ICU message contains interpolation and/or tags ([#83](https://github.com/martinroob/ngx-i18nsupport/issues/83)).

* **xliffmerge** Placeholder index is invalid ([#84](https://github.com/martinroob/ngx-i18nsupport/issues/84)).

### Features
* **xliffmerge:** There is a new configuration flag `beautifyOutput`. When set to `true`  now [pretty-data](https://github.com/vkiryukhin/pretty-data) (the library beyond pretty-xml) will be used to format the output. ([#64](https://github.com/martinroob/ngx-i18nsupport/issues/64))

<a name="0.15.0"></a>
# [0.15.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.15.0...v0.14.0) (2018-04-22)

### Bug fixes
* **xliffmerge** Merge for source language isn't updating ([#81](https://github.com/martinroob/ngx-i18nsupport/issues/81)).
This happened when there was an explicitly set ID and the original text was changed.

<a name="0.14.0"></a>
# [0.14.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.14.0...v0.13.0) (2018-04-16)

### Features

* **xliffmerge:** Allow configuration to be part of package.json ([#72](https://github.com/martinroob/ngx-i18nsupport/issues/72)).
You can now put your configuration to the `package.json` instead of having it in a separate file.
There is also a JSON schema file available to check the configuration values 
(`node_modules/ngx-i18nsupport/dist/xliffmerge/configuration-schema.json`,
actual version available under [configuration-schema.json](https://github.com/martinroob/ngx-i18nsupport/blob/master/src/xliffmerge/configuration-schema.json)).

### Bug fixes
* **autotranslate** Error `Auto translation from "en" to "de" failed: "Invalid request: Required Text"` is fixed ([#78](https://github.com/martinroob/ngx-i18nsupport/issues/78)).
This error occured when autotranslation was enable and there were no units to translate (because they are already translated).

<a name="0.13.0"></a>
# [0.13.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.13.0...v0.12.0) (2018-03-19)

### Features

* **xliffmerge:** Added ability to change i18n basename to something other then 'messages' ([#74](https://github.com/martinroob/ngx-i18nsupport/issues/74)).
There is a new option `i18nBaseFile`.
This was a contribution of [rwlogel](https://github.com/rwlogel).

<a name="0.12.0"></a>
# [0.12.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.12.0...v0.11.1) (2018-02-23)

### Features

* **xliffmerge:** Added support to add a prefix to translated target languages.
<br>There are 2 new options `targetPraefix` and `targetSuffix` used for copied untranslated units ([#70](https://github.com/martinroob/ngx-i18nsupport/issues/70)).

<a name="0.11.1"></a>
# [0.11.1](https://github.com/martinroob/ngx-i18nsupport/compare/v0.11.1...v0.11.0) (2018-02-16)

### Bug Fixes

* **xliffmerge:** fixed bug with "`allowIdChange: true`", it changes "new" to "translated" ([#68](https://github.com/martinroob/ngx-i18nsupport/issues/68)).

<a name="0.11.0"></a>
# [0.11.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.11.0...v0.10.0) (2018-02-02)

### Features

* **xliffmerge:** Added new option "`allowIdChange`" ([#65](https://github.com/martinroob/ngx-i18nsupport/issues/65)).
When there is only a small change in the original message text, e.g. a trailing white space, 
the Angular extraction tool will change the ID of the unit.
This means that the translations of the unit are lost.
When you activate this flag, `xliffmerge` will check for units with only white space changes and merge them correctly.
This was a contribution of [Szpadel](https://github.com/Szpadel).

### Bug Fixes

* **xliffmerge:** fixed xliffmerge removes trailing line break when there is an update ([#66](https://github.com/martinroob/ngx-i18nsupport/issues/66)).

<a name="0.10.0"></a>
# [0.10.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.10.0...v0.9.0) (2018-01-12)

### Features

* **ngx-translate:** You can now specify in detail what entries are exported to ngx-translate, you can supress exporting all entries with explicitely set IDs ([#62](https://github.com/martinroob/ngx-i18nsupport/issues/62)).
For details how to use it have a look at the Wiki Page [ngx translate usage](https://github.com/martinroob/ngx-i18nsupport/wiki/ngx-translate-usage).

* **xliffmerge:** Technology update to typescript 2.6 and latest versions of all used dependencies.

<a name="0.9.0"></a>
# [0.9.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.9.0...v0.8.8) (2017-11-06)

### Features

* **xliffmerge:** support for 'en_US' language format (_ is now allowed in language codes) ([#59](https://github.com/martinroob/ngx-i18nsupport/issues/59)).
This was a contribution of [kennanseno](https://github.com/kennanseno).

### Bug Fixes

* **xliffmerge:** fixed travis build failure due to changed definition files of chalk library (upgraded chalk to 2.3)

<a name="0.8.8"></a>
# [0.8.8](https://github.com/martinroob/ngx-i18nsupport/compare/v0.8.8...v0.8.6) (2017-10-19)

### Bug Fixes

* **xliffmerge:** xliffmerge uses wrong state values for new XLIFF 2.0 segments ([#57](https://github.com/martinroob/ngx-i18nsupport/issues/57)).

<a name="0.8.6"></a>
# [0.8.6](https://github.com/martinroob/ngx-i18nsupport/compare/v0.8.5...v0.8.6) (2017-09-25)

### Bug Fixes

* **xliffmerge:** correction for setting boolean parameters (removeUnusedIds, supportNgxTranslate)([#55](https://github.com/martinroob/ngx-i18nsupport/pull/55)).
This was a contribution of [vhdirk](https://github.com/vhdirk).

<a name="0.8.5"></a>
# [0.8.5](https://github.com/martinroob/ngx-i18nsupport/compare/v0.8.4...v0.8.5) (2017-08-29)

### Bug Fixes

* **autotranslate:** Autotranslate parameter is checked against first given language instead of default language ([#52](https://github.com/martinroob/ngx-i18nsupport/issues/52)).

<a name="0.8.4"></a>
# [0.8.4](https://github.com/martinroob/ngx-i18nsupport/compare/v0.8.3...v0.8.4) (2017-08-22)

### Bug Fixes

* **xliffmerge:** When autotranslate is disabled, there should be no warning "Auto translation from..." ([#49](https://github.com/martinroob/ngx-i18nsupport/issues/49)).

<a name="0.8.3"></a>
# [0.8.3](https://github.com/martinroob/ngx-i18nsupport/compare/v0.8.0...v0.8.3) (2017-08-18)

### Features

* **xliffmerge:** Merge source content if id is explicitly set and source is changed. 
([#46](https://github.com/martinroob/ngx-i18nsupport/issues/46)).

### Bug Fixes

* **xliffmerge:** handle ICU equiv in XLIFF 2.0 ([#47](https://github.com/martinroob/ngx-i18nsupport/issues/47)).

<a name="0.8.0"></a>
# [0.8.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.7.4...v0.8.0) (2017-08-11)

### Features

* **xliffmerge:** merging updated description and meaning
([#44](https://github.com/martinroob/ngx-i18nsupport/issues/44)).

<a name="0.7.4"></a>
# [0.7.4](https://github.com/martinroob/ngx-i18nsupport/compare/v0.7.3...v0.7.4) (2017-07-09)

### Bug Fixes

* **xliffmerge:** runtime error map is not a function when using autotranslate v0.7.2
([#40](https://github.com/martinroob/ngx-i18nsupport/issues/40)).
This is the next serious bug.
Second try to fix it.
Do not use v0.7.3 too.

<a name="0.7.3"></a>
# [0.7.3](https://github.com/martinroob/ngx-i18nsupport/compare/v0.7.2...v0.7.3) (2017-07-09)

### Bug Fixes

* **xliffmerge:** runtime error map is not a function when using autotranslate v0.7.2
([#40](https://github.com/martinroob/ngx-i18nsupport/issues/40)).
This is the next serious bug.
Do not use v0.7.2 too.

<a name="0.7.2"></a>
# [0.7.2](https://github.com/martinroob/ngx-i18nsupport/compare/v0.7.1...v0.7.2) (2017-07-09)

### Bug Fixes

* **xliffmerge:** run with version 0.7.1 breaks with an exception:
([#38](https://github.com/martinroob/ngx-i18nsupport/issues/38)).
This is a serious bug.
Do not use v0.7.1.

<a name="0.7.1"></a>
# [0.7.1](https://github.com/martinroob/ngx-i18nsupport/compare/v0.7.0...v0.7.1) (2017-07-07)

### Bug Fixes

* **build process:** Travis CI build green again (broken due to problem with Typescript 2.4.1: [#17630 @types/request](https://github.com/DefinitelyTyped/DefinitelyTyped/issues/17630).
Temporary fixed by pinning Typescript to 2.3.1.

### Features

* **autotranslate:** API Key can now be read from file instead of setting it explicitly. Key is not shown in debug output any more. ([#35](https://github.com/martinroob/ngx-i18nsupport/issues/35)).
 For details how to use it have a look at the Wiki Page [xliffmerge-autotranslate-feature](https://github.com/martinroob/ngx-i18nsupport/wiki/xliffmerge-autotranslate-feature).

<a name="0.7.0"></a>
# [0.7.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.6.2...v0.7.0) (2017-07-07)

### Features

* **autotranslate:** Added google translate support ([#35](https://github.com/martinroob/ngx-i18nsupport/issues/35)).
You can now use the [Google Cloud Translation API](https://cloud.google.com/translate/) to automatically translate new units to different target languages.
 For details how to use it have a look at the Wiki Page [xliffmerge-autotranslate-feature](https://github.com/martinroob/ngx-i18nsupport/wiki/xliffmerge-autotranslate-feature).

<a name="0.6.2"></a>
# [0.6.2](https://github.com/martinroob/ngx-i18nsupport/compare/v0.6.1...v0.6.2) (2017-06-02)

### Bug Fixes

* **xliffmerge:** Improve error messages ([#31](https://github.com/martinroob/ngx-i18nsupport/issues/31)).

* **xliffmerge:** problems with parsing messages that contain same tag multiple times ([lib #26](https://github.com/martinroob/ngx-i18nsupport-lib/issues/26)).

<a name="0.6.1"></a>
# [0.6.1](https://github.com/martinroob/ngx-i18nsupport/compare/v0.6.0...v0.6.1) (2017-05-26)

### Bug Fixes

* **xliffmerge:** xlifffmerge emits wrong message 'WARNING: transferred 28 source references from master to "de" for format xtb' ([#28](https://github.com/martinroob/ngx-i18nsupport/issues/28)).

<a name="0.6.0"></a>
# [0.6.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.5.0...v0.6.0) (2017-05-25)

### Bug Fixes

* **xliffmerge:** Format xmb should create xtb files for translations. ([#25](https://github.com/martinroob/ngx-i18nsupport/issues/25)).
There is no migration tooling, so if you do have translated xmb files, you must manually correct them to xtb. 

* **xliffmerge:** File suffix change. For format XLIFF 2.0 the suffix of the generated files is `xlf` now (was `xlf2`, which is not correct).
If you already have such files, you should rename them before running xliffmerge. Otherwise they will not be merged.

### Features

* **xliffmerge:** xliffmerge does not merge the new source references. ([#24](https://github.com/martinroob/ngx-i18nsupport/issues/24))

* **xliffmerge:** For format XLIFF 2.0 source references are supported now.

<a name="0.5.0"></a>
# [0.5.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.4.0...v0.5.0) (2017-05-05)

### Features

* **xliffmerge:** added XLIFF 2.0 support. ([#20](https://github.com/martinroob/ngx-i18nsupport/issues/20))

<a name="0.4.0"></a>
# [0.4.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.3.1...v0.4.0) (2017-05-03)

### Bug Fixes

* **xliffmerge:** xliffmerge creates empty json files ([#18](https://github.com/martinroob/ngx-i18nsupport/issues/18))

### Features

* **xliffmerge:** create an API to access parsing functionality. ([#11](https://github.com/martinroob/ngx-i18nsupport/issues/11)). 
The API is in a separate npm package [ngx-i18nsupport-lib](https://github.com/martinroob/ngx-i18nsupport-lib).

* **xliffmerge:** use explicitly set IDs for ngx-translate data generation. ([#15](https://github.com/martinroob/ngx-i18nsupport/issues/15))
For detail have a look at the Wiki page [ngx translate usage](https://github.com/martinroob/ngx-i18nsupport/wiki/ngx-translate-usage).

* **xliffmerge:** Handle new source element introduced with Angular 4. ([#21](https://github.com/martinroob/ngx-i18nsupport/issues/21))

<a name="0.3.1"></a>
# [0.3.1](https://github.com/martinroob/ngx-i18nsupport/compare/v0.3.0...v0.3.1) (2017-04-25)

### Bug Fixes

* **xliffmerge:** compilation problem in WriterToString ([#19](https://github.com/martinroob/ngx-i18nsupport/issues/19))

<a name="0.3.0"></a>
# [0.3.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.2.3...v0.3.0) (2017-04-24)

### Features

* **xliffmerge:** Added useSourceAsTargetOption, allows empty translations if set to false.

<a name="0.2.1"></a>
# [0.2.1](https://github.com/martinroob/ngx-i18nsupport/compare/v0.2.0...v0.2.1) (2017-03-27)


### Bug Fixes

* **xliffmerge:** Wrong line endings in bin ([#12](https://github.com/martinroob/ngx-i18nsupport/issues/12))

<a name="0.2.0"></a>
# [0.2.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.1.0...v0.2.0) (2017-03-17)


### Bug Fixes

* **xliffmerge:** Wrong version displayed ([#2](https://github.com/martinroob/ngx-i18nsupport/issues/2)) (second try to fix it)
* **xliffmerge:** Code coverage display is too low ([#8](https://github.com/martinroob/ngx-i18nsupport/issues/8))

### Features

* **xliffmerge:** Added support for placeholders, linebreaks, embedded html ([#9](https://github.com/martinroob/ngx-i18nsupport/issues/9))
* **xliffmerge:** Added support for ngx-translate ([#5](https://github.com/martinroob/ngx-i18nsupport/issues/5))
* **documentation:** added ngx-translate integration page (as part of the wiki) ([#5](https://github.com/martinroob/ngx-i18nsupport/issues/5))

<a name="0.1.0"></a>
# [0.1.0](https://github.com/martinroob/ngx-i18nsupport/compare/v0.0.4...v0.1.0) (2017-03-10)


### Bug Fixes

* **xliffmerge:** Wrong version displayed ([#2](https://github.com/martinroob/ngx-i18nsupport/issues/2))

### Features

* **xliffmerge:** Added support for xmb format ([#4](https://github.com/martinroob/ngx-i18nsupport/issues/4))
* **xliffmerge:** languages can now be specified in the profile ([#6](https://github.com/martinroob/ngx-i18nsupport/issues/6))
* **documentation:** added Usage Tutorial (as part of the wiki) ([#3](https://github.com/martinroob/ngx-i18nsupport/issues/3))
* **documentation:** added this Changelog.md

<a name="0.0.4"></a>
# [0.0.4](https://github.com/martinroob/ngx-i18nsupport/compare/v0.0.3...v0.0.4) (2017-02-28)


### Bug Fixes

* **xliffmerge:** missing .npmignore prevents starting ([#1](https://github.com/martinroob/ngx-i18nsupport/issues/1))

<a name="0.0.3"></a>
# 0.0.3 (2017-02-24)

Initial version
