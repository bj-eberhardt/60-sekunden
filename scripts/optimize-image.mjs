import { mkdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const options = parseArgs(process.argv.slice(2));

if (!options.input) {
  printUsage();
  process.exit(1);
}

const outputDir = options.outputDir ?? 'src/assets';
const outputName = options.name ?? basename(options.input, extname(options.input));
const webpOutput = join(outputDir, `${outputName}.webp`);
const avifOutput = join(outputDir, `${outputName}.avif`);

mkdirSync(outputDir, { recursive: true });

const image = sharp(options.input, { animated: false }).rotate();
const resized = options.width ? image.resize({ width: options.width }) : image;

await resized.clone().webp({ quality: options.webpQuality }).toFile(webpOutput);
await resized
  .clone()
  .avif({ effort: options.avifEffort, quality: options.avifQuality })
  .toFile(avifOutput);

console.log(`Created ${webpOutput}`);
console.log(`Created ${avifOutput}`);

function parseArgs(args) {
  const parsed = {
    avifEffort: 6,
    avifQuality: 58,
    webpQuality: 78,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith('--') && !parsed.input) {
      parsed.input = arg;
      continue;
    }

    if (arg === '--out-dir') {
      parsed.outputDir = readValue(args, (index += 1), arg);
      continue;
    }

    if (arg === '--name') {
      parsed.name = readValue(args, (index += 1), arg);
      continue;
    }

    if (arg === '--width') {
      parsed.width = readPositiveInteger(readValue(args, (index += 1), arg), arg);
      continue;
    }

    if (arg === '--webp-quality') {
      parsed.webpQuality = readIntegerInRange(readValue(args, (index += 1), arg), arg, 0, 100);
      continue;
    }

    if (arg === '--avif-quality') {
      parsed.avifQuality = readIntegerInRange(readValue(args, (index += 1), arg), arg, 0, 100);
      continue;
    }

    if (arg === '--avif-effort') {
      parsed.avifEffort = readIntegerInRange(readValue(args, (index += 1), arg), arg, 0, 9);
      continue;
    }

    console.error(`Unknown argument: ${arg}`);
    printUsage();
    process.exit(1);
  }

  return parsed;
}

function readValue(args, index, optionName) {
  const value = args[index];

  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${optionName}`);
    process.exit(1);
  }

  return value;
}

function readPositiveInteger(value, optionName) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.error(`${optionName} must be a positive integer`);
    process.exit(1);
  }

  return parsed;
}

function readIntegerInRange(value, optionName, min, max) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    console.error(`${optionName} must be an integer from ${min} to ${max}`);
    process.exit(1);
  }

  return parsed;
}

function printUsage() {
  console.error(`
Usage:
  node scripts/optimize-image.mjs <input> [--width <px>] [--out-dir <dir>] [--name <name>]

Examples:
  node scripts/optimize-image.mjs assets/pair.png
  node scripts/optimize-image.mjs assets/background-people.png --width 1280 --name home-background
`);
}
