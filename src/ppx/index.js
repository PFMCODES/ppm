#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import os from 'os';
import fetch from 'node-fetch';
import { x } from 'tar';
import { join, check, createSpinner, checkForUpdates } from '../utils.js';
import chalk from 'chalk';

const args = process.argv.slice(2); // get CLI args

const command = args[0];

async function runPackage(pkg) {
    const tempDir = join(os.tmpdir(), 'ppx', pkg);
    // Step 1: Check if temp folder exists
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

    // Step 2: Fetch package info from npm
    const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`);
    if (!res.ok) {
        console.error(`Failed to fetch package: ${pkg}`);
        process.exit(1);
    }
    const data = await res.json();
    const tarballUrl = data.dist.tarball;

    // Step 3: Download tarball
    const tarRes = await fetch(tarballUrl);
    const buffer = Buffer.from(await tarRes.arrayBuffer());

    // Step 4: Write tarball to temp file
    const tarPath = join(tempDir, 'package.tgz');
    writeFileSync(tarPath, buffer);

    // Step 5: Extract tarball
    await x({ file: tarPath, cwd: tempDir, strip: 1 });
    if (!existsSync(join(tempDir, 'node_modules'))) {
        console.log(chalk.blueBright('Installing dependencies...'));
        const stopSpinner = await createSpinner('', '' ,async () => {
            await new Promise((resolve, reject) => {
                const install = spawn('npm', ['install', '--omit=dev'], {
                    cwd: tempDir,
                    stdio: 'inherit',
                    shell: true
                });

                install.on('exit', code => code === 0 ? resolve() : reject(new Error('npm install failed')));
                install.on('error', reject);
            });
    console.log(`${check} successfully installed dependencies`);

        });
    } else {
        console.log('Using cached package...');
    }


    // Step 6: Read package.json to find bin
    const pkgJsonPath = join(tempDir, 'package.json');
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    let binPath;

    if (pkgJson.bin) {
        if (typeof pkgJson.bin === 'string') binPath = join(tempDir, pkgJson.bin);
        else binPath = join(tempDir, Object.values(pkgJson.bin)[0]);
    } else {
        console.error('No binary found in package.');
        process.exit(1);
    }

    // Step 7: Spawn Node process to run the binary
    const pkgArgs = args.slice(1); // skip the first arg, which is the package name
    const child = spawn(
        process.execPath,
        [binPath, ...pkgArgs],
        { stdio: 'inherit', cwd: tempDir }
    );

    child.on('exit', code => process.exit(code));
    child.on('error', err => { console.error('Failed to run binary:', err); process.exit(1); });
}

switch (command) {
    default:
        await checkForUpdates();
        if (command === undefined || command === null) {
            console.log('Please provide script name to run');
        }
        else {
            await runPackage(command);
        }
        break;
}