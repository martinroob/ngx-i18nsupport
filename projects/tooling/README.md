[![Build Status][travis-badge]][travis-badge-url]
[![Dependency Status][david-badge]][david-badge-url]
[![devDependency Status][david-dev-badge]][david-dev-badge-url]
[![npm][npm-badge]][npm-badge-url]

@ngx-i18nsupport/tooling
=========

Schematics and architect builders for adding @ngx-i18nsupport to your projects.

# Installation
After creation of an angular workspace (via `ng new ..`) you can add this package to your workspace using

`ng add @ngx-i18nsupport/tooling`

This will add the needed rpm packages and will configure usage of the tooling too.
For further details have a look at the following chapter describing the schematics.

# Schematics Usage
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

# Builders
Beginning with version 1.1.0 the tooling package contains an Angular Architect Builder (see for example the nice overview [Builders demystified](https://medium.com/dailyjs/angular-cli-6-under-the-hood-builders-demystified-f0690ebcf01)) that can replace the xliffmerge command line tool.

Old style calling `xliffmerge` after running `ng xi18n` via script in `package.json`:
```
{// DEPRECATED USAGE in package.json
..  "scripts": {
    [...]
    "extract-i18n": "ng xi18n <project> --output-path i18n --i18n-locale de && xliffmerge --profile xliffmerge.json de en"
  }
..
}
```

New style using the builder:
```
{// package.json
..  "scripts": {
    [...]
    "extract-i18n": "ng xi18n <project> --output-path src/i18n --i18n-locale de && ng run <project>>:xliffmerge"
  }
..
}
```

The builder and its configuration is configured in the `angular.json` workspace file:
```
{// angular.json
  "projects": {
    "<project>": {
      "architect": {
        ..
        "xliffmerge": {
           "builder": "@ngx-i18nsupport/tooling:xliffmerge",
           "options": {
             // profile used by xliffmerge
             "profile": "xliffmerge.json"
           }
        },
```

As an alternative to referencing the profile you can directly specify all allowed options of xliffmerge:
```
{// angular.json
  "projects": {
    "<project>": {
      "architect": {
        ..
        "xliffmerge": {
           "builder": "@ngx-i18nsupport/tooling:xliffmerge",
           "options": {
             // direct options
             "xliffmergeOptions": {
               "srcDir": "src/i18n",
               "languages": ["en", "de"],
                ..
             }
           }
        },
```

# ng-update
Beginning with version 1.1.0 the tooling package contains an `ng-update`-Schematics.
You can update from version 1.0 to 1.1 using `ng update`

``ng update @ngx-i18nsupport/tooling``

This will update the old xliffmerge commandline usage with the new builder.


[travis-badge]: https://travis-ci.org/martinroob/ngx-i18nsupport.svg?branch=master
[travis-badge-url]: https://travis-ci.org/martinroob/ngx-i18nsupport
[david-badge]: https://david-dm.org/martinroob/ngx-i18nsupport.svg
[david-badge-url]: https://david-dm.org/martinroob/ngx-i18nsupport
[david-dev-badge]: https://david-dm.org/martinroob/ngx-i18nsupport/dev-status.svg
[david-dev-badge-url]: https://david-dm.org/martinroob/ngx-i18nsupport?type=dev
[npm-badge]: https://badge.fury.io/js/%40ngx-i18nsupport%2Ftooling.svg
[npm-badge-url]: https://badge.fury.io/js/%40ngx-i18nsupport%2Ftooling
