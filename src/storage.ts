import config from "./config";

class storage {
	constructor() {
		this.update();

		let data = this.data;
		this.data = new Proxy(data, {
			get: (target, key) => {
				return (data as any)[key];
			},
			set: (target, key, value) => {
				(data as any)[key] = value;
				Editor.Profile.setConfig(config.name_s, key as string, value);
				return true;
			},
		});
	}
	data = {
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
	};
	/* ------------------------------- 功能 ------------------------------- */
	/** 更新存储数据 */
	async update(key_?: keyof storage["data"]): Promise<void> {
		if (key_) {
			(this as any)["data"][key_] =
				(await Editor.Profile.getConfig(config.name_s, key_)) ?? (this as any)[key_];
		} else {
			for (let k_s in this.data) {
				if (typeof (this.data as any)[k_s] !== "function") {
					(this.data as any)[k_s] =
						(await Editor.Profile.getConfig(config.name_s, k_s)) ??
						(this.data as any)[k_s];
				}
			}
		}
	}
}

export default new storage();
