import { VNodeFlags, ChildrenFlags } from "./utils/enums";

export interface H_Result {
  _isVnode: boolean;
  flags: VNodeFlags; // vNode 枚举值作为标识
  tag: Tag;
  data: any;
  children: any;
  childFlags: ChildrenFlags;
  el: any;
}
type Tag =
  | string
  | typeof Fragment
  | typeof Portal
  | null
  | { [key: string]: any };
// 唯一标识
export const Fragment = Symbol();
export const Portal = Symbol();
export function h(
  tag: Tag,
  data: any = null,
  children: Array<any> | null | { _isVnode: boolean } = null
): H_Result {
  let flags: VNodeFlags = null;
  // 如果是字符串说明传入的是标签
  if (typeof tag === "string") {
    // 判断是不是 svg
    flags = tag === "svg" ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML;
  } else if (tag === Fragment) {
    flags = VNodeFlags.FRAGMENT;
  } else if (tag === Portal) {
    flags = VNodeFlags.PORTAL;
    tag = data && data.target; //要挂载的节点
  } else {
    if (tag !== null && typeof tag === "object") {
      // 兼容 vue 2 写法
      flags = tag.functional
        ? VNodeFlags.COMPONENT_FUNCTIONAL //函数
        : VNodeFlags.COMPONENT_STATEFUL_NORMAL; //有状态
    } else if (typeof tag === "function") {
      // vue3 的类组件
      flags =
        tag.prototype && tag.prototype.render
          ? VNodeFlags.COMPONENT_STATEFUL_NORMAL //有状态
          : VNodeFlags.COMPONENT_FUNCTIONAL; //函数
    }
  }

  let childFlags: ChildrenFlags = null;
  if (Array.isArray(children)) {
    const { length } = children;
    if (length === 0) {
      // 没有 子节点
      childFlags = ChildrenFlags.NO_CHILDREN;
    } else if (length === 1) {
      // 单子节点
      childFlags = ChildrenFlags.SINGLE_VNODE;
      children = children[0];
    } else {
      // 多个子节点 带 key
      childFlags = ChildrenFlags.KEYS_VNODES;
      // 标准Vnode
      children = normalizeVNodes(children);
    }
  } else if (children === null) {
    childFlags = ChildrenFlags.NO_CHILDREN;
  } else if (children._isVnode) {
    childFlags = ChildrenFlags.SINGLE_VNODE;
  } else {
    // 以上条件都不符合 视为文本节点
    childFlags = ChildrenFlags.SINGLE_VNODE;
    // 创建文本节点
    children = createTextVNode(children + "");
  }

  return {
    _isVnode: true,
    flags,
    tag,
    data,
    children,
    childFlags,
    el: null,
  };
}

function normalizeVNodes(children: Array<any>) {
  const newChildren = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (child.key == null) {
      child.key = "|" + i;
    }

    newChildren.push(child);
  }

  return newChildren;
}

export function createTextVNode(text: string): H_Result {
  return {
    _isVnode: true,
    flags: VNodeFlags.TEXT,
    tag: null,
    data: null,
    children: text,
    childFlags: ChildrenFlags.NO_CHILDREN,
    el: null,
  };
}
