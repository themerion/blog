A static website with articles, using a custom build-step.

## Building

* Install any recent version of nodejs with npm
* Run `npm install`
* Run `npm run build`
* The website is generated into the `dist/` folder

## Running

* Launch a web server in `dist/`. For instance:
   * `npx lite-server`
   * `python -m http.server`


## Deploying

* Copy `dist/` into a web server.
* For Apache servers, copy `deploy/.htaccess` into the web server's root folder to get http->https redirection.

## Folder Overview

* `static/` is for files that should be used as-is. images, scripts and styles.
* `articles/` is for the unique articles.
* `templates/` is for common html-layout.
* `build/` contains scripts for building the website.
* `dist/` is where the built website ends up.

## Architecture and dependencies

* Typescript
* Cross platform dependencies for package.json scripts:
   * `rimraf` instad of `rm -fr`
   * `npm-run-all` with `run-s` instead of `&&`
* Homemade static website generator:
   * Is fun to make
   * Avoids frontend framework webpack hell
