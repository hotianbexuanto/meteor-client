import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { FormData, Blob } from 'node-fetch';
import { fileURLToPath } from 'url';

const branch = process.argv[2];
const compareUrl = process.argv[3];
const success = process.argv[4] === "true";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function send(version, number) {
    if (!process.env.DISCORD_WEBHOOK) {
        console.log("Discord webhook URL is not set, skipping webhook notification");
        return;
    }

    fetch(compareUrl)
        .then(res => res.json())
        .then(res => {
            let description = "";

            description += "**Branch:** " + branch;
            description += "\n**Status:** " + (success ? "success" : "failure");

            let changes = "\n\n**Changes:**";
            let hasChanges = false;
            for (let i in res.commits) {
                let commit = res.commits[i];

                changes += "\n- [`" + commit.sha.substring(0, 7) + "`](https://github.com/MeteorDevelopment/meteor-client/commit/" + commit.sha + ") *" + commit.commit.message + "*";
                hasChanges = true;
            }
            if (hasChanges) description += changes;

            if (success) {
                description += "\n\n**Download:** [meteor-client-" + version + "-" + number + "](https://meteorclient.com/download?devBuild=" + number + ")";
            }

            const webhook = {
                username: "Dev Builds",
                avatar_url: "https://meteorclient.com/icon.png",
                embeds: [
                    {
                        title: "meteor client v" + version + " build #" + number,
                        description: description,
                        url: "https://meteorclient.com",
                        color: success ? 2672680 : 13117480
                    }
                ]
            };

            return fetch(process.env.DISCORD_WEBHOOK, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(webhook)
            });
        })
        .catch(error => {
            console.error("Error sending webhook:", error);
        });
}

if (success) {
    try {
        const buildDir = path.resolve(__dirname, "../../build/libs");
        let jar = "";
        fs.readdirSync(buildDir).forEach(file => {
            if (!file.endsWith("-all.jar") && !file.endsWith("-sources.jar")) {
                jar = path.join(buildDir, file);
            }
        });

        if (!jar) {
            throw new Error("No suitable jar file found in build/libs");
        }

        if (!process.env.SERVER_TOKEN) {
            throw new Error("SERVER_TOKEN is not set");
        }

        const form = new FormData();
        form.set(
            "file",
            new Blob([fs.readFileSync(jar)], { type: "application/java-archive" }),
            path.basename(jar)
        );

        fetch("https://meteorclient.com/api/uploadDevBuild", {
            method: "POST",
            headers: {
                "Authorization": process.env.SERVER_TOKEN
            },
            body: form
        })
            .then(async res => {
                let data = await res.json();

                if (res.ok) {
                    send(data.version, data.number);
                }
                else {
                    throw new Error("Failed to upload dev build: " + data.error);
                }
            })
            .catch(error => {
                console.error("Error uploading build:", error);
                process.exit(1);
            });
    }
    catch (error) {
        console.error("Error processing build:", error);
        process.exit(1);
    }
}
else {
    fetch("https://meteorclient.com/api/stats")
        .then(res => res.json())
        .then(res => send(res.dev_build_version, parseInt(res.devBuild) + 1))
        .catch(error => {
            console.error("Error getting stats:", error);
            process.exit(1);
        });
}
