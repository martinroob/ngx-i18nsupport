[![Build Status][travis-badge]][travis-badge-url]
[![Dependency Status][david-badge]][david-badge-url]
[![devDependency Status][david-dev-badge]][david-dev-badge-url]
[![npm][npm-badge]][npm-badge-url]

ngx-i18nsupport-lib
=========

A Typescript library to work with Angular generated i18n files (XLIFF Version 1.2 and 2.0, XMB)

## Table of Contents

* [Introduction](#introduction)
* [Installation](#installation)
* [Usage](#usage)
* [Tests](#tests)
* [Contributing](#contributing)
* [References](#references)

## Introduction

## Installation

  `npm install ngx-i18nsupport-lib --save-dev`
  
## Usage

### TranslationMessagesFileFactory
This class is the entry point of the library.
You can use `TranslationMessagesFileFactory` to load Angular generated message files.
The format of the files can be XLIFF 1.2, XLIFF 2.0 or XMB.

It returns a format independent abstraction of the file content, which is described in the interfade `ITranslationMessagesFile`

Example
```
// Usage of fromFileContent to read a file with a known format
let filename = ...;
let encoding = 'UTF-8';
let content = fs.readFileSync(filename, encoding);
let file: ITranslationMessagesFile
  = TranslationMessagesFileFactory.fromFileContent('xlf', content, filename, encoding);
console.log(Utils.format('Translation from %s to %s', 
    file.sourceLanguage(),
    file.targetLanguage()));
file.forEachTransUnit((tu: ITransUnit) => {
  console.log(tu.sourceContent());
});
```

You can also use `fromUnknownFormatFileContent` to read a file of any supported format.
The library will detect the correct file format:

```
...
let file: ITranslationMessagesFile
  = TranslationMessagesFileFactory.fromUnknownFormatFileContent(content, filename, encoding);

```
### ITranslationMessagesFile
A messages file.

For API details have a look at the interface.

### ITransUnit
A single translation contained in the messages file.

For API details have a look at the interface.

## Tests

  `npm test`
  
This will run a testsuite that checks all relevant aspects of the library.

## Contributing

I did not really think about contributions, because it is just a small experimental project.

But if you are interesting, send me an email, so that we can discuss it.

## References

* Angular Cookbook [Internationalization (i18n)](https://angular.io/docs/ts/latest/cookbook/i18n.html)
* [XLIFF Spec](http://docs.oasis-open.org/xliff/xliff-core/xliff-core.html)

[travis-badge]: https://travis-ci.org/martinroob/ngx-i18nsupport.svg?branch=master
[travis-badge-url]: https://travis-ci.org/martinroob/ngx-i18nsupport
[david-badge]: https://david-dm.org/martinroob/ngx-i18nsupport.svg
[david-badge-url]: https://david-dm.org/martinroob/ngx-i18nsupport
[david-dev-badge]: https://david-dm.org/martinroob/ngx-i18nsupport/dev-status.svg
[david-dev-badge-url]: https://david-dm.org/martinroob/ngx-i18nsupport?type=dev
[npm-badge]: https://badge.fury.io/js/%40ngx-i18nsupport%2Fngx-i18nsupport-lib.svg
[npm-badge-url]: https://badge.fury.io/js/%40ngx-i18nsupport%2Fngx-i18nsupport-lib
