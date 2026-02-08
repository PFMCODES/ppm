import { existsSync, mkdirSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import { x } from 'tar';
import { fs } from '../../utils.js';
import { rmSync } from 'fs';
import { join, cwd, createSpinner, check, getPkgDir, getGlobalNodeModules } from '../../utils.js';
import chalk from 'chalk';

export async function install(pkg, version = 'latest', flags) {
    const baseDir = cwd();
    const nodeModules = join(baseDir, 'node_modules');
    mkdirSync(nodeModules, { recursive: true });
    let pkgDir;
    if (flags.includes('-g')) {
        pkgDir = getPkgDir(getGlobalNodeModules(), pkg);
    } else {
        pkgDir = getPkgDir(nodeModules, pkg);
    }
    const pkgJsonPath = join(pkgDir, 'package.json');

    // 🔁 Already installed
    if (existsSync(pkgJsonPath)) return;

    let meta;

    try {
        meta = await createSpinner(
            chalk.blueBright(`Installing ${pkg}@${version}`), `\n${check} Installed ${pkg}@${version}`,
            async () => {
                const res = await fetch(`https://registry.npmjs.org/${pkg}/${version}`);
                if (!res.ok) throw new Error(`Package not found: ${pkg}`);

                const meta = await res.json();
                const tarballUrl = meta.dist.tarball;

                const tarRes = await fetch(tarballUrl);
                const buffer = Buffer.from(await tarRes.arrayBuffer());

                mkdirSync(pkgDir, { recursive: true });

                const tarPath = join(pkgDir, 'package.tgz');
                writeFileSync(tarPath, buffer);

                await x({
                    file: tarPath,
                    cwd: pkgDir,
                    strip: 1
                });

                fs.unlinkSync(tarPath);

                if (existsSync(join(pkgDir, 'README.md'))) {
                    fs.unlinkSync(join(pkgDir, 'README.md'));
                }

                return meta;
            }
        );
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }

    // 4️⃣ Install dependencies recursively
    if (meta.dependencies) {
        for (const [dep, depVersion] of Object.entries(meta.dependencies)) {
            await install(dep, depVersion, flags);
        }
    }
}

export function uninstall(pkg, flags) {
    let pkgDir = join(cwd(), 'node_modules', pkg);

    if (flags.includes('-g')) {
        pkgDir = join(getGlobalNodeModules(), pkg);
    }

    rmSync(pkgDir, {
        recursive: true,
        force: true
    });

    console.log(`${check} Uninstalled ${pkg}`);
}