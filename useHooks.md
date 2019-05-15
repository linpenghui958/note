## useHooks - 一期
#### 简介

Hooks是React 16.8新增的一项特性，可以让你在不使用class的情况下去使用state和React的其他功能。这篇文章提供了简单易懂的案例，帮助你去了解hooks如何使用，并且鼓励你在接下来的项目中去使用它。但是在此之前，请确保你已经看了[hook的官方文档](https://reactjs.org/docs/hooks-intro.html)

#### useEventListener

如果你发现自己使用`useEffect`添加了许多事件监听，那你可能需要考虑将这些逻辑封装成一个通用的hook。在下面的使用窍门里，我们创建了一个叫`useEventListener`的hook，这个hook会检查`addEventListener`是否被支持、添加事件监听并且在cleanup钩子中清空监听。你可以在[CodeSandbox demo](https://codesandbox.io/s/z64on3ypm)上查看在线实例。

```javascript
import { useRef, useEffect, useCallback } from 'react';

// 使用
function App(){
  // 用来储存鼠标位置的State
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  
  // 利用useCallback来处理回调
  // ... 这里依赖将不会发生改变
  const handler = useCallback(
    ({ clientX, clientY }) => {
      // 更新坐标
      setCoords({ x: clientX, y: clientY });
    },
    [setCoords]
  );
  
  // 使用自定义的hook添加事件
  useEventListener('mousemove', handler);
  
  return (
    <h1>
      The mouse position is ({coords.x}, {coords.y})
    </h1>
  );
}

// Hook
function useEventListener(eventName, handler, element = global){
  // 创建一个储存处理方法的ref
  const savedHandler = useRef();
  
  // 当处理函数改变的时候更新ref.current的方法
  // 这样可以使我们的总是获取到最新的处理函数
  // 并且不需要在它的effect依赖数组中传递
  // 并且避免有可能每次渲染重新引起effect方法
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      // 确认是否支持addEventListener
      const isSupported = element && element.addEventListener;
      if (!isSupported) return;
      
      // 创建一个调用储存在ref中函数的事件监听
      const eventListener = event => savedHandler.current(event);
      
      // 添加事件监听
      element.addEventListener(eventName, eventListener);
      
      // 在cleanup的回调中，清除事件监听
      return () => {
        element.removeEventListener(eventName, eventListener);
      };
    },
    [eventName, element] // 当元素或者绑定事件改变时，重新运行
  );
};
```

>  [donavon/use-event-listener](https://github.com/donavon/use-event-listener) - 这个库可以作为这个hook的原始资源。

#### useWhyDidYouUpdate

这个hook让你更加容易观察到是哪一个prop的改变导致了一个组件的重新渲染。如果一个函数运行一次的成本非常的高，并且你也知道它会因为哪些prop造成重复的渲染，你可以使用**React.memo**这个高阶组件来解决这个问题，在接下来有一个**Counter**的组件将会使用这个特性。在这个案例中，如果你还在寻找一些看起来不必要的重新渲染，你可以使用**useWhyDidYouUpdate**这个hook，并且在你的控制台查看哪一个prop在这次渲染中发生了改变和它改变前后的值。Pretty nifty huh?
你可以在这里查看在线实例。[CodeSandbox demo](https://codesandbox.io/s/kx83n7201o)

```javascript
import { useState, useEffect, useRef } from 'react';

// 让我们装作这个<Counter>组件的重新渲染成本很高...
// ... 我们使用React.memo将它包裹起来，但是我们仍然需要寻找性能问题 :/
// 因此我们添加useWhyDidYouUpdate并在控制台查看将会发生什么
const Counter = React.memo(props => {
  useWhyDidYouUpdate('Counter', props);
  return <div style={props.style}>{props.count}</div>;
});

function App() {
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState(0);

  // 我们的控制台告诉了我们 <Counter> 的样式prop...
  // ... 在每一次重新渲染中的改变，即使我们只通过按钮改变了userId的状态 ...
  // ... 这是因为每一次重新渲染中counterStyle都被重新创建了一遍
  // 感谢我们的hook让我们发现了这个问题，并且提醒我们或许应该把这个对象移到component的外部
  const counterStyle = {
    fontSize: '3rem',
    color: 'red'
  };

  return (
    <div>
      <div className="counter">
        <Counter count={count} style={counterStyle} />
        <button onClick={() => setCount(count + 1)}>Increment</button>
      </div>
      <div className="user">
        <img src={`http://i.pravatar.cc/80?img=${userId}`} />
        <button onClick={() => setUserId(userId + 1)}>Switch User</button>
      </div>
    </div>
  );
}

// Hook
function useWhyDidYouUpdate(name, props) {
  // 获得一个可变的kef对象，我们可以用来存储props并且在下一次hook运行的时候进行比较
  const previousProps = useRef();

  useEffect(() => {
    if (previousProps.current) {
      // 获取改变前后所有的props的key值
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      // 使用这个对象去跟踪改变的props
      const changesObj = {};
      // 通过key值进行循环
      allKeys.forEach(key => {
        // 判断改变前的值是否和当前的一致
        if (previousProps.current[key] !== props[key]) {
          // 将prop添加到用来追踪的对象中
          changesObj[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });

      // 如果改变的props不为空，则输出到控制台
      if (Object.keys(changesObj).length) {
        console.log('[why-did-you-update]', name, changesObj);
      }
    }

    // 最后将当前的props值保存在previousProps中，以供下一次hook进行的时候使用
    previousProps.current = props;
  });
}
```

#### useDarkMode
这个hook包含了，当你需要在你的网站添加一个黑暗模式的所有状态逻辑。它利用localStorage去记住用户选择的模式、默认浏览器或者系统级别设置使用`prefers-color-schema`媒体查询和管理`.dark-mode`的类名去在body上应用你自己的样式。
这篇文章同样能帮助你了解将hook组合起来的威力。将state中的状态同步到localStorage中使用的是`useLocalStorage`hook。检测用户的黑暗模式偏好使用的`useMeida`hook。这两个hook都是我们在其他案例中创建的，但是这里我们将它们组合起来，使用相当少的行数创建一个非常有用的hook。It's almost as if hooks bring the compositional power of React components to stateful logic! 🤯

```javascript
// Usage
function App() {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <div>
      <div className="navbar">
        <Toggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>
      <Content />
    </div>
  );
}

// Hook
function useDarkMode() {
  // 使用我们useLocalStorage hook即使在页面刷新后也能保存状态
  const [enabledState, setEnabledState] = useLocalStorage('dark-mode-enabled');

  // 查看用户是否已经为黑暗模式设置了一个浏览器或系统偏好
  // usePrefersDarkMode hook 组合了 useMedia hook （查看接下来的代码）
  const prefersDarkMode = usePrefersDarkMode();

  // If enabledState is defined use it, otherwise fallback to prefersDarkMode.
  // 这允许用户在我们的网站上覆盖掉系统级别的设置
  const enabled =
    typeof enabledState !== 'undefined' ? enabledState : prefersDarkMode;

  // 改变黑暗模式
  useEffect(
    () => {
      const className = 'dark-mode';
      const element = window.document.body;
      if (enabled) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    },
    [enabled] // 只要当enabled改变时调用该方法
  );

  // 返回enabled的状态和设置方法
  return [enabled, setEnabledState];
}

// 组合useMedia hook去检测黑暗模式的偏好
// useMedia被设计成可以支持多种媒体查询并且返回数值。
// 感谢hook的组合，我们可以把这一块的复杂性隐藏起来
// useMedia的方法在接下来的文章中
function usePrefersDarkMode() {
  return useMedia(['(prefers-color-scheme: dark)'], [true], false);
}

```

> [donavon/use-dark-mode](https://github.com/donavon/use-dark-mode) - 这个钩子一个更可配置的的实现，并且同步了不同浏览器tab和处理的SSR情况。为这篇文章提供了很多代码和灵感。

#### useMedia
这个hook让你轻易可以在你的component逻辑里使用媒体查询。在我们的例子中，我们可以根据哪一个媒体查询匹配到了当前屏幕的宽度，并渲染不同的列数。然后分配图片在列中不同的位置以限制列的高度差（我们并不像希望某一列比剩下的都要长）。
你可以创建一个直接获取屏幕宽度的hook，代替使用媒体查询。但是这个方法会让你更容易在JS和你的Stylesheet共享媒体查询。这里查看[在线示例](https://codesandbox.io/s/6jlmpjq9vw)。

```javascript
import { useState, useEffect } from 'react';

function App() {
  const columnCount = useMedia(
    // 媒体查询
    ['(min-width: 1500px)', '(min-width: 1000px)', '(min-width: 600px)'],
    // 列数 （跟上方的媒体查询数组根据下标相关）
    [5, 4, 3],
    // 默认列数
    2
  );

  // 创建一个默认的列高度数组，以0填充
  let columnHeights = new Array(columnCount).fill(0);

  // 创建一个数组用来储存每列的元素，数组的每一项为一个数组
  let columns = new Array(columnCount).fill().map(() => []);

  data.forEach(item => {
    // 获取高度最矮的那一项
    const shortColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    // 添加item
    columns[shortColumnIndex].push(item);
    // 更新高度
    columnHeights[shortColumnIndex] += item.height;
  });

  // 渲染每一列和其中的元素
  return (
    <div className="App">
      <div className="columns is-mobile">
        {columns.map(column => (
          <div className="column">
            {column.map(item => (
              <div
                className="image-container"
                style={{
                  // 根据图片的长宽比例调整图片容器
                  paddingTop: (item.height / item.width) * 100 + '%'
                }}
              >
                <img src={item.image} alt="" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook
function useMedia(queries, values, defaultValue) {
  // 一个包含了是否匹配每一个媒体查询的数组
  const mediaQueryLists = queries.map(q => window.matchMedia(q));

  // 根据匹配的媒体查询取值的方法
  const getValue = () => {
    // 获取第一个匹配的媒体查询的下标
    const index = mediaQueryLists.findIndex(mql => mql.matches);
    // 返回相对应的值或者默认值
    return typeof values[index] !== 'undefined' ? values[index] : defaultValue;
  };

  // 匹配值的state和setter
  const [value, setValue] = useState(getValue);

  useEffect(
    () => {
      // 回调方法
      // 注意：通过在useEffect外定义getValue ...
      // ... 我们可以确定它又从hook的参数传入的最新的值（在这个hook的回调第一次在mount的时候被创建）
      const handler = () => setValue(getValue);
      // 为上面每一个媒体查询设置一个监听作为一个回调
      mediaQueryLists.forEach(mql => mql.addListener(handler));
      // 在cleanup中清除监听
      return () => mediaQueryLists.forEach(mql => mql.removeListener(handler));
    },
    [] // 空数组保证了effect只会在mount和unmount时运行
  );

  return value;
}
```

> [useMedia v1](https://gist.github.com/gragland/ed8cac563f5df71d78f4a1fefa8c5633/c769cdc6a658b3925e9e2e204d228400d132965f) - 这个小方法的原始方案，使用一个事件监听浏览器的resize事件，效果也很好，但是只对屏幕宽度的媒体查询有用。
> [Masonry Grid](https://codesandbox.io/s/26mjowzpr?from-embed) - useMedia v1的源码。这个demo在图片改变列数时使用react-spring进行动画。

#### useLockBodyScroll

有时候当一些特别的组件在你们的页面中展示时，你想要阻止用户滑动你的页面（想一想modal框或者移动端的全屏菜单）。如果你看到modal框下的内容滚动尤其是当你打算滚动modal框内的内容时，这可能会让人很困惑。这个hook解决了这个问题。在任意组件内使用这个hook，只有当然这个组件unmount的时候，页面才会被解锁滑动。[在线实例](https://codesandbox.io/s/yvkol51m81)

```javascript
import { useState, useLayoutEffect } from 'react';

// 使用
function App(){
  // modal框的state
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <div>
      <button onClick={() => setModalOpen(true)}>Show Modal</button>
      <Content />
      {modalOpen && (
        <Modal
          title="Try scrolling"
          content="I bet you you can't! Muahahaha 😈"
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function Modal({ title, content, onClose }){
  // 调用hook锁定body滚动
  useLockBodyScroll();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal">
        <h2>{title}</h2>
        <p>{content}</p>
      </div>
    </div>
  );
}

// Hook
function useLockBodyScroll() {
  useLayoutEffect(() => {
   // 获取原始body的overflow值
   const originalStyle = window.getComputedStyle(document.body).overflow;  
   //防止在mount的过程中滚动
   document.body.style.overflow = 'hidden';
   // 当组件unmount的时候解锁滚动
   return () => document.body.style.overflow = originalStyle;
   }, []); // 空数组保证了effect函数只会在mount和unmount的时候运行
}
```

> [How hooks might shape desgin systems built in React](https://jeremenichelli.io/2019/01/how-hooks-might-shape-design-systems-built-in-react/) - 一篇非常棒，启发了这个小方法的文章。他们版本的useLockBodyScroll hook接受一个切换参数从而对锁定状态提供更多控制。

#### useTheme
这个hook帮助你简单使用CSS变量动态的改变你的app的表现。你只需要简单的在你文档的根元素传递一个，你想用来更新并且hook更新的每一个变量包含键值对的CSS变量。这在你无法使用行内样式（没有伪类支持）以及在你们的主题样式里有太多方式排列（例如一个可以让用户定制他们的外观形象的app应用）的情况下很有用。值得注意的是，许多css-in-js的库支持动态的样式，但是尝试一下仅仅使用CSS变量和一个React hook来完成会是非常有趣的。下面的例子非常简单，但是你可以想象一下主题对象是被存储在state中或者从接口获取的。一定要看看这个有趣的[在线实例](https://codesandbox.io/s/15mko9187)。

```javascript
import { useLayoutEffect } from 'react';
import './styles.scss'; // -> https://codesandbox.io/s/15mko9187

// Usage
const theme = {
  'button-padding': '16px',
  'button-font-size': '14px',
  'button-border-radius': '4px',
  'button-border': 'none',
  'button-color': '#FFF',
  'button-background': '#6772e5',
  'button-hover-border': 'none',
  'button-hover-color': '#FFF'
};

function App() {
  useTheme(theme);

  return (
    <div>
      <button className="button">Button</button>
    </div>
  );
}

// Hook
function useTheme(theme) {
  useLayoutEffect(
    () => {
      // 循环这个主题对象
      for (const key in theme) {
        // 更新文档根元素的css变量
        document.documentElement.style.setProperty(`--${key}`, theme[key]);
      }
    },
    [theme] // 只要当主题对象发行改变时才会再次运行
  );
}
```

> [CSS Variables and React](https://medium.com/geckoboard-under-the-hood/how-we-made-our-product-more-personalized-with-css-variables-and-react-b29298fde608) -  一篇激发了这个小方法的博文，来自Dan Bahrami。

#### useSpring
这个hook是react-spring的一部分，react-spring是一个可以让你使用高性能物理动画的库。我试图在这里避免引入依赖关系，但是这一次为了暴露这个非常有用的库，我要破例做一次。react-spring的优点之一就是允许当你使用动画时完全的跳过React render的生命周期。这样经常可以得到客观的性能提升。在接下来的例子中，我们将渲染一行卡片并且根据鼠标移过每一个卡片的位置应用spring动画效果。为了实现这个效果，我们使用由一组将要变换的值组成的数组来调用useSpring hook。渲染一个动画组件（由react-spring导出），用onMouseMove事件获取鼠标的位置。然后调用setAnimationProps（hook返回的函数）去更新。你可以阅读下面的代码的注释，或者直接查看[在线实例](https://codesandbox.io/s/6jlvz1j5q3)

```javascript
import { useState, useRef } from 'react';
import { useSpring, animated } from 'react-spring';

// 展示一行卡片
// Usage of hook is within <Card> component below
function App() {
  return (
    <div className="container">
      <div className="row">
        {cards.map((card, i) => (
          <div className="column">
            <Card>
              <div className="card-title">{card.title}</div>
              <div className="card-body">{card.description}</div>
              <img className="card-image" src={card.image} />
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ children }) {
  // 我们使用这个ref来储存从onMouseMove事件中获取的元素偏移值和大小
  const ref = useRef();
  
  // 持续跟踪这个卡片是否hover状态，这样我们可以确保这个卡片的层级在其他动画上面
  const [isHovered, setHovered] = useState(false);
  
  // The useSpring hook
  const [animatedProps, setAnimatedProps] = useSpring({
    // 用来储存这些值 [rotateX, rotateY, and scale] 的数组
    // 我们使用一个组合的key（xys）来代替分开的key，这样我们可以在使用animatedProps.xys.interpolate()去更新css transform的值
    xys: [0, 0, 1],
    // Setup physics
    config: { mass: 10, tension: 400, friction: 40, precision: 0.00001 }
  });

  return (
    <animated.div
      ref={ref}
      className="card"
      onMouseEnter={() => setHovered(true)}
      onMouseMove={({ clientX, clientY }) => {
        // 获取鼠标X坐标相对卡片的位置
        const x =
          clientX -
          (ref.current.offsetLeft -
            (window.scrollX || window.pageXOffset || document.body.scrollLeft));

        // 获取鼠标Y相对卡片的位置
        const y =
          clientY -
          (ref.current.offsetTop -
            (window.scrollY || window.pageYOffset || document.body.scrollTop));

        // 根据鼠标的位置和卡片的大小设置动画的值
        const dampen = 50; // 数字越小，旋转的角度越小
        const xys = [
          -(y - ref.current.clientHeight / 2) / dampen, // rotateX
          (x - ref.current.clientWidth / 2) / dampen, // rotateY
          1.07 // Scale
        ];
        
        // 更新动画的值
        setAnimatedProps({ xys: xys });
      }}
      onMouseLeave={() => {
        setHovered(false);
        // 还原xys的值
        setAnimatedProps({ xys: [0, 0, 1] });
      }}
      style={{
        // 当卡片被hover时我们希望它的层级在其他卡片之上
        zIndex: isHovered ? 2 : 1,
        // 处理css变化的函数
        transform: animatedProps.xys.interpolate(
          (x, y, s) =>
            `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`
        )
      }}
    >
      {children}
    </animated.div>
  );
}
```

#### useHistory

这个hook可以非常简单的将撤销/重做功能添加到你的应用中。我们的案例是一个简单的绘画应用。这个例子将会生成一个网格块，你可以单击任何一个块去改变它的颜色，并且通过使用useHistory hook，我们可以在canvas上撤销、重做或者清除所有的更改。[在线示例](https://codesandbox.io/s/32rqn6zq0p)。在我们的hook中，我们将使用useRoducer来代替useState储存数据，这些东西应该对任何使用过redux的人都非常的熟悉（查看更多useReducer相关信息尽在[官方文档](https://reactjs.org/docs/hooks-reference.html#usereducer)）。这个hook复制了[use-undo](https://github.com/xxhomey19/use-undo)这个库并有一些细微的变化。因此你可以直接通过npm去安装和使用这个库。

```javascript
import { useReducer, useCallback } from 'react';

// Usage
function App() {
  const { state, set, undo, redo, clear, canUndo, canRedo } = useHistory({});

  return (
    <div className="container">
      <div className="controls">
        <div className="title">👩‍🎨 Click squares to draw</div>
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
        <button onClick={clear}>Clear</button>
      </div>

      <div className="grid">
        {((blocks, i, len) => {
          // 生成一个网格块
          while (++i <= len) {
            const index = i;
            blocks.push(
              <div
                // 如果state中的状态为true则给这个块添加active类名
                className={'block' + (state[index] ? ' active' : '')}
                // 根据点击改变块的状态并合并到最新的state
                onClick={() => set({ ...state, [index]: !state[index] })}
                key={i}
              />
            );
          }
          return blocks;
        })([], 0, 625)}
      </div>
    </div>
  );
}

// 初始化useReducer中的state
const initialState = {
  // 当我们每次添加新state时，用来储存更新前状态的数组
  past: [],
  // 当前的state值
  present: null,
  // 让我们可以用使用重做功能的，future数组
  future: []
};

// 根据action处理state的改变
const reducer = (state, action) => {
  const { past, present, future } = state;

  switch (action.type) {
    case 'UNDO':
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [present, ...future]
      };
    case 'REDO':
      const next = future[0];
      const newFuture = future.slice(1);

      return {
        past: [...past, present],
        present: next,
        future: newFuture
      };
    case 'SET':
      const { newPresent } = action;

      if (newPresent === present) {
        return state;
      }
      return {
        past: [...past, present],
        present: newPresent,
        future: []
      };
    case 'CLEAR':
      const { initialPresent } = action;

      return {
        ...initialState,
        present: initialPresent
      };
  }
};

// Hook
const useHistory = initialPresent => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    present: initialPresent
  });

  const canUndo = state.past.length !== 0;
  const canRedo = state.future.length !== 0;

  // 设置我们的回调函数
  // 使用useCallback来避免不必要的重新渲染

  const undo = useCallback(
    () => {
      if (canUndo) {
        dispatch({ type: 'UNDO' });
      }
    },
    [canUndo, dispatch]
  );

  const redo = useCallback(
    () => {
      if (canRedo) {
        dispatch({ type: 'REDO' });
      }
    },
    [canRedo, dispatch]
  );

  const set = useCallback(newPresent => dispatch({ type: 'SET', newPresent }), [
    dispatch
  ]);

  const clear = useCallback(() => dispatch({ type: 'CLEAR', initialPresent }), [
    dispatch
  ]);

  // 如果需要，同样可以到处过去和未来的state
  return { state: state.present, set, undo, redo, clear, canUndo, canRedo };
};
```

> [xxhomey19/use-undo](https://github.com/xxhomey19/use-undo) - 上面所借鉴的库，同样从hook中返回了previous和future的状态，但是没有一个清晰的action
> [React useHistory hook](https://codesandbox.io/s/yv3004lqnj) - 另一种useHistory的实现方式。

#### useScript
使用这个hook可以让你非常简单的动态加载外部scr的ipt并且知道它什么时候加载完毕。当你需要依赖一个第三方库，并且想要按需加载而不是在每一个页面的头部请求时，这个hook非常有用。在下面的例子中我们直到脚本加载完成前才会调用我们在script中声明的方法。如果你有兴趣了解一下这个高级组件时如何实现的，你可以看一下[source of react-script-loader-hoc](https://github.com/sesilio/react-script-loader-hoc/blob/master/src/index.js)。我个人觉得它比这个hook的可读性更高。另一个优势是因为它更容易调用一个hook去加载多个不同的script，而不像这个高阶组件的实现方式，我们使用添加多个src的字符串来支持这个功能。

```javascript
import { useState, useEffect } from 'react';

// Usage
function App() {
  const [loaded, error] = useScript(
    'https://pm28k14qlj.codesandbox.io/test-external-script.js'
  );

  return (
    <div>
      <div>
        Script loaded: <b>{loaded.toString()}</b>
      </div>
      {loaded && !error && (
        <div>
          Script function call response: <b>{TEST_SCRIPT.start()}</b>
        </div>
      )}
    </div>
  );
}

// Hook
let cachedScripts = [];
function useScript(src) {
  // 持续跟踪script加载完成和失败的状态
  const [state, setState] = useState({
    loaded: false,
    error: false
  });

  useEffect(
    () => {
      // 如果cachedScripts数组中存在这个src则代表另一个hook的实例加载了这个script，所以不需要再加载一遍
      if (cachedScripts.includes(src)) {
        setState({
          loaded: true,
          error: false
        });
      } else {
        cachedScripts.push(src);

        // 创建script标签
        let script = document.createElement('script');
        script.src = src;
        script.async = true;

        // Script事件监听方法
        const onScriptLoad = () => {
          setState({
            loaded: true,
            error: false
          });
        };

        const onScriptError = () => {
          // 当失败时，将cachedScripts中移除，这样我们可以重新尝试加载
          const index = cachedScripts.indexOf(src);
          if (index >= 0) cachedScripts.splice(index, 1);
          script.remove();

          setState({
            loaded: true,
            error: true
          });
        };

        script.addEventListener('load', onScriptLoad);
        script.addEventListener('error', onScriptError);

        // 将script添加到文档中
        document.body.appendChild(script);

        // 在cleanup回调中清除事件监听
        return () => {
          script.removeEventListener('load', onScriptLoad);
          script.removeEventListener('error', onScriptError);
        };
      }
    },
    [src] // 只有当src改变时才会重新运行
  );

  return [state.loaded, state.error];
}
```

> [react-script-loader-hoc](https://github.com/sesilio/react-script-loader-hoc/blob/master/src/index.js) - 同样逻辑的HOC实现，可以用来比较。
> [useScript from palmerhq/the-platform](https://github.com/palmerhq/the-platform#usescript) - 类似的hook，但是使用了React Suspense来返回一个promise

#### useKeyPress
使用这个hook可以轻易的监测当用户在他们的键盘上输入特殊的键值时。这个小窍门非常的简单，并且我想给你们看这只需要很少的代码，但我挑战任何读者看谁能创建一个更高级的版本。监测当多个键同时被按住会是一个很好的补充。加分项：还能检测是否在按照指定顺序输入键值。

```javascript

  const happyPress = useKeyPress('h');
  const sadPress = useKeyPress('s');
  const robotPress = useKeyPress('r');
  const foxPress = useKeyPress('f');

  return (
    <div>
      <div>h, s, r, f</div>
      <div>
        {happyPress && '😊'}
        {sadPress && '😢'}
        {robotPress && '🤖'}
        {foxPress && '🦊'}
      </div>
    </div>
  );
}

// Hook
function useKeyPress(targetKey) {
  // 用来储存持续追踪是否有键被按下
  const [keyPressed, setKeyPressed] = useState(false);

  // 如果按下的键值是我们的目标值，将其设置为true
  function downHandler({ key }) {
    if (key === targetKey) {
      setKeyPressed(true);
    }
  }

  // 如果松开的键值是我们的目标值，将其设置为false
  const upHandler = ({ key }) => {
    if (key === targetKey) {
      setKeyPressed(false);
    }
  };

  // 添加事件监听
  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    // 在cleanup中清除回调
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, []); // 空数组意味着只有在mount和unmout的时候才会运行

  return keyPressed;
}
```

> [useMultiKeyPress](https://codesandbox.io/s/y3qzyr3lrz) - 这个例子可以同时检测多个键值。