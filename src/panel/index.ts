import * as fs from "fs";
import path from "path";
import * as vue from "vue";
import lib_css from "../../../@libs/lib_css";
import config from "../config";
import * as panel_config from "./config/panel_config";
import * as panel_container from "./container/panel_container";

const weak_map = new WeakMap<any, vue.App>();

const option = {
	listeners: {},
	template: fs.readFileSync(`${__dirname}/index.html`, "utf-8"),
	style: fs.readFileSync(`${__dirname}/index.css`, "utf-8"),
	$: {
		app: "#app",
	},
	methods: {},
	ready() {
		if (this.$.app) {
			const app = vue.createApp({});
			// 标记自定义元素
			app.config.compilerOptions.isCustomElement = (tag_s) => tag_s.startsWith("ui-");
			// 面板容器
			app.component("container", panel_container);
			// 配置面板
			app.component("config", panel_config);
			// 挂载
			app.mount(this.$.app);
			weak_map.set(this, app);
		}
	},
	beforeClose() {},
	close() {
		const app = weak_map.get(this);
		if (app) {
			app.unmount();
		}
	},
};

export = Editor.Panel.define(option);
