const fs = require("fs");
const path = require("path");
const moment = require("moment");

build();

function build() {
    let articleTwigs = fs.readdirSync("articles");

    let articleStatus = {};

    for (let twigName of articleTwigs.filter(x => /\.html$/.test(x))) {
        let localPath = path.join("articles", twigName);
        let stat = fs.statSync(localPath);
        articleStatus[twigName] = {
            name: twigName,
            localPath: localPath,
            lastEdit: stat.mtimeMs,
        };
    }

    let articleTemplate = fs.readFileSync("articleTemplate.html", 'utf8');

    fs.rmdirSync("dist", {recursive: true});
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
    let { content, title, meta, date } = parseArticleTwig(raw, article.name);

    let [textHeadings, content2] = processTextHeadings(content);
    let tblContent = generateTableOfContentsHtml(textHeadings);
    let content3 = tblContent + content2;

    let articleHtml = articleTemplate
        .replace(/#title#/g, title) // using /g because of <title> and <h1>
        .replace(/#content#/, content3)
        .replace(/#created#/, generateDateHtml(date))
        .replace(/#meta#/, meta)
        .replace(/#head#/, headHtml)
        .replace(/#title-container#/, titleContainerHtml)
        ;

    fs.writeFileSync("dist/" + article.name, articleHtml);

    return {
        title: title,
        meta: meta,
        date: date,
        fileName: article.name
    };
}

function generateIndexHtml(articleMetas) {
    let indexHtml = fs.readFileSync("index.html", 'utf8');
    let articleListHtml = (`
        <section>
            ${articleMetas.map(x => `<div class="article-brief">
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
        date: parseField("created")
    };
}

function generateDateHtml(date) {
    return '<span class="article-date">' + date + '</span>';
}

function processTextHeadings(html) {
    var headings = [];
    var lines = html.split("\n");
    for(let i = 0; i < lines.length; i++) {
        const headingPos = lines[i].indexOf("#heading#")
        if(headingPos > -1) {
            let headingText = lines[i].substring(headingPos + 9).trim();
            headings.push(headingText);
            lines[i] = `<h2 id="${generateIdFromHeading(headingText)}">${headingText}</h2>`;
        }
    }
    return [headings, lines.join("\n")];
}

function generateIdFromHeading(heading) {
    return heading
        .toLowerCase()
        .replace(/ /g,"-")
        .replace(/[!?&.,;:]/g,"");
}

function generateTableOfContentsHtml(textHeadings) {
    if(!textHeadings || !textHeadings.length)
        return "";

    let rows = "";
    for(let x of textHeadings) {
        rows += '<li><a href="#'+generateIdFromHeading(x)+'">'+x+'</a></li>';
    }
    return '<ol id="article-index">'+rows+'</ol>';
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