import { mount } from "./mount";
import { patch } from "./patch";
export function render(vnode, container) {
  const prevVNode = container.vnode;
  // trick 新增
  if (prevVNode == null) {
    if (vnode) {
      mount(vnode, container);
      // 将 新 vnode 挂载到 container
      container.vnode = vnode;
    }
  } else {
    //更新
    if (vnode) {
      patch(prevVNode, vnode, container);
      container.vnode = vnode;
    } else {
      container.removeChild(prevVNode.el);
      container.vnode = null;
    }
  }
}
