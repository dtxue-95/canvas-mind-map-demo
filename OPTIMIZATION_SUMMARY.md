# 思维导图项目优化和汉化总结

## 项目概述
这是一个基于React和Canvas的交互式思维导图应用，支持节点的创建、编辑、删除、拖拽、搜索等功能。

## 完成的优化和汉化工作

### 1. 常量文件优化 (`constants.ts`)
- ✅ 汉化所有注释和字符串
- ✅ 优化配置值，提高可读性
- ✅ 重新组织常量结构，按功能分组
- ✅ 添加详细的中文注释说明

### 2. 初始数据汉化 (`initialData.ts`)
- ✅ 汉化示例数据内容
- ✅ 优化数据结构，修复类型错误
- ✅ 添加中文注释说明
- ✅ 改进数据规范化逻辑

### 3. 布局引擎优化 (`layoutEngine.ts`)
- ✅ 汉化所有注释
- ✅ 优化代码结构和可读性
- ✅ 添加详细的JSDoc注释
- ✅ 改进函数命名和参数说明

### 4. 类型定义优化 (`types.ts`)
- ✅ 汉化所有接口和类型注释
- ✅ 优化类型结构，提高可读性
- ✅ 添加详细的中文说明
- ✅ 改进类型命名和文档

### 5. 组件汉化

#### 5.1 工具栏组件 (`components/Toolbar.tsx`)
- ✅ 汉化组件注释
- ✅ 优化组件结构

#### 5.2 底部工具栏 (`components/BottomViewportToolbar.tsx`)
- ✅ 汉化所有按钮文本和提示
- ✅ 优化用户界面文本
- ✅ 改进用户体验

#### 5.3 搜索组件 (`components/SearchWidget.tsx`)
- ✅ 汉化搜索框占位符和提示
- ✅ 优化搜索体验

### 6. 主应用组件优化 (`App.tsx`)
- ✅ 汉化所有注释和文本
- ✅ 优化代码结构和可读性
- ✅ 改进错误处理和用户提示
- ✅ 添加详细的中文注释

### 7. 工具函数优化

#### 7.1 节点工具 (`utils/nodeUtils.ts`)
- ✅ 汉化所有函数注释
- ✅ 添加详细的JSDoc文档
- ✅ 优化函数说明

#### 7.2 Canvas工具 (`utils/canvasUtils.ts`)
- ✅ 汉化所有绘制函数注释
- ✅ 优化错误信息
- ✅ 添加详细的功能说明

### 8. 命令模式优化

#### 8.1 添加节点命令 (`commands/addNodeCommand.ts`)
- ✅ 汉化所有注释和错误信息
- ✅ 优化命令逻辑说明
- ✅ 改进错误处理

#### 8.2 删除节点命令 (`commands/deleteNodeCommand.ts`)
- ✅ 汉化所有注释和错误信息
- ✅ 优化命令逻辑说明
- ✅ 改进错误处理

### 9. 状态管理优化 (`hooks/useMindMap.ts`)
- ✅ 汉化所有Hook注释
- ✅ 优化状态管理逻辑说明
- ✅ 添加详细的功能文档
- ✅ 改进错误信息

### 10. 文档优化

#### 10.1 README文件 (`README.md`)
- ✅ 完全汉化项目说明
- ✅ 添加功能特性介绍
- ✅ 优化安装和使用说明
- ✅ 添加快捷键说明
- ✅ 列出技术栈

#### 10.2 搜索功能渲染问题修复
- ✅ **问题**: 当用户删除搜索内容时，页面不渲染任何内容，导致界面空白。
- ✅ **原因**: 在`SET_SEARCH_TERM`处理逻辑中，当搜索词为空时，条件判断`searchTerm && node.text.toLowerCase().includes(searchTerm)`会阻止所有节点的渲染。
- ✅ **解决方案**: 重构搜索逻辑，只有当搜索词不为空时才进行匹配，当搜索词为空时清除所有高亮但不影响正常渲染。
- ✅ **结果**: 搜索功能现在可以正常工作，删除搜索内容时页面正常渲染，用户体验得到改善。

#### 10.3 编辑模式下搜索问题修复
- ✅ **问题**: 在只读模式下搜索正常，但在编辑模式下删除搜索内容会导致页面不渲染。
- ✅ **原因**: `MindMapCanvas`组件中主要的渲染`useEffect`的依赖数组缺少`isReadOnly`，导致在编辑模式和只读模式之间切换时，渲染逻辑不一致。
- ✅ **解决方案**: 在主要的渲染`useEffect`的依赖数组中添加`isReadOnly`，确保渲染逻辑能够正确响应模式切换。
- ✅ **结果**: 搜索功能现在在编辑模式和只读模式下都能正常工作，页面渲染一致。

#### 10.4 初始化时序问题修复
- ✅ **问题**: 当初始进入页面时，搜索框输入然后删除就会出现错误，但多刷新几次页面或切换模式后问题消失。
- ✅ **原因**: `LOAD_DATA`处理中的状态重置逻辑存在问题，`Set`对象的引用比较导致React认为状态发生了变化，影响渲染逻辑。
- ✅ **解决方案**: 在`LOAD_DATA`处理中明确重置搜索相关状态，包括`currentSearchTerm`和`highlightedNodeIds`，确保状态初始化的一致性。
- ✅ **结果**: 搜索功能现在在页面初始加载时就能正常工作，不再需要多次刷新或模式切换。

#### 10.1 空格处理优化
- ✅ **问题**: 当用户在搜索框中输入空格时，搜索功能出现异常。
- ✅ **原因**: 原逻辑`searchTerm && searchTerm.trim() !== ''`在处理空格时存在逻辑错误，空格字符串被认为是truthy但trim后为空。
- ✅ **解决方案**: 优化搜索逻辑为`searchTerm.toLowerCase().trim()`和`searchTerm && searchTerm.length > 0`，确保空格等空白字符被正确处理。
- ✅ **结果**: 搜索功能现在可以正确处理各种输入情况，包括空格、制表符等空白字符。

#### 10.2 输入删除问题修复
- ✅ **问题**: 搜索框输入内容后，第一次按退格删除时，搜索框内容没有变，页面就不会渲染内容。
- ✅ **原因**: `useMindMap.ts`中的搜索逻辑和`canvasUtils.ts`中的绘制逻辑使用了不同的搜索词处理方式，导致状态不一致。
- ✅ **解决方案**: 
    - 统一搜索词处理逻辑，在`useMindMap.ts`中使用`originalTerm`保存原始输入值
    - 在`canvasUtils.ts`中也使用`trim()`后的搜索词进行匹配
    - 确保状态更新和渲染逻辑的一致性
- ✅ **结果**: 搜索功能现在可以正确处理输入和删除操作，页面渲染正常。

#### 10.3 搜索功能React 18兼容性修复
- ✅ **问题**: 搜索组件使用`@alifd/next`的`Input`组件时，在React 18严格模式下出现"Legacy context API has been detected"警告。
- ✅ **原因**: `@alifd/next`的`Input`组件使用了旧的React Context API，与React 18的严格模式不兼容。
- ✅ **解决方案**: 将搜索组件中的`@alifd/next`的`Input`替换为原生`input`元素，并添加了相应的样式和交互效果，保持视觉一致性。
- ✅ **结果**: 消除了React 18严格模式警告，搜索功能正常工作，用户体验不受影响。

#### 10.4 Wheel事件preventDefault警告修复
- ✅ **问题**: 在浏览器控制台中出现"Unable to preventDefault inside passive event listener invocation"警告，影响用户体验。
- ✅ **原因**: 现代浏览器中，wheel事件默认作为被动事件监听器处理，不允许调用`preventDefault()`方法。
- ✅ **解决方案**: 
    - 移除React的`onWheel`属性处理方式
    - 使用`useRef`和`useEffect`手动添加事件监听器
    - 设置`{ passive: false }`选项来允许`preventDefault()`调用
    - 保持原有的缩放功能逻辑不变
- ✅ **结果**: 消除了浏览器控制台警告，鼠标滚轮缩放功能正常工作，用户体验得到改善。

#### 10.5 搜索功能键盘事件冲突修复
- ✅ **问题**: 在搜索框中输入内容后，第一次按Backspace删除时，搜索框内容不变，页面白屏，且控制台无报错。
- ✅ **原因**: 
    - 搜索框的Backspace操作被全局键盘事件监听器捕获，误认为是节点删除操作
    - 删除根节点时会将`rootNode`设置为`null`，导致页面白屏
    - 输入法拼音输入过程中可能触发多次状态更新，导致时序问题
- ✅ **解决方案**: 
    - **键盘事件冲突修复**: 在全局键盘事件处理中添加焦点检查，当焦点在输入框上时不处理全局键盘事件
    - **删除根节点逻辑修复**: 删除根节点时提升第一个子节点作为新的根节点，而不是设置为`null`
    - **搜索框事件优化**: 添加`onInput`事件监听器，确保能捕获所有输入变化
- ✅ **结果**: 搜索功能现在可以正确处理输入和删除操作，页面渲染正常。

#### 10.6 搜索功能精确匹配和中心点定位优化
- ✅ **背景**: 用户希望搜索功能能够区分精确匹配和模糊匹配，并为精确匹配的节点提供更明显的高亮效果，同时自动定位到匹配的节点。
- ✅ **优化内容**:
    - **精确匹配高亮**: 
        - 添加了淡黄色背景常量 `NODE_EXACT_MATCH_BACKGROUND_COLOR = '#FEF3C7'`
        - 修改搜索逻辑，区分精确匹配（`nodeTextLower === searchTerm`）和模糊匹配（`nodeTextLower.includes(searchTerm)`）
        - 为精确匹配的节点添加淡黄色背景，模糊匹配的节点保持金色边框高亮
    - **中心点定位功能**:
        - 记录搜索时第一个匹配的节点ID
        - 将第一个匹配的节点设为选中节点，作为中心点
        - 添加useEffect监听搜索状态变化，当有匹配节点时自动居中到目标节点
    - **状态管理优化**:
        - 在 `MindMapState` 中添加 `exactMatchNodeIds` 字段记录精确匹配的节点
        - 修改 `SET_SEARCH_TERM` 处理逻辑，分别记录精确和模糊匹配的节点
        - 在 `LOAD_DATA` 等状态重置时也重置精确匹配集合
    - **绘制逻辑优化**:
        - 更新 `drawNode` 函数，支持精确匹配背景色参数
        - 修改 `MindMapCanvas` 组件，传递精确匹配参数给绘制函数
        - 更新相关useEffect依赖数组
- ✅ **结果**: 搜索功能现在能够：
    - 精确匹配的节点显示淡黄色背景，更容易识别
    - 模糊匹配的节点显示金色边框高亮
    - 搜索后自动居中到第一个匹配的节点
    - 如果有精确匹配，优先选择精确匹配的节点作为中心点
    - 大大提升了搜索功能的用户体验和视觉效果

#### 10.7 搜索功能中心点定位逻辑修复
- ✅ **背景**: 用户反馈在模糊搜索和精确搜索下，选择任何一个节点都会成为中心点，而且匹配到的节点不应该被默认选中。
- ✅ **问题分析**:
    - 搜索匹配时自动选中第一个匹配的节点，导致匹配节点被默认选中
    - 居中逻辑依赖选中节点，而不是匹配节点
    - 用户希望只有被匹配的节点才能成为中心点，且匹配节点不应被选中
- ✅ **修复内容**:
    - **移除自动选中逻辑**: 修改 `SET_SEARCH_TERM` 处理逻辑，移除自动选中匹配节点的功能
    - **优化自动居中逻辑**: 修改搜索状态监听器，当有搜索匹配时自动居中到第一个匹配的节点，而不是选中的节点
    - **优化手动居中功能**: 修改 `handleCenterContent` 函数，优先居中到匹配的节点，其次才是选中的节点
    - **保持节点选择独立性**: 匹配节点不再被自动选中，用户可以独立选择任何节点
- ✅ **结果**: 搜索功能现在能够：
    - 匹配到的节点不会被默认选中，保持用户选择的独立性
    - 只有被匹配的节点才能成为中心点（通过自动居中或手动居中）
    - 搜索后自动居中到第一个匹配的节点
    - 手动点击"居中"按钮时，优先居中到匹配的节点
    - 用户体验更加符合预期，搜索和选择功能分离

#### 10.8 工具栏侧边栏设计和推出动画优化
- ✅ **背景**: 用户希望工具栏采用侧边栏设计，展开收起按钮紧贴屏幕右上角和右下角，展开后从右向左推出工具条，实现更现代化的交互效果。
- ✅ **设计理念**:
    - **侧边栏设计**: 将工具栏从中央悬浮改为右侧侧边栏设计
    - **紧贴边缘**: 展开收起按钮紧贴屏幕右上角和右下角
    - **推出动画**: 展开时从右向左推出，收起时向右滑出
    - **毛玻璃效果**: 使用 `backdrop-blur-md` 和半透明背景，营造层次感
- ✅ **位置和布局优化**:
    - **顶部工具栏**: 展开收起按钮固定在 `top-4 right-4`，工具栏在右上角展开
    - **底部工具栏**: 展开收起按钮固定在 `bottom-6 right-4`，工具栏在右下角展开
    - **按钮尺寸**: 从 `w-8 h-8` 增加到 `w-10 h-10`，提供更好的点击区域
    - **层级管理**: 按钮使用 `z-40`，工具栏使用 `z-30`，确保正确的层级关系
- ✅ **推出动画效果**:
    - **展开动画**: 使用 `translate-x-0` 和 `w-auto` 实现从右向左推出
    - **收起动画**: 使用 `translate-x-full` 和 `w-0` 实现向右滑出
    - **平滑过渡**: 500ms的 `transition-all duration-500 ease-out` 动画
    - **缩放效果**: 配合 `scale-100` 和 `scale-95` 提供更丰富的视觉反馈
- ✅ **图标和交互优化**:
    - **方向图标**: 使用 `arrow-right`（展开）和 `arrow-left`（收起）图标
    - **布局对齐**: 工具栏内容使用 `justify-end` 右对齐，符合侧边栏设计
    - **悬浮提示**: 提示框位置调整为紧贴按钮，提供更好的视觉关联
    - **按钮样式**: 统一的毛玻璃背景和阴影效果
- ✅ **响应式设计**:
    - **最大宽度**: 顶部工具栏 `max-w-6xl`，底部工具栏 `max-w-5xl`
    - **间距优化**: 保持原有的按钮间距和响应式布局
    - **屏幕适配**: 在不同屏幕尺寸下保持一致的侧边栏效果
- ✅ **技术实现**:
    - **CSS变换**: 使用 `translate-x` 实现水平滑动动画
    - **宽度动画**: 配合 `w-auto` 和 `w-0` 实现宽度变化
    - **状态管理**: 使用 React useState 管理展开收起状态
    - **条件渲染**: 根据状态动态渲染不同的UI元素
    - **定位系统**: 使用 `fixed` 定位实现精确的位置控制
- ✅ **用户体验提升**:
    - **直觉化交互**: 按钮位置符合用户习惯，紧贴屏幕边缘
    - **流畅动画**: 从右向左的推出动画更加自然和现代
    - **视觉层次**: 清晰的层级关系，避免元素重叠
    - **操作便利**: 更大的按钮尺寸，提供更好的点击体验
    - **空间利用**: 侧边栏设计更好地利用屏幕空间
- ✅ **结果**: 工具栏现在具有：
    - 现代化的侧边栏设计，符合当前UI设计趋势
    - 紧贴屏幕边缘的展开收起按钮，操作更加便利
    - 流畅的从右向左推出动画，提供优秀的视觉体验
    - 清晰的层级关系和视觉层次
    - 响应式设计，在不同设备上都有良好表现
    - 为后续功能扩展预留了充足空间

### 8. UI组件库迁移至`@alifd/next`
- ✅ **背景**: 为了统一UI风格并提升组件的专业性，决定引入Fusion Design (`@alifd/next`)。
- ✅ **实施**:
    - **依赖安装**: 添加`@alifd/next`到项目依赖。
    - **样式引入**: 在`App.tsx`中全局引入`@alifd/next/dist/next.css`。
    - **组件替换**:
        - `components/Toolbar.tsx`: 使用`Button`替换原生按钮。
        - `components/BottomViewportToolbar.tsx`: 使用`Button`和`Icon`替换自定义按钮和SVG图标。
        - `components/SearchWidget.tsx`: 使用`Input`、`Button`和`Icon`重构。
        - `components/NodeEditInput.tsx`: 使用`Input`和`Button`重构，并修复了`ref`类型兼容性问题。
    - **图标清理**: 删除了不再需要的本地SVG图标文件`components/icons.tsx`。
    - **依赖问题修复**: 解决了`@alifd/next`依赖`lodash`但项目缺少该依赖的问题，安装了`lodash`和`@types/lodash`。
- ✅ **结果**: 应用的所有核心UI组件现在都由`@alifd/next`驱动，实现了统一、现代化的外观。

## 修复的Bug和改进

### 1. 类型错误修复
- ✅ 修复了initialData.ts中的类型错误
- ✅ 确保所有节点都有完整的属性定义
- ✅ 改进了类型安全性

### 2. 依赖管理优化
- ✅ 安装了必要的React类型定义
- ✅ 确保TypeScript编译正常
- ✅ 优化了包管理配置

### 3. 代码质量改进
- ✅ 统一了代码风格和注释格式
- ✅ 改进了错误处理和用户反馈
- ✅ 优化了代码可读性和维护性

### 4. 用户体验优化
- ✅ 汉化了所有用户界面文本
- ✅ 改进了错误提示信息
- ✅ 优化了操作反馈

### 5. 初始节点重叠问题
- ✅ **问题**: 初始进入页面时，所有节点都重叠在一起。
- ✅ **原因**: `useMindMap` hook在初始化时没有对默认数据应用布局。
- ✅ **修复**: 修改`hooks/useMindMap.ts`，在`useEffect`中通过`LOAD_DATA` action加载初始数据，确保布局在渲染前正确应用。

### 6. 只读模式无法展开/收起节点
- ✅ **问题**: 在只读模式下，用户无法点击按钮来展开或收起节点。
- ✅ **原因**: `MindMapCanvas.tsx`中的`handleMouseDown`事件处理器错误地检查了`isReadOnly`状态，阻止了`toggleNodeCollapse`动作的派发。
- ✅ **修复**: 移除了`handleMouseDown`函数中对`isReadOnly`的不必要检查，允许在任何模式下都能进行节点的展开和收起操作。

### 7. UI组件库迁移至`@alifd/next`
- ✅ **背景**: 为了统一UI风格并提升组件的专业性，决定引入Fusion Design (`@alifd/next`)。
- ✅ **实施**:
    - **依赖安装**: 添加`@alifd/next`到项目依赖。
    - **样式引入**: 在`App.tsx`中全局引入`@alifd/next/dist/next.css`。
    - **组件替换**:
        - `components/Toolbar.tsx`: 使用`Button`替换原生按钮。
        - `components/BottomViewportToolbar.tsx`: 使用`Button`和`Icon`替换自定义按钮和SVG图标。
        - `components/SearchWidget.tsx`: 使用`Input`、`Button`和`Icon`重构。
        - `components/NodeEditInput.tsx`: 使用`Input`和`Button`重构，并修复了`ref`类型兼容性问题。
    - **图标清理**: 删除了不再需要的本地SVG图标文件`components/icons.tsx`。
    - **依赖问题修复**: 解决了`@alifd/next`依赖`lodash`但项目缺少该依赖的问题，安装了`lodash`和`@types/lodash`。
- ✅ **结果**: 应用的所有核心UI组件现在都由`@alifd/next`驱动，实现了统一、现代化的外观。

### 8. 居中功能智能优化
- ✅ **背景**: 用户希望"居中"操作能根据当前选中节点动态调整。
- ✅ **优化内容**: 
    - 如果没有选中任何节点，点击"居中"按钮时，视图以根节点为中心。
    - 如果选中了某个节点，点击"居中"按钮时，视图以该选中节点为中心。
- ✅ **结果**: 操作体验更加智能、贴合用户直觉。

## 技术特性

### 核心功能
- 🎯 **节点管理**: 创建、编辑、删除节点
- 🔄 **拖拽操作**: 拖拽移动节点位置
- 🔍 **搜索功能**: 实时搜索节点内容
- 📱 **响应式设计**: 支持不同屏幕尺寸
- 🖱️ **缩放平移**: 鼠标滚轮缩放，拖拽平移
- 📋 **只读模式**: 保护内容不被意外修改
- 🖥️ **全屏模式**: 沉浸式编辑体验
- 🎨 **美观界面**: 现代化的UI设计

### 快捷键支持
- `Tab`: 为选中节点添加子节点
- `Shift + Tab` 或 `Insert`: 添加兄弟节点
- `Delete` 或 `Backspace`: 删除选中节点
- `Enter`: 编辑节点文本
- `Esc`: 取消编辑

### 技术栈
- React 19
- TypeScript
- Canvas API
- Tailwind CSS
- Vite
- @alifd/next (Fusion Design)

## 项目结构
```
├── components/          # React组件
├── hooks/              # 自定义Hooks
├── utils/              # 工具函数
├── commands/           # 命令模式实现
├── constants.ts        # 常量定义
├── types.ts           # 类型定义
├── layoutEngine.ts    # 布局引擎
├── initialData.ts     # 初始数据
└── App.tsx           # 主应用组件
```

## 运行说明

1. 安装依赖:
   ```bash
   pnpm install
   ```

2. 运行开发服务器:
   ```bash
   pnpm dev
   ```

3. 构建生产版本:
   ```bash
   pnpm build
   ```

## 总结

通过这次全面的优化和汉化工作，我们：

1. **提升了代码质量**: 统一了代码风格，改进了注释和文档
2. **改善了用户体验**: 汉化了所有界面文本，优化了交互反馈
3. **增强了可维护性**: 改进了代码结构，添加了详细文档
4. **修复了潜在问题**: 解决了类型错误和依赖问题
5. **完善了功能**: 优化了现有功能，改进了错误处理
6. **现代化UI**: 引入了Fusion Design组件库，提升了界面美观度
7. **修复了关键bug**: 解决了搜索、居中、只读模式等多个功能问题
8. **修复了wheel事件preventDefault警告**: 消除了浏览器控制台警告，鼠标滚轮缩放功能正常工作，用户体验得到改善。
9. **修复了搜索功能键盘事件冲突**: 解决了输入和删除操作与全局快捷键冲突的问题，页面不会白屏。
10. **搜索功能精确匹配和中心点定位优化**: 提升了搜索功能的用户体验和视觉效果
11. **工具栏展开收起功能优化**: 提升了工具栏的交互体验和视觉效果

项目现在具有更好的可读性、可维护性和用户体验，完全支持中文环境，适合中文用户使用。

## 工具栏重构 - 实现图片风格并修复布局

- ✅ **背景**: 用户反馈工具栏样式错乱，关闭按钮定位错误，缩放百分比不显示，并提供了期望的新UI风格图片。
- ✅ **设计理念**:
    - **UI对齐**: 精确复刻用户提供的图片风格，包括按钮样式、布局、字体和分组。
    - **移除复杂性**: 放弃了之前问题频发的"展开/收缩
    "和"悬浮小球"逻辑，改为更稳定、更直观的常驻式工具栏。
    - **健壮性优先**: 修复了所有已知的布局和显示问题，通过内联样式和简化逻辑来保证UI的稳定性。
- ✅ **顶部工具栏重构 (Toolbar.tsx)**:
    - **全新风格**: 实现了"上图标、下文字"的圆角矩形按钮样式，完全匹配图片。
    - **命令分组**: 将"回退/前进"与"节点操作"进行分组，并使用垂直分隔线，布局更清晰。
    - **占位符按钮**: 添加了禁用的"回退"和"前进"按钮，使UI布局更接近于最终形态。
    - **精确定位**: 整个工具栏使用 `fixed top-4 left-1/2 -translate-x-1/2` 定位，始终保持在屏幕顶部中央。
- ✅ **底部工具栏重构 (BottomViewportToolbar.tsx)**:
    - **布局修复**: 彻底解决了按钮和百分比的错乱问题。现在缩放控件和其它视图控件被清晰地分为两组。
    - **百分比修复**: 确保了 `zoomPercentage` 能够被正确传递和显示。
    - **按钮风格统一**: 底部工具栏的按钮统一为简洁的圆形图标按钮，与顶部工具栏形成区分，符合其作为"视图控制"的功能定位。
    - **提示修复**: 移除了导致问题的自定义Tooltip，改用更稳定、更轻量的浏览器原生 `title` 属性进行提示。
- ✅ **逻辑与代码优化**:
    - **移除状态管理**: 删除了两个工具栏中所有的 `useState`（用于控制展开/收缩），使组件变为无状态的纯展示组件，更易于维护。
    - **代码简化**: 在 `BottomViewportToolbar` 中创建了可复用的 `IconButton` 子组件，提高了代码的可读性。
    - **CSS文件清理**: 之前引入的外部CSS文件及其引用已被完全移除，避免了潜在的样式冲突。
- ✅ **图标系统**:
    - **统一使用 `react-icons`**: 所有图标均来自 `react-icons`，确保了视觉风格的统一和专业性。

## 工具栏交互打磨 - "小抽屉"拉手最终优化

- ✅ **背景**: 用户认为"小抽屉"拉手的设计方向正确，但希望它能更精巧，并增加自定义的悬浮提示。
- ✅ **设计理念**:
    - **精益求精**: 在已有设计的基础上，进一步优化细节，追求更极致的用户体验。
    - **信息传递**: 用自定义的、与UI风格统一的提示框，清晰地告诉用户拉手的功能，同时避免原生`title`的样式突兀。
    - **视觉减负**: 适当减小拉手的高度，使其在屏幕上更加低调、轻盈。
- ✅ **"小抽屉"拉手细节优化**:
    - **高度调整**: 将拉手的高度从 `h-24` (96px) 减少为 `h-20` (80px)，使其在视觉上更为精巧。
    - **自定义提示框**:
        - **移除原生Title**: 删除了拉手上的原生 `title` 属性。
        - **添加自定义Tooltip**: 新增了一个div作为自定义提示框，它会在`group-hover`时平滑地浮现出来。
        - **样式统一**: 提示框采用了与底部按钮提示框相同的样式（深色背景、白色文字、圆角、阴影），保证了UI风格的一致性。
        - **内容区分**: 顶部拉手的提示为"展开主工具栏"，底部为"展开视图工具栏"，清晰明了。
- ✅ **交互动画保持**:
    - 保留并优化了拉手的滑出效果 (`translate-x-4` -> `group-hover:translate-x-0`) 和视觉反馈（背景、图标颜色变化），确保交互体验的流畅和引导性。

## 工具栏交互升级 - "小抽屉"拉手设计

## 工具栏稳定性修复

- ✅ **背景**: 用户报告底部工具栏的缩放百分比不显示，按缩放按钮百分比没有变化。
- ✅ **问题分析**: 
    - 经过排查，发现虽然 `INITIAL_ZOOM` 的值为 `1.0`，但在某些边缘情况下（如组件初次渲染时），传递给 `BottomViewportToolbar` 的 `zoomPercentage` 属性可能是一个无效值（如 `NaN`），导致UI上不显示任何数字。
    - **根本原因**: 在 `App.tsx` 中，`BottomViewportToolbar` 组件调用时缺少了 `zoomPercentage` 属性的传递，导致组件接收到 `undefined` 值。
- ✅ **修复方案**:
    - **增加数据校验**: 在 `BottomViewportToolbar` 组件内部，增加了一个简单的保护逻辑。
    - **默认值**: 在渲染百分比之前，会先检查 `zoomPercentage` 是否是一个有效的数字 (`!isNaN(zoomPercentage)`)。
        - 如果是有效数字，则正常显示。
        - 如果是无效数字（`NaN`），则**默认显示为 `100`**。
    - **修复数据传递**: 在 `App.tsx` 中，为 `BottomViewportToolbar` 组件添加了缺失的 `zoomPercentage={zoomPercentage}` 属性传递。
    - **清理代码**: 移除了不再使用的 `@alifd/next` CSS 导入和 `Toolbar` 组件中不存在的 `borderStyle` 属性。
- ✅ **效果**:
    - 此项修复确保了无论上游数据状态如何，缩放百分比显示区域永远不会为空白，至少会显示一个合理的默认值 `100%`。
    - 修复了缩放按钮点击后百分比不更新的问题，现在缩放操作会正确反映在百分比显示上。
    - 提升了组件的健壮性，避免了因数据异常导致的UI显示问题。
    - 清理了代码中的冗余导入和无效属性，提高了代码质量。

## 搜索功能快捷键修复

- ✅ **背景**: 用户报告使用 `Cmd+F` 或 `Ctrl+F` 快捷键时，会触发浏览器自带的搜索功能，而不是应用内的搜索框。用户进一步要求在整个应用范围内完全禁用浏览器的默认搜索功能。
- ✅ **问题分析**: 
    - 应用缺少一个全局的快捷键监听器来捕获并阻止搜索快捷键的默认行为。
    - 虽然 `MindMapCanvas` 中有键盘事件处理，但它主要关注画布内的操作，并且没有处理 `Cmd+F`。
    - 用户希望确保在任何情况下，浏览器都不会提供搜索功能，用户只能使用应用内的搜索。
- ✅ **修复方案**:
    - **添加全局监听器**: 在主组件 `App.tsx` 中，使用 `useEffect` 添加了一个全局的 `keydown` 事件监听器。
    - **阻止默认行为**: 在该监听器中，检测 `(e.metaKey || e.ctrlKey) && e.key === 'f'` 组合键。
    - **触发应用内搜索**: 当检测到快捷键时，立即调用 `e.preventDefault()` 来阻止浏览器的默认搜索行为，然后调用 `handleToggleSearchWidget()` 函数来显示或隐藏应用内的搜索组件。
    - **焦点保护**: 监听器会检查当前焦点是否在输入框（`INPUT`, `TEXTAREA`）上，如果是，则不执行任何操作，以避免干扰正常的文本输入。
    - **全面禁用浏览器搜索**:
        - 使用 `capture` 阶段监听器确保最先执行
        - 添加 `e.stopPropagation()` 和 `return false` 确保事件被完全阻止
        - 处理其他可能的搜索快捷键（如 `Cmd+G` 在 Safari 中）
        - 处理 `F3` 键（某些浏览器的查找下一个）
        - 添加右键菜单监听器，禁用包含搜索选项的默认右键菜单
        - 为搜索组件添加特定类名，确保在搜索相关元素上仍可正常使用右键菜单
        - **搜索框内完全禁用**: 即使在搜索框或输入框内，也要阻止浏览器的搜索快捷键，确保用户无法通过任何方式访问浏览器搜索功能
- ✅ **效果**:
    - 现在，在应用的任何地方（除了在输入框中）按下 `Cmd+F` 或 `Ctrl+F` 都会正确地打开或关闭思维导图的搜索框。
    - 浏览器的默认搜索功能被完全禁用，包括快捷键、右键菜单等所有入口。
    - 提供了完全无缝的应用体验，用户只能使用应用内提供的搜索功能。
    - 在搜索框和输入框内仍保持正常的右键菜单功能。

## 【2024-重大重构】NPM包化与现代化演进全记录

### 1. 目录结构重构
- 将原有所有源码（components、hooks、utils、types等）统一迁移到 `src/lib/` 目录，作为NPM包的核心代码。
- `src/App.tsx` 仅作为示例入口，演示如何在外部项目中集成和使用该思维导图组件。

### 2. 入口组件与API设计
- 新增 `src/lib/ReactMindMap.tsx`，封装所有核心逻辑，暴露 `initialData` 等props，成为NPM包的主入口。
- 新建 `src/lib/index.ts`，统一导出主组件和类型。

### 3. 构建与类型声明
- 新增 `vite.lib.config.ts`，专用于库模式打包，支持ESM/UMD双格式输出。
- 集成 `vite-plugin-dts`，自动生成类型声明文件，提升TypeScript开发体验。
- `package.json` 增加 `main/module/types/files/exports` 字段，配置NPM包元数据。

### 4. 样式系统修复
- 新建 `tailwind.config.js`，配置 `content` 路径，确保所有组件样式被Tailwind扫描。
- 新建 `postcss.config.js`，注册 `tailwindcss` 和 `autoprefixer` 插件，保证Vite能正确处理Tailwind指令。
- 修正 `index.html` 和样式表引用路径，确保开发环境和打包环境下样式一致。

### 5. 依赖与兼容性
- 将 `react`、`react-dom` 移至 `peerDependencies`，避免多版本冲突。
- 安装并配置 `@types/node`，解决Vite配置文件类型报错。

### 6. 其他关键修复
- 批量修正所有源码文件的导入路径，适配新目录结构。
- 清理未使用的变量和类型，消除TypeScript构建警告。
- 优化 `App.tsx`，只保留最简用法示例，便于外部集成测试。

### 7. 典型问题与解决
- 解决了因缺少Tailwind/PostCSS配置导致的样式全部丢失问题（详见本文件前述补充章节）。
- 解决了Vite入口路径、样式表路径等因目录调整导致的404和渲染异常。

---

### 效果
通过本次重构，组件的灵活性和可扩展性得到了极大的提升，能更好地适应各种复杂的业务场景，是组件库走向成熟的关键一步。

### 10.9 工具条按钮声明式自定义与 key/id 规范化
- ✅ **背景**: 用户希望通过 ReactMindMap 组件的 props 直接声明要显示哪些工具条按钮（如增删、撤销、全屏等），而不是手动组装 action/icon。
- ✅ **问题**: 用户在 App.tsx 传递的 topToolbarKeys/bottomToolbarKeys 使用了驼峰式 key（如 addChild、addSibling、deleteNode），而命令注册表和内部逻辑使用短横线风格（如 add-child-node、add-sibling-node、delete-node），导致按钮无法正常显示。
- ✅ **修复内容**:
    - 明确所有命令 id 采用短横线风格（如 add-child-node），并在文档和类型定义中补充注释说明。
    - 优化 ReactMindMap 组件内部的工具条渲染逻辑，严格按传入的 key/id 过滤按钮。
    - 检查并修正 App.tsx 示例配置，确保 key/id 与命令注册表一致。
    - 保证 icon 字段为 React 组件，按钮渲染和点击逻辑声明式、自动化。
- ✅ **结论**:
    - 只需在 ReactMindMap 组件上传递 topToolbarKeys/bottomToolbarKeys，且 key/id 与命令注册表一致（短横线风格），即可声明式控制工具条按钮，无需手动组装 action/icon。
    - 该方案极大提升了工具条自定义的易用性和可维护性。

### 10.10 工具条支持自定义操作按钮
- ✅ **背景**: 用户希望在思维导图工具条中，除了内置命令按钮外，还能灵活添加自定义操作按钮（如"保存"、"导出"等）。
- ✅ **实现方案**:
    - 在 ReactMindMapProps 新增 `topToolbarCustomButtons` 和 `bottomToolbarCustomButtons`，类型为 ToolbarButtonConfig[]。
    - 渲染工具条时，将自定义按钮与内置按钮合并（追加到末尾）。
    - 支持自定义 icon、label、action、title、disabled、visible 等属性。
    - 所有类型和注释均已汉化，便于团队理解和二次开发。
- ✅ **用法示例**:
    ```tsx
    import { FaSave } from 'react-icons/fa';
    const customSaveButton = {
      id: 'custom-save',
      label: '保存',
      icon: FaSave,
      action: () => alert('自定义保存！'),
      title: '保存当前思维导图'
    };
    <ReactMindMap topToolbarCustomButtons={[customSaveButton]} />
    ```
- ✅ **优势**:
    - 外部可声明式追加任意自定义按钮，满足多样化业务需求。
    - 内置与自定义按钮可共存，互不影响。
    - 未来可扩展更多自定义属性（如分组、顺序、权限等）。

### 10.11 自定义工具条按钮支持函数式禁用（自动响应只读/编辑模式）
- ✅ **背景**: 以往自定义按钮的禁用状态只能手动传递布尔值，无法自动响应全局只读/编辑模式，体验不一致。
- ✅ **优化内容**:
    - ToolbarButtonConfig 的 `disabled` 字段支持传递函数 `(state) => boolean`，可根据当前思维导图状态动态判断是否禁用。
    - 组件内部会自动传递当前 state，和内置按钮行为完全一致。
    - 只需写 `disabled: (state) => state.isReadOnly`，即可让按钮在只读时禁用、编辑时可用。
- ✅ **使用示例**:
    ```js
    import { FaSave } from 'react-icons/fa';
    const customSaveButton = {
      id: 'custom-save',
      label: '保存',
      icon: FaSave,
      action: () => alert('自定义保存！'),
      title: '保存当前思维导图',
      disabled: (state) => state.isReadOnly, // 自动禁用
    };
    <ReactMindMap topToolbarCustomButtons={[customSaveButton]} />
    ```
- ✅ **优势**:
    - 自定义按钮禁用状态与全局只读/编辑模式完全同步，无需手动维护。
    - 支持更复杂的动态禁用逻辑（如根据选中节点、权限等）。
    - 体验与内置按钮一致，声明式、易扩展。

### 10.12 节点自定义样式与搜索高亮优先级优化
- ✅ **背景**: 需求支持每个节点自定义 style，但在搜索高亮/精确匹配时，需保证高亮样式优先于自定义样式，且匹配文字应标红。
- ✅ **优化内容**:
    - drawNode 支持 style 参数，解析 background、color、border、borderRadius、fontWeight、fontSize、fontFamily、boxShadow 等常用样式。
    - 搜索高亮/精确匹配时，背景色、边框、字体加粗等高亮样式优先于自定义 style。
    - 匹配到的文字自动标红（NODE_SEARCH_TEXT_MATCH_COLOR），其余部分按自定义 color 或默认色渲染。
    - 支持多行文本、多个匹配段，兼容所有自定义样式。
    - Canvas 节点样式只能通过 JS 传递 style/getNodeStyle 控制，不能直接用 CSS。
    - 如需极致自定义，建议用 getNodeStyle 实现"主题"或"按需样式"。
- ✅ **自定义样式用法示例**:
    ```js
    // 方式一：节点数据自带 style
    {
      id: '1',
      text: '自定义节点',
      style: { background: 'pink', color: 'blue', border: '2px solid #00bcd4', borderRadius: 12, fontWeight: 'bold', fontSize: 20 }
    }
    // 方式二：全局动态样式回调
    <ReactMindMap
      getNodeStyle={(node, state) => {
        if (node.id === '1') return { background: 'gold', color: 'red', fontWeight: 'bold', fontSize: 22 };
        if (node.text.includes('测试')) return { background: '#e0f7fa', border: '2px solid #00bcd4', borderRadius: 16 };
        return {};
      }}
    />
    ```
- ✅ **优势**:
    - 支持声明式、动态定制每个节点的视觉风格。
    - 搜索高亮体验与主流思维导图工具一致，匹配文字始终标红。
    - 兼容多种 CSS 风格，优先级清晰，易于扩展。

### 10.13 getNodeStyle 支持"伪 CSS 主题"能力
- ✅ **背景**: Canvas 节点无法直接用 CSS 控制样式，但通过 getNodeStyle 回调可以实现类似 CSS 选择器/主题的能力。
- ✅ **实现思路**:
    - getNodeStyle 接收每个节点和全局 state，可用 JS 条件判断节点的 id、type、className、text、level 等属性，返回类似 CSS 的样式对象。
    - 支持模拟 id、class、属性、层级、主题切换等"选择器"效果。
    - 所有样式最终会被 drawNode 应用到 Canvas 上，达到"主题"效果。
- ✅ **典型用法示例**:
    ```js
    // 1. 按节点类型/自定义 className 实现主题
    getNodeStyle={(node) => {
      if (node.type === 'root') return { background: '#222', color: '#fff', fontWeight: 'bold', fontSize: 22 };
      if (node.type === 'important') return { background: '#fffbe6', color: '#d48806', border: '2px solid #faad14' };
      if (node.className === 'danger') return { background: '#fff1f0', color: '#cf1322', border: '2px solid #cf1322' };
      return {};
    }}

    // 2. 按 id、text、层级等实现"选择器"效果
    getNodeStyle={(node) => {
      if (node.id === 'special-node') return { background: 'purple', color: 'white' };
      if (node.text.includes('重要')) return { color: 'red', fontWeight: 'bold' };
      if (node.level === 1) return { background: '#e6f7ff' };
      return {};
    }}

    // 3. 支持"主题切换"
    const theme = 'dark';
    getNodeStyle={(node) => theme === 'dark' ? { background: '#222', color: '#fff' } : { background: '#fff', color: '#222' }}
    ```
- ✅ **优势**:
    - getNodeStyle 就是 JS 版的"节点样式选择器"，可模拟大部分 CSS 主题/选择器能力。
    - 支持声明式、动态、全局主题、复杂条件组合，极大提升了样式定制能力。
    - 兼容所有 Canvas 支持的视觉属性，且与搜索高亮等内置样式优先级兼容。

## 搜索跳转自动展开路径

### 背景
在思维导图中，搜索功能支持模糊/精确匹配，但若匹配节点处于收起（折叠）状态，用户跳转时无法直接看到目标节点，影响体验。

### 优化方案
- 在 `useMindMap` 内部实现了 `expandPathToNode` 辅助函数。
- 在 `goToNextMatch` 和 `goToPreviousMatch` 跳转到下一个/上一个匹配节点后，自动递归展开该节点的所有父节点，确保目标节点始终可见。
- 该逻辑无需外部调用，组件内部自动处理。

### 主要实现思路
1. 通过递归查找目标节点的路径（祖先链）。
2. 路径上除目标节点本身外，所有父节点依次展开（如有收起）。
3. 跳转匹配节点时自动触发，无需用户手动展开。

### 交互体验提升
- 搜索跳转时，用户总能直接看到目标节点，无需手动逐级展开。
- 兼容多层嵌套、任意收起状态，极大提升搜索与定位效率。
- 该优化与高亮、自动聚焦等功能协同，体验与主流思维导图工具一致。

### 用法
- 外部无需关心，直接使用搜索与跳转功能即可享受自动展开体验。

## 画布背景色自定义与点状背景

### 背景
原有画布背景色为常量，无法灵活适配品牌色、主题色等多样化需求，也不支持类似 reactflow 的点状网格背景。

### 优化方案
- ReactMindMap 组件 props 新增 `canvasBackgroundColor?: string`，可自定义全局画布背景色，默认 `#f9fafb`。
- 新增 `showDotBackground?: boolean`，为 true 时自动在画布上绘制点状网格背景，默认关闭。
- 相关参数透传至 MindMapCanvas，底层渲染时优先使用 props 配置。

### 主要实现思路
1. 画布背景色优先使用 props 传入值，无则回退默认色。
2. 点状背景通过 canvas 绘制，点间距 24px，点半径 1.2px，颜色为浅灰（Tailwind gray-300）。
3. 两者可独立或组合使用，兼容所有主题。

### 交互体验提升
- 支持任意品牌色、主题色，满足多场景定制需求。
- 点状背景提升画布空间感和美观度，体验对标 reactflow。
- 兼容自适应缩放、窗口变化，视觉一致。

### 用法示例
```jsx
<ReactMindMap
  canvasBackgroundColor="#fffbe6" // 自定义画布背景色
  showDotBackground={true}         // 开启点状背景
  {...其他props}
/>
```

## Minimap 缩略图功能

### 背景
主视图区内容较多时，用户难以快速定位全局结构和当前视口位置。主流思维导图/流程图工具（如 reactflow）均支持右下角缩略图（Minimap）辅助导航。

### 优化方案
- 新增 Minimap 组件，自动在主视图区右下角悬浮显示。
- 缩略图实时展示全部节点缩略视图，并高亮主视图窗口。
- 支持点击/拖拽缩略图快速定位主视图。
- 支持自定义节点样式，风格与主视图一致。

### 主要实现思路
1. 递归计算所有节点包围盒，缩放适配到缩略图区。
2. 以 canvas 绘制全部节点矩形，透明度略低，边框高亮。
3. 主视图窗口以虚线矩形高亮，实时同步。
4. 监听缩略图点击/拖拽，自动平移主视图。
5. 组件参数与主视图完全解耦，便于复用和扩展。

### 交互体验提升
- 用户可一键定位全局任意区域，极大提升大图场景下的导航效率。
- 缩略图与主视图实时同步，交互流畅。
- 支持自定义节点样式，视觉风格统一。

### 用法示例
```jsx
<ReactMindMap
  {...其他props}
/>
// Minimap 会自动在右下角悬浮显示，无需额外配置
```

### Minimap 显示控制
- 通过 ReactMindMap 组件的 `showMinimap?: boolean` 参数，可灵活控制右下角 Minimap 缩略图的显示与隐藏，默认显示。
- 用法示例：
```jsx
<ReactMindMap showMinimap={false} {...其他props} /> // 隐藏 Minimap
```

## 2024-07-24 useMindMap 死循环与画布抖动问题修复

### 问题现象
- 画布在某些操作下发生抖动，控制台报错：`Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.`
- 具体报错位置：`useMindMap.ts:276`，涉及 ReactMindMap 组件。

### 原因分析
- useMindMap 中 goToNextMatch、goToPreviousMatch 两个 useCallback 依赖了 state.present.searchMatches 和 state.present.currentMatchIndex。
- 这两个回调在 setTimeout 里又会触发 dispatch（setState），导致每次渲染都重新生成回调，进而引发 useEffect/useCallback 死循环，最终报错。

### 解决方案
- 修改 goToNextMatch 和 goToPreviousMatch，只依赖 historyDispatch 和 expandPathToNode，不再依赖 state.present.searchMatches、state.present.currentMatchIndex。
- setTimeout 里用最新的 state.present，彻底避免死循环。

### 优化效果
- 画布抖动和 Maximum update depth exceeded 报错已消失。
- 搜索匹配跳转功能依然正常，体验更流畅

## 2024-06 右键菜单与命令式集成优化

1. **右键菜单分组与命令式调用**
   - 右键菜单内容与顶部工具栏完全一致，所有操作均走 commands 目录下的命令式组件。
   - 支持分组、图标、只读禁用、动态展开/收起等功能，行为与工具栏一致。

2. **菜单图标渲染兼容性优化**
   - 引入 getCommandIcon 辅助函数，自动兼容 icon 字段为 IconType 或 (state)=>IconType，确保菜单图标与工具栏一致。
   - 修复了菜单图标渲染报错问题。

3. **右键菜单 API 化与多实例独立控制**
   - ReactMindMapProps 新增 enableContextMenu，可全局控制是否启用右键菜单。
   - 新增 getContextMenuGroups，可自定义、动态注入菜单内容，并支持多实例独立配置。
   - 右键空白处和节点均可自定义菜单内容。

4. **右键菜单弹出逻辑修复**
   - 修复了右键空白处无法弹出自定义菜单的问题。
   - 现在无论节点还是空白处，右键都能弹出自定义菜单。

5. **2024-06-右键空白处菜单增强**
   - 修复右键点击空白处画布无法弹出自定义上下文菜单的问题。
   - 现在右键空白处菜单包含"展开所有节点、收起所有节点、居中视图、适应视图"四项操作。
   - "居中视图""适应视图"均为 commands 目录下命令式组件，行为、图标、禁用状态与工具栏完全一致。

6. **2024-06-展开/收起所有节点命令式组件化**
   - "展开所有节点""收起所有节点"已完全封装为命令式组件（expandAllCommand/collapseAllCommand），所有逻辑都在命令组件内部实现。
   - 右键菜单、工具栏等场景只需传 dispatch 即可，无需外部 handler，支持灵活复用和统一扩展。

---

## 右键上下文菜单自定义用法

### 1. 启用/禁用右键菜单
```tsx
<ReactMindMap enableContextMenu={false} /> // 禁用右键菜单
<ReactMindMap enableContextMenu={true} />  // 启用右键菜单（默认）
```

### 2. 自定义右键菜单内容（支持节点和空白处）
```tsx
<ReactMindMap
  // ...其他props
  getContextMenuGroups={(node, state) => {
    if (!node) {
      // 右键空白处菜单
      return [
        { actions: [{ key: 'blank', label: '空白菜单', onClick: () => alert('空白处') }] }
      ];
    }
    // 右键节点菜单
    return [
      {
        actions: [
          { key: 'edit', label: '自定义编辑', onClick: () => alert('编辑' + node.text) }
        ]
      }
    ];
  }}
/>
```
- `node` 为当前右键的节点对象，空白处为 null。
- `state` 为当前思维导图状态。
- 返回值为 ContextMenuGroup[]，可自定义分组、图标、禁用、点击事件等。

### 3. 多实例独立菜单
每个 ReactMindMap 实例都可传递不同的 getContextMenuGroups，实现完全独立的右键菜单逻辑。

---

如需更复杂的菜单内容（如图标、快捷键、分隔符等），可参考 ContextMenuAction/ContextMenuGroup 类型扩展