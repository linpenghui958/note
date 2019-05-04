### webComponents
还记得当**document.querySelector**最开始被广泛的被浏览器支持并且结束了无处不在的JQuery。这最终给我们提供了一个原生的方法，虽然JQuery已经提供了很久。我觉得这同样将会发生在想Angular和React这的前端框架身上。
这些框架可以帮助我们去做一些做不到的时间，比如创建可以服用的前端组件，但是这样需要付诸复杂度、专属语法、性能消耗的代价。
但是这样将会得到改变。
现代浏览器的API已经更新到你不需要使用一个框架就可以去创建一个可服用的组件。Custom Element和Shadow DOM都可以让你去创造可复用的组件。
最早在2011年，Web Components就已经是一个只需要使用HTML、CSS、JavaScript就可以创建可复用的组件。这也意味着你可以不使用类似React和Angular的框架就可以创造组件。甚至，这些组件可以无缝的接入到这些框架中。
这么久以来第一次，我们可以只使用HTML、CSS、JavaScript来创建可以在任何现代浏览器运行的可复用组件。Web Components现在已经被主要的浏览器的较新颁布所支持。
Edge将会在接下来的19版本提供支持。而对于那些旧的版本可以使用 [polyfill](https://github.com/webcomponents/webcomponentsjs)兼容至IE11.
这意味着你可以在当下基本上任何浏览器甚至移动端使用Web Components。
创造一个你定制的HTML标签，它将会继承HTM元素的所有属性，并且你可在任何支持的浏览器中通过简单的引入一个script。所有的HTML、CSS、JavaScript将会在组件内部局部定义。
这个组件在你的浏览器开发工具中显示为一个单独个HTML标签，并且它的样式和行为都是完全在组件内惊醒，不需要工作区，框架和一些前置的转换。
让我们来看一些Web Components的一些主要功能。

#### 自定义元素
自定义元素是简单的用户自定义HTML元素。它们通过使用CustomElementRegistry来定义。要注册一个新的元素，通过**window.customElements**中一个叫define的方法来获取注册的实例。

```javascript
window.customElements.define('my-element', MyElement);
```

方法中的第一个参数定义了新创造元素的标签名字，我们可以非常简单的直接使用

```javascript
<my-element></my-element> 
```

为了避免和native标签冲突，这里强制使用中划线来连接。
这里的**MyElement**的构造函数需要使用ES6的class，折让JavaScript的class不像原来面向对象class那么让人疑惑。同样的，如果一个Object和Proxy可以被使用来给自定义元素进行简单的数据绑定。但是，为了保证你的原生HTML元素的拓展性并保证元素继承了整个DOM API，需要使用这个限制。
让我们写一个这个自定义元素class

```javascript
class MyElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // here the element has been inserted into the DOM
  }
}
```

这个自定义元素的class就好像一个常规的继承自nativeHTML元素的class。在它的构造函数中有一个叫**connectedCallback**额外添加的方法，当这个元素被插入DOM树的时候将会触发这个方法。你可以把这个方法与React的**componentDidMount**方法。
通常来说，我们需要在**connectedCallback**之后进行元素的设置。因为这是唯一可以确定所有的属性和子元素都已经可用的办法。构造函数一般是用来初始化状态和设置Shadow DOM。
元素的构造函数和connectCallback的区别是，当时一个元素被创建时（好比document.createElement）将会调用构造函数，而当一个元素已经被插入到DOM中时会调用connectedCallback，例如在已经声明并被解析的文档中，或者使用document.body.appendChild添加。
你同样可以用过调用**customElements.get('my-element')**来获取这个元素构造函数的引用，从而构造元素。前提是你已经通过customElement.define()去注册。然后你可以使用new element()来代替document.createElement()去实例一个元素。

```javascript
customElements.define('my-element', class extends HTMLElement {...});

...

const el = customElements.get('my-element');
const myElement = new el();  // same as document.createElement('my-element');
document.body.appendChild(myElement);
```

与connectedCallback相对应的则是disconnectCallback，当元素从DOM中移除的时候将会调用它。但是要记住，在用户关闭浏览器或者浏览器tab的时候，不会调用这个方法。
还有adoptedCallback，当元素通过调用document.adoptNode(element)被采用到文档时将会被调用，虽然到目前为止，我还没有碰到这个方法被调用的时候。
另一个有用的生命周期方法是attributeChangedCallback，每当将属性添加到observedAttributes的数组中时，就会调用这个函数。这个方法调用时两个参数分别为旧值和新值。

```javascript
class MyElement extends HTMLElement {
  static get observedAttributes() {
    return ['foo', 'bar'];
  }

  attributeChangedCallback(attr, oldVal, newVal) {
    switch(attr) {
      case 'foo':
        // do something with 'foo' attribute

      case 'bar':
        // do something with 'bar' attribute

    }
  }
}
```

这个方法只有当被保存在observedAttributes数组的属性改变时，就如这个例子中的foo和bar，被改变才会调用，其他属性改变则不会。
属性主要用在声明元素的初始配置，状态。理论上通过序列化可以将复杂值传递给属性，但是这样会影响性能，并且你可以直接调用组件的方法，所以不需要这样做。但是如果你希望像React和Angular这样的框架提供属性的绑定，那你可以看一下。[Polymer](https://polymer-library.polymer-project.org/)。
#### 生命周期函数的顺序
顺序如下：

```javascript
constructor -> attributeChangedCallback -> connectedCallback
```

为什么attributeChangedCallback要在connectedCallback之前执行呢？
回想一下，web组件上的属性主要用来初始化配置。这意味着当组件被插入DOM时，这些配置需要可以被访问了。因此attributeChangedCallback要在connectedCallback之前执行。
这意味着你需要根据某些属性的值，在Shadow DOM中配置任何节点，那么你需要在构造函数中引用这些节点，而不是在connectedCallback中引用它们。
例如，如果你有一个ID为container的组件，并且你需要在根据属性的改变来决定是否给这个元素添加一个灰色的背景，那么你可以在构造函数中引用这个元素，以便它可以在attributeChangedCallback中使用：

```javascript
constructor() {
  this.container = this.shadowRoot.querySelector('#container');
}

attributeChangedCallback(attr, oldVal, newVal) {
  if(attr === 'disabled') {
    if(this.hasAttribute('disabled') {
      this.container.style.background = '#808080';
    }
    else {
      this.container.style.background = '#ffffff';
    }
  }
}
```

如果你一直等到connectedCallback再去创建this.container。然后在第一时间调用attributeChangedCallback，它还是不尅用的。因此尽管你应该尽可能的延后你组件的connectedCallback，但在这种情况下是不可能的。
同样重要的是，你可以在组件使用customElement.define()之前去使用它。当改元素出现在DOM或者被插入到DOM，而还没有被注册时。它将会是一个HTMLUnkonwElement的实例。浏览器将会这样处理未知的元素，你可以像处理其他元素一样与它交互，除此之前，它将不会有任何方法和默认样式。
然后当荣国使用customElement.define()去定义它时，并可使用类来定义增加它，这个过程被称为升级。当使用customElement.whenDefined升级元素时，可以调用回调，并会返回一个promise。当这个元素被升级时。

```javascript
customElements.whenDefined('my-element')
.then(() => {
  // my-element is now defined
})
```
#### Web Component的公共API

除了这些生命周期方法，你还可以定义可以从外部调用的方法，这对于使用React和Angular等框架目前是不可行的。例如你可以定义一个名为doSomething的方法：

```javascript
class MyElement extends HTMLElement {
  ...

  doSomething() {
    // do something in this method
  }
}
```

然后你可以在外部使用它

```javascript
const element = document.querySelector('my-element');
element.doSomething();
```

在你的元素上定义的任何方法，都会成为其公共JavaScript的一部分。通过这种方式，你可以给元素的属性提供setter来实现数据绑定。例如在元素的HTML中展示设置的属性值。由于本质上不可以将给属性设置除了字符串以外的值，所以应该讲像对象这样的复杂之作为属性传递给自定义元素。
除了生命组件的初始状态，属性还可以用于对应属性的值，以便将元素的Javascript状态反应到DOM的表现中。input元素的disabled属性就是一个很好的例子：

```javascript
<input name="name">

const input = document.querySelector('input');
input.disabled = true;
```

在将input的disabled的属性设置为true后，改变也会相应的反映到disabled属性上。

```javascript
<input name="name" disabled>
```

通过setter可以很容易的将property反应到attribute上。

```javascript
class MyElement extends HTMLElement {
  ...

  set disabled(isDisabled) {
    if(isDisabled) {
      this.setAttribute('disabled', '');
    }
    else {
      this.removeAttribute('disabled');
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }
}
```

当attribute改变后需要执行某些操作时，将其添加到observedAttributes数组中。作为一种性能优化，只有在这被列举出的属性才会监测它们的改变。无论这个attribute什么时候改变了，都会调用attributeChangedCallback，参数分别是当前值和新的值。

```javascript
class MyElement extends HTMLElement {  
  static get observedAttributes() {    
    return ['disabled'];  
  }

  constructor() {    
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = `      
      <style>        
        .disabled {          
          opacity: 0.4;        
        }      
      </style>      

      <div id="container"></div>    
    `;

    this.container = this.shadowRoot('#container');  
  }

  attributeChangedCallback(attr, oldVal, newVal) {    
    if(attr === 'disabled') {      
      if(this.disabled) {        
        this.container.classList.add('disabled');      
      }      
      else {        
        this.container.classList.remove('disabled')      
      }    
    }
  }
}
```

现在无论何时disabled的attribute被改变时，this.container上面的名为disabled的class都会显示或隐藏，它是ShadowDOM的内在元素。
接下来让我们看一下。

####Shadow DOM
使用Shadow DOM，自定义元素的HTML和CSS完全封装在组件内。这意味着元素将以单个的HTML标签出现在文档的DOM树种。其内部的结构将会放在#shadow-root。
实际上一些原生的HTML元素也使用了Shadow DOM。例如你再一个网页中有一个`<video>`元素，它将会作为一个单独的标签展示，但它也将显示播放和暂停视频的控件，当你在浏览器开发工具中查看video标签，是看不到这些控件。
这些控件实际上就是video元素的Shadow DOM的一部分，因此默认情况下是隐藏的。要在Chrome中显示Shadow DOM，进入开发者工具中的Preferences中，选中Show user agent Shadow DOM。当你在开发者工具中再次查看video元素时，你就可以看到该元素的Shadow DOM了。
Shadow DOM还提供了局部作用域的CSS。所有的CSS都只应用于组件本身。元素将只继承最小数量从组件外部定义的CSS，甚至可以不从外部继承任何CSS。不过你可以暴露这些CSS属性，以便用户对组件进行样式设置。这可以解决许多CSS问题，同时仍然允许自定义组件样式。
定义一个Shadow root:

```javascript
const shadowRoot = this.attachShadow({mode: 'open'});
shadowRoot.innerHTML = `<p>Hello world</p>`;
```

这定义了一个带mode: open的Shadow root，这意味着可以再开发者工具找到它并与之交互，配置暴露出的CSS属性，监听抛出的事件。同样也可以定义mode：closed，会得到与之相反的表现。
你可以使用使用HTML字符串添加到innerHtml的property属性中，或者使用一个`<template>`去给Shadow root添加HTML。一个HTML的template基本是惰性的HTML片段，你可以定义了延后使用。在实际插入DOM前，它是不可见也不可解析的。这意味着定义在内部的任何资源都无法获取，任何内部定义的CSS和JavaScript只有当它被插入DOM中时，才会被执行。当组件的HTML根据其状态发生更改时，例如你可以定义多个`<template>`元素，然后根据组件的状态去插入这些元素，这样可以轻松的修改组件的HTML部分，并不需要修改单个DOM节点。
当Shadow root被创建之后，你可以使用document对象的所有DOM方法，例如this.shadowRoot.querySelector去查找元素。组件的所有样式都被定义在style标签内，如果你想使用一个常规的`<link rel="stylesheet">`标签，你也可以获取外部样式。除此之外，还可以使用`:host`选择器对组件本身进行样式设置。例如，自定义元素默认使用`display: inline`，所以如果你想要将组件展示为款元素，你可以这样做：

```javascript
:host {
  display: block;
}
```

这还允许你进行上下文的样式化。例如你想要通过disabled的attribute来改变组件的背景是否为灰色：

```css
:host([disabled]) {
  opacity: 0.5;
}
```

默认情况下，自定义元素从周围的CSS中继承一些属性，例如颜色和字体等，如果你想清空组件的初始状态并且将组件内的所有CSS都设置为默认的初始值，你可以使用：

```css
:host {
  all: initial;
}
```

非常重要，需要注意的一点是，从外部定义在组件本身的样式优先于使用`:host`在Shadow DOM中定义的样式。如果你这样做

```css
my-element {
  display: inline-block;
}
```

它将会被覆盖

```css
:host {
  display: block;
}
```

不应该从外部去改变自定义元素的样式。如果你希望用户可以设置组件的部分样式，你可以暴露CSS变量去达到这个效果。例如你想让用户可以选择组件的背景颜色，可以暴露一个叫 `--background-color`的CSS变量。
假设现在有一个Shadow DOM的根节点是 `<div id="container">`

```javascript
#container {
  background-color: var(--background-color);
}
```

现在用户可以在组件的外部设置它的背景颜色

```css
my-element {
  --background-color: #ff0000;
}
```

你还可以在组件内设置一个默认值，以防用户没有设置

```css
:host {
  --background-color: #ffffff;
}

#container {
  background-color: var(--background-color);
}
```

当然你还可以让用户设置任何的CSS变量，前提是这些变量的命名要以`--`开头。
通过提供局部的CSS、HTML，Shadow DOM解决了全部CSS可能带来的一些问题，这样问题通常导致不断地添加样式表，其中包含了越来越多的选择器和覆盖。Shadow DOM似的标记和样式捆绑到自己的组件内，而不需要任何工具和命名约定。你再也不用担心新的class或id会与现有的任何一个冲突。
除此之外，还可以通过CSS变量设置web组件的内部样式，还可以将HTML注入到Web Components中。

#### 通过slots组成
组合是通过Shadow DOM树与用户提供的标记组合在一起的过程。这是通过`<slot>`元素完成的，该元素基本是Shadow DOM的占位符，用来呈现用户提供的标记。用户提供的标记又可以成为 light DOM。合成会将light DOM和Shadow DOM合并成为一个新的DOM树。

例如，你可以创建一个`<iamge-gallery>`组件，并提供标准的img标签作为组件要呈现的内容：

```javascript
<image-gallery>
  <img src="foo.jpg" slot="image">
  <img src="bar.jpg" slot="image">
</image-gallery>
```

组件现在将会获取两个提供的图像，并且使用slots将它们渲染到组件的Shadow DOM中。注意到`slot="image"`的attribute，这告诉了组件应该要在Shadow DOM的什么位置渲染它们。例如这样

```javascript
<div id="container">
  <div class="images">
    <slot name="image"></slot>
  </div>
</div>
```

当light DOM中的节点被分发到Shadow DOM中时，得到的DOM树看起来是这样的：

```javascript
<div id="container">
  <div class="images">
    <slot name="image">
      <img src="foo.jpg" slot="image">
      <img src="bar.jpg" slot="image">
    </slot>
  </div>
</div>
```

正如你看到的，任何用户提供的具有slot属性的元素，都将在slot元素中呈现。而slot元素具有name属性，其值与slot属性的值对应。
`<select>`元素的工作方与此完全相同，你可以在开发这工具中查看（查看设置在上方）

![Alt text](./1556955462019.png)

它接受用户提供的option元素，并将它们呈现到下拉菜单中。
带有name属性的slot被称为具名slot，但是这个属性不是必须的。它仅用于需要将内容呈现在特定位置时使用。当一个或多个slot没有name属性时，将按照用户提供内容的顺序在其中展示。当用户提供的内容少于slot时，slot可以提供默认的展示。
看一下`<image-gallery>`的Shadow DOM：

```javascript
<div id="container">
  <div class="images">
    <slot></slot>
    <slot></slot>
    <slot>
      <strong>No image here!</strong> <-- fallback content -->
    </slot>
  </div>
</div>
```

如果你再只给两个image的话，最后的结果如下：

```javascript
<div id="container">
  <div class="images">
    <slot>
      <img src="foo.jpg">
    </slot>
    <slot>
      <img src="bar.jpg">
    </slot>
    <slot>
     <strong>No image here!</strong>
    </slot>
  </div>
</div>
```

通过slot在Shadow DOM中展示的元素被称为分发节点。这些组件被插入前的样式也将会被用于他们插入后。在Shadow DOM中，分发节点可以通过`::sloted()`来获取额外的样式

```css
::slotted(img) {
  float: left;
}
```

`::sloted()`可以接受任何有效的CSS选择器，但它只能选择顶级节点，例如`::slotedd(section img)`的情况，将不会作用于this content

```css
<image-gallery>
  <section slot="image">
    <img src="foo.jpg">
  </section>
</image-gallery>
```

#### 在JavaScript中使用slots

你可以通过JavaScript与slots进行交互去监测哪个节点被分发到哪个slot，哪些slot被插入了元素，以及slotchange事件。
要找出哪些元素已经被分发给对应的slots可以使用 `slot.assignedNodes()` 如果你还想查看slot的默认内容，你可以使用 `slot.assignedNodes({flatten: true})`
要找出哪些slot被分发的元素，可以使用`element.assignedSlot`
当slot内的节点发生改变，即添加或删除节点时，将会出发`slotchange`事件。要注意的是，只有当slot节点自身改变才会触发，而这些slot节点的子节点并不会触发。

```javascript
slot.addEventListener('slotchange', e => {
  const changedSlot = e.target;
  console.log(changedSlot.assignedNodes());
});
```

在元素第一次初始化时，Chrome会触发slotchange事件，而Safari和Firefox则不会。

#### Shadow DOM中的事件
默认情况下，自定义元素（如鼠标和键盘事件）的标准事件将会从Shadow DOM中冒泡。每当一个事件来此Shadow DOM中的一个节点时，它会被重定向，因此该事件似乎来自元素本身。如果你想找出事件实际来自Shadow DOM中的哪个元素，可以调用event.composedPath()来检索事件经过的节点数组。然而，事件的target属性还是会指向自定义元素本身。
你可以使用CustomEvent从自定义元素中抛出任何你想要的事件。

```javascript
class MyElement extends HTMLElement {
  ...

  connectedCallback() {
    this.dispatchEvent(new CustomEvent('custom', {
      detail: {message: 'a custom event'}
    }));
  }
}

// on the outside
document.querySelector('my-element').addEventListener('custom', e => console.log('message from event:', e.detail.message));
```

但是当一个事件从Shadow DOM的节点抛出而不是自定义元素本身，他不会从ShadowDOM上冒泡，除非它使用了`composition: true`来创建

```javascript
class MyElement extends HTMLElement {
  ...

  connectedCallback() {
    this.container = this.shadowRoot.querySelector('#container');

    // dispatchEvent is now called on this.container instead of this
    this.container.dispatchEvent(new CustomEvent('custom', {
      detail: {message: 'a custom event'},
      composed: true  // without composed: true this event will not bubble out of Shadow DOM
    }));
  }
}
```

#### 模板元素
除了使用this.shadowRoot.innerHTML来向一个元素的shadow root添加HTML，你也可以使用 `<template>`来做。template保存HTML供以后使用。它不会被渲染，并只有确保内容是有效的才会进行解析。模板中的JavaScript不会被执行，也会获取任何外部资源，默认情况下它是隐藏的。
当一个web component需要根据不同的情况来渲染不同的标记时，可以用不同的模板来完成：

```javascript
class MyElement extends HTMLElement {
  ...

  constructor() {
    const shadowRoot = this.attachShadow({mode: 'open'});

    this.shadowRoot.innerHTML = `
      <template id="view1">
        <p>This is view 1</p>
      </template>

      <template id="view1">
        <p>This is view 1</p>
      </template>

      <div id="container">
        <p>This is the container</p>
      </div>
    `;
  }

  connectedCallback() {
    const content = this.shadowRoot.querySelector('#view1').content.clondeNode(true);
    this.container = this.shadowRoot.querySelector('#container');
    
    this.container.appendChild(content);
  }
}
```

这里两个模板都使用了innerHTML放在shadow root内，最初这两个模板都是隐藏的，自由container被渲染。在`connectedCallback`中我们通过`this.shadowRoot.querySelector('#view1').content.clondeNode(true)`获取了`#view1`的内容。模板content的属性以DocumentFragment形式返回模板的内容，可以勇士appendChild添加到另一个元素中。因为appendChild将在元素已经存在于DOM中时移除它，所以我们需要先使用cloneNode(true)，否则模板的内容将会被移除，这意味着我们只能使用一次。
模板对于快速的更改HTML部分或者重写标记非常有用。它们不仅限于web components并且可以在任何DOM中使用。

#### 扩展原生元素
到目前为止，我们一直在扩展HTMLElement来创建一个全新的HTML元素。自定义元素还允许使用扩展原生内置元素，支持增强已经存在的HTML元素，例如images和buttons。目前此功能仅在Chrome和Firefox中受支持。
扩展现有HTML元素的好处是继承了元素的所有属性和方法。这允许对现有元素进行逐步的增强。这意味着即使在不支持自定义元素的浏览器中，它仍是可用的。它只会降级到默认的内置行为。而如果它是一个全新的HTML标签，那它将会完全无法使用。
例如，我们想要增强一个`HTML<button>`标签

```javascript
class MyButton extends HTMLButtonElement {
  ...

  constructor() {
    super();  // always call super() to run the parent's constructor as well
  }

  connectedCallback() {
    ...
  }

  someMethod() {
    ...
  }
}

customElements.define('my-button', MyButton, {extends: 'button'});
```

我们的web component不在扩展更通用的HTMLElement，而是扩展HTMLButtonElement。当我们使用customElements.define()的时候还需要添加一个额外的参数 `{extends: 'button'}`来表示我们的类扩展的是`<button>`元素。这可能看起来有些多余，因为我们已经表明了我们想要扩展的是HTMLElementButton，但是这是必要的，因为一些元素共享一个DOM接口。例如 `<q>` 和 `<blockquote>`都共享 HTMLQuoteElement接口。
这个增强后的button可以通过is属性来被使用

```javascript
<button is="my-button">
```

现在它将被我们的MyElement类增加，如果它加载在一个不支持自定义元素的浏览器中，它将降级到一个标准的按钮，真正的渐进式增强。
注意，在扩展现有元素时，不能使用Shadow DOM。这只是一种扩展原生HTML元素的方法，它继承了所有现有的属性、方法和事件，并提供了额外的功能。当然可以在组件中修改元素的DOM和CSS，但是尝试创建一个Shadow root将会抛出一个错误。
扩展内置元素的另一个好处就是，这些元素也可以应用于子元素被限制的情况。例如thead元素只允许tr作为其子元素，因此`<awesome-tr>`元素将呈现无效标记。这种情况下，我们可以拓展内置的tr元素。并像这样使用它：

```javascript
<table>
  <thead>
    <tr is="awesome-tr"></tr>
  </thead>
</table>
```

这种创建web components的方式带来了巨大的渐进式增强，但是正如前面所提到，目前仅有Chrome和Firefox支持。Edge也将会支持，但不幸的是，目前Safari还没有实现这一点。

#### 测试web components
与为Angular和React这样的框架编写测试相比，测试web components既简单又直接。不需要转换或者复杂的设置，只需要创建元素，并将其添加到DOM中并运行测试。
这里有一个使用Mocha的测试

```javascript
import 'path/to/my-element.js';

describe('my-element', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('my-element');

    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('should test my-element', () => {
    // run your test here
  });
});
```

在这里，第一行引入了my-element.js文件，该文件将我们的web component通过es6模块对外暴露。这意味着我们测试文件也需要作为一个ES6模块加载到浏览器中农。这需要以下的index.html能够在浏览器中运行测试。除了Mocha，这个设置还加载了WebcomponentsJS polyfill，Chai用于断言，以及Sinon用于监听和模拟。

```javascript
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="../node_modules/mocha/mocha.css">
        <script src="../node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
        <script src="../node_modules/sinon/pkg/sinon.js"></script>
        <script src="../node_modules/chai/chai.js"></script>
        <script src="../node_modules/mocha/mocha.js"></script>

        <script>
            window.assert = chai.assert;
            mocha.setup('bdd');
        </script>
        <script type="module" src="path/to/my-element.test.js"></script>
        <script type="module">
            mocha.run();
        </script>

    </head>
    <body>
        <div id="mocha"></div>
    </body>
</html>
```

在加载完所需的scripts后，我们暴露chai.assert作为一个全局变量，因此我们可以在测试中简易的使用assert()，并设置Mocha来使用BDD接口。然后加载测试文件，并调用mocha.run()运行测试。
请注意，在使用ES6模块化时，还需要将mocha.run()放在`type="module"`的script中。因为ES6模块在默认情况下是延迟执行的。如果mocha.run()放在一个常规的script标签中，他将会在加载my-element.test.js之前执行。

#### 浏览器兼容
目前，Chrome、Firefox、Safari和Opera的最新版本都支持定制元素，即将推出的Edge 19也将支持定制元素。在iOS和Android上，Safari、Chrome和Firefox都支持它们。
对于老版本的浏览器，我们可以使用WebcomponentsJS polyfill，这样下载

```javascript
npm install --save @webcomponents/webcomponentsjs
```

你可以将webcomponents-loader.js包含进去，这可以用来检测特性只加载必要的polyfills。使用这个polyfill，你可以使用自定义的元素不需要向源码中添加任何东西。但是它没有真正的提供局部CSS。这意味着在不同web components中如果有同样的class和id，在同一个document中，它们将会发生冲突。此外Shadow DOM的css选择器 `:host()` `:sloted()`可能无法正常工作。
为了使其正确中座，你需要使用Shady CSS ployfill，这也意味着你需要稍微修改源代码才能使用它。我个人认为这是不可取的，所以我创建了一个webpack loader。它将为你处理这个问题。这也意味着你不得不对你的代码进行编译。但是你可以保持代码的不变。
webpack loader做了三件事，他在web components的Shadow DOM中为所有的CSS加上前缀，这些css不能以`::host`或者`::slotted`开头，而是与元素的标记名开头，以提供适当的局部作用于，然后它解析所有的`::host`和`::slotted`规则，以它们也能正确工作。

#### 示例 #1 ：lazy-img
这是一个图片懒加载的组件
lazy-img自定义组件主要以元素img标签进行实现

```javascript
<lazy-img
  src="path/to/image.jpg"
  width="480"
  height="320"
  delay="500"
  margin="0px"></lazy-img>
```

如果继承与img标签，通过is使用

```javascript
<img
  is="lazy-img"
  src="path/to/img.jpg"
  width="480"
  height="320"
  delay="500"
  margin="0px">
```

这是一个很好的例子，说明了原生web components的强大，只需要导入JavaScript，添加HTML标记，或者使用js拓展原生web组件，就可以使用了。

#### 示例 #2 material-webcomponents
通过使用自定义元素实现Google的Material Design [Github](https://github.com/DannyMoerkerke/material-webcomponents)

#### So，我应该抛弃我的框架吗？
当然，这要视情况而定。
目前的前端框架具有数据绑定、状态管理和相当标准化的代码库等功能所带来的额外价值。问题是你的应用是否真的需要它。
如果你需要问自己，你的应用是否需要类似Redux这样的状态管理，那么你可能并不需要它。
你或许可以从数据绑定中获益，但是对于数组和对象等非基本类型的值已经允许直接用来设置web component的属性。基本类型的值也可以直接用来设置，并且可以通过attributeChangedCallback来监听这些属性的改变。
原生的web components并不提供类似允许其使用数据实例化并更新的功能，尽管有人建议这样拓展`<template>`

```javascript
<template id="example">
  <h1>{{title}}</h1>

  <p>{{text}}</p>
</template>

const template = document.querySelector('#example');
const instance = template.createInstance({title: 'The title', text: 'Hello world'});
shadowRoot.appendChild(instance.content);

//update
instance.update({title: 'A new title', text: 'Hi there'});
```
当前最新提供DOM有效更新的库是[lit-html](https://lit-html.polymer-project.org/)
另一个经常提到的前端框架的好处是，它们提供了一个标准的代码基准，可以使团队中的每一个新人从一开始就熟悉这些代码基准。虽然我想这是真的，但是我认为这种好处是相当有限的。
我曾今用过Angular、React和Polymer做过很多项目。虽然大家都对它们很熟悉，但是尽管使用了相同的框架，这些代码库还是有很大的不同。清晰定义的工作方式和样式指南比简单的使用框架更有助于代码库的一致性。框架也带来了额外的复杂性，问问自己这是否真的值得。
现在web component已经得到了广泛的支持，你可以会得出这样的结论：原生代码可以提供与框架相同的功能，但是性能更好，代码更少，复杂度更低。
使用原生web components的好处非常的清晰：
- 原生不需要框架
- 易于继承，不需要编译
- 真正的局部CSS作用域
- 标准，只有HTML，CSS，JavaScript
JQuery及其极其出色的遗产将会存在一段时间，但是你可能会发现不会有太多新项目用它来构建，因为现在有了更好的选择，并且正在迅速获得关注。我期望这些前端框架的角色会发生巨大的变化，以至于它们仅仅围绕原生 web component提供一个薄薄的层。