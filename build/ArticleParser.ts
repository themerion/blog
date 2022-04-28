import { ArticleHashFields, ArticleSection } from "./ArticleParts.js";

export class ArticleParser {
	#name: string;
	#content: string;

	constructor(name: string, initialContent: string) {
		this.#name = name;
		this.#content = initialContent;
	}

	tldr(): string {
		const tagStart = this.#content.indexOf("#tldr#");
		if (tagStart === -1) {
			return "";
		}
		const tagEol = getEol(this.#content, tagStart);
		const endTldrContent = this.#content.indexOf("#heading#", tagStart);
		if (endTldrContent === -1) {
			throw new Error(`Could not parse tldr for '${this.#name}', expected a #heading# to follow the #tldr# section.`)
		}

		return this.#content.substring(tagEol, endTldrContent);
	}

	sections(): ArticleSection[] {
		const sections: ArticleSection[] = [];

		let headingPos = -1;
		let contentStart = -1;
		let headingText = "";

		const flushIfContent = (endPos: number) => {
			if (contentStart > -1 && contentStart < endPos) {
				sections.push({
					heading: headingText,
					content: this.#content.substring(contentStart, endPos)
				});
			}
		};

		while (true) {
			headingPos = this.#content.indexOf("#heading#", headingPos + 1);

			// --- loop exit ---
			if (headingPos === -1) break;

			flushIfContent(headingPos);

			const eolPos = getEol(this.#content, headingPos);
			contentStart = eolPos;
			const line = this.#content.substring(headingPos, eolPos);
			headingText = line.substring(9).trim();
		}

		flushIfContent(this.#content.length);

		return sections;
	}

	hashFields(): ArticleHashFields {
		const parseField = (fieldName: string, optional: boolean = false): string => {
			let fieldString = "#" + fieldName + "#";
			let pos = this.#content.indexOf(fieldString);
			if (pos === -1) {
				if (optional) { return ""; }
				throw "Could not parse expected field " + fieldString + " for " + this.#name;
			}
			let endPos = this.#content.indexOf("\n", pos + fieldString.length);
			if (endPos === -1)
				throw "Could not find end of line (\\n) while parsing field " + fieldString + " for " + this.#name;
			return this.#content.substring(pos + fieldString.length, endPos).trim();
		}

		let contentStart = 0;
		while (true) {
			let lineEnd = this.#content.indexOf("\n", contentStart);
			if (lineEnd === -1)
				throw "No content found while parsing " + this.#name;
			if (this.#content.substring(contentStart, lineEnd).indexOf("#") === -1)
				break;
			contentStart = lineEnd + 1;
		}

		return {
			title: parseField("title"),
			meta: parseField("meta"),
			date: parseField("created"),
			image: parseField("image", true),
		};
	}
}

// ==============================================================
/**
 * Returns the position of the end of the current line.
 * Takes last line into consideration.
 */
function getEol(source: string, pos: number): number {
	const eol = source.indexOf("\n", pos);
	return (eol !== -1)
		? eol
		: source.length;
}