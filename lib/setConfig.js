"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setConfig = exports.client = void 0;
const client_1 = __importDefault(require("./browser/client"));
exports.setConfig = (options, ctx) => {
    exports.client = new client_1.default(options, ctx);
};
