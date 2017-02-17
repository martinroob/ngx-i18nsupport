ngx-i18nsupport
=========

Some tooling to be used for Angular 2 i18n workflows.

Angular has a specific way of dealing with internationalization (i18n).
It is described in the official dcoumentation [Cookbook Internationalization](https://angular.io/docs/ts/latest/cookbook/i18n.html).

Said in one sentence, 
* markup your strings to translate in your templates with an attribute **i18n**
* run a tool (**ng-xi18n**) to extract the strings in an XML Format called XLIFF
* translate the extracted file for every language you support
* run the ng compiler to generate a special version of your app for the different languages

This excellent Blog by Phillippe Martin [Deploying an i18n Angular app with angular-cli](https://medium.com/@feloy/deploying-an-i18n-angular-app-with-angular-cli-fc788f17e358) describes it in detail.

But there are some maior gaps in the workflow.
Thats where this tool comes into play.

## Installation

  `npm install ngx-i18nsupport`

## Usage

xliffmerge [-p|--profile <json-Configurationfile] [language*]

## Tests

  `npm test`

## Contributing

I did not really think about contributions, because it is just a small experimental project.

But if you are interesting, send me an email, so that we can discuss it.

## References

* [Roland Oldengarm: Angular 2: Automated i18n workflow using gulp](http://rolandoldengarm.com/index.php/2016/10/17/angular-2-automated-i18n-workflow-using-gulp/)
