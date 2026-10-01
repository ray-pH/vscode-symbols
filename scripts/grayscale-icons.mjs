import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIRECTORY = join(__dirname, "../src/icons");

function toGrayscale(hex) {
	const value = hex.slice(1);
	const hasAlpha = value.length === 4 || value.length === 8;
	const channels =
		value.length <= 4
			? value
					.slice(0, 3)
					.split("")
					.map((channel) => Number.parseInt(channel.repeat(2), 16))
			: [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((channel) => Number.parseInt(channel, 16));
	const alpha = hasAlpha ? value.slice(-1).repeat(value.length === 4 ? 2 : 1) : "";
	const gray = Math.round(0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]);
	const grayHex = gray.toString(16).padStart(2, "0").toUpperCase();

	return `#${grayHex}${grayHex}${grayHex}${alpha.toUpperCase()}`;
}

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
	const grayscale = source.replace(/\r\n/g, "\n").replace(/#[0-9a-f]{3,8}\b/gi, toGrayscale);

	if (source !== grayscale) {
		await writeFile(svgPath, grayscale);
		changedCount += 1;
	}
}

console.log(`Converted ${changedCount} of ${svgPaths.length} SVG icons to grayscale.`);
