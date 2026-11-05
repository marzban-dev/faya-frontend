import { readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

// Bytes a browser downloads for every built public file, by URL path: the brotli copy's
// size when `compressPublicAssets` made one (gzip's otherwise), else the file's own. Filled
// once the client build has been copied (and compressed) into the output, before the server
// is bundled, so the sizes are exact; empty in dev, where the intro's load progress falls
// back to counting files.
let publicAssetSizes: Record<string, number> = {};

const COMPRESSED_SUFFIXES = [".br", ".gz"];

const fileSize = (path: string) => {
    try {
        const stat = statSync(path);
        return stat.isFile() ? stat.size : null;
    } catch {
        return null;
    }
};

const readAssetSizes = (publicDir: string, prefix = "/") => {
    const sizes: Record<string, number> = {};
    for (const file of readdirSync(publicDir, { recursive: true, encoding: "utf8" })) {
        if (COMPRESSED_SUFFIXES.some((suffix) => file.endsWith(suffix))) continue;
        const path = join(publicDir, file);
        const size = COMPRESSED_SUFFIXES.map((suffix) => fileSize(path + suffix)).find((found) => found !== null);
        const own = fileSize(path);
        if (own !== null) sizes[`${prefix}${file.split(sep).join("/")}`] = size ?? own;
    }
    return sizes;
};

// `nuxt generate` prerenders before the public files are copied into the output, so the
// table above is still empty then: fall back to the source files' own (uncompressed) sizes.
const readSourceAssetSizes = (publicAssets: { dir: string; baseURL?: string }[]) =>
    Object.assign(
        {},
        ...publicAssets.map(({ dir, baseURL = "/" }) =>
            readAssetSizes(dir, `/${baseURL.replace(/^\/+|\/+$/g, "")}/`.replace("//", "/")),
        ),
    ) as Record<string, number>;

export default defineNuxtConfig({
    components: [{ path: "./components", prefix: "Landing" }],

    hooks: {
        "nitro:config": (config) => {
            config.virtual ??= {};
            config.virtual["#landing/public-asset-sizes"] = () => {
                const usesSource = config.static && !Object.keys(publicAssetSizes).length;
                const sizes = usesSource ? readSourceAssetSizes(config.publicAssets ?? []) : publicAssetSizes;
                return `export default ${JSON.stringify(sizes)};`;
            };
        },
        "nitro:build:public-assets": (nitro) => {
            publicAssetSizes = readAssetSizes(nitro.options.output.publicDir);
        },
    },
});
