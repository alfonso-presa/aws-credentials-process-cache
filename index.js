#!/usr/bin/env node

const {spawn} = require("child_process");
const homedir = require("os").homedir();
const fs = require("fs");
const {promisify} = require("util");
const {join} = require("path");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function getOutput(command) {
    return new Promise((resolve, reject) => {
        let result = '';
        const child = spawn(command[0], command.slice(1));
        child.stdout.on('data', function(data) {
            result+=data;
        });
        child.stderr.pipe(process.stderr);
        child.on('close', (code) => {
            (!code ? resolve: reject)(result);
        });
    });
}

async function awsume(profile) {
    const command = await getOutput(['aws','configure','get','credential_process','--profile='+profile]);
    return getOutput(['sh','-c',command]);
}

function expired(credential) {
    var retdate = new Date();
    var mydate = new Date(credential.Expiration);
    return retdate > mydate;
}

async function doIt(profile) {
    let save = false;
    let creds = {};
    const file = join(homedir, '.aws_creds_cache');

    try {
        creds = JSON.parse(await readFile(file));
        if(!creds || !creds[profile] || expired(creds[profile])) {
            save=true;
            creds[profile] = JSON.parse(await awsume(profile));
        }

    } catch(e) {
        save=true;
        creds[profile] = JSON.parse(await awsume(profile));
    }

    if(save) {
        writeFile(file, JSON.stringify(creds));
    }
    console.log(JSON.stringify(creds[profile], null, 2));
}

doIt(process.argv[2]);
