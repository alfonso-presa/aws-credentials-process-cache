#!/usr/bin/env node

const {spawn} = require("child_process");
const homedir = require("os").homedir();
const fs = require("fs");
const {promisify} = require("util");
const {join} = require("path");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const SingleInstance = require('single-instance');
const file = join(homedir, '.aws_creds_cache');

async function getOutput(command) {
    return new Promise((resolve, reject) => {
        let result = '';
        const child = spawn(command[0], command.slice(1), {env: {
            ...process.env,
            AWS_PROFILE: undefined,
            LD_LIBRARY_PATH: undefined,
        }});
        child.stdout.on('data', function(data) {
            result+=data;
        });
        child.stderr.pipe(process.stderr);
        child.on('close', (code) => {
            (!code ? resolve: reject)(result);
        });
    });
}

async function updateCreds(creds, profile) {
    const command = await getOutput(['aws','configure','get','credential_process','--profile='+profile]);
    const response = await getOutput(command.trim().split(" "));
    creds[profile] = JSON.parse(response);
    await writeFile(file, JSON.stringify(creds));
}

function expired(credential) {
    var retdate = new Date();
    var mydate = new Date(credential.Expiration);
    return retdate > mydate;
}

async function doIt(profile) {
    const locker = new SingleInstance('aws-credentials-cache-' + profile);
    let flag = true;
    while(flag) {
        try {
            await locker.lock();
            flag = false;
        } catch(e) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    let creds = {};
    try {
        creds = JSON.parse(await readFile(file));
        if(!creds || !creds[profile] || expired(creds[profile])) {
            await updateCreds(creds, profile);
        }
    } catch(e) {
        await updateCreds(creds, profile);
    }

    console.log(JSON.stringify(creds[profile], null, 2));
    await locker.unlock();
}

doIt(process.argv[2]);
