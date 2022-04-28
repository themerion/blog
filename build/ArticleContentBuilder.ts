import { ArticleSection } from "./ArticleParts.js";

// ------------------------------------------------

export class ArticleContentBuilder {
	#content: string;

	constructor() {
		this.#content = "";
	}

	tldr(content: string) {
		this.#content += `<h2 id="tldr">tl;dr</h2>`
		this.#content += content;
		return this;
	}

	tableOfContents(headings: string[]) : ArticleContentBuilder {
		if (!headings.length)
        	return this;

		let rows = "";
		for (let x of headings) {
			rows += '<li><a href="#' + generateIdFromHeading(x) + '">' + x + '</a></li>';
		}
		this.#content += `<h2>Table of contents</h2>`
		this.#content += `<ol id="article-index">${rows}</ol>`;
		return this;
	}

	section(section: ArticleSection) : ArticleContentBuilder {
		const id = generateIdFromHeading(section.heading);
		this.#content += `<h2 id="${id}">${section.heading}</h2>`
		this.#content += section.content;
		return this;
	}

	sections(sections: ArticleSection[]) {
		for(const s of sections) this.section(s);
		return this;
	}

	getResult() : string {
		return this.#content;
	}
}

// ==============================================================

function generateIdFromHeading(heading: string) {
    return heading
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[!?&.,;:]/g, "");
}
