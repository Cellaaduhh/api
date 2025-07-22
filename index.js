import express from 'express';
import chalk from 'chalk';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import serverless from 'serverless-http';

import './function.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

const settingsPath = join(__dirname, '../src/settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
global.apikey = settings.apiSettings.apikey;
global.totalreq = 0;

app.use((req, res, next) => {
    console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Request Route: ${req.path} `));
    global.totalreq++;
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === 'object') {
            const responseData = {
                status: data.status,
                creator: settings.apiSettings.creator || "Created Using Skyzo",
                ...data
            };
            return originalJson.call(this, responseData);
        }
        return originalJson.call(this, data);
    };
    next();
});

// API routes loader
let totalRoutes = 0;
const apiFolder = join(__dirname, '../src/api');

fs.readdirSync(apiFolder).forEach((subfolder) => {
    const subfolderPath = join(apiFolder, subfolder);
    if (fs.statSync(subfolderPath).isDirectory()) {
        fs.readdirSync(subfolderPath).forEach((file) => {
            const filePath = join(subfolderPath, file);
            if (path.extname(file) === '.js') {
                import(filePath).then(module => module.default(app));
                totalRoutes++;
                console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${file} `));
            }
        });
    }
});

console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Total Routes Loaded: ${totalRoutes} `));

app.get('/', (req, res) => {
    res.json({ status: true, message: 'API jalan di Vercel!' });
});

export default serverless(app);
