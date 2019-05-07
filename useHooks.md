@(MarkDown)

## useHooks
#### 简介

Hooks是React 16.8新增的一项特性，可以让你在不用class的情况下去使用state和React的其他功能。这篇文章提供了简单易懂的案例，帮助你去了解hooks如何使用，并且鼓励你在接下来的项目中去使用它。再次之前，请确保你已经看了[官方文档](https://reactjs.org/docs/hooks-intro.html)

#### useEventListener

如果你发现自己使用`useEffect`添加了许多事件监听，那你可能需要考虑将这些逻辑封装成一个通用的hook。在下面的使用窍门里，我们创建了一个叫`useEventListener`的hook，这个hook会检查`addEventListener`是否被支持、添加事件监听并且在cleanup钩子中清空。你可以在[CodeSandbox demo](https://codesandbox.io/s/z64on3ypm)上查看动态实例。