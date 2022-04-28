interface Expandable {
    id: string,
    title: string,
    content: string
}

export class ExpandableBuilder {
    #expandables: Expandable[];

    constructor() {
        this.#expandables = [];
    }

    add(title: string, content: string, id: string) {
        this.#expandables.push({title, content, id});
    }

    print(): string {
        let header = "";
        let content = "";

        for (const e of this.#expandables) {
            header += `<span class="expandable" for="#${e.id}">${e.title}</span>`;
            content += `<div class="expandable-hidden" id="${e.id}">${e.content}</div>`;
        }

        return `<div class="expandable-group" style="margin-bottom: -2em">
            <div class="expandable-header">${header}</div>
            ${content}
        </div>`;
    }
}