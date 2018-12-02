[![Build Status][travis-badge]][travis-badge-url]
[![Dependency Status][david-badge]][david-badge-url]
[![devDependency Status][david-dev-badge]][david-dev-badge-url]
[![Code coverage][coverage-badge]][coverage-badge-url]

@ngx-i18nsupport
=========

**Some tooling to be used for Angular i18n workflows.**

>This page contains just a very short description about the installation process and usage.
For details have a look at the [Tutorial for using xliffmerge](https://github.com/martinroob/ngx-i18nsupport/wiki/Tutorial-for-using-xliffmerge-with-angular-cli) contained in the Wiki pages.

# Packages

This is a **monorepo** containing projects
* [tooling](projects/tooling) Schematics for adding @ngx-i18nsupport to your projects
* [xliffmerge](projects/xliffmerge) The command line tool that does all the magic
* [ngx-i18nsupport-lib](projects/ngx-i18nsupport-lib) A library to support working with xliff 1.2, xliff 2.0 and xmb/xtb file
* [tiny-translator](projects/tiny-translator) An application to translate xliff 1.2, xliff 2.0 and xmb/xtb file to other languages

| Project | Package | Version |
|---|---|---|
**[tooling](projects/tooling)** | [`@ngx-i18nsupport/tooling`](https://npmjs.com/package/@ngx-i18nsupport/tooling) | [![npm][npm-badge-tooling]][npm-badge-url-tooling]
**[xliffmerge](projects/xliffmerge)** | [`@ngx-i18nsupport/xliffmerge`](https://npmjs.com/package/@ngx-i18nsupport/xliffmerge) | [![npm][npm-badge-xliffmerge]][npm-badge-url-xliffmerge]
**[ngx-i18nsupport-lib](projects/ngx-i18nsupport-lib)** | [`@ngx-i18nsupport/ngx-i18nsupport-lib`](https://npmjs.com/package/@ngx-i18nsupport/ngx-i18nsupport-lib) | [![npm][npm-badge-ngx-i18nsupport-lib]][npm-badge-url-ngx-i18nsupport-lib]
**[tiny-translator](projects/tiny-translator)** | [`https://martinroob.github.io/tiny-translator`](https://martinroob.github.io/tiny-translator) | v0.14

[travis-badge]: https://travis-ci.org/martinroob/ngx-i18nsupport.svg?branch=master
[travis-badge-url]: https://travis-ci.org/martinroob/ngx-i18nsupport
[david-badge]: https://david-dm.org/martinroob/ngx-i18nsupport.svg
[david-badge-url]: https://david-dm.org/martinroob/ngx-i18nsupport
[david-dev-badge]: https://david-dm.org/martinroob/ngx-i18nsupport/dev-status.svg
[david-dev-badge-url]: https://david-dm.org/martinroob/ngx-i18nsupport?type=dev
[npm-badge-tooling]: https://badge.fury.io/js/%40ngx-i18nsupport%2Ftooling.svg
[npm-badge-url-tooling]: https://badge.fury.io/js/%40ngx-i18nsupport%2Ftooling
[npm-badge-xliffmerge]: https://badge.fury.io/js/%40ngx-i18nsupport%2Fngx-i18nsupport.svg
[npm-badge-url-xliffmerge]: https://badge.fury.io/js/%40ngx-i18nsupport%2Fngx-i18nsupport
[npm-badge-ngx-i18nsupport-lib]: https://badge.fury.io/js/%40ngx-i18nsupport%2Fngx-i18nsupport-lib.svg
[npm-badge-url-ngx-i18nsupport-lib]: https://badge.fury.io/js/%40ngx-i18nsupport%2Fngx-i18nsupport-lib
[coverage-badge]: https://coveralls.io/repos/github/martinroob/ngx-i18nsupport/badge.svg?branch=master
[coverage-badge-url]: https://coveralls.io/github/martinroob/ngx-i18nsupport
