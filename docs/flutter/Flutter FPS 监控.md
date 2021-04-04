### 如何获取Flutter APP的FPS

众所周知，我们需要衡量一个APP的性能数据，其中FPS也作为其中一个非常重要的标准。

这里我们了解一下如何获取Flutter应用中的FPS性能数据。

### FPS是什么

**帧率**是用于测量显示帧数的[量度](https://zh.wikipedia.org/wiki/量度)，可产生的图像的数量
计量单位是帧/秒（Frame Per Second，FPS） 
通常是评估硬件性能与游戏体验流畅度的指标

### Flutter的渲染过程

Flutter 关注如何尽可能快地在两个硬件时钟的 VSync 信号之间计算并合成视图数据，然后通过 Skia 交给 GPU 渲染：UI 线程使用 Dart 来构建视图结构数据，这些数据会在 GPU 线程进行图层合成，随后交给 Skia 引擎加工成 GPU 数据，而这些数据会通过 OpenGL 最终提供给 GPU 渲染

![img](http://km.oa.com/files/photos/pictures/202008/1597306977_34_w1870_h450.png)

### 本地调试获取FPS

官方提供了许多在开发Flutter APP的过程中查看FPS等性能的工具。

- [devtool](https://github.com/flutter/devtools)

  DevTool 的 [Timeline] 界面可以让开发者逐帧分析应用的 UI 性能，具体的使用方式可以看一下[官方文档](https://flutter.dev/docs/perf/rendering/ui-performance)

- 性能图层

![Screenshot of overlay showing zero jank](https://flutter.cn/assets/tools/devtools/performance-overlay-green-bb41b466cf6bcd529b285e1510b638086fc5afb8921b8ac5a6565dee5bc44788.png)

在这些工具中我们只能在本地开发过程中获取FPS数据，如果要统计线上用户的真实数据，要在Flutter代码中计算FPS又该如何做呢？

### 生成环境获取FPS

#### Flutter相关性能指标定义

在阅读官方文档的时候，有一个[FrameTiming](https://api.flutter.dev/flutter/dart-ui/FrameTiming-class.html)类描述了每一帧的时间相关的性能指标。

> If you're using the whole Flutter framework, please use [SchedulerBinding.addTimingsCallback](https://api.flutter.dev/flutter/scheduler/SchedulerBinding/addTimingsCallback.html) to get this. It's preferred over using [Window.onReportTimings](https://api.flutter.dev/flutter/dart-ui/Window/onReportTimings.html) directly because [SchedulerBinding.addTimingsCallback](https://api.flutter.dev/flutter/scheduler/SchedulerBinding/addTimingsCallback.html) allows multiple callbacks. If [SchedulerBinding](https://api.flutter.dev/flutter/scheduler/SchedulerBinding-mixin.html) is unavailable, then see [Window.onReportTimings](https://api.flutter.dev/flutter/dart-ui/Window/onReportTimings.html) for how to get this.

这里更推荐使用SchedulerBinding.addTimingsCallBack来获取FPS相关数据。该回调允许多个回调方法，如果该方法不可用才考虑使用Window.onReportTimings。

#### 性能数据获取

这里看一下文档中[addTimingsCallback](https://api.flutter.dev/flutter/scheduler/SchedulerBinding/addTimingsCallback.html)的定义。

> Add a [TimingsCallback](https://api.flutter.dev/flutter/dart-ui/TimingsCallback.html) that receives [FrameTiming](https://api.flutter.dev/flutter/dart-ui/FrameTiming-class.html) sent from the engine.

添加一个TimingsCallback从engine接受发送的FrameTiming信息。接下来看一下具体代码中的定义，了解一下如何使用该方法。

`flutter/src/scheduler/binding.dart`

```dart
void addTimingsCallback(TimingsCallback callback) {
    _timingsCallbacks.add(callback);
    if (_timingsCallbacks.length == 1) {
      assert(window.onReportTimings == null);
      window.onReportTimings = _executeTimingsCallbacks;
    }
    assert(window.onReportTimings == _executeTimingsCallbacks);
  }
```

这里就是对window.onReportTimings的处理进行了封装了。首先用一个叫_timingsCallbacks的List保存了添加的回调，然后初始化时给window.onReportTimings赋值_executeTimingsCallbacks方法。这里_executeTimingsCallbacks会对前面保存的回调List进行遍历执行。

知道了addTimingsCallback做了什么，我们再看一下这里callback的定义。

`sky_engine/ui/window.dart`

```dart
/// {@template dart.ui.TimingsCallback.list}
/// The callback takes a list of [FrameTiming] because it may not be
/// immediately triggered after each frame. Instead, Flutter tries to batch
/// frames together and send all their timings at once to decrease the
/// overhead (as this is available in the release mode). The list is sorted in
/// ascending order of time (earliest frame first). The timing of any frame
/// will be sent within about 1 second (100ms if in the profile/debug mode)
/// even if there are no later frames to batch. The timing of the first frame
/// will be sent immediately without batching.
/// {@endtemplate}
typedef TimingsCallback = void Function(List<FrameTiming> timings);
```

上方的注释写到，这个回调接受一个FrameTiming的List，Flutter会尝试将这些帧合并后一次性发送，以减少开销。正常情况下一秒内会发送完所有帧，如果在profile/debug模式下，时间会缩短到100毫秒内。

简而言之，callback将会得到一个**FrameTiming的List**。

#### 具体信息分析

这里知道在回调中可以拿到的是FrameTiming了，接下来看一下，如果通过这个帧信息可以获取到那些信息呢。

`sky_engine/ui/window.dart`

```
class FrameTiming {
  /// 使用以微秒为单位的原始时间戳来构造[FrameTiming]
  ///
  /// 这个构建函数仅在单元测试中使用，如果需要获取真实的[FrameTiming]数据请通过[Window.onReportTimings]中获取
  factory FrameTiming({
    required int vsyncStart,
    required int buildStart,
    required int buildFinish,
    required int rasterStart,
    required int rasterFinish,
  }) {
    return FrameTiming._(<int>[
      vsyncStart,
      buildStart,
      buildFinish,
      rasterStart,
      rasterFinish
    ]);
  }

  /// Construct [FrameTiming] with raw timestamps in microseconds.
  ///
  /// [timestamps]List必须要有一个同样长度的[FramePhase.values]List

  FrameTiming._(List<int> timestamps)
      : assert(timestamps.length == FramePhase.values.length), _timestamps = timestamps;

  int timestampInMicroseconds(FramePhase phase) => _timestamps[phase.index];

  Duration _rawDuration(FramePhase phase) => Duration(microseconds: _timestamps[phase.index]);

  /// 在UI线程上构建帧持续的时间。
  ///
  /// 构建开始的时机大概是当[Window.onBeginFrame]被调用时。[Window.onBeginFrame]回调中的[Duration]就是`Duration(microseconds: timestampInMicroseconds(FramePhase.buildStart))`
  ///
  /// 构建结束的时机大概是当[Window.render]被调用时。
  ///
  /// {@template dart.ui.FrameTiming.fps_smoothness_milliseconds}
  /// 为了确保x fps平滑动画，这里的时间不应该超过1000/x毫秒。 （x即为fps值，例60， 120）
  /// {@endtemplate}
  /// {@template dart.ui.FrameTiming.fps_milliseconds}
  /// 60fps约为16ms，120fps约为8ms;
  /// {@endtemplate}
  Duration get buildDuration => _rawDuration(FramePhase.buildFinish) - _rawDuration(FramePhase.buildStart);

  /// 在GPU线程上光栅化帧的持续时间。
  ///
  /// {@macro dart.ui.FrameTiming.fps_smoothness_milliseconds}
  /// {@macro dart.ui.FrameTiming.fps_milliseconds}
  Duration get rasterDuration => _rawDuration(FramePhase.rasterFinish) - _rawDuration(FramePhase.rasterStart);

  /// 在接收到vsync信号并开始构建该帧所花费的时间。
  Duration get vsyncOverhead => _rawDuration(FramePhase.buildStart) - _rawDuration(FramePhase.vsyncStart);

  /// 构建开始到栅格化结束的时间。
  ///
  /// 继续强调这里的时间不应该超过1000/x毫秒。
  /// {@macro dart.ui.FrameTiming.fps_milliseconds}
  ///
  /// See also [vsyncOverhead], [buildDuration] and [rasterDuration].
  Duration get totalSpan => _rawDuration(FramePhase.rasterFinish) - _rawDuration(FramePhase.vsyncStart);

  final List<int> _timestamps;  // in microseconds

  String _formatMS(Duration duration) => '${duration.inMicroseconds * 0.001}ms';

  @override
  String toString() {
    return '$runtimeType(buildDuration: ${_formatMS(buildDuration)}, rasterDuration: ${_formatMS(rasterDuration)}, vsyncOverhead: ${_formatMS(vsyncOverhead)}, totalSpan: ${_formatMS(totalSpan)})';
  }
}
```

这里`FrameTiming`获取帧相关的时间，其实都是通过`FramePhase`上的属性来计算的。看一下该类的具体定义。

```
/// 帧的生命周期中各个重要的时间点。
/// [FrameTiming]记录了用于性能分析的每个阶段的时间戳。
enum FramePhase {
  /// 当接收到操作系统vsync信号的时间戳
  /// See also [FrameTiming.vsyncOverhead].
  vsyncStart,

  /// 当UI线程开始绘制一个帧。
  /// See also [FrameTiming.buildDuration].
  buildStart,

  /// 当UI线程结束帧的绘制。
  /// See also [FrameTiming.buildDuration].
  buildFinish,

  /// 当GPU线程开始栅格化帧时。
  /// See also [FrameTiming.rasterDuration].
  rasterStart,

  /// 当GPU线程完成栅格化帧时。
  /// See also [FrameTiming.rasterDuration].
  rasterFinish,
}
```

现在知道了如果获取最近`N个FrameTiming`和每个FrameTiming中所含有的时间戳信息，接下来看一下如果进行实际的FPS计算了。

#### 计算FPS

理所当然的去想，我们可以获取`总帧数`(FrameTiming List的长度)，总共的`耗时`(尾帧时间减去首帧时间)。是不是轻而易举就能算出FPS了呢。

```dart
double get fps {
  int frames = lastFrames.length;
  var start = lastFrames.last.timestampInMicroseconds(FramePhase.buildStart);
  var end = lastFrames.first.timestampInMicroseconds(FramePhase.rasterFinish);
  var duration = (end - start) / Duration.microsecondsPerMillisecond;

  return frames * Duration.millisecondsPerSecond / duration;
}
```

这样算出来的结果完全对不上，这是为什么呢。

其实，`window.onReportTimings` 只会在有帧被绘制时才有数据回调，换句话说，你没有和app发生交互、界面状态没有变化（setState）、没有定时刷布局（动画）等等没有新的帧产生，所以`lastFrames`里存的可能是分属不同“绘制时间段”的帧信息。

**假设**一秒最多绘制 60 帧，每帧消耗的时间 `frameInterval` 为：

```dart
const REFRESH_RATE = 60;
const frameInterval = const Duration(microseconds: Duration.microsecondsPerSecond ~/ REFRESH_RATE);
```

Flutter引擎每次在收到vsync信号的时候会去调用drawFrame方法，这里如果一帧所花费的时间超过`frameInterval`，则可能会出现丢帧的情况。

并且如果`lastFrames`里面相邻的两个帧开始、结束时间相差过大

```dart
List<FrameTiming> framesSet = <FrameTiming>[];
// 每帧耗时 先写死16.6ms
static double frameInterval = 16600;
SchedulerBinding.instance.addTimingsCallback((List<FrameTiming> timings) {
      timings.forEach(framesSet.add);
      // 当时间间隔大于1s，则计算一次FPS
      if (shouldReport()) {
        startTime = getTime();
        processor(framesSet);
        framesSet = <FrameTiming>[];
      }
    });

double processor(List<FrameTiming> timings) {
    int sum = 0;
    for (final FrameTiming timing in timings) {
      // 计算渲染耗时
      final int duration = timing.timestampInMicroseconds(FramePhase.rasterFinish) -
          timing.timestampInMicroseconds(FramePhase.buildStart);
      // 判断耗时是否在 Vsync 信号周期内
      if (duration < frameInterval) {
        sum += 1;
      } else {
        // 有丢帧，向上取整
        final int count = (duration / frameInterval).ceil();
        sum += count;
      }
    }

    final double fps = timings.length / sum * 60;
    return fps;
  }


```



