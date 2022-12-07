import config from "./config";
import log from "./log";

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

	/** 场景刷新 */
	scene_update() {
		log.log("场景刷新");
		Editor.Message.send("scene", "execute-scene-script", {
			name: config.name_s,
			method: "event_scene_update",
			args: [],
		});
	},
};
