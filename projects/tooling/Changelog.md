<a name="1.1.1"></a>
# 1.1.1 (2019-01-05)

### Bug fixes
* **tooling** output-path in generated extract script is wrong.
([#118](https://github.com/martinroob/ngx-i18nsupport/issues/118)).

* **tooling** There should be different extract-scripts for different projects in one workspace.
([#119](https://github.com/martinroob/ngx-i18nsupport/issues/119)).

<a name="1.1.0"></a>
# 1.1.0 (2018-12-29)

### Features

* **tooling** Upgrade to Angular 7 including usage of `x-prompt` for schematics.

* **builders** New Angular Architect Builder to run xliffmerge. ([#107](https://github.com/martinroob/ngx-i18nsupport/issues/107))

* **ng-update** New schematic to update from version 1.0 to 1.1 using `ng update @ngx-i18nsupport/tooling`

<a name="1.0.1"></a>
# 1.0.1 (2018-11-09)

### Bug fixes
* **tooling** schematics option `--i18n-format` does not work when using `ng-add`.
([#110](https://github.com/martinroob/ngx-i18nsupport/issues/110)). Options is now renamed to `--i18nFormat`

<a name="1.0.0"></a>
# 1.0.0 (2018-10-28)

This is the first version of tooling.

### Features
* **tooling** schematics to add ngx-i18nsupport to projects
