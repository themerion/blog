const fs = require("fs");
const path = require("path");
const moment = require("moment");

build();

function build() {
    let articleTwigs = fs.readdirSync("articles");

    let articleStatus = {};

    for (let twigName of articleTwigs) {
        let localPath = path.join("articles", twigName);
        let stat = fs.statSync(localPath);
        articleStatus[twigName] = {
            name: twigName,
            localPath: localPath,
            lastEdit: stat.mtimeMs,
        };
    }

    let articleTemplate = fs.readFileSync("articleTemplate.html", 'utf8');

    if (!fs.existsSync("dist"))
        fs.mkdirSync("dist");

    let articleMetas = [];
    for (let article of Object.values(articleStatus))
        articleMetas.push(generateArticle(article, articleTemplate));

    articleMetas.sort((a, b) => a.date > b.date ? -1 : (b.date < a.date ? 1 : 0));

    generateIndexHtml(articleMetas);
    generateRssFeed(articleMetas);

    copyStaticFiles();
}

function generateArticle(article, articleTemplate) {
    let headHtml = fs.readFileSync("headTemplate.html", 'utf8');
    let titleContainerHtml = fs.readFileSync("titleContainerTemplate.html", 'utf8');
    let raw = fs.readFileSync(article.localPath, 'utf8');
    let { content, title, meta, date, tags } = parseArticleTwig(raw, article.name);
    let articleHtml = articleTemplate
        .replace(/#title#/g, title) // using /g because of <title> and <h1>
        .replace(/#content#/, content)
        .replace(/#created#/, generateDateHtml(date))
        .replace(/#meta#/, meta)
        .replace(/#tags#/, "" /*generateTagsHtml(tags)*/)
        .replace(/#head#/, headHtml)
        .replace(/#title-container#/, titleContainerHtml)
        ;

    fs.writeFileSync("dist/" + article.name, articleHtml);

    return {
        title: title,
        meta: meta,
        date: date,
        tags: tags,
        fileName: article.name
    };
}

function generateIndexHtml(articleMetas) {
    let indexHtml = fs.readFileSync("index.html", 'utf8');
    let articleListHtml = (`
        <section>
            ${articleMetas.map(x => `<div class="article-brief">
                ${/*<div>${generateTagsHtml(x.tags)}</div>*/""}
                <div>${generateDateHtml(x.date)}</div>
                <h2><a href="${x.fileName}">${x.title}</a></h2>
                <p><a href="${x.fileName}">${x.meta}</a></p>
            </div>`).join("")}
        </section>
    `);

    let headHtml = fs.readFileSync("headTemplate.html", 'utf8');
    let titleContainerHtml = fs.readFileSync("titleContainerTemplate.html", 'utf8');

    indexHtml = indexHtml
        .replace(/#article-list#/, articleListHtml)
        .replace(/#head#/, headHtml)
        .replace(/#title-container#/, titleContainerHtml);
    fs.writeFileSync("dist/index.html", indexHtml);
}

function copyStaticFiles() {
    let staticFiles = fs.readdirSync("static");
    for (let fileName of staticFiles) {
        let sourcePath = path.join("static", fileName);
        let destinationPath = path.join("dist", fileName);
        fs.copyFileSync(sourcePath, destinationPath);
    }
}

function parseArticleTwig(twig, twigName) {
    function parseField(fieldName) {
        let fieldString = "#" + fieldName + "#";
        let pos = twig.indexOf(fieldString);
        if (pos === -1)
            throw "Could not parse expected field " + fieldString + " for " + twigName;
        let endPos = twig.indexOf("\n", pos + fieldString.length);
        if (endPos === -1)
            throw "Could not find end of line (\\n) while parsing field " + fieldString + " for " + twigName;
        return twig.substring(pos + fieldString.length, endPos).trim();
    }

    let contentStart = 0;
    while (true) {
        let lineEnd = twig.indexOf("\n", contentStart);
        if (lineEnd === -1)
            throw "No content found while parsing " + twigName;
        if (twig.substring(contentStart, lineEnd).indexOf("#") === -1)
            break;
        contentStart = lineEnd + 1;
    }

    return {
        content: twig.substring(contentStart),
        title: parseField("title"),
        meta: parseField("meta"),
        date: parseField("created"),
        tags: parseField("tags").split(",").map(x => x.trim()),
    };
}

function generateTagsHtml(tags) {
    return (
        '<span class="tag-container">' +
        tags.map(tag => '<span class="tag">' + tag + '</span>').join("") +
        '</span>');
}

function generateDateHtml(date) {
    return '<span class="article-date">' + date + '</span>';
}

function generateRssFeed(articleMetas) {
    let now = getTimestamp();
    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
        <title>Lissel's code blog</title>
        <description>The article feed containing snippets about c0de.</description>
        <link>http://www.lissel.net/</link>
        <lastBuildDate>${now}</lastBuildDate>
        <pubDate>${now}</pubDate>
        <ttl>1800</ttl>${articleMetas.map(article => `
        <item>
            <title>${article.title}</title>
            <description>${article.meta}</description>
            <link>http://www.lissel.net/${article.fileName}</link>
            <guid isPermaLink="false">http://www.lissel.net/${article.fileName}</guid>
            <pubDate>${getTimestamp(article.date)}</pubDate>
        </item>`).join("")}
    </channel>
</rss>`;
    fs.writeFileSync(path.join("dist", "lissel.rss"), rss);
}

/*
    arg can be "YYYY-MM-DD" or nothing=now
*/
function getTimestamp(arg) {
    if (typeof (arg) === "string")
        arg = new Date(arg)
    else
        arg = arg || new Date();
    return moment(arg).format('ddd, DD MMM YYYY HH:mm:ss ZZ');
}