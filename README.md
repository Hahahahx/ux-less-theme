# ux-less-theme
动态主题切换，express中间件

在开始之前首先要确认一点，<b>动态主题切换始终只作用于开发环境下，不该在生产环境中使用它</b>，
正确的做法应该是在开发环境中确认主题样式，生成所需要的样式文件，在生产环境中引用这些文件，而不是交给服务器再次生成，这是一步很耗时的操作。

开发过程：https://zhuanlan.zhihu.com/p/260415434

```typescript
    const Theme = require("ux-less-theme");
    const express = require("express");

    const app = express();
    app.use(Theme.themeMiddleware({
        antdDir:path.resolve(paths.appNodeModules,"./antd"),    // antd文件夹目录
        indexDir:path.resolve(appSrc,"./assets/styles"),    // 自定义样式入口文件，确保目录下有index.less
        outputDir:paths.appPublic,              // 生成出的文件存放位置
        baseUrl:"/less",                // 访问路由
    }))

```

接口参数（GET）：

```typescript

// whiteList:['Button','Layout'],              // 只打包这些组件，白名单优先级高于黑名单
// blackList:['TreeSelect','Cart'],        // 不打包这些组件你
//生成两个antd自带的样式主题 dark.css 与 compact.css
fetch("/less?generater=ture&whiteList[0]=Button&whiteList[1]=Layout")

//生成antd自带的样式主题 dark.css
fetch("/less?generater=ture&theme=dark&blackList[0]=TreeSelect&blackList[1]=Cart ")

//生成被编译后的index.less样式 theme.css
fetch("/less?vars[@height]=100vh")

//生成被编译后的antd样式 theme-antd.css
fetch("/less?vars[@primary-color]=red&compileAntd=true")

//生成被编译后的antd样式 theme-antd.css ，开启shaking功能只编译出和@primary-color变量有依赖的样式
fetch("/less?vars[@primary-color]=red&compileAntd=true&shaking=true")

//生成被编译后的antd样式 theme-antd.css但是是基于 antd自带样式主题compact的
fetch("/less?vars[@primary-color]=red&compileAntd=true&theme=compact")
```

除了上面使用的express中间件以外还暴露了三个主要方法，它们是构成这个中间件的基础。 <br/>
把他暴露出来以便能自己编写中间件，如webpackPlugin：

```typescript
    // config, generaterAntd, changeLessVars
    const Theme = require("ux-less-theme");

    // 需要先配置config
    Theme.config({
        antdDir:path.resolve(paths.appNodeModules,"./antd"),    // antd文件夹目录
        indexDir:path.resolve(appSrc,"./assets/styles"),    // 自定义样式入口文件，确保目录下有index.less
        outputDir:paths.appPublic,              // 生成出的文件存放位置
        whiteList:['Button','Layout'],              // 只打包这些组件，白名单优先级高于黑名单
        blackList:['TreeSelect','Cart'],        // 不打包这些组件你
    })

    // 在配置完config后调用该方法就可以生成两个antd自带的主题样式  dark.css 与 compact.css
    // 如果传入主题可以只生成对应的主题样式文件
    Theme.generaterAntd("dark"|"compact"|null)

    /**
     * 在配置完config后调用该方法，就会去编译改变依赖变量的样式，
     * 如果是compileAntd则对antd的样式进行编译，白名单黑名单有效，生成文件theme-antd.css，
     * 否则对index.less自定义的主题修改，生成theme.css
     * @param vars 变量，键值对，如：{"@primary-color":"red"}
     * @param compileAntd 是否对antd编译，如果是否则编译index.less即自定义的样式，否则就对antd渲染
     * @param theme 主题，只有在compileAntd为true时有效，可选项为dark|compact
     * @param shaking 是否开启shaking功能
     */
    Theme.changeLessVars({
        vars:{"@height":"100vh"},
        compileAntd: true|false,
        theme:"dark"|"compact", 
        shaking:true|false
    })
```
