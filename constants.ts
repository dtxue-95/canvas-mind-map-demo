// 节点默认尺寸和样式常量
export const NODE_DEFAULT_WIDTH = 160;
export const NODE_DEFAULT_HEIGHT = 50;
export const NODE_DEFAULT_COLOR = '#FFFFFF'; // 白色背景
export const NODE_SELECTED_COLOR = '#dbeafe'; // Tailwind blue-100 - 选中时背景色（如果使用边框则不填充）
export const NODE_TEXT_COLOR = '#1f2937'; // Tailwind gray-800 - 文本深灰色
export const NODE_SELECTED_TEXT_COLOR = '#1e40af'; // Tailwind blue-800 - 选中时文本色

// 节点选中状态边框样式
export const NODE_SELECTED_BORDER_COLOR = '#3b82f6'; // Tailwind blue-500 边框色
export const NODE_SELECTED_BORDER_WIDTH = 2.5;

// 节点高亮和搜索匹配样式
export const NODE_HIGHLIGHT_BORDER_COLOR = '#FFD700'; // 金色高亮边框
export const NODE_SEARCH_TEXT_MATCH_COLOR = '#FF0000'; // 红色搜索匹配文本
export const NODE_HIGHLIGHT_BORDER_WIDTH = 3.0;

// 节点宽度限制
export const MIN_NODE_WIDTH = 80; // 节点最小宽度
export const MAX_NODE_WIDTH = 300; // 节点最大宽度（超过可能需要文本换行）

// 画布和连接线样式
export const CANVAS_BACKGROUND_COLOR = '#f9fafb'; // Tailwind gray-50 画布背景色
export const CONNECTION_LINE_COLOR = '#6b7280'; // Tailwind gray-500 连接线颜色
export const CONNECTION_LINE_WIDTH = 1.5; // 连接线宽度（稍细一些）

// 文本和字体样式
export const TEXT_PADDING_X = 12; // 文本水平内边距
export const TEXT_PADDING_Y = 8;  // 文本垂直内边距
export const FONT_SIZE = 14;
export const FONT_FAMILY = 'Arial, sans-serif';

// 交互相关常量
export const DRAG_THRESHOLD = 5; // 拖拽阈值
export const ZOOM_SENSITIVITY = 0.001; // 缩放灵敏度
export const MIN_ZOOM = 0.1; // 最小缩放比例
export const MAX_ZOOM = 3.0; // 最大缩放比例
export const INITIAL_ZOOM = 1.0; // 初始缩放比例
export const ZOOM_STEP = 0.1; // 离散缩放步长

// 节点样式
export const NODE_BORDER_RADIUS = 8; // 节点圆角半径

// 布局间距
export const CHILD_H_SPACING = 60; // 父子节点水平间距
export const CHILD_V_SPACING = 15; // 兄弟节点垂直间距

// 新节点默认文本
export const NEW_NODE_TEXT = "新想法";

// 节点阴影效果
export const NODE_SHADOW_COLOR = 'rgba(0, 0, 0, 0.1)';
export const NODE_SHADOW_BLUR = 6;
export const NODE_SHADOW_OFFSET_X = 2;
export const NODE_SHADOW_OFFSET_Y = 3;

// 折叠/展开按钮样式
export const COLLAPSE_BUTTON_RADIUS = 8; // 折叠按钮半径
export const COLLAPSE_BUTTON_COLOR = '#9ca3af'; // Tailwind gray-400 按钮背景色
export const COLLAPSE_BUTTON_SYMBOL_COLOR = '#FFFFFF'; // 白色按钮符号
export const COLLAPSE_BUTTON_GAP = 4; // 节点与折叠按钮间距
