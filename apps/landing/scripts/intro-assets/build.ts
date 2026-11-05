// Builds the landing intro's frames in public/intro/ from the originals in Faya/: every
// frame of both intro videos as WebP. Run `bun run intro-assets` after a video changes.
// macOS only: frames are read with AVFoundation, through video-tools.swift. (The logo
// animation is an SVG component, IntroLogo.vue, not built here.)
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const FRAME_QUALITY = 60;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const originalsDir = join(scriptDir, "../../../../..");
const outDir = join(scriptDir, "../../public/intro");

const run = async (cmd: string[]) => {
    const proc = Bun.spawn(cmd, { stdout: "inherit", stderr: "inherit" });
    if ((await proc.exited) !== 0) throw new Error(`failed: ${cmd.join(" ")}`);
};

const pngFiles = async (dir: string) =>
    (await readdir(dir)).filter((file) => file.endsWith(".png")).sort();

const writeWebpFrames = async (pngDir: string, webpDir: string) => {
    await rm(webpDir, { recursive: true, force: true });
    await mkdir(webpDir, { recursive: true });
    const files = await pngFiles(pngDir);
    let bytes = 0;
    for (const file of files) {
        const info = await sharp(join(pngDir, file))
            .webp({ quality: FRAME_QUALITY, effort: 6, smartSubsample: true })
            .toFile(join(webpDir, file.replace(".png", ".webp")));
        bytes += info.size;
    }
    console.log(`${files.length} frames → ${webpDir} (${(bytes / 1e6).toFixed(1)} MB)`);
};

const main = async () => {
    const work = await mkdtemp(join(tmpdir(), "faya-intro-"));
    try {
        const tools = join(work, "video-tools");
        await run(["xcrun", "swiftc", "-O", join(scriptDir, "video-tools.swift"), "-o", tools]);
        await mkdir(outDir, { recursive: true });

        for (const variant of ["desktop", "mobile"]) {
            const pngDir = join(work, variant);
            await mkdir(pngDir);
            await run([tools, "decode", join(originalsDir, `intro-${variant}.mov`), pngDir]);
            await writeWebpFrames(pngDir, join(outDir, variant));
        }
    } finally {
        await rm(work, { recursive: true, force: true });
    }
};

await main();
