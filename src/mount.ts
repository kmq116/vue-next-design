import { createTextVNode } from "./h";
import { patchData, unifiedClass } from "./utils";
import { ChildrenFlags, VNodeFlags } from "./utils/enums";

interface VNodeData {
  style: CSSStyleDeclaration;
  [propName: string]: any;
}
interface VNode {
  data: VNodeData;
  el: Element | SVGElement;
  tag: any;
  children: any;
  flags: VNodeFlags;
  childFlags: ChildrenFlags;
}
export function mount(
  vnode: VNode,
  container: Node,
  isSVG: Boolean | Number = false
) {
  const { flags } = vnode;
  if (flags & VNodeFlags.ELEMENT) {
    // 普通标签
    mountElement(vnode, container, isSVG);
  } else if (flags & VNodeFlags.COMPONENT) {
    // 挂载组件
    mountComponent(vnode, container);
  } else if (flags & VNodeFlags.TEXT) {
    // 文本节点
    mountText(vnode, container);
  } else if (flags & VNodeFlags.FRAGMENT) {
    mountFragment(vnode, container);
  } else if (flags & VNodeFlags.PORTAL) {
    mountPortal(vnode, container);
  }
}

function mountElement(
  vnode: VNode,
  container: Node,
  isSVG: Boolean | Number = false
) {
  isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG;

  const el: HTMLElement = isSVG
    ? document.createElementNS("http://www.w3.org/2000/svg", vnode.tag)
    : document.createElement(vnode.tag);
  // 引用真实 dom 元素
  vnode.el = el;
  const { data, childFlags, children } = vnode;
  if (data) {
    // 遍历
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        patchData(el, key, null, data[key]);
      }
    }
  }

  // 没有子节点不递归
  if (childFlags !== ChildrenFlags.NO_CHILDREN) {
    // 单节点 调用 mount 函数
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
      // 子节点 el dom
      mount(children, el, isSVG);
    } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
      // 多个子节点 遍历
      for (let i = 0; i < children.length; i++) {
        mount(children[i], el, isSVG);
      }
    }
  }

  container.appendChild(el);
}

// 组件挂载 有状态 无状态
function mountComponent(vnode, container) {
  if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
    // 有状态组件
    mountStatefulComponent(vnode, container);
  } else {
    mountFunctionalComponent(vnode, container);
  }
}

function mountStatefulComponent(vnode, container, isSVG = false) {
  const instance = new vnode.tag();

  instance.$vnode = instance.render();

  mount(instance.$vnode, container, isSVG);

  instance.$el = vnode.el = instance.$vnode.el;
}

function mountFunctionalComponent(vnode, container, isSVG = false) {
  const $vnode = vnode.tag();

  mount($vnode, container, isSVG);

  vnode.el = $vnode.el;
}

// 挂载文本节点
function mountText(vnode, container) {
  const el = document.createTextNode(vnode.children);
  vnode.el = el; //引用节点对象
  container.appendChild(el);
}
function mountFragment(vnode, container, isSVG = false) {
  const { children, childFlags } = vnode;

  switch (childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      mount(children, container, isSVG);
      vnode.el = children.el;
      break;

    case ChildrenFlags.NO_CHILDREN:
      const placeholder = createTextVNode("");
      mountText(placeholder, container);
      vnode.el = placeholder.el;

      break;
    default:
      for (let i = 0; i < children.length; i++) {
        mount(children[i], container, isSVG);
      }

      vnode.el = children[0].el;
      break;
  }
}

// 挂载到任意节点
function mountPortal(vnode, container) {
  const { tag, children, childFlags } = vnode;

  // 字符串当做节点去获取 否则直接拿节点
  const target = typeof tag === "string" ? document.querySelector(tag) : tag;

  // 单节点
  if (childFlags & ChildrenFlags.SINGLE_VNODE) {
    mount(children, target);
  } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
    // 多节点
    for (let i = 0; i < children.length; i++) {
      mount(children[i], target);
    }
  }

  const placeholder = createTextVNode("");
  mountText(placeholder, container);
  vnode.el = placeholder.el;
}
