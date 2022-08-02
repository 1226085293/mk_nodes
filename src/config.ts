import path from "path";
import * as cc from "cc";

module config {
	/** 根节点定位类型 */
	export enum root_position_type {
		/** 固定基类 */
		base,
		/** 生成标记 */
		mark,
	}

	/** 生成类型 */
	export enum generate_type {
		/** 属性 */
		property,
		/** 脚本 */
		script,
	}

	/** 生成返回数据 */
	export interface generate_result {
		/** 变量名 */
		name_s: string;
		/** 值 */
		value_s: string;
		/** 节点 */
		node: cc.Node;
	}

	/** 生成配置 */
	export interface generate_config {
		/** 正则表达式 */
		reg: RegExp;
		/** 生成函数（不存在则中断生成） */
		generate_f?: (
			/** 挂载节点 */
			root: cc.Node,
			/** 当前节点 */
			node: cc.Node,
			/** 生成类型 */
			type: generate_type
		) => generate_result;
	}

	/** 插件名 */
	export const name_s = "mk_nodes";
	/** 插件根目录 */
	export const root_path_s = Editor.Package.getPath(name_s);
	/** 插件目录 */
	export const path_s = path.resolve(__dirname, "..");
	/** 生成配置 */
	export const generate_config_as: generate_config[] = [
		// 节点
		{
			reg: /^(\+|-\+)/g,
			generate_f: (root: cc.Node, node: cc.Node, type: generate_type) => {
				let name_ss = node.name.slice(1).split("@");
				/** 变量名 */
				let name_s = (name_ss[1] || name_ss[0]).replace(/[^\w\u4e00-\u9fa5]/g, "_");
				/** 值 */
				let value_s = "";
				/** 根节点路径 */
				let root_path_s = (root as any)[" INFO "].split(", path: ")[1];
				/** 当前节点路径 */
				let node_path_s = (node as any)[" INFO "].split(", path: ")[1];

				// 脚本
				if (type === generate_type.script) {
					value_s = `this.${name_s} = node.getChildByPath("${node_path_s.slice(
						root_path_s.length + 1
					)}")!;`;
				}
				// 属性
				else {
					value_s = [
						`@property({ displayName: "nodes-${
							name_ss[0] || name_ss[1]
						}", type: Node })`,
						`${name_s}: Node = null!;`,
					].join("\n");
				}
				return {
					name_s: name_s,
					value_s: value_s,
					node: node,
				};
			},
		},
		// 排除子节点
		{
			reg: /^(-|\+-)/g,
		},
	];
}

export default config;
