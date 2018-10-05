import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import {AddLanguageOptions} from './schema';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function addLanguage(_options: AddLanguageOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    tree.create('added.txt', 'Hello World!, added lang is ' + _options.language);
    return tree;
  };
}
