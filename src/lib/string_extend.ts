import path from "path";
import prettier from "prettier";
import * as fs from "fs";
import log from "../log";

class string_extend {
	/* --------------- private --------------- */
	private _config!: string_extend_.init_config;
	/** prettier 配置 */
	private _prettier_config?: prettier.Options;
	/* ------------------------------- 功能 ------------------------------- */
	/** 读取 prettier 配置 */
	private _load_prettier_config(): void {
		if (!this._config.prettier_path_s) {
			return;
		}
		let config_path_s = path.join(this._config.prettier_path_s, ".prettierrc.js");
		// js 配置
		if (fs.existsSync(config_path_s)) {
			this._prettier_config = require(config_path_s);
			return;
		}
		// json 配置
		config_path_s = path.join(this._config.prettier_path_s, ".prettierrc.json");
		if (fs.existsSync(config_path_s)) {
			this._prettier_config = JSON.parse(fs.readFileSync(config_path_s, "utf-8"));
		}
	}

	/** 初始化 */
	init(config_?: string_extend_.init_config): void {
		this._config = new string_extend_.init_config(config_);
		this._load_prettier_config();
	}

	/** 格式化 */
	format(source_s_: string, option_?: prettier.Options | undefined): string {
		let result_s = source_s_;
		try {
			let config = option_ || this._prettier_config;
			// 防止解析错误
			if (config && !config.parser) {
				config.parser = "typescript";
			}
			result_s = prettier.format(
				source_s_,
				config || {
					filepath: "*.ts",
				}
			);
		} catch (err) {
			log.error("格式化代码失败", source_s_);
			result_s = source_s_;
		}
		return result_s;
	}
}

module string_extend_ {
	export class init_config {
		constructor(init_?: init_config) {
			Object.assign(this, init_);
		}
		/** prettier 配置路径 */
		prettier_path_s?: string;
	}
}

export default new string_extend();
