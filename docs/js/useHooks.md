## useHooks
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

#### useMemo

React内置了一个叫useMemo的hook，允许你缓存开销大的方法避免它们在每一次render中都被调用。你可以简单的只传入函数和数组然后useMemo将会只有在其中一个输入改变的情况才会重新计算。下面在我们的例子中有一个叫computeLetterCount的开销成本大的函数（出于演示目的，我们通过包含	一个完全不必要的大循环来降低速度）。当前选中的单词发生改变时，你会观察到因为新的单词它需要重新调用computeLetterCount方法而造成的延迟。我们还有一个计数器用来每一次按钮被点击时增加计数。当计数器增加时，你会发现在两次渲染之前没有延迟。这是因为computeLetterCount没有被调用。输入文字并没有改变因此返回的是缓存值。或许你想看一下[CodeSandbox](https://codesandbox.io/s/jjxypyk86w)上的实例。

```javascript
import { useState, useMemo } from 'react';

// Usage
function App() {
  // 计数器的state
  const [count, setCount] = useState(0);
  // 追踪我们在数组中想要展示的当前单词
  const [wordIndex, setWordIndex] = useState(0);

  // 我们可以浏览单词和查看字母个数
  const words = ['hey', 'this', 'is', 'cool'];
  const word = words[wordIndex];

  // 返回一个单词的字母数量
  // 人为的使它运行缓慢
  const computeLetterCount = word => {
    let i = 0;
    while (i < 1000000000) i++;
    return word.length;
  };

  // 缓存computeLetterCount，当输入数组的值和上一次运行一样的话，就会返回缓存的值
  const letterCount = useMemo(() => computeLetterCount(word), [word]);

  // 这个方法会是我们增加计数变得延迟，因为我们不得不等开销巨大的方法重新运行。
  //const letterCount = computeLetterCount(word);

  return (
    <div style={{ padding: '15px' }}>
      <h2>Compute number of letters (slow 🐌)</h2>
      <p>"{word}" has {letterCount} letters</p>
      <button
        onClick={() => {
          const next = wordIndex + 1 === words.length ? 0 : wordIndex + 1;
          setWordIndex(next);
        }}
      >
        Next word
      </button>

      <h2>Increment a counter (fast ⚡️)</h2>
      <p>Counter: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### useDebounce

这个hook允许对任何快速改变的值去抖动。去抖动的值只有当最新的值在指定时间间隔内useDebounce hook没有被调用的情况下才会改变。比如在下面的例子中我们用来和useEffect配合使用，你可以很容易地确保类似API调用这样的昂贵操作不会被频繁调用。下面的实例，我们将使用漫威漫画API进行搜索，并且通过使用useDebounce防止API每次按键都被调用而导致你被接口屏蔽。[在线实例](https://codesandbox.io/s/711r1zmq50) ， hook代码和灵感来自[https://github.com/xnimorz/use-debounce](https://github.com/xnimorz/use-debounce)

```javascript
import { useState, useEffect, useRef } from 'react';

// Usage
function App() {
  // 搜索词
  const [searchTerm, setSearchTerm] = useState('');
  // API搜索结果
  const [results, setResults] = useState([]);
  // 搜索状态 (是否有正在等待的请求)
  const [isSearching, setIsSearching] = useState(false);
  // 对改变搜索词去抖动，只有当搜索词500毫秒内没有发生改变时，才会返回最新的值
  // 目标就是只有当用户停止输入时才会调用API，防止我们太过迅速频繁的调用API
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Effect for API call 
  useEffect(
    () => {
      if (debouncedSearchTerm) {
        setIsSearching(true);
        searchCharacters(debouncedSearchTerm).then(results => {
          setIsSearching(false);
          setResults(results);
        });
      } else {
        setResults([]);
      }
    },
    [debouncedSearchTerm] // 只有当去抖动后的搜索词改变时才会调用
  );

  return (
    <div>
      <input
        placeholder="Search Marvel Comics"
        onChange={e => setSearchTerm(e.target.value)}
      />
  
      {isSearching && <div>Searching ...</div>}

      {results.map(result => (
        <div key={result.id}>
          <h4>{result.title}</h4>
          <img
            src={`${result.thumbnail.path}/portrait_incredible.${
              result.thumbnail.extension
            }`}
          />
        </div>
      ))}
    </div>
  );
}

// API search function
function searchCharacters(search) {
  const apiKey = 'f9dfb1e8d466d36c27850bedd2047687';
  return fetch(
    `https://gateway.marvel.com/v1/public/comics?apikey=${apiKey}&titleStartsWith=${search}`,
    {
      method: 'GET'
    }
  )  
    .then(r => r.json())
    .then(r => r.data.results)
    .catch(error => {
      console.error(error);
      return [];
    });
}
       
// Hook
function useDebounce(value, delay) {
  // 存储去抖动后的值
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // 在延迟delay之后更新去抖动后的值
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // 如果值改变了取消timeout (同样在delay改变或者unmount时生效)
      // 这就是我们通过延迟间隔内值没有被改变来达到防止值去抖动 清空timeout并且重新运行
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // 只有当搜索值或者delay值发生改变时才会重新调用
  );

  return debouncedValue;
}
```

#### useOnScreen

这个hook允许你轻易的检测一个元素是否在屏幕上可见，以及指定有多少元素应该被显示在屏幕上。当用户滚动到某个特定区域，非常适合懒加载图片或者触发动画。

```javascript
import { useState, useEffect, useRef } from 'react';

// Usage
function App() {
  // 用来储存我们想要检测是否在屏幕中的元素
  const ref = useRef();
  // 调用hook并传入ref和root margin
  // 在这种情况下，只有当元素多大于300px的元素才会在屏幕上显示
  const onScreen = useOnScreen(ref, '-300px');

  return (
    <div>
      <div style={{ height: '100vh' }}>
        <h1>Scroll down to next section 👇</h1>
      </div>
      <div
        ref={ref}
        style={{
          height: '100vh',
          backgroundColor: onScreen ? '#23cebd' : '#efefef'
        }}
      >
        {onScreen ? (
          <div>
            <h1>Hey I'm on the screen</h1>
            <img src="https://i.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif" />
          </div>
        ) : (
          <h1>Scroll down 300px from the top of this section 👇</h1>
        )}
      </div>
    </div>
  );
}

// Hook
function useOnScreen(ref, rootMargin = '0px') {
  // 储存元素是否可见的状态
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 当observer回调触发是更新状态
        setIntersecting(entry.isIntersecting);
      },
      {
        rootMargin
      }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      observer.unobserve(ref.current);
    };
  }, []); // 空数组确保只会在mount和unmount执行

  return isIntersecting;
}
```

> [react-intersection-observer](https://thebuilder.github.io/react-intersection-observer/?path=/story/useinview-hook--taller-then-viewport-with-threshold-100) - 一个更加健壮和可配置的实现。

#### usePrevious
一个经常会出现的问题是，当使用hook的时候我们如何获取props和state之前的值。在React的class组件内我们有componentDidUpdate方法用来参数的形式来接收之前的props和state，或者你客户更新一个实例变量（this.previous = value）并在稍后引用它以获得之前的值。所以我们如何能在没有生命周期方法或者实例存储值的函数组件中做到这一点呢？Hook来救火。我们可以创造一个定制的hook，使用useRef hook在内部存储之前的值。查看下面的例子和行内注释。或者直接查看[官方例子](https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state)

```javascript
import { useState, useEffect, useRef } from 'react';

// Usage
function App() {
  const [count, setCount] = useState(0);
  
  // 获取更新前的值 (在上一次render中传进hook)
  const prevCount = usePrevious(count);
  
  // 同时展示当前值和更新前值
  return (
    <div>
      <h1>Now: {count}, before: {prevCount}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
   );
}

// Hook
function usePrevious(value) {
  // ref对象是一个通用容器其current属性为可变的，并且可以容纳任何值，类似与一个类上的实例属性。
  const ref = useRef();
  
  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // 只有当值改变时重新运行
  
  // 返回更新前的值 (发生在useEffect更新之前)
  return ref.current;
}
```

#### useOnClickOutside

这个hook允许你监测是否在一个特定元素外点击。在接下来的例子中，我们使用它监测在modal框以外任何元素被点击时，去关闭modal框。通过抽象这个逻辑到一个hook中，我们可以很容易将它使用在需要这种类似功能的组件中（下拉菜单、提示等）

```javascript
import { useState, useEffect, useRef } from 'react';

// Usage
function App() {
  // 创建一个ref，储存我们要监测外部点击的元素
  const ref = useRef();
  // modal框的逻辑
  const [isModalOpen, setModalOpen] = useState(false);
  // 调用hook，并传入ref和外部点击时要触发的函数
  useOnClickOutside(ref, () => setModalOpen(false));

  return (
    <div>
      {isModalOpen ? (
        <div ref={ref}>
          👋 Hey, I'm a modal. Click anywhere outside of me to close.
        </div>
      ) : (
        <button onClick={() => setModalOpen(true)}>Open Modal</button>
      )}
    </div>
  );
}

// Hook
function useOnClickOutside(ref, handler) {
  useEffect(
    () => {
      const listener = event => {
        // 元素内点击不做任何事
        if (!ref.current || ref.current.contains(event.target)) {
          return;
        }

        handler(event);
      };

      document.addEventListener('mousedown', listener);
      document.addEventListener('touchstart', listener);

      return () => {
        document.removeEventListener('mousedown', listener);
        document.removeEventListener('touchstart', listener);
      };
    },
    // 将ref和处理函数添加到effect的依赖数组中
    // 值得注意的一点是，因为在每一次render中被传入的处理方法是一个新函数，这将会导致effect的callback和cleanup每次render时被1调用。
    // 这个问题也不大，你可以将处理函数通过useCallback包裹起来然后再传入hook中。
    [ref, handler]
  );
}
```

> [Andarist/use-onclickoutside] - 类似逻辑的库。如果你想要从github/npm上拉取一些东西，这个库是一个不错的选择。

#### useAnimation

这个hook允许你通过一个缓动函数去平滑的动画任意值（linear elastic）。在例子中，我们调用useAnimation hook三次去让三个不同的小球在不同的间隔时间完成动画。作为额外的一点，我们也展示了如何组合hook是非常简单的。我们的useAnimation hook不实际使用useState或者useEffect本身，而是使用useAnimationTimer hook将其包裹起来。将计时器相关逻辑从hook中抽离出来，让我们的代码可读性更高并且可以在其他环节使用计时器逻辑。[在线实例](https://codesandbox.io/s/qxnmn1n45q)

```javascript
import { useState, useEffect } from 'react';

// Usage
function App() {
  // 在不同的启动延迟去多次调用hook以获得不同的动画值
  const animation1 = useAnimation('elastic', 600, 0);
  const animation2 = useAnimation('elastic', 600, 150);
  const animation3 = useAnimation('elastic', 600, 300);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <Ball
        innerStyle={{
          marginTop: animation1 * 200 - 100
        }}
      />

      <Ball
        innerStyle={{
          marginTop: animation2 * 200 - 100
        }}
      />

      <Ball
        innerStyle={{
          marginTop: animation3 * 200 - 100
        }}
      />
    </div>
  );
}

const Ball = ({ innerStyle }) => (
  <div
    style={{
      width: 100,
      height: 100,
      marginRight: '40px',
      borderRadius: '50px',
      backgroundColor: '#4dd5fa',
      ...innerStyle
    }}
  />
);

// Hook 
function useAnimation(
  easingName = 'linear',
  duration = 500,
  delay = 0
) {
  // useAnimationTimer在我们给定的时间内在每一帧调用useState，尽可能的使动画更加的流畅
  const elapsed = useAnimationTimer(duration, delay);
  // 在0-1的时间范围内指定持续时间的总量
  const n = Math.min(1, elapsed / duration);
  // 根据我们指定的缓动函数返回修改后的值
  return easing[easingName](n);
}

// 一些缓动函数的地址:
// https://github.com/streamich/ts-easing/blob/master/src/index.ts
// 在这里硬编码或者引入依赖
const easing = {
  linear: n => n,
  elastic: n =>
    n * (33 * n * n * n * n - 106 * n * n * n + 126 * n * n - 67 * n + 15),
  inExpo: n => Math.pow(2, 10 * (n - 1))
};

function useAnimationTimer(duration = 1000, delay = 0) {
  const [elapsed, setTime] = useState(0);

  useEffect(
    () => {
      let animationFrame, timerStop, start;

      // 在每一帧动画所要执行的函数
      function onFrame() {
        setTime(Date.now() - start);
        loop();
      }

      // 在下一个帧上调用onFrame()
      function loop() {
        animationFrame = requestAnimationFrame(onFrame);
      }

      function onStart() {
        // 设置一个timeout当持续时间超过时停止
        timerStop = setTimeout(() => {
          cancelAnimationFrame(animationFrame);
          setTime(Date.now() - start);
        }, duration);

        // 开始循环
        start = Date.now();
        loop();
      }

      // 在指定的延迟后执行(defaults to 0)
      const timerDelay = setTimeout(onStart, delay);

      // Clean things up
      return () => {
        clearTimeout(timerStop);
        clearTimeout(timerDelay);
        cancelAnimationFrame(animationFrame);
      };
    },
    [duration, delay] // 只有当持续时间和延迟改变时重新运行
  );

  return elapsed;
}
```

#### useWindowSize

一个真正常见的需求是获取浏览器当前窗口的尺寸。这个hook返回包含宽高的对象。如果在服务器端执行(没有window对象)，则宽度和高度的值将未定义。

```javascript
import { useState, useEffect } from 'react';

// Usage
function App() {
  const size = useWindowSize();

  return (
    <div>
      {size.width}px / {size.height}px
    </div>
  );
}

// Hook
function useWindowSize() {
  const isClient = typeof window === 'object';

  function getSize() {
    return {
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined
    };
  }

  const [windowSize, setWindowSize] = useState(getSize);

  useEffect(() => {
    if (!isClient) {
      return false;
    }
    
    function handleResize() {
      setWindowSize(getSize());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // 空数组保证effect只会在mount和unmount执行

  return windowSize;
}
```

#### useHover

监测一个鼠标是否移动到某个元素上。这个hook返回一个ref和一个布尔值，改值表示当前具有该ref的元素是否被hover。因此只需要将返回的ref添加到你想要监听hover状态的任何元素。

```javascript
import { useRef, useState, useEffect } from 'react';

// Usage
function App() {
  const [hoverRef, isHovered] = useHover();

  return (
    <div ref={hoverRef}>
      {isHovered ? '😁' : '☹️'}
    </div>
  );
}

// Hook
function useHover() {
  const [value, setValue] = useState(false);

  const ref = useRef(null);

  const handleMouseOver = () => setValue(true);
  const handleMouseOut = () => setValue(false);

  useEffect(
    () => {
      const node = ref.current;
      if (node) {
        node.addEventListener('mouseover', handleMouseOver);
        node.addEventListener('mouseout', handleMouseOut);

        return () => {
          node.removeEventListener('mouseover', handleMouseOver);
          node.removeEventListener('mouseout', handleMouseOut);
        };
      }
    },
    [ref.current] // 只有当ref改变时才会重新调用
  );

  return [ref, value];
}
```

#### useLocalStorage

将state中的数据同步到localstorage，以便页面刷新的时候保存状态。使用方法和useState类似，我们只要传入一个localstorage的值，以便在页面加载时默认使用该值，而不是指定的初始值。

```javascript
import { useState } from 'react';

// Usage
function App() {
  // 与useState相似，但是第一个参数是localstorage中的key值
  const [name, setName] = useLocalStorage('name', 'Bob');

  return (
    <div>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
    </div>
  );
}

// Hook
function useLocalStorage(key, initialValue) {
  // State to store our value
  // 将初始状态传给useState，这样逻辑只会执行一次
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // 通过key值从localstorage中获取值
      const item = window.localStorage.getItem(key);
      // 如果没有返回初始值则解析储存的json
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // 如果报错了依旧返回初始值
      console.log(error);
      return initialValue;
    }
  });

  // 返回useState的setter函数的包装版本，该函数将新的值保存到localstorage中
  const setValue = value => {
    try {
      // 允许值是一个函数，这样我们就有了和useState一样的api
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // 保存state
      setStoredValue(valueToStore);
      // 保存到localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // 更高级实现的处理将会处理错误的情况
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
```

> [use-persisted-state](https://github.com/donavon/use-persisted-state) - 一个更高级的实现，可以在不同tab和浏览器窗口之间同步。