项目的“节点类型”设计非常灵活且可扩展，核心内容如下：
1. 基础节点结构（MindMapNode）
每个思维导图节点（MindMapNode）包含如下字段：
id：唯一标识
text：显示文本
position：节点坐标（由布局引擎设置）
width/height：节点尺寸（由布局引擎/计算函数设置）
color/textColor：节点颜色
children：子节点数组
isCollapsed：是否折叠
childrenCount：子节点数量（折叠时显示）
style：自定义样式
nodeType：节点类型（核心字段）
2. 节点类型体系
nodeType 字段用于标识节点类型，支持内置类型和自定义类型。
类型相关的配置通过 MindMapTypeConfig 进行统一管理。
内置类型（BuiltinNodeType）
rootNode（需求）
moduleNode（模块）
testPointNode（测试点）
caseNode（用例）
preconditionNode（前置条件）
stepNode（步骤）
resultNode（预期结果）
每种内置类型有明确的“可添加子类型”与“子类型数量限制”，如：
rootNode 只能添加 moduleNode
caseNode 可添加 preconditionNode（最多1个）和 stepNode（不限）
stepNode 可添加 resultNode（最多1个）
自定义类型（CustomNodeTypeConfig）
type：类型唯一标识
label：标签显示文本
color：标签颜色
canAddTo：允许作为哪些类型的子节点
canAddChildren：允许添加哪些类型的子节点
maxChildrenOfType：限制某类型子节点数量
类型模式（NodeTypeMode）
none：无类型
builtin：使用内置类型体系
custom：使用自定义类型体系
3. 类型配置入口
MindMapTypeConfig 用于描述当前类型体系（mode: 'none' | 'builtin' | 'custom'，以及 customTypes 配置）。
ReactMindMap 组件支持通过 typeConfig 属性注入类型体系。
4. 类型约束与渲染
新增/编辑节点时，会根据类型体系自动约束可添加的子类型、兄弟类型等。
节点渲染时会根据类型显示不同的标签、颜色、样式。
5. 典型用法
支持“测试用例树”、“需求树”等多种业务场景。
也支持完全自定义的类型体系，满足企业级扩展需求。
