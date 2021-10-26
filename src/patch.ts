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
    patchFragMent(prevVNode, nextVNode, container);
  } else if (nextFlags & VNodeFlags.PORTAL) {
    patchPortal(prevVNode, nextVNode, container);
  }
}

function replaceVNode(prevVNode: VNode, nextVNode: VNode, container: Node) {
  container.removeChild(prevVNode.el);

  // 挂载新的 vnode
  mount(nextVNode, container);
}
function patchElement(prevVNode: VNode, nextVNode, container) {
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
  prevChildFlags,
  nextChildFlags,
  prevChildren,
  nextChildren,
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
          break;

        case ChildrenFlags.NO_CHILDREN:
          break;

        default:
          break;
      }
      break;

    default:
      // 旧值没有子节点
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          break;

        case ChildrenFlags.NO_CHILDREN:
          break;

        default:
          break;
      }
      break;
  }
}

function patchComponent(prevVNode, nextVNode, container) {}
function patchFragMent(prevVNode, nextVNode, container) {}
function patchText(prevVNode, nextVNode, container) {}
function patchPortal(prevVNode, nextVNode, container) {}
