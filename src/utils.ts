import * as core from "@actions/core";
import fetch from "node-fetch";
import _ from "lodash";

export class ActionUtils {
    constructor(fn?: string, params?: string) {
        if (fn && params) {
            // @ts-ignore
            this[fn](...JSON.parse(params));
        }
    }

    async fetch(url: string, method: string = "get", keys: string[] = []) {
        const resp = await fetch(url, {
            method,
        });
        const text = await resp.text();
        try {
            const json = JSON.parse(text);
            if (keys && keys.length) {
                this.setVariable(
                    keys.reduce((data, key) => {
                        data[key.replace(/[\.\[\]]/g, "_")] = _.get(json, key);
                        return data;
                    }, {} as any)
                );
            } else {
                this.setVariable(this.flatObject(JSON.parse(text)));
            }
        } catch (error) {
            this.setVariable({
                body: text,
            });
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