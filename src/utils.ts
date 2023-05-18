import * as core from "@actions/core";
import fetch from "node-fetch";
import _ from "lodash";
import yaml from "yaml";
import path from "path";
import fs from "fs";

export class ActionUtils {
    constructor() {
        this.init();
    }

    private init() {
        // 经过测试 actions 仅支持变量名为小写字母
        let fnName: string, params: string[];
        if (core.getInput("params")) {
            fnName = core.getInput("function");
            params = JSON.parse(core.getInput("params"));
        } else {
            const inputNames = Object.keys(process.env)
                .filter((key) => key.startsWith("INPUT_"))
                .map((key) => key.replace("INPUT_", ""));
            const inputParams: any = {};
            inputNames.map((name) => {
                _.set(inputParams, name.toLowerCase(), core.getInput(name));
            });
            fnName = inputParams.function;
            params = inputParams.params;
        }
        core.debug(fnName);
        core.debug(JSON.stringify(params));
        if (fnName && params) {
            // @ts-ignore
            this[fnName](...params);
        } else {
            core.getInput("function", { required: true });
            core.getInput("params", { required: true });
        }
    }

    async fetch(url: string, method: string = "get", keys: string[] = []) {
        const resp = await fetch(url, {
            method,
        });
        const text = await resp.text();
        try {
            const json = JSON.parse(text);
            core.debug(text);
            this.objectToVariable(json, keys);
        } catch (error) {
            this.setVariable({
                body: text,
            });
        }
    }

    json(config: { file?: string; text?: string; keys?: string[] }) {
        let obj: any;
        if (config.file) {
            obj = JSON.parse(this.getFileText(config.file));
        } else if (config.text) {
            obj = JSON.parse(config.text);
        }
        core.debug(JSON.stringify(config));
        core.debug(JSON.stringify(obj));
        this.objectToVariable(obj, config.keys);
    }

    yaml(config: { file?: string; text?: string; keys?: string[] }) {
        let obj: any;
        if (config.file) {
            obj = yaml.parse(this.getFileText(config.file));
        } else if (config.text) {
            obj = yaml.parse(config.text);
        }
        core.debug(JSON.stringify(config));
        core.debug(JSON.stringify(obj));
        this.objectToVariable(obj, config.keys);
    }

    private getFileText(file: string) {
        const env: any = process.env;
        return fs
            .readFileSync(path.join(env.GITHUB_WORKSPACE, file))
            .toString();
    }

    private objectToVariable(obj: any, keys: string[] = []) {
        if (keys && keys.length) {
            this.setVariable(
                keys.reduce((data, key) => {
                    data[key.replace(/[\.\[\]]/g, "_")] = _.get(obj, key);
                    return data;
                }, {} as any)
            );
        } else {
            this.setVariable(this.flatObject(obj));
        }
    }

    async docker(
        username: string,
        password: string,
        repo: string,
        info: Record<string, string>
    ) {
        const resp = (await (
            await fetch("https://hub.docker.com/v2/users/login", {
                body: JSON.stringify({
                    username,
                    password,
                }),
                headers: {
                    "content-type": "application/json",
                },
                method: "post",
            })
        ).json()) as { token: string };
        const token = resp.token;
        const changeResult = (await (
            await fetch(
                `https://hub.docker.com/v2/repositories/${username}/${repo}`,
                {
                    body: JSON.stringify(info),
                    headers: {
                        "content-type": "application/json",
                        authorization: `JWT ${token}`,
                    },
                    method: "patch",
                }
            )
        ).json()) as any;
        core.debug(changeResult);
    }

    private setVariable(data: Record<string, string>) {
        Object.keys(data).map((key) => {
            core.debug(`${key.replace(/[\.\[\]]/g, "_")}=${data[key]}`);
            core.exportVariable(key.replace(/[\.\[\]]/g, "_"), data[key]);
        });
    }

    private flatObject(object: any, prop = "", isArray = false) {
        return _.toPairs(object).reduce((obj, [key, value]) => {
            if (isArray) {
                key = `[${key}]`;
            }
            if (_.isObjectLike(value)) {
                obj = {
                    ...obj,
                    ...this.flatObject(
                        value,
                        [prop, key].filter(Boolean).join("."),
                        _.isArray(value)
                    ),
                };
            } else {
                obj[[prop, key].filter(Boolean).join(".")] = value;
            }
            return obj;
        }, {} as Record<string, any>);
    }
}
