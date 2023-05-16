import * as core from "@actions/core";
import fetch from "node-fetch";
import _ from "lodash";

class ActionUtils {
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

new ActionUtils(
  core.getInput("function", { required: true }),
  core.getInput("params", { required: true })
);
