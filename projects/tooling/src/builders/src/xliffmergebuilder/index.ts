import {createBuilder, BuilderContext} from '@angular-devkit/architect';
import XliffmergeBuilder from './xliffmerge.builder';
import {JsonObject} from '@angular-devkit/core';

export default createBuilder((options: JsonObject, context: BuilderContext) => {
  const xliffmergeBuilder = new XliffmergeBuilder(context);
  return xliffmergeBuilder.run(options).toPromise();
});
