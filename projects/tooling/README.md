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
- `--i18n-locale` set the locale used in your templates (default is first language or `en`)
- `--i18n-format` the format to be used (`xlf`, `xlf2` or `xmb`)

For example you can use the following

`ng add @ngx-i18nsupport/tooling --project=myproject --i18n-format=xlf2 --languages=en,de,ru`

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
