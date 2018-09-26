import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import {NgAddOptions} from './schema';

function addXliffmergeToPackageJson() {
    return (host: Tree, context: SchematicContext) => {
        addPackageToPackageJson(
            host,
            'dependencies',
            '@ngrx/store',
            platformVersion
        );
        context.addTask(new NodePackageInstallTask());
        return host;
    };
}

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function ngAdd(_options: NgAddOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    tree.create('hello.txt', 'Hello World!, Default lang is ' + _options.defaultLanguage);
      tree.create('xliffmerge.json', 'Hello World!, Default lang is ' + _options.defaultLanguage);
    return tree;
  };
}
