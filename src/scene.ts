import log from "./log";
import * as cc from "cc";
import * as fs from "fs";
import config from "./config";
import storage from "./storage";
import path from "path";
import lib_file from "../../@libs/lib_file";
import string_extend from "./lib/string_extend";
import lib_string_extend from "../../@libs/lib_string_extend";

export function load(): void {
	// 初始化本地 lib
	string_extend.init({
		prettier_path_s: Editor.Project.path,
	});
}

export function unload(): void {
	// ...
}

/** 场景事件放在此处 */
export const methods = {
	/** 场景刷新事件 */
	scene_update_fs: [] as { valid_f?: () => boolean; event_f: () => void }[],

	/** 判断基类是否一致 */
	base_class_comparison(value_: any, super_s_: string): boolean {
		const temp = (self as any).cc.js.getSuper(value_);

		if (!temp) {
			return false;
		}
		if ((self as any).cc.js.getClassName(temp) === super_s_) {
			return true;
		}
		return this.base_class_comparison(temp, super_s_);
	},

	/** 查找挂载路径 */
	async find_mount_path(node_: cc.Node): Promise<cc.Component | null> {
		/** 非 cc 组件 */
		const component_as = node_.components.filter(
			(v) => !(self as any).cc.js.getClassName(v).startsWith("cc.")
		);
		/** 挂载组件 */
		let mount_comp: cc.Component | null = null;

		switch (storage.data.mount_position_type) {
			case config.mount_position_type.base:
				{
					mount_comp =
						component_as.find((v) =>
							this.base_class_comparison(v.constructor, storage.data.mount_comp_base)
						) ?? null;
				}

				break;
			case config.mount_position_type.mark:
				{
					for (const v of component_as) {
						if ((v as any).__scriptUuid) {
							const path_s = path.normalize(
								(await Editor.Message.request(
									"asset-db",
									"query-path",
									(v as any).__scriptUuid
								))!
							);

							if (path_s) {
								const content_s = fs.readFileSync(path_s, "utf-8");

								if (content_s?.includes(storage.data.mount_comp_mark)) {
									mount_comp = v;
									break;
								}
							}
						}
					}
				}

				break;
		}
		return mount_comp;
	},

	/** 获取引用节点 */
	async get_nodes(
		root_: cc.Node,
		node_ = root_,
		result_as_: config.generate_result[] = []
	): Promise<config.generate_result[]> {
		/** 中断生成 */
		let break_b: boolean;

		for (const v of node_.children) {
			break_b = false;
			// 生成
			config.generate_config_as.forEach((v2) => {
				if (v.name.match(v2.reg)) {
					if (v2.generate_f) {
						result_as_.push(v2.generate_f(root_, v, storage.data.generate_type));
					}
					// 中断
					else {
						break_b = true;
					}
				}
			});
			// 判断是否为另一个 nodes 节点
			if (!break_b && (await this.find_mount_path(v))) {
				break_b = true;
			}

			if (!break_b) {
				await this.get_nodes(root_, v, result_as_);
			}
		}
		return result_as_;
	},

	/** 删除生成代码 */
	del_generate_code(content_s_: string): string {
		switch (storage.data.generate_type) {
			case config.generate_type.property:
				{
					/** 属性列表 */
					const property_as = content_s_.match(/@property([^\n]*)\n([^;]*);/g);

					// 无属性
					if (!property_as?.length) {
						break;
					}
					/** 字符头 */
					let string_head_s: string;

					// 初始化字符头
					{
						const index_n =
							property_as[0].indexOf("displayName: ") + "displayName: ".length;

						string_head_s = property_as[0].slice(index_n, index_n + 1);
						if (!string_head_s) {
							log.error("del_generate_code - 未找到字符头");
							break;
						}
					}

					/** 删除列表 */
					let del_ss: string[];

					// 初始化删除列表
					{
						const reg = new RegExp(
							`(?<=displayName: ${string_head_s}nodes-)([^${string_head_s}]+)`,
							"g"
						);

						del_ss = property_as.filter((v) => v.match(reg));
						// 不存在删除属性
						if (!del_ss) {
							break;
						}
					}

					// 删除属性
					{
						let index_n: number;

						del_ss.forEach((v_s) => {
							index_n = content_s_.indexOf(v_s);
							if (index_n === -1) {
								log.error("del_generate_code - 删除失败", v_s);
								return;
							}
							content_s_ =
								content_s_.slice(0, index_n) +
								content_s_.slice(
									index_n +
										v_s.length +
										(content_s_[index_n + v_s.length] === "\n" ? 1 : 0)
								);
						});
					}
				}

				break;
			case config.generate_type.script:
				{
					// 删除导入
					{
						const index_n = content_s_.indexOf(
							`import ${storage.data.generate_class_s} from`
						);

						if (index_n === -1) {
							break;
						}
						content_s_ =
							content_s_.slice(0, index_n) +
							content_s_.slice(content_s_.indexOf("\n", index_n) + 1);
					}

					// 删除声明
					{
						const index_n = content_s_.indexOf(
							`nodes!: ${storage.data.generate_class_s};`
						);

						if (index_n === -1) {
							break;
						}
						content_s_ =
							content_s_.slice(0, index_n) +
							content_s_.slice(content_s_.indexOf("\n", index_n) + 1);
					}

					// 删除定义
					{
						const index_n = content_s_.indexOf(
							`this.nodes = new ${storage.data.generate_class_s}`
						);

						if (index_n === -1) {
							break;
						}
						content_s_ =
							content_s_.slice(0, index_n) +
							content_s_.slice(content_s_.indexOf("\n", index_n) + 1);
					}
				}

				break;
		}
		return content_s_;
	},

	/**
	 * 添加生成代码
	 * @param content_s_ 文件内容
	 * @param mount_comp_ 挂载组件
	 * @returns
	 */
	async add_generate_code(content_s_: string, mount_comp_: cc.Component): Promise<string> {
		/** 引用节点数据 */
		const nodes = await this.get_nodes(mount_comp_.node);
		/** 组件名 */
		const comp_name_s = (self as any).cc.js.getClassName(mount_comp_);
		/** 组件路径 */
		const comp_path_s = path.normalize(
			(await Editor.Message.request(
				"asset-db",
				"query-path",
				(mount_comp_ as any).__scriptUuid
			))!
		);

		switch (storage.data.generate_type) {
			case config.generate_type.property:
				{
					// 添加导入
					{
						const index_n = content_s_.indexOf("import * as cc from");

						// 添加
						if (index_n === -1) {
							content_s_ = `import * as cc from "cc";\n` + content_s_;
						}
					}

					// 添加属性
					{
						/** 添加位置 */
						let index_n = content_s_.indexOf(storage.data.mount_comp_mark);

						if (index_n === -1) {
							const match_result = content_s_.match(
								new RegExp(
									// eslint-disable-next-line no-useless-escape
									`export class ${comp_name_s} extends ((?!_)(?!.*?_$)[\w\d_u4e00-u9fa5\.]+)( *){`,
									"i"
								)
							);

							index_n = match_result?.index ?? -1;
							if (index_n === -1) {
								log.error("add_generate_code - 未找到属性生成位置");
								break;
							}
							index_n += match_result![0].length;
						} else {
							index_n += storage.data.mount_comp_mark.length;
						}
						index_n = content_s_.indexOf("\n", index_n);
						// 添加属性
						content_s_ =
							content_s_.slice(0, index_n) +
							"\n" +
							nodes.map((v) => v.value_s).join("\n") +
							content_s_.slice(index_n);
					}

					// 属性赋值
					{
						/** 当前节点路径 */
						const node_path_s = (mount_comp_.node as any)[" INFO "].split(
							", path: "
						)[1];

						this.scene_update_fs.push({
							valid_f: () => Boolean(cc.find(node_path_s)),
							event_f: () => {
								const node = cc.find(node_path_s)!;
								/** 组件下标 */
								const comp_index_n = node.components.findIndex(
									(v) => v.name === mount_comp_.name
								);

								// 更新属性列表
								nodes.forEach((v) => {
									// 场景刷新后 node 失效
									Editor.Message.send("scene", "set-property", {
										uuid: node.uuid,
										path: `__comps__.${comp_index_n}.${v.name_s}`,
										dump: {
											type: "cc.Node",
											value: {
												uuid: cc.find(
													(v.node as any)[" INFO "].split(", path: ")[1]
												)!.uuid,
											},
										},
									});
								});
							},
						});
					}
				}

				break;
			case config.generate_type.script:
				{
					// 添加导入
					{
						const index_n = content_s_.indexOf(
							`import ${storage.data.generate_class_s} from`
						);

						// 添加
						if (index_n === -1) {
							content_s_ =
								`import ${storage.data.generate_class_s} from "./${path.basename(
									comp_path_s,
									".ts"
								)}${storage.data.script_end_s}";\n` + content_s_;
						}
					}

					// 添加声明
					{
						/** 添加位置 */
						let index_n = content_s_.indexOf(storage.data.mount_comp_mark);

						// 初始化添加位置
						{
							if (index_n === -1) {
								const match_result = content_s_.match(
									new RegExp(
										// eslint-disable-next-line no-useless-escape
										`export class ${comp_name_s} extends ((?!_)(?!.*?_$)[\w\d_u4e00-u9fa5\.]+)( *){`,
										"i"
									)
								);

								index_n = match_result?.index ?? -1;
								if (index_n === -1) {
									log.error("add_generate_code - 未找到声明添加位置");
									break;
								}
								index_n += match_result![0].length;
							} else {
								index_n += storage.data.mount_comp_mark.length;
							}
							index_n = content_s_.indexOf("\n", index_n);
						}

						// 添加声明
						content_s_ =
							content_s_.slice(0, index_n) +
							`\nnodes!: ${storage.data.generate_class_s};` +
							content_s_.slice(index_n);
					}

					// 添加定义
					{
						// 直接在 onLoad 添加
						let index_n = content_s_.indexOf("onLoad() {");

						// onLoad 不存在
						if (index_n === -1) {
							const match_result = content_s_.match(
								new RegExp(
									// eslint-disable-next-line no-useless-escape
									`export class ${comp_name_s} extends ((?!_)(?!.*?_$)[\w\d_u4e00-u9fa5\.]+)( *){`,
									"i"
								)
							);
							/** 类开始下标 */
							let class_body_index_n = match_result?.index ?? -1;

							{
								if (class_body_index_n === -1) {
									log.error("add_generate_code - 未找到类开始下标");
									break;
								}
								class_body_index_n += match_result![0].length - 1;
							}

							/** 类体 */
							const body_s = lib_string_extend.get_block(
								content_s_.slice(class_body_index_n)
							)[0];
							/** 新类体 */
							const new_body_s =
								body_s +
								[
									"onLoad() {",
									`this.nodes = new ${storage.data.generate_class_s}(this.node);`,
									"}",
								].join("\n");

							// 更新内容
							content_s_ =
								content_s_.slice(0, class_body_index_n + 1) +
								new_body_s +
								content_s_.slice(class_body_index_n + body_s.length + 1);
						}
						// 存在直接则插入
						else {
							index_n += "onLoad() {".length;
							content_s_ =
								content_s_.slice(0, index_n) +
								`\nthis.nodes = new ${storage.data.generate_class_s}(this.node);` +
								content_s_.slice(index_n);
						}
					}

					// 生成脚本
					{
						let nodes_script_s = fs.readFileSync(
							path.join(config.path_s, "res/template"),
							"utf-8"
						);

						// 类名
						nodes_script_s = nodes_script_s.replace(
							/类名/g,
							storage.data.generate_class_s
						);
						// 声明
						nodes_script_s = nodes_script_s.replace(
							"// 声明",
							nodes.map((v) => `${v.name_s}: cc.Node = null!;`).join("\n")
						);
						// 定义
						nodes_script_s = nodes_script_s.replace(
							"// 定义",
							nodes.map((v) => v.value_s).join("\n")
						);
						// 格式化
						nodes_script_s = string_extend.format(nodes_script_s);
						// 生成
						{
							const path_s = path.join(
								path.dirname(comp_path_s),
								path.basename(comp_path_s, ".ts") +
									storage.data.script_end_s +
									".ts"
							);

							lib_file.add(path_s, nodes_script_s);
						}
					}
				}

				break;
		}

		// 格式化
		content_s_ = string_extend.format(content_s_);
		return content_s_;
	},

	/** 生成节点引用 */
	async generate_nodes(node_uuid_s_: string): Promise<void> {
		const node: cc.Node = (self as any).cce.Node.query(node_uuid_s_);

		if (!node) {
			log.error("generate_nodes - 节点未找到");
			return;
		}
		/** 挂载组件 */
		const mount_comp = await this.find_mount_path(node);

		if (!mount_comp) {
			log.error("generate_nodes - 挂载组件不存在");
			return;
		}
		/** 挂载路径 */
		const mount_path_s = path.normalize(
			(await Editor.Message.request(
				"asset-db",
				"query-path",
				(mount_comp as any).__scriptUuid
			))!
		);
		/** 挂载脚本 */
		let content_s = fs.readFileSync(mount_path_s, "utf-8");

		// 删除旧代码
		content_s = this.del_generate_code(content_s);
		// 生成新代码
		content_s = await this.add_generate_code(content_s, mount_comp);
		// 保存文件
		lib_file.add(mount_path_s, content_s);
	},
	/* ------------------------------- segmentation ------------------------------- */
	/** 生成代码 */
	async event_generate(): Promise<void> {
		const node_uuid_ss: string[] = Editor.Selection.getSelected("node");

		if (!node_uuid_ss.length) {
			return;
		}
		// 更新存储数据
		await storage.update();

		// 生成节点引用
		for (const v_s of node_uuid_ss) {
			await this.generate_nodes(v_s);
		}
		log.log("生成结束");
	},

	/** 场景刷新 */
	event_scene_update(): void {
		// 执行事件
		this.scene_update_fs.forEach(async (v) => {
			if (v.valid_f && !(await v.valid_f())) {
				return;
			}
			v.event_f();
		});
		this.scene_update_fs.splice(0, this.scene_update_fs.length);
	},
};
