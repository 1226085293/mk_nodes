import * as fs from "fs";
import path from "path";
import * as vue from "vue";
import lib_css from "../../../../@libs/lib_css";
import config from "../../config";
import storage from "../../storage";

const component: vue.Component = {
	template: fs.readFileSync(`${__dirname}/panel_config.html`, "utf-8"),
	methods: {},
	data() {
		return {
			self: null,
			config_root_position_type: config.root_position_type,
			/** 根节点定位类型 */
			get root_position_type() {
				return storage.data.root_position_type;
			},
			set root_position_type(value) {
				storage.data.root_position_type = Number(value);
			},
			/** 根节点基类 */
			get root_base() {
				return storage.data.root_base;
			},
			set root_base(value) {
				storage.data.root_base = value;
			},
			/** 根节点标记 */
			get root_mark() {
				return storage.data.root_mark;
			},
			set root_mark(value) {
				storage.data.root_mark = value;
			},
			config_generate_type: config.generate_type,
			/** 根节点定位类型 */
			get generate_type() {
				return storage.data.generate_type;
			},
			set generate_type(value) {
				storage.data.generate_type = Number(value);

				// 更新视图，避免 ui-prop 导致的一系列问题
				this.self.$refs.script_end_s_root.style.display =
					storage.data.generate_type !== config.generate_type.script ? "none" : "";
			},
			/** 脚本名后缀 */
			get script_end_s() {
				return storage.data.script_end_s;
			},
			set script_end_s(value) {
				storage.data.script_end_s = value;
			},
		};
	},
	watch: {},
	created() {
		this.self = this;
	},
	async mounted() {
		await storage.update();
		// 更新视图
		this.$refs.root_position_type.value = storage.data.root_position_type;
		this.$refs.generate_type.value = storage.data.generate_type;
		this.$refs.root_base.value = storage.data.root_base;
		this.$refs.root_mark.value = storage.data.root_mark;
		this.$refs.script_end_s.value = storage.data.script_end_s;
		this.$refs.script_end_s_root.style.display =
			storage.data.generate_type !== config.generate_type.script ? "none" : "";
	},
};

export = component;
