import config from "./config";

// export function load() {}
// export function unload() {}

export const methods = {
	/** 打开面板 */
	open() {
		Editor.Panel.open(config.name_s);
	},

	/** 生成脚本 */
	generate() {
		Editor.Message.send("scene", "execute-scene-script", {
			name: config.name_s,
			method: "event_generate",
			args: [],
		});
	},
};
