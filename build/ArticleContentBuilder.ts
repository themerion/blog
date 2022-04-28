import { ArticleSection } from "./ArticleParts.js";
import { ExpandableBuilder } from "./ExpandableBuilder.js";
import { generateIdFromHeading } from "./generateIdFromHeading.js";

// ------------------------------------------------

export class ArticleContentBuilder {
	#content: string;

	constructor() {
		this.#content = "";
	}

	expandableSections(sections: (ArticleSection | null)[]) : ArticleContentBuilder {
		const builder = new ExpandableBuilder();
		for (const s of sections) {
			if (!s) continue;
			builder.add(
				s.heading,
				s.content,
				generateIdFromHeading(s.heading),
			);
		}
		this.#content += builder.print();
		return this;
	}

	section(section: ArticleSection) : ArticleContentBuilder {
		const id = generateIdFromHeading(section.heading);
		this.#content += `<h2 id="${id}">${section.heading}</h2>`
		this.#content += section.content;
		return this;
	}

	sections(sections: ArticleSection[]) : ArticleContentBuilder {
		for(const s of sections) this.section(s);
		return this;
	}

	getResult() : string {
		return this.#content;
	}
}
