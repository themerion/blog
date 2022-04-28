export function generateIdFromHeading(heading: string) {
    return heading
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[!?&.,;:]/g, "");
}
