# 本地编译FlutterEngine

> 在Flutter的一些深度开发过程中，会遇到需要对Flutter Engine进行修改、定制的情况。这里就需要了解Flutter Engine的编译、打包等流程。这里简单介绍一下如果在本地编译Flutter Engine。


### 工具部分

1. 介绍
    - [gclient](https://www.chromium.org/developers/how-tos/depottools)，谷歌开发的一套跨平台git仓库管理工具，用来将多个git仓库组成一个solution进行管理，通过gclient获取我们编译所需源码和依赖。
    - [ninja](https://ninja-build.org/)，编译工具，负责最终编译可执行的文件。
    - [gn](https://gn.googlesource.com/gn)，负责生产ninja所需的构建文件，像Flutter这种跨多操作系统、多平台、多CPU架构的，就需要gn生产多套不同的ninja构建文件(Ninja build files)。

2. 安装
    - homebrew

    ```bash
    /usr/bin/ruby -e "$(curl -fsSL [https://raw.githubusercontent.com/Homebrew/install/master/install](https://raw.githubusercontent.com/Homebrew/install/master/install))"
    ```

    - 下载depot_tools

    ```bash
    // 下载
    git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git 

    // 配置环境变量
    vim ~/.bash_profile
    #新增环境变量
    export PATH=$PATH:/Users/xxx/flutter/depot_tools #此处使用clone源码到本地的地址
    #刷新环境变量缓存，使生效
    source ~/.bash_profile
    ```

    - ant、ninja

    ```bash
    brew install ant
    brew install ninja
    ```

### 源码下载

Flutter Engine的源码是通过gclient管理的，我们首先要创建一个engine目录，然后新建一个gclient的配置文件.gclient。([配置介绍](https://chromium.googlesource.com/chromium/tools/depot_tools.git/+/HEAD/README.gclient.md))

```bash
cd engine
vim .gclient
// .gclient
solutions = [
  {
    "managed": False,
    "name": "src/flutter",
    "url": "git@github.com:xxxxxx/engine.git",
    "custom_deps": {},
    "deps_file": "DEPS",
    "safesync_url": "",
  },
]
```

这里的url也可以替换为自己fork的仓库，后续方便提交和修改。

配置host

```bash
172.217.160.112 storage.l.googleusercontent.com
172.217.160.112 commondatastorage.googleapis.com
172.217.160.68 googleapis.com
172.217.160.116 chrome-infra-packages.appspot.com
172.217.160.116 appspot-preview.l.google.com
```

下载源码

```bash
gclient sync --verbose // 拉取Flutter Engine的源码以及所需的依赖
//--verbose可以看到下载的过程，方便下载过程中出现问题看到异常信息
```

首次下载过程会比较漫长。

ps: 这里需要注意本地的dart、flutter环境不要与engine的版本差异太多

### 编译本地Engine

编译相关基础知识

- CPU架构

    编译结果包括`arm`、`arm64`、`x86`这几种架构，arm对应Android的`armeabi-v7a`，arm64对应Android的`arm64-v8a`，x86还是`x86`一般是模拟器上用的。

- 运行模式

    根据flutter的模式是分为`debug`、`profile`、`release`这三种模式的。

常用的编译参数

- `—-android-cpu`：cpu架构，对应`arm`、`arm64`、`x86`，例如：`gn —android-cpu arm`
- `—-runtime-mode`：运行模式，对应`debug`、`profile`、`release`，例如：`gn —runtime-mode debug`
- `—unoptiimized`：是否优化。

编译之前，最好将下载的engine的版本与本地的flutter依赖的engine版本调整一致，不然可能会报错。

```bash
// 查看本地flutter依赖的engine版本
vim $pwd/flutter/bin/internal/engine.version // xxxxxxxxxx
cd $pwd/engine/src/flutter
git reset --hard xxxxxxxxxx
gclient sync -D --with_branch_heads --with_tags
```

编译开始

```bash
// 1、定位到engine/src目录
cd $pwd/engine/src

// 2、编译Android对应的代码
./flutter/tools/gn --android --runtime-mode release --android-cpu arm
// 这里会在src目录下生产一个out/android_release的目录，里面就是ninja所需要的编译文件

// 3、通过2中生产的ninja build files编译
ninja -C out/android_release

// 4、编译Android打包所需要的代码
./flutter/tools/gn --runtime-mode release --android-cpu arm

// 5、编译4中生产的
ninja -C out/host_android 
// 如果4中使用的是arm64，这里就需要用host_android_arm64文件夹了
```

### 使用本地的Engine

创建一个demo工程

```bash
flutter create engine_demo
cd engine_demo
flutter run --release --local-engine-src-path $pwd/engine/src --local-engine=android_release
```