A static website with articles, using a custom build-step.

## Building

* Install any recent version of nodejs with npm
* Run `npm install` (we have a dependency on moment.js)
* Run `node build.js`
* The website is generated into the `dist/` folder

## Releasing

* Merge changes from branch `dev` into `master`. A github workflow will build and publish the site via SFTP to https://lissel.net

## Folder Overview

* `static/` is for files that should be used as-is. Images, scripts and styles.
* `articles/` is for the unique articles.
* `articleTemplate.html` is the basic html-layout for all articles.
* `headTemplate.html` is the `<head>` part which is merged into each page.
* `titleContainer.html` is the top part of the body, containing the "logo" and rss-icon.
* `index.html` is the start page (which lists all articles).

## Architectural motivation

* There is not really any need for minified or bundled javascript/css.
* There is a need for sharing the head-section
* There is a need for sharing data between articles and the index-page article list.
* The blog might spend long times between updates.

There is always a risc when using front-end frameworks. They are keen on breaking API:s between versions. Since we do not have need for most of their functions, we use this primitive approach instead. This should simplify changes in the future.

