[![Build Status][travis-badge]][travis-badge-url]
[![Dependency Status][david-badge]][david-badge-url]
[![devDependency Status][david-dev-badge]][david-dev-badge-url]
[![npm][npm-badge]][npm-badge-url]

@ngx-i18nsupport/tooling
=========

Schematics for adding @ngx-i18nsupport to your projects.

# Usage
## Add the tooling to your workspace (ng-add)

After creation of an angular workspace (via `ng new ..`) you can add this package to your workspace

`ng add @ngx-i18nsupport/tooling`

This adds the required packages and configures everything for the default language `en`, format XLIFF 1.2, no configured other languages.

There are some command line parameters available:
- `--project` add the tooling to a specific project in your workspace
- `--languages` the languages to be used (a comma separated list like `en,de,ru`)
- `--i18nLocale` set the locale used in your templates (default is first language or `en`)
- `--i18nFormat` the format to be used (`xlf`, `xlf2` or `xmb`)

For example you can use the following

`ng add @ngx-i18nsupport/tooling --project=myproject --i18nFormat=xlf2 --languages=en,de,ru`

## Add a new language (addLanguage)
In an already configured project you can add one or more additional languages by using

`ng generate @ngx-i18nsupport/tooling:addLanguage de`

There are some command line parameters available:
- `--project` a specific project in your workspace
- `--language` the language to be added
- `--languages` the languages to be added (a comma separated list like `de,ru`).

Only `--languages` or `--language` can be used, not both.

For example you can use the following

`ng generate @ngx-i18nsupport/tooling:addLanguage --project=myproject --languages=de,ru`

This will add `de` and `ru` as additional languages.

[travis-badge]: https://travis-ci.org/martinroob/ngx-i18nsupport.svg?branch=master
[travis-badge-url]: https://travis-ci.org/martinroob/ngx-i18nsupport
[david-badge]: https://david-dm.org/martinroob/ngx-i18nsupport.svg
[david-badge-url]: https://david-dm.org/martinroob/ngx-i18nsupport
[david-dev-badge]: https://david-dm.org/martinroob/ngx-i18nsupport/dev-status.svg
[david-dev-badge-url]: https://david-dm.org/martinroob/ngx-i18nsupport?type=dev
[npm-badge]: https://badge.fury.io/js/%40ngx-i18nsupport%2Ftooling.svg
[npm-badge-url]: https://badge.fury.io/js/%40ngx-i18nsupport%2Ftooling
