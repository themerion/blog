const fs = require("fs");
const path = require("path");

let articleTwigs = fs.readdirSync("articles");

let articleStatus = {};

for(let twigName of articleTwigs) {
    let localPath = path.join("articles",twigName);
    let stat = fs.statSync(localPath);
    articleStatus[twigName] = {
        name: twigName,
        localPath: localPath,
        lastEdit: stat.mtimeMs,
    };
}

let mainFile = fs.readFileSync("main.html",'utf8');

if(!fs.existsSync("dist"))
    fs.mkdirSync("dist");

let generatedStatus = [];
for(let article of Object.values(articleStatus)) {
    generateArticle(article);
}

function generateArticle(article) {
    let raw = fs.readFileSync(article.localPath, 'utf8');
    let {content, title, meta} = parseArticleTwig(raw, article.name);
    let articleHtml = mainFile
        .replace(/#title#/,"<title>"+title+" - Lissel's code blog</title>")
        .replace(/#content#/,content);
    
    fs.writeFileSync("dist/"+article.name, articleHtml);

    generatedStatus.push({
        title: title,
        meta: meta
    });
}

function parseArticleTwig(twig, twigName) {
    function parseField(fieldName) {
        let fieldString = "#"+fieldName+"#";
        let pos = twig.indexOf(fieldString);
        if(pos === -1)
            throw "Could not parse expected field "+fieldString+" for "+twigName;
        let endPos = twig.indexOf("\n",pos+fieldString.length);
        if(endPos === -1)
            throw "Could not find end of line (\\n) while parsing field "+fieldString+" for "+twigName;
        return twig.substring(pos+fieldString.length,endPos).trim();
    }

    let contentStart = 0;
    while(true) {
        let lineEnd = twig.indexOf("\n",contentStart);
        if(lineEnd === -1)
            throw "No content found while parsing "+twigName;
        if(twig.substring(contentStart,lineEnd).indexOf("#")===-1)
            break;
        contentStart = lineEnd+1;
    }

    return {
        content: twig.substring(contentStart),
        title: parseField("title"),
        meta: parseField("meta")
    };
}