import * as fs from "fs";
import path from "path";
import * as vue from "vue";
import lib_css from "../../../../@libs/lib_css";
import config from "../../config";

const component: vue.Component = {
	template: fs.readFileSync(`${__dirname}/panel_container.html`, "utf-8"),
	methods: {},
	data() {
		return {};
	},
	watch: {},
	created() {},
	mounted() {},
};

export = component;
