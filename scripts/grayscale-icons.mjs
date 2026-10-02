import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIRECTORY = join(__dirname, "../src/icons");

const ICON_COLOR = "#A6A3B8";

async function getSvgPaths(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const paths = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = join(directory, entry.name);

			if (entry.isDirectory()) {
				return getSvgPaths(entryPath);
			}

			return entry.isFile() && entry.name.endsWith(".svg") ? [entryPath] : [];
		}),
	);

	return paths.flat();
}

const svgPaths = await getSvgPaths(ICONS_DIRECTORY);
let changedCount = 0;

for (const svgPath of svgPaths) {
	const source = await readFile(svgPath, "utf8");
	const grayscale = source.replace(/\r\n/g, "\n").replace(/#[0-9a-f]{3,8}\b/gi, ICON_COLOR);

	if (source !== grayscale) {
		await writeFile(svgPath, grayscale);
		changedCount += 1;
	}
}

console.log(`Set ${changedCount} of ${svgPaths.length} SVG icons to ${ICON_COLOR}.`);
