import { VNodeFlags, ChildrenFlags } from "./utils/enums";
import { mount } from "./mount";
import { patchData } from "./utils/index";

interface VNodeData {
  style: CSSStyleDeclaration;
  [propName: string]: any;
}

interface VNode {
  data: VNodeData;
  el: HTMLElement | SVGElement;
  tag: any;
  children: any;
  flags: VNodeFlags;
  childFlags: ChildrenFlags;
  handle?: {
    prev: VNode | null;
    next: VNode;
    update: () => void;
    container: Node;
  };
}

export function patch(prevVNode: VNode, nextVNode: VNode, container: Node) {
  const nextFlags = nextVNode.flags,
    prevFlags = prevVNode.flags;

  if (prevFlags !== nextFlags) {
    // 类型不相等直接替换
    replaceVNode(prevVNode, nextVNode, container);
  } else if (nextFlags & VNodeFlags.ELEMENT) {
    patchElement(prevVNode, nextVNode, container);
  } else if (nextFlags & VNodeFlags.COMPONENT) {
    patchComponent(prevVNode, nextVNode, container);
  } else if (nextFlags & VNodeFlags.TEXT) {
    patchText(prevVNode, nextVNode, container);
  } else if (nextFlags & VNodeFlags.FRAGMENT) {
    patchFragment(prevVNode, nextVNode, container);
  } else if (nextFlags & VNodeFlags.PORTAL) {
    patchPortal(prevVNode, nextVNode, container);
  }
}

function replaceVNode(prevVNode: VNode, nextVNode: VNode, container: Node) {
  container.removeChild(prevVNode.el);
  // 如果是组件 调用 unmounted
  if (prevVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    const instance = prevVNode.children;

    instance.unmounted && instance.unmounted();
  }
  // 挂载新的 vnode
  mount(nextVNode, container);
}
function patchElement(prevVNode: VNode, nextVNode: VNode, container: Node) {
  // 类型相同 但标签不相同
  if (prevVNode.tag !== nextVNode.tag) {
    replaceVNode(prevVNode, nextVNode, container);
    return;
  }

  // 拿到 el 元素 nextVNode 引用 旧的 el
  const el = (nextVNode.el = prevVNode.el),
    prevData = prevVNode.data,
    nextData = nextVNode.data;

  if (nextData) {
    // 遍历新 data
    for (const key in nextData) {
      if (Object.prototype.hasOwnProperty.call(nextData, key)) {
        patchData(el, key, prevData[key], nextData[key]);
      }
    }
  }

  // 移除新数据中不存在的旧值属性
  if (prevData) {
    // 遍历 prevValue 将不存在的新数据中的数据移除
    for (const key in prevData) {
      const prevValue = prevData[key];
      if (prevValue && !nextData.hasOwnProperty(key)) {
        patchData(el, key, prevValue, null);
      }
    }
  }

  patchChildren(
    prevVNode.childFlags,
    nextVNode.childFlags,
    prevVNode.children,
    nextVNode.children,
    el
  );
}

function patchChildren(
  prevChildFlags: any,
  nextChildFlags: any,
  prevChildren: any,
  nextChildren: any,
  container: Node
) {
  switch (prevChildFlags) {
    // 单子节点
    case ChildrenFlags.SINGLE_VNODE:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新旧都是单节点
          patch(prevChildren, nextChildren, container);
          break;

        case ChildrenFlags.NO_CHILDREN:
          //纠结点单节点 新节点没有子节点 移除新节点就好
          container.removeChild(prevChildren.el);
          break;

        default:
          // 新节点有多个子节点 移除旧节点 遍历添加新节点
          container.removeChild(prevChildren.el);
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container);
          }
          break;
      }
      break;
    // 旧值没有子节点
    case ChildrenFlags.NO_CHILDREN:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 没有纠结点 直接挂载单节点
          mount(nextChildren, container);
          break;

        case ChildrenFlags.NO_CHILDREN:
          break;

        default:
          // 多节点 遍历挂载
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container);
          }
          break;
      }
      break;

    default:
      // 多节点
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 遍历移除旧节点 挂载新节点
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el);
          }
          mount(nextChildren, container);
          break;

        case ChildrenFlags.NO_CHILDREN:
          // 遍历移除旧节点
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el);
          }
          break;

        default:
          // 先移除旧节点 挂载新节点
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el);
          }
          // 挂载新节点
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container);
          }
          break;
      }
      break;
  }
}

function patchComponent(prevVNode: VNode, nextVNode: VNode, container: Node) {
  // 如果组件类型不同 则替换
  if (nextVNode.tag !== prevVNode.tag) {
    replaceVNode(prevVNode, nextVNode, container);
  }

  // 有状态组件更新
  else if (nextVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    // 有状态组件
    const instance = (nextVNode.children = prevVNode.children);
    console.log(nextVNode.data);

    instance.$props = nextVNode.data;

    instance._update();
  } else {
    // 函数式组件
    const handle = (nextVNode.handle = prevVNode.handle);

    handle.prev = prevVNode;
    handle.next = nextVNode;
    handle.container = container;
    handle.update();
  }
}
function patchFragment(prevVNode: VNode, nextVNode: VNode, container: Node) {
  patchChildren(
    prevVNode.childFlags,
    nextVNode.childFlags,
    prevVNode.children,
    nextVNode.children,
    container
  );

  switch (nextVNode.childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      // 单子节点 el 指向子节点
      nextVNode.el = nextVNode.children.el;
      break;
    case ChildrenFlags.NO_CHILDREN:
      // 将节点指向 旧 el
      nextVNode.el = prevVNode.el;
      break;

    default:
      // 多节点 将 el 指向第一个节点
      nextVNode.el = nextVNode.children[0].el;
  }
}
function patchText(prevVNode: VNode, nextVNode: VNode, container: Node) {
  const el = (nextVNode.el = prevVNode.el);
  // 新旧节点信息不一致更新
  if (nextVNode.children !== prevVNode.children) {
    el.nodeValue = nextVNode.children;
  }
}
function patchPortal(prevVNode: VNode, nextVNode: VNode, container: Node) {
  patchChildren(
    prevVNode.childFlags,
    nextVNode.childFlags,
    prevVNode.children,
    nextVNode.children,
    container
  );

  // 新旧元素不同 更新 target
  if (nextVNode.tag !== prevVNode.tag) {
    // 获取新容器元素
    const container =
      typeof nextVNode.tag === "string"
        ? document.querySelector(nextVNode.tag)
        : nextVNode.tag;

    switch (nextVNode.childFlags) {
      // 单子节点 直接挂载
      case ChildrenFlags.SINGLE_VNODE:
        container.appendChild(nextVNode.children.el);
        break;

      case ChildrenFlags.NO_CHILDREN:
        break;

      default:
        for (let i = 0; i < nextVNode.children.length; i++) {
          container.appendChild(nextVNode.children[i].el);
        }
        break;
    }
  }
}
