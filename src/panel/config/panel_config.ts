import * as fs from "fs";
import * as vue from "vue";
import config from "../../config";
import storage from "../../storage";

const component: vue.Component = {
	template: fs.readFileSync(`${__dirname}/panel_config.html`, "utf-8"),
	methods: {},
	data() {
		return {
			config_mount_position_type: config.mount_position_type,
			config_generate_type: config.generate_type,
			/** 生成类型 */
			generate_type: config.generate_type.property,
			/** 根节点定位类型 */
			mount_position_type: config.mount_position_type.mark,
			/** 根节点定位基类 */
			mount_comp_base: "cc.Component",
			/** 根节点定位标记 */
			mount_comp_mark: "extends Component {",
			/** 脚本名后缀 */
			script_end_s: "Nodes",
			/** 生成类名 */
			generate_class_s: "Nodes",
		};
	},
	watch: {
		/** 挂载定位方式 */
		mount_position_type(value) {
			storage.data.mount_position_type = Number(value);
		},
		/** 挂载组件基类 */
		mount_comp_base(value) {
			storage.data.mount_comp_base = value;
		},
		/** 挂载组件标记 */
		mount_comp_mark(value) {
			storage.data.mount_comp_mark = value;
		},
		/** 生成方式 */
		generate_type(value) {
			storage.data.generate_type = Number(value);
		},
		/** 脚本名后缀 */
		script_end_s(value) {
			storage.data.script_end_s = value;
		},
		/** 生成类名 */
		generate_class_s(value) {
			storage.data.generate_class_s = value;
		},
	},
	created() {
		this.self = this;
	},
	async mounted() {
		await storage.update();
		this.generate_type = storage.data.generate_type;
		this.mount_position_type = storage.data.mount_position_type;
		this.mount_comp_base = storage.data.mount_comp_base;
		this.mount_comp_mark = storage.data.mount_comp_mark;
		this.script_end_s = storage.data.script_end_s;
		this.generate_class_s = storage.data.generate_class_s;
	},
};

export = component;
