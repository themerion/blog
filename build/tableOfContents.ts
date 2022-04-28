import { ArticleSection } from "./ArticleParts.js";
import { generateIdFromHeading } from "./generateIdFromHeading.js";

export function tableOfContents(headings: string[]) : ArticleSection {
    let rows = "";
    for (let x of headings) {
        rows += '<li><a href="#' + generateIdFromHeading(x) + '">' + x + '</a></li>';
    }
    return {
        heading: "Table of contents",
        content: `<ol>${rows}</ol>`
    };
}