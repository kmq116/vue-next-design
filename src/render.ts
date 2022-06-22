import { H_Result } from "./h";
import { mount } from "./mount";
import { patch } from "./patch";
// render 函数逻辑从 container 中取出 vnode 节点作为旧节点, vnode 节点作为新节点，根据有无旧节点决定进行 mount 或 patch 操作
export function render(vnode: H_Result, container: Node & { vnode: H_Result }) {
  const prevVNode = container.vnode;
  // trick 新增
  if (prevVNode == null) {
    if (vnode) {
      mount(vnode, container);
      // 将新 vnode 的引用保存在 container
      container.vnode = vnode;
    }
  } else {
    //更新 如果有新节点说明是更新操作 否则是删除操作
    if (vnode) {
      patch(prevVNode, vnode, container);
      container.vnode = vnode;
    } else {
      container.removeChild(prevVNode.el);
      container.vnode = null;
    }
  }
}
