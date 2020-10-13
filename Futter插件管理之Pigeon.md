### Flutter插件开发之Pigeon

> Flutter开发中经常会需要用到插件包，而插件包中Android、iOS双端代码如何规范出参入参，如何跟dart侧实现统一。
> Flutter官方提供了Pigeon插件，通过dart代码，生成通用的模板代码，Native部分只需实现对应逻辑，函数名，入参，出参均通过生成的模板代码进行约束。

warning：目前Pigeon还是prerelease版本，所以可能会有breaking change。下文以0.1.7版本为例。



#### 创建package

ps：如果熟悉如何创建插件包，可以跳过此部分，直接看接入部分。

执行命令：

```
flutter create --org com.exmple --template plugin flutterPigeonDemo
```

要创建插件包，使用`--template=plugin`参数执行`flutter create`

- `lib/flutter_pigeon_demo.dart`
  - 插件包的dart api
- `android/src/main/kotlin/com/example/flutter_pigeon_demo/FlutterPigeonPlugin.kt`
  - 插件包Android部分的实现
- `ios/Classes/FlutterPigeonDemoPlugin.m`
  - 插件包ios部分的实现。
- `example/`
  - 使用该插件的flutterdemo。

这里常规通过methodchannel实现的部分省略，主要讲解一下如果接入pigeon插件。



#### Pigeon接入

这里可以看一下pub.dev上Pigeon的[介绍](https://pub.dev/packages/pigeon)，Pigeon只会生成Flutter与native平台通信所需的模板代码，没有其他运行时的要求，所以也不用担心Pigeon版本不同而导致的冲突。（这里的确不同版本使用起来差异较大，笔者这里接入的时候0.1.7与0.1.10，pigeon默认导出和使用都不相同）

#### 添加依赖

首先在`pubspec.yaml`中添加依赖

```
dev_dependencies:
  flutter_test:
    sdk: flutter
  pigeon:
    version: 0.1.7
```

然后按照官方的要求添加一个pigeons目录，这里我们放dart侧定义接口，参数，返回值的代码，后面通过pigeon的命令，生产native端代码。

这里以`pigeons/pigeonDemoMessage.dart`为例

```
import 'package:pigeon/pigeon.dart';

class DemoReply {
  String result;
}

class DemoRequest {
  String methodName;
}

// 需要实现的api
@HostApi()
abstract class PigeonDemoApi {
  DemoReply getMessage(DemoRequest params);
}

// 输出配置
void configurePigeon(PigeonOptions opts) {
  opts.dartOut = './lib/PigeonDemoMessage.dart';
  opts.objcHeaderOut = 'ios/Classes/PigeonDemoMessage.h';
  opts.objcSourceOut = 'ios/Classes/PigeonDemoMessage.m';
  opts.objcOptions.prefix = 'FLT';
  opts.javaOut =
  'android/src/main/kotlin/com/example/flutter_pigeon_demo/PigeonDemoMessage.java';
  opts.javaOptions.package = 'package com.example.flutter_pigeon_demo';
}
```

`pigeonDemoMessage.dart`文件中定义了请求参数类型、返回值类型、通信的接口以及pigeon输出的配置。

这里`@HostApi()`标注了通信对象和接口的定义，后续需要在native侧注册该对象，在Dart侧通过该对象的实例来调用接口。

`configurePigeon`为执行pigeon生产双端模板代码的输出配置。

- `dartOut`为dart侧调用文件
- `objcHeaderOut、objcSourceOut`为iOS侧输出位置
- `prefix`为插件默认的前缀
- `javaOut、javaOptions.package`为Android侧输出位置和包名

之后我们只需要执行如下命令，就可以生成对应的代码到指定目录中。

```
flutter pub run pigeon --input pigeons/pigeonDemoMessage.dart
```

- `--input`为我们创建的目标文件

我们接下来看一下双端如何使用pigeon生成的模板文件。