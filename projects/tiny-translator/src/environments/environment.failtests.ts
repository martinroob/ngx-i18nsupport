// The file content for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  version: '%VERSION%',
  buildtime: '%BUILDTIME%',
  base_href: '%BASE_HREF%',
  googletranslate_api_key: null,
  googletranslate_provoke_failures: true,
  github_api_key: null,
  github_provoke_failures: true,
};
