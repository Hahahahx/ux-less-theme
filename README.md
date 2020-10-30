# ux-less-theme
动态主题切换，express中间件

在开始之前首先要确认一点，<b>动态主题切换始终只作用于开发环境下，不该在生产环境中使用它</b>，
正确的做法应该是在开发环境中确认主题样式，生成所需要的样式文件，在生产环境中引用这些文件，而不是交给服务器再次生成，这是一步很耗时的操作。

```typescript
    const ThemeMiddleware = require("./themeMiddleware");
    const express = require("express");

    const app = express();
    app.use(ThemeMiddleware({
        antdDir:path.resolve(paths.appNodeModules,"./antd"),    // antd文件夹目录
        indexDir:path.resolve(appSrc,"./assets/styles"),    // 自定义样式入口文件，确保目录下有index.less
        outputDir:paths.appPublic,              // 生成出的文件存放位置
        antdRequired:['Button','Layout']，              //只打包这些组件
        baseUrl:"/less",                // 访问路由
    }))

```

接口参数（GET）：

```typescript
//生成两个antd自带的样式主题 dark.css 与 compact.css
fetch("/less?generater=ture")
//生成被编译后的index.less样式 theme.css
fetch("/less?vars[@height]=100vh")
//生成被编译后的antd样式 theme-antd.css
fetch("/less?vars[@primary-color]=red")
```