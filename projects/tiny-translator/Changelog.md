<a name="0.16.0"></a>
# 0.16.0 (2019-05-31)

### Features
* **Application** upgraded to Angular 8
<a name="0.15.0"></a>
# 0.15.0 (2019-04-05)

### Features

* **Application** Tiny Translator now can directly import files from Github and write them back too. ([#129](https://github.com/martinroob/ngx-i18nsupport/issues/129)).

* **Application** Technology update to Angular 7.2, no functionality changes.

<a name="0.14.0"></a>
# 0.14.0 (2018-12-02)

### Bugfixes

* **Application** savAs was broken, so download did not work any more.([#51](https://github.com/martinroob/tiny-translator/issues/51))

<a name="0.13.0"></a>
# 0.13.0 (2018-11-26)

### Features

* **Application** Technology update to Angular 7, no functionality changes.

* **internal** Sources moved to monorepo [ngx-i18nsupport](https://github.com/martinroob/ngx-i18nsupport)

<a name="0.12.0"></a>
# [0.12.0](https://github.com/martinroob/tiny-translator/compare/v0.12.0...v0.11.0) (2017-12-08)

### Bugfixes

* **Application** deleted test code that was forgotten in v.11 and shows a snackbar "new version" at startup.

<a name="0.11.0"></a>
# [0.11.0](https://github.com/martinroob/tiny-translator/compare/v0.11.0...v0.10.0) (2017-12-08)

### Features

* **Application** (experimental) Introduce service worker to cache application for offline mode ([#47](https://github.com/martinroob/tiny-translator/issues/47)).
The Application can now be used offline (loaded from Browser cache then).

* **internal** replace deprecated Http by new Angular HttpClient  ([#46](https://github.com/martinroob/tiny-translator/issues/46)).

<a name="0.10.0"></a>
# [0.10.0](https://github.com/martinroob/tiny-translator/compare/v0.10.0...v0.9.0) (2017-11-24)

### Features

* **internal** Technology update to Angular 5.0 and Material RC 1 ([#44](https://github.com/martinroob/tiny-translator/issues/44)).

### Bugfixes

* **internal** fixed: Cannot find module 'rxjs/observable' ([#43](https://github.com/martinroob/tiny-translator/issues/43)).

<a name="0.9.0"></a>
# [0.9.0](https://github.com/martinroob/tiny-translator/compare/v0.9.0...v0.8.0) (2017-09-15)

### Features

* **GUI** Added keyboard shortcut Ctrl Enter for the next button. ([#40](https://github.com/martinroob/tiny-translator/issues/40)).
This was a nice contribution by [quanterion](https://github.com/quanterion).

<a name="0.8.0"></a>
# [0.8.0](https://github.com/martinroob/tiny-translator/compare/v0.8.0...v0.7.0) (2017-09-12)

### Bug Fixes

* **GUI** Google Translate Button should be disabled when there is no target language ([#37](https://github.com/martinroob/tiny-translator/issues/37)).

### Features

* **GUI** Added an undo button to translate-unit. ([#38](https://github.com/martinroob/tiny-translator/issues/38)).

* **GUI** Upgrade to material beta 10. ([#35](https://github.com/martinroob/tiny-translator/issues/35)).
 Upgrade to Angular CLI 1.3 too.
 
<a name="0.7.0"></a>
# [0.7.0](https://github.com/martinroob/tiny-translator/compare/v0.7.0...v0.6.0) (2017-08-25)

### Bug Fixes

* **GUI** Layout improvements ([#29](https://github.com/martinroob/tiny-translator/issues/29)).
The changes for supporting small phone size displays introduced some nasty effects on larger displays.
This should be fixed now.

### Features

* **GUI** Added a button for reviewers to mark translation as not ok. ([#31](https://github.com/martinroob/tiny-translator/issues/31)).

<a name="0.6.0"></a>
# [0.6.0](https://github.com/martinroob/tiny-translator/compare/v0.6.0...v0.5.0) (2017-08-18)

### Bug Fixes

* **XLIFF 2.0 format** handle ICU equiv in XLIFF 2.0 ([#27](https://github.com/martinroob/tiny-translator/issues/27)).

### Features

* **GUI** Support Phone Size Display ([#14](https://github.com/martinroob/tiny-translator/issues/14)).

<a name="0.5.0"></a>
# [0.5.0](https://github.com/martinroob/tiny-translator/compare/v0.5.0...v0.4.0) (2017-07-13)

### Bug Fixes

* **GUI** No flag shown for language with region code like `fr-google`. Now when region code is longer than 2 chars it cannot be a country, so the language will be used (`fr` in example) ([#23](https://github.com/martinroob/tiny-translator/issues/23)).

### Features

* **GUI** TinyTranslator now stores current project and current unit in local storage ([#25](https://github.com/martinroob/tiny-translator/issues/25)).

* **auto translation** Auto translation now shows a summary page after run. You can then filter for auto translated units. ([#24](https://github.com/martinroob/tiny-translator/issues/24)).

<a name="0.4.0"></a>
# [0.4.0](https://github.com/martinroob/tiny-translator/compare/v0.4.0...v0.3.0) (2017-07-10)

### Features

* **new languages** Added a *French* and a *Russian* version.
Both are created by the new Autotranslate Feature, so do not expect to see perfect translation here.
It is more like a design study. ([#21](https://github.com/martinroob/tiny-translator/issues/21)).

* **auto translation** Google translate support for ICU messages ([#20](https://github.com/martinroob/tiny-translator/issues/20)).

* **auto translation** Handle Google translate query limit ([#19](https://github.com/martinroob/tiny-translator/issues/19)).

* **auto translation** Google translate support should ignore region codes ([#18](https://github.com/martinroob/tiny-translator/issues/18)).

<a name="0.3.0"></a>
# [0.3.0](https://github.com/martinroob/tiny-translator/compare/v0.3.0...v0.2.0) (2017-07-01)

### Bug Fixes

* **all formats** ICU-References are not converted to native strings ([#11](ngx-i18nsupport-lib [#37](https://github.com/martinroob/ngx-i18nsupport-lib/issues/37)).

### Features

* **all formats** Added `Google Translate` support. You can now use Google Translate to let it automatically translate your texts. ([#15](https://github.com/martinroob/tiny-translator/issues/15)).

* **all formats** Ready to run versions are now available as `Docker images` on `dockerhub`. See details in the [README](https://github.com/martinroob/tiny-translator/README.md). ([#16](https://github.com/martinroob/tiny-translator/issues/16)).

<a name="0.2.0"></a>
# [0.2.0](https://github.com/martinroob/tiny-translator/compare/v0.1.0...v0.2.0) (2017-06-16)

### Bug Fixes

* **all formats** Linebreaks in normalized mode do not work ([#11](https://github.com/martinroob/tiny-translator/issues/11)).

* **all formats** upload button in project summary on translation page does not work ([#10](https://github.com/martinroob/tiny-translator/issues/10)).

### Features

* **all formats** Added Search functionality ([#9](https://github.com/martinroob/tiny-translator/issues/9)).

* **all formats** Added State Management ([#5](https://github.com/martinroob/tiny-translator/issues/5)).

* **all formats** Support for ICU message translation (ngx-i18nsupport-lib [#25](https://github.com/martinroob/ngx-i18nsupport-lib/issues/25)).

* **XLIFF 2.0** Support for sourcefile and linenumber in XLIFF 2.0 format ([#3](https://github.com/martinroob/tiny-translator/issues/3)).

<a name="0.1.0"></a>
# [0.1.0](https://github.com/martinroob/tiny-translator/compare/v0.0.1...v0.1.0) (2017-05-26)

### Bug Fixes

* **angular version:** tiny translator now is based on Angular version 4.1

### Features

* **XLIFF 2.0** Support for XLIFF 2.0 is added ([#3](https://github.com/martinroob/tiny-translator/issues/3)).

* **XMB/XTB** Support for XMB is added ([#7](https://github.com/martinroob/tiny-translator/issues/7)).

* **all formats** Sourcefile and linenumber of original texts are displayed ([#4](https://github.com/martinroob/tiny-translator/issues/4)).

* **all formats** All messages can now be edited format independent ([#2](https://github.com/martinroob/tiny-translator/issues/2)).


<a name="0.0.1"></a>
# 0.0.1 (2017-04-04)

Initial version

