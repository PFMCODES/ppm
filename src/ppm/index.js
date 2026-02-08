#!/usr/bin/env node

import { cwd } from "process";
import { checkForUpdates, join } from "../utils.js";
import { init } from './c/init.js';
import { install, uninstall } from "./c/install.js";
import { readFileSync } from "fs";
import { execSync } from "child_process";

let args = process.argv.slice(2); // get CLI args

const command = args[0];

(async () => await checkForUpdates());

switch (command) {
    case 'init':
        await checkForUpdates();
        await init(args);
        break;
    case 'help' : 
        await checkForUpdates();
        console.log(`Available commands:
    init [-y | initializes with default settings] | initializes a new package
    help | shows avaible commands`);
    break;
    case 'install': 
    case "add":
    case "i":
        await checkForUpdates();

        const spec = args[1]; // react or react@18.2.0
        if (!spec) {
            console.error('Please specify a package name');
            process.exit(1);
        }

        let pkg;
        let version;

        if (spec.includes('@') && !spec.startsWith('@')) {
            [pkg, version] = spec.split('@');
        } else {
            pkg = spec;
            version = 'latest';
        }

        await install(pkg, version, args.slice(2));
        break;
    case 'uninstall': 
          await checkForUpdates();
        uninstall(args[1], args.slice(2));
        break;
    case 'start':
        try {
            const pkgJson = readFileSync(join(cwd(), 'package.json'));
            const com = JSON.parse(pkgJson)
            console.log(`\n> ${com.name}@${com.version} start`)
            console.log(`> ${com.scripts.start}\n `)
            execSync(com.scripts.start, {
                stdio: "inherit"
            });
        } catch (err) {
            throw Error('Requested file does not exist');
        }
        break;
    default:
        await checkForUpdates();
        if (command === undefined || command === null){
            console.log(`Available commands:
            init [-y | initializes with default settings] | initializes a new package
            help | shows avaible commands`);
        } else {
            console.log(`Unknown command: ${command}`);
            console.log(`Available commands:
            init [-y | initializes with default settings] | initializes a new package
            help | shows avaible commands`);
        }
        break;
}