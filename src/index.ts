import * as core from "@actions/core";
import { ActionUtils } from "./utils.js";

new ActionUtils(
    core.getInput("function", { required: true }),
    core.getInput("params", { required: true })
);
