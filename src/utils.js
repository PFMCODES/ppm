import * as Fs from 'fs';
import path from 'path';
import process from 'process';
import chalk from 'chalk';
import { execSync } from 'child_process';

// Expose fs module directly
export const fs = Fs;

// Convenience wrappers
export const readFile = (filePath, encoding) => fs.readFileSync(filePath, encoding);
export const writeFile = (filePath, data, encoding) => fs.writeFileSync(filePath, data, encoding);
export const join = (...paths) => path.join(...paths);
export const cwd = process.cwd;
export const baseName = path.basename;
export const check = chalk.greenBright('√');

export const getLatestVersion = async (pkgName) => {
    try {
        const res = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(pkgName)}/latest`
    );
    const data = await res.json();
    // if (data.version === null || data.version === undefined) throw Error('Package not found, or version value in the package.json of the requested package not found');
    return data.version;
    }
    catch (err) {
        throw err;
    }
}

export const createSpinner = (message = '', doneMessage = '', fn) => {
    const frames = ['|', '/', '-', '\\'];
    let i = 0;

    const interval = setInterval(() => {
        process.stdout.write(`\r\x1b[2K${frames[i]} ${message}`);
        i = (i + 1) % frames.length;
    }, 100);

    const promise = fn ? fn() : Promise.resolve();

    return promise.finally(() => {
        clearInterval(interval);

        // 🔥 THIS is the important part
        process.stdout.write(`\r\x1b[2K${doneMessage}\n`);
    });
};

export function getGlobalNodeModules() {
    const prefix = execSync('npm config get prefix', {
        encoding: 'utf8'
    }).trim();

    return path.join(prefix, 'node_modules');
}

export const checkForUpdates = (async () => {
    const pkgPath = join(baseName(cwd()), "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

    const currentVersion = pkg.version;
    const name = pkg.name;
    const latest = await getLatestVersion(name);

    if (latest === currentVersion) {
        console.log(`ppm v${currentVersion} (latest)`)
    } else {
        console.log(`ppm v${currentVersion} (update avaible: ${currentVersion} => ${latest})`)
        console.log(`to update: ppm install @pfmcodes/ppm@${latest} -g`)
    }

});

export const getPkgDir = (base, pkg) => {
    if (pkg.startsWith('@')) {
        const [scope, name] = pkg.split('/');
        const scopeDir = join(base, scope);
        fs.mkdirSync(scopeDir, { recursive: true });
        return join(scopeDir, name);
    }
    return join(base, pkg);
}
