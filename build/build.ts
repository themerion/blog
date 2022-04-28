import * as fs from "fs";
import * as path from "path";
import { ArticleParser } from "./ArticleParser.js";
import { ArticleContentBuilder } from "./ArticleContentBuilder.js";
import { ArticleSection } from "./ArticleParts.js";
import { tableOfContents } from "./tableOfContents.js";

// ------------------------------------------------------------

build();

// ------------------------------------------------------------

interface Files {
    name: string,
    localPath: string,
    lastEdit: number
}

interface ArticleMeta {
    title: string,
    meta: string,
    date: string,
    fileName: string
}

interface Templates {
    index: string,
    article: string,
    head: string,
    titleContainer: string
}

// -----------------------------------------------------------

function build() {
    const files = getArticleFiles();

    const templates: Templates = {
        index: fs.readFileSync("templates/index.html", 'utf8'),
        article: fs.readFileSync("templates/articleTemplate.html", 'utf8'),
        head: fs.readFileSync("templates/headTemplate.html", 'utf8'),
        titleContainer: fs.readFileSync("templates/titleContainerTemplate.html", 'utf8')
    };

    fs.rmSync("dist", { recursive: true });
    fs.mkdirSync("dist");

    const articleMetas = files.map(article => {
        const content = fs.readFileSync(article.localPath, 'utf8');
        return generateArticle(article.name, content, templates)
    });

    articleMetas.sort((a, b) => a.date > b.date ? -1 : (b.date < a.date ? 1 : 0));

    const indexHtml = generateIndexHtml(articleMetas, templates);
    fs.writeFileSync("dist/index.html", indexHtml)

    generateRssFeed(articleMetas);

    copyStaticFiles();
}

function getArticleFiles(): Files[] {
    const files: Files[] = [];

    const fileNames = fs.readdirSync("articles");
    for (let fileName of fileNames.filter(x => /\.html$/.test(x))) {
        let localPath = path.join("articles", fileName);
        let stat = fs.statSync(localPath);
        files.push({
            name: fileName,
            localPath: localPath,
            lastEdit: stat.mtimeMs,
        });
    }

    return files;
}

function generateArticle(
    name: string,
    rawContent: string,
    templates: Templates,
) {
    const parse = new ArticleParser(name, rawContent);
    const { title, meta, date, image } = parse.hashFields();
    const ogImage = image ? `<meta property="og:image" content="https://lissel.net/${image}" />` : "";
    const sections = parse.sections();
    const tldr = parse.tldr();

    const tldrSection : ArticleSection = {heading: "tl;dr", content: tldr};
    const tableOfContentsSection = tableOfContents(sections.map(s => s.heading));

    const contentBuilder = new ArticleContentBuilder();
    const content = contentBuilder
        .expandableSections([
            tldrSection,
            tableOfContentsSection
        ])
        .sections(sections)
        .getResult();

    let articleHtml = templates.article
        .replace(/#title#/g, title) // using /g because of <title> and <h1>
        .replace(/#content#/, content)
        .replace(/#created#/, generateDateHtml(date))
        .replace(/#meta#/, meta)
        .replace(/#head#/, templates.head)
        .replace(/#ogimage#/, ogImage)
        .replace(/#title-container#/, templates.titleContainer)
        ;

    fs.writeFileSync("dist/" + name, articleHtml);

    return {
        title: title,
        meta: meta,
        date: date,
        fileName: name
    };
}

function generateIndexHtml(articleMetas : ArticleMeta[], templates : Templates) {
    let articleListHtml = (`
        <section>
            ${articleMetas.map(x => `<div class="article-brief">
                <div>${generateDateHtml(x.date)}</div>
                <h2><a href="${x.fileName}">${x.title}</a></h2>
                <p><a href="${x.fileName}">${x.meta}</a></p>
            </div>`).join("")}
        </section>
    `);

    return templates.index
        .replace(/#article-list#/, articleListHtml)
        .replace(/#head#/, templates.head)
        .replace(/#title-container#/, templates.titleContainer);
}

function copyStaticFiles() {
    let staticFiles = fs.readdirSync("static");
    for (let fileName of staticFiles) {
        let sourcePath = path.join("static", fileName);
        let destinationPath = path.join("dist", fileName);
        fs.copyFileSync(sourcePath, destinationPath);
    }
}

function generateDateHtml(date) {
    return '<span class="article-date">' + date + '</span>';
}



function generateRssFeed(articleMetas) {
    let now = getDateForRSS(new Date());
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
            <pubDate>${getDateForRSS(new Date(article.date))}</pubDate>
        </item>`).join("")}
    </channel>
</rss>`;
    fs.writeFileSync(path.join("dist", "lissel.rss"), rss);
}

/*
    arg can be "YYYY-MM-DD" or nothing=now
*/


// Borrowed from https://gist.github.com/samhernandez/5260558

/**
* Get an RSS pubDate from a Javascript Date instance.
* @param Date - optional
* @return String
*/
function getDateForRSS(date: Date) {

    if (typeof date === 'undefined') {
        date = new Date();
    }

    var pieces = date.toString().split(' '),
        offsetTime = pieces[5].match(/[-+]\d{4}/),
        offset = (offsetTime) ? offsetTime : pieces[5],
        parts = [
            pieces[0] + ',',
            pieces[2],
            pieces[1],
            pieces[3],
            pieces[4],
            offset
        ];

    return parts.join(' ');
}
