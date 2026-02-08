import inquirer from 'inquirer';
import { writeFile, join, cwd, baseName, check } from '../../utils.js';
import fs from 'fs';
import { basename } from 'path';

export async function init(flags = []) {
    const configPath = join(cwd(), 'package.json');

    if (flags.includes('-y')) {
        const pkgJson = {
            name: baseName(cwd()),
            version: '1.0.0',
            main: 'main.js',
            scripts: {
                start: 'node main.js'
            },
            keywords: [],
            author: '',
            license: 'MIT'
        };

        writeFile(
            configPath,
            JSON.stringify(pkgJson, null, 2) + '\n'
        );
    } else {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Create new directory?',
                default: false
            },
            {
                type: 'input',
                name: 'name',
                message: 'name:',
                default: baseName(cwd()),
            },
            {
                type: 'input',
                name: 'main',
                message: 'main:',
                default: 'main.js'
            },
            {
                type: 'input',
                name: 'version',
                message: 'version:',
                default: '1.0.0'
            },
            {
                type: 'input',
                name: 'keywords',
                message: 'keywords:',
            },
            {
                type: 'input',
                name: 'author',
                message: 'author:',
            },
            {
                type: 'input',
                name: 'license',
                message: 'license:',
                default: 'MIT'
            },
            {
                type: 'list',
                name: 'type',
                message: 'type:',
                choices: ['commonjs', 'module'], // ✅ Fixed: 'commonjs' not 'common'
                default: 'commonjs' // Optional: set a default
            }
        ]);

        const config = {
            name: answers.name,
            version: answers.version,
            main: answers.main,
            scripts: {
                start: `node ${answers.main}`
            },
            keywords: answers.keywords
                .split(',')
                .map(k => k.trim())
                .filter(k => k),
            author: answers.author,
            license: answers.license,
            type: answers.type,
            dependecies: {

            }
        };

        if (answers.confirm === true) {
            const newDir = join(cwd(), answers.name);
            if (!fs.existsSync(newDir)) {
                fs.mkdirSync(newDir, { recursive: true });
            }

            const newConfigPath = join(newDir, 'package.json');
            fs.writeFileSync(newConfigPath, JSON.stringify(config, null, 2), 'utf-8');
            
            console.log(`${check} Created package.json in ${newDir}`);
        } else {
            writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
            console.log(`${check} Created package.json in ${cwd()}`);
        }
    }
}