# Changelog

* 4.0.0 Refactor using typescript. No external changes expected, but everything is possible :)
* 3.0.0 `server.ApiURL` moved to `server.config.apiURL`
* 2.6.0
  * Make webhooks work with user's commands and callback queries;
  * bump deps;
  * Remove bluebird from deps;
* 2.5.0 Added webhook support;
* 2.4.6 fix storage cleanup;
* 2.4.5 Update dependencies;
* 2.4.4 Update dependencies;
* 2.4.3 Update dependencies;
* 2.4.2 Fix [hangs issue](https://github.com/jehy/telegram-test-api/issues/20);
* 2.4.1 Added [support for https](https://github.com/jehy/telegram-test-api/issues/21);
* 2.4.0 Simple sendCallback implementation;
* 2.3.1 Add chatTitle client option;
* 2.3.0 Added Add `deleteWebhook` dummi API command, bumped deps;
* 2.2.1 fix accidental coverage issue;
* 2.2.0 added client method `makeCommand` and `sendCommand` to send commands instead of pure text;
* 2.1.0 added api method `getMe` and telegraf sample test, minor updates;
* 2.0.2 Better readme, minor deps updates;
* 2.0.1 Replace `lodash.merge` with `deep-extend`;
* 2.0.0 Replace `request` with `axios`, remove `ramda` from deps, make some funcs async;
* 1.2.3 Update dependencies;
* 1.2.2 Update dependencies;
* 1.2.1 Update dependencies;
* 1.2.0 `getUpdatesHistory` client method was added;
* 1.1.1 `deleteMessage` API method was added;
* 1.0.7 Implement `GET` method for api;
* 1.0.6 Bump dependencies;
* 1.0.5 Remove extra files from npm tarball;
* 1.0.4 Loosen dependencies;
* 1.0.3 Add request as a dependency;
* 1.0.2 Move logging to debug module, clear storage when stopping server;
* 1.0.1 Fix slow server stop;
* 1.0.0 Such much refactoring;
* 0.0.4 Public release;
