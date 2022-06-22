import { createTextVNode } from "./h";
import { patch } from "./patch";
import { patchData } from "./utils";
import { ChildrenFlags, VNodeFlags } from "./utils/enums";

interface VNodeData {
  style: CSSStyleDeclaration;
  [propName: string]: any;
}
interface VNode {
  data: VNodeData | null;
  el: Element | SVGElement;
  tag: any;
  children: any;
  flags: VNodeFlags;
  childFlags: ChildrenFlags;
}
// 根据不同的标签类型去挂载不同的标签
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

// 挂载 Element 节点
function mountElement(
  vnode: VNode,
  container: Node,
  isSVG: Boolean | Number = false
) {
  isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG;
  //  如果是 svg 标签需要创建 svg 元素
  const el: HTMLElement = isSVG
    ? document.createElementNS("http://www.w3.org/2000/svg", vnode.tag)
    : document.createElement(vnode.tag);
  // 引用真实 dom 元素
  vnode.el = el;
  const { data, childFlags, children } = vnode;
  if (data) {
    // data 的值是 style value class 或者其自定义的属性
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
function mountComponent(vnode: VNode, container: Node) {
  if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
    // 有状态组件
    mountStatefulComponent(vnode, container);
  } else {
    console.log("函数组件");

    mountFunctionalComponent(vnode, container);
  }
}

function mountStatefulComponent(vnode: VNode, container: Node, isSVG = false) {
  // 将 children 也指向 tag 函数
  const instance = (vnode.children = new vnode.tag());

  // 初始化 props
  instance.$props = vnode.data;

  instance._update = function () {
    if (instance._mounted) {
      console.log("有 mounted 更新");

      // 挂载过则重新渲染 并更新
      const prevVNode = instance.$vnode,
        nextVNode = (instance.$vnode = instance.render());

      patch(prevVNode, nextVNode, container);

      instance.$el = vnode.el = instance.$vnode.el;
    } else {
      // 没有挂载过则挂载
      instance.$vnode = instance.render();

      mount(instance.$vnode, container, isSVG);

      instance._mounted = true;

      instance.$el = vnode.el = instance.$vnode.el;

      // 调用 mounted 钩子
      instance.mounted && instance.mounted();
    }
  };

  // 组件自身状态发生更新后 即可再次调用 _update 函数更新
  instance._update();
}

function mountFunctionalComponent(vnode: any, container: Node, isSVG = false) {
  // 因为 函数式组件没有实例 所以 在 vnode 上定义 update 函数
  vnode.handle = {
    prev: null,
    next: vnode,
    container,
    update: () => {
      // 更新调用
      if (vnode.handle.prev) {
        const prevVNode = vnode.handle.prev,
          nextVNode = vnode.handle.next,
          prevTree = prevVNode.children,
          props = nextVNode.data,
          nextTree = (nextVNode.children = vnode.tag(props));
        // 调用 patch 函数
        patch(prevTree, nextTree, vnode.handle.container);
      } else {
        // 挂载调用
        const props = vnode.data,
          $vnode = (vnode.children = vnode.tag(props));

        mount($vnode, container, isSVG);

        vnode.el = $vnode.el;
      }
    },
  };

  // 先调用一次 update 函数
  vnode.handle.update();
}

// 挂载文本节点
function mountText(vnode: { children: string; el: Node }, container: Node) {
  const el = document.createTextNode(vnode.children);
  vnode.el = el; //引用节点对象
  container.appendChild(el);
}
function mountFragment(
  vnode: { children: any; childFlags: ChildrenFlags; el?: Node },
  container: Node,
  isSVG = false
) {
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
function mountPortal(
  vnode: {
    tag: Node | string;
    children: any;
    childFlags: ChildrenFlags;
    el?: Node;
  },
  container: Node
) {
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
