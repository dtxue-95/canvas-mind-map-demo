import { MindMapNode as MindMapNode, Point, Viewport } from '../types';
import { 
  FONT_FAMILY, FONT_SIZE, NODE_BORDER_RADIUS, 
  TEXT_PADDING_X, TEXT_PADDING_Y, CONNECTION_LINE_COLOR, CONNECTION_LINE_WIDTH,
  NODE_SELECTED_BORDER_COLOR, NODE_SELECTED_BORDER_WIDTH,
  MIN_NODE_WIDTH, MAX_NODE_WIDTH, CHILD_H_SPACING,
  NODE_HIGHLIGHT_BORDER_COLOR, NODE_HIGHLIGHT_BORDER_WIDTH, NODE_SEARCH_TEXT_MATCH_COLOR,
  NODE_DEFAULT_HEIGHT, COLLAPSE_BUTTON_RADIUS, COLLAPSE_BUTTON_COLOR, COLLAPSE_BUTTON_SYMBOL_COLOR,
  NODE_SHADOW_COLOR, NODE_SHADOW_BLUR, NODE_SHADOW_OFFSET_X, NODE_SHADOW_OFFSET_Y,
  NODE_EXACT_MATCH_BACKGROUND_COLOR
} from '../constants';

// 离屏Canvas上下文，用于文本测量
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

/**
 * 获取离屏Canvas上下文，确保字体已设置
 */
function getOffscreenContext(): CanvasRenderingContext2D {
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement('canvas');
  }
  if (!offscreenCtx) {
    offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) {
      throw new Error('无法从离屏Canvas获取2D上下文');
    }
  }
  offscreenCtx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  return offscreenCtx;
}

/**
 * 将文本分割成多行以适应指定宽度
 * @param text 要分割的文本
 * @param maxWidth 最大宽度
 * @param ctx Canvas上下文（期望字体已设置）
 * @returns 分割后的文本行数组
 */
function splitTextIntoLines(
  text: string, 
  maxWidth: number, 
  ctx: CanvasRenderingContext2D // 期望上下文已设置字体
): string[] {
  const lines: string[] = [];
  
  if (maxWidth <= 0) { 
    if (text.length > 0) {
        let placeholder = "";
        for(const char of text) {
            if(ctx.measureText(placeholder + char).width > MIN_NODE_WIDTH - TEXT_PADDING_X*2) break; 
            placeholder += char;
        }
        return [placeholder || (text.length > 0 ? text[0] : "")]; 
    }
    return [""]; 
  }

  const words = text.split(/\s+/); 
  let currentLine = "";

  for (const word of words) {
    if (word === "") continue; 

    const testLineWithWord = currentLine.length > 0 ? currentLine + " " + word : word;
    
    if (ctx.measureText(testLineWithWord).width <= maxWidth) {
      currentLine = testLineWithWord;
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = word; 

      // 检查单个单词本身是否需要字符换行
      if (ctx.measureText(currentLine).width > maxWidth) {
        let charWrappedLineAccumulator = "";
        for (let i = 0; i < currentLine.length; i++) {
          const char = currentLine[i];
          const testCharLine = charWrappedLineAccumulator + char;
          if (ctx.measureText(testCharLine).width > maxWidth && charWrappedLineAccumulator.length > 0) {
            lines.push(charWrappedLineAccumulator);
            charWrappedLineAccumulator = char; 
          } else {
            charWrappedLineAccumulator = testCharLine;
          }
        }
        currentLine = charWrappedLineAccumulator; // 单词的剩余部分
      }
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  if (lines.length === 0 && text.length > 0) { // 处理单个很长单词的情况
      let charWrappedLine = "";
      for(const char of text){
          if(ctx.measureText(charWrappedLine + char).width > maxWidth && charWrappedLine.length > 0){
              lines.push(charWrappedLine);
              charWrappedLine = char;
          } else {
              charWrappedLine += char;
          }
      }
      if(charWrappedLine.length > 0) lines.push(charWrappedLine);
  }
  
  if (lines.length === 0) { // 确保至少有一行，即使为空，用于高度计算
    return [""]; 
  }

  return lines;
}

/**
 * 计算节点的尺寸
 * @param text 节点文本
 * @param nodeType 节点类型
 * @param typeConfig 类型配置
 * @returns 节点的宽度和高度
 */
export function calculateNodeDimensions(text: string, nodeType?: string, typeConfig?: any): { width: number; height: number } {
  const ctx = getOffscreenContext(); // 确保字体已设置
  let labelWidth = 0;
  // 计算标签宽度
  if (nodeType) {
    let labelConfig: { label: string; color: string; bg: string } | undefined;
    if (typeConfig && typeConfig.mode === 'custom' && Array.isArray(typeConfig.customTypes)) {
      const custom = typeConfig.customTypes.find((t: any) => t.type === nodeType);
      if (custom) {
        labelConfig = { label: custom.label, color: custom.color, bg: custom.color + '22' };
      }
    } else if (typeConfig && typeConfig.mode === 'builtin' && BUILTIN_TYPE_LABELS[nodeType]) {
      labelConfig = BUILTIN_TYPE_LABELS[nodeType];
    } else if (BUILTIN_TYPE_LABELS[nodeType]) {
      labelConfig = BUILTIN_TYPE_LABELS[nodeType];
    }
    if (labelConfig) {
      ctx.save();
      ctx.font = `500 12px ${FONT_FAMILY}`;
      const paddingX = 6;
      labelWidth = ctx.measureText(labelConfig.label).width + paddingX * 2 + 6; // 6为标签与文本间距
      ctx.restore();
    }
  }
  // 计算文本宽度
  const singleLineMetrics = ctx.measureText(text.trim() || " ");
  let width = singleLineMetrics.width + TEXT_PADDING_X * 2 + labelWidth;
  width = Math.max(MIN_NODE_WIDTH, Math.min(width, MAX_NODE_WIDTH));
  const maxTextWidth = width - TEXT_PADDING_X * 2 - labelWidth;
  const lines = splitTextIntoLines(text.trim(), maxTextWidth, ctx);
  const numLines = lines.length;
  const lineHeight = FONT_SIZE * 1.2;
  const calculatedHeight = numLines * lineHeight + TEXT_PADDING_Y * 2;
  const height = Math.max(NODE_DEFAULT_HEIGHT, calculatedHeight);
  return { width, height };
}

// 内置类型标签样式配置
const BUILTIN_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  rootNode: { label: '根', color: '#8e8e93', bg: '#f4f4f7' },
  moduleNode: { label: '模块', color: '#34c759', bg: '#eafaf1' },
  testPointNode: { label: '测试点', color: '#ff9500', bg: '#fff7e6' },
  caseNode: { label: '用例', color: '#007aff', bg: '#e6f0ff' },
  preconditionNode: { label: '前置', color: '#af52de', bg: '#f6eaff' },
  stepNode: { label: '步骤', color: '#32ade6', bg: '#e6faff' },
  resultNode: { label: '预期', color: '#ff3b30', bg: '#fff0ef' },
};

/**
 * 绘制节点
 * @param ctx Canvas上下文
 * @param node 要绘制的节点
 * @param isSelected 是否选中
 * @param isEditing 是否正在编辑
 * @param isHighlighted 是否高亮
 * @param isExactMatch 是否精确匹配
 * @param currentSearchTerm 当前搜索词
 * @param style 节点自定义样式（可选，优先级高于节点默认属性）
 * @param typeConfig 类型配置（可选）
 */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: MindMapNode,
  isSelected: boolean,
  
  isHighlighted?: boolean,
  isExactMatch?: boolean,
  currentSearchTerm?: string,
  style?: React.CSSProperties,
  typeConfig?: any
): void {
  // 匹配高亮样式优先级最高
  let background = (style?.background as string) || (style?.backgroundColor as string) || node.color;
  let textColor = style?.color || node.textColor;
  let border = style?.border as string | undefined;
  let borderRadius = typeof style?.borderRadius === 'number' ? style.borderRadius : NODE_BORDER_RADIUS;
  let fontWeight = style?.fontWeight || 'normal';
  let fontSize = typeof style?.fontSize === 'number' ? style.fontSize : FONT_SIZE;
  let fontFamily = style?.fontFamily || FONT_FAMILY;
  let boxShadow = style?.boxShadow as string | undefined;

  // 精确匹配优先级最高
  if (isExactMatch) {
    background = NODE_EXACT_MATCH_BACKGROUND_COLOR;
    textColor = node.textColor;
    border = undefined;
    fontWeight = 'bold';
  } else if (isHighlighted) {
    // 高亮匹配优先级高于自定义
    border = `${NODE_HIGHLIGHT_BORDER_WIDTH}px solid ${NODE_HIGHLIGHT_BORDER_COLOR}`;
    fontWeight = 'bold';
  }

  ctx.save();

  // 处理阴影
  if (boxShadow) {
    // 简单解析 boxShadow: "offsetX offsetY blur color"
    const match = boxShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.+)/);
    if (match) {
      ctx.shadowOffsetX = parseInt(match[1], 10);
      ctx.shadowOffsetY = parseInt(match[2], 10);
      ctx.shadowBlur = parseInt(match[3], 10);
      ctx.shadowColor = match[4];
    }
  } else {
    ctx.shadowColor = NODE_SHADOW_COLOR;
    ctx.shadowBlur = NODE_SHADOW_BLUR;
    ctx.shadowOffsetX = NODE_SHADOW_OFFSET_X;
    ctx.shadowOffsetY = NODE_SHADOW_OFFSET_Y;
  }

  // 绘制圆角矩形路径
  ctx.beginPath();
  ctx.moveTo(node.position.x + Number(borderRadius), node.position.y);
  ctx.lineTo(node.position.x + node.width - Number(borderRadius), node.position.y);
  ctx.quadraticCurveTo(node.position.x + node.width, node.position.y, node.position.x + node.width, node.position.y + Number(borderRadius));
  ctx.lineTo(node.position.x + node.width, node.position.y + node.height - Number(borderRadius));
  ctx.quadraticCurveTo(node.position.x + node.width, node.position.y + node.height, node.position.x + node.width - Number(borderRadius), node.position.y + node.height);
  ctx.lineTo(node.position.x + Number(borderRadius), node.position.y + node.height);
  ctx.quadraticCurveTo(node.position.x, node.position.y + node.height, node.position.x, node.position.y + node.height - Number(borderRadius));
  ctx.lineTo(node.position.x, node.position.y + Number(borderRadius));
  ctx.quadraticCurveTo(node.position.x, node.position.y, node.position.x + Number(borderRadius), node.position.y);
  ctx.closePath();

  // 填充背景色
  ctx.fillStyle = background;
  ctx.fill();
  ctx.restore();

  // 绘制边框
  if (border) {
    // 解析 border: "2px solid #00bcd4"
    const match = border.match(/(\d+)px\s+\w+\s+(.+)/);
    if (match) {
      ctx.save();
      ctx.strokeStyle = match[2];
      ctx.lineWidth = parseInt(match[1], 10) / ctx.getTransform().a;
      ctx.stroke();
      ctx.restore();
    }
  } else if (isHighlighted) {
    ctx.save();
    ctx.strokeStyle = NODE_HIGHLIGHT_BORDER_COLOR;
    ctx.lineWidth = NODE_HIGHLIGHT_BORDER_WIDTH / ctx.getTransform().a;
    ctx.stroke();
    ctx.restore();
  } else if (isSelected) {
    ctx.save();
    ctx.strokeStyle = NODE_SELECTED_BORDER_COLOR;
    ctx.lineWidth = NODE_SELECTED_BORDER_WIDTH / ctx.getTransform().a;
    ctx.stroke();
    ctx.restore();
  }

  // --- 标签渲染 ---
  let labelWidth = 0;
  let labelConfig: { label: string; color: string; bg: string } | undefined;
  if (node.nodeType) {
    if (typeConfig && typeConfig.mode === 'custom' && Array.isArray(typeConfig.customTypes)) {
      const custom = typeConfig.customTypes.find((t: any) => t.type === node.nodeType);
      if (custom) {
        labelConfig = { label: custom.label, color: custom.color, bg: custom.color + '22' };
      }
    } else if (typeConfig && typeConfig.mode === 'builtin' && BUILTIN_TYPE_LABELS[node.nodeType]) {
      labelConfig = BUILTIN_TYPE_LABELS[node.nodeType];
    } else if (BUILTIN_TYPE_LABELS[node.nodeType]) {
      labelConfig = BUILTIN_TYPE_LABELS[node.nodeType];
    }
  }
  if (labelConfig) {
    ctx.save();
    ctx.font = `500 12px ${fontFamily}`;
    const paddingX = 6;
    const labelText = labelConfig.label;
    labelWidth = ctx.measureText(labelText).width + paddingX * 2;
    const labelHeight = 20;
    const labelX = node.position.x + TEXT_PADDING_X;
    const labelY = node.position.y + (node.height - labelHeight) / 2;
    // 圆角矩形
    ctx.beginPath();
    ctx.moveTo(labelX + 6, labelY);
    ctx.lineTo(labelX + labelWidth - 6, labelY);
    ctx.quadraticCurveTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + 6);
    ctx.lineTo(labelX + labelWidth, labelY + labelHeight - 6);
    ctx.quadraticCurveTo(labelX + labelWidth, labelY + labelHeight, labelX + labelWidth - 6, labelY + labelHeight);
    ctx.lineTo(labelX + 6, labelY + labelHeight);
    ctx.quadraticCurveTo(labelX, labelY + labelHeight, labelX, labelY + labelHeight - 6);
    ctx.lineTo(labelX, labelY + 6);
    ctx.quadraticCurveTo(labelX, labelY, labelX + 6, labelY);
    ctx.closePath();
    ctx.fillStyle = labelConfig.bg;
    ctx.fill();
    ctx.strokeStyle = labelConfig.color;
    ctx.lineWidth = 1;
    ctx.stroke();
    // 文字
    ctx.fillStyle = labelConfig.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, labelX + paddingX, labelY + labelHeight / 2);
    ctx.restore();
  }

  // --- 文本渲染 ---
  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const textX = node.position.x + TEXT_PADDING_X + (labelWidth > 0 ? labelWidth + 6 : 0); // 标签后加间距
  const textY = node.position.y + node.height / 2;
  const maxTextWidth = node.width - TEXT_PADDING_X * 2 - labelWidth - (labelWidth > 0 ? 6 : 0);
  const lines = splitTextIntoLines(node.text, maxTextWidth, ctx);
  const lineHeight = Number(fontSize) * 1.2;
  const totalTextHeight = lines.length * lineHeight;
  lines.forEach((line, i) => {
    const lineY = textY - totalTextHeight / 2 + i * lineHeight + lineHeight / 2;
    if ((isHighlighted || isExactMatch) && currentSearchTerm && currentSearchTerm.trim().length > 0) {
      // 匹配时，匹配到的文字标红
      ctx.textAlign = 'left';
      const searchTermLower = currentSearchTerm.toLowerCase().trim();
      const lineTextLower = line.toLowerCase();
      let currentRenderX = textX;
      let lastIndex = 0;
      while (lastIndex < line.length) {
        const matchIndex = lineTextLower.indexOf(searchTermLower, lastIndex);
        if (matchIndex !== -1) {
          if (matchIndex > lastIndex) {
            const preText = line.substring(lastIndex, matchIndex);
            ctx.fillStyle = textColor;
            ctx.fillText(preText, currentRenderX, lineY);
            currentRenderX += ctx.measureText(preText).width;
          }
          const matchedText = line.substring(matchIndex, matchIndex + searchTermLower.length);
          ctx.fillStyle = NODE_SEARCH_TEXT_MATCH_COLOR;
          ctx.fillText(matchedText, currentRenderX, lineY);
          currentRenderX += ctx.measureText(matchedText).width;
          lastIndex = matchIndex + searchTermLower.length;
        } else {
          const remainingText = line.substring(lastIndex);
          ctx.fillStyle = textColor;
          ctx.fillText(remainingText, currentRenderX, lineY);
          break;
        }
      }
    } else {
      ctx.fillStyle = textColor;
      ctx.fillText(line, textX, lineY);
    }
  });
  ctx.restore();
}

/**
 * 绘制展开/折叠按钮
 * @param ctx Canvas上下文
 * @param node 要在其上绘制按钮的节点
 * @param isNodeCollapsed 节点是否折叠
 * @param nodeChildrenCount 子节点数量（如果折叠）
 */
export function drawCollapseButton(
  ctx: CanvasRenderingContext2D,
  node: MindMapNode,
  isNodeCollapsed: boolean,
  nodeChildrenCount?: number
): void {
  const buttonCenterX = node.position.x + node.width;
  const buttonCenterY = node.position.y + node.height / 2;

  // 绘制按钮背景
  ctx.beginPath();
  ctx.arc(buttonCenterX, buttonCenterY, COLLAPSE_BUTTON_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = COLLAPSE_BUTTON_COLOR;
  ctx.fill();

  // 绘制按钮符号
  ctx.fillStyle = COLLAPSE_BUTTON_SYMBOL_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let symbol = '';
  if (isNodeCollapsed) {
    if (nodeChildrenCount !== undefined && nodeChildrenCount > 0) {
      symbol = nodeChildrenCount.toString();
      const countFontSize = Math.max(8, FONT_SIZE - 4); // 计数的较小字体
      ctx.font = `${countFontSize}px ${FONT_FAMILY}`;
    } else {
      symbol = '+';
      ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`; 
    }
  } else {
    symbol = '-';
    ctx.font = `${FONT_SIZE + 2}px ${FONT_FAMILY}`; // 减号稍大一些
  }
  ctx.fillText(symbol, buttonCenterX, buttonCenterY);
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`; // 重置字体
}

/**
 * 绘制连接线
 * @param ctx Canvas上下文
 * @param parentAnchor 父节点锚点
 * @param childAnchor 子节点锚点
 */
export function drawConnection(
  ctx: CanvasRenderingContext2D,
  parentAnchor: Point,
  childAnchor: Point
): void {
  ctx.beginPath();
  const midX = parentAnchor.x + CHILD_H_SPACING / 3;
  ctx.moveTo(parentAnchor.x, parentAnchor.y);
  ctx.lineTo(midX, parentAnchor.y);
  ctx.lineTo(midX, childAnchor.y);
  ctx.lineTo(childAnchor.x, childAnchor.y);
  ctx.strokeStyle = CONNECTION_LINE_COLOR;
  ctx.lineWidth = CONNECTION_LINE_WIDTH / ctx.getTransform().a;
  ctx.stroke();
}

/**
 * 检查点是否在节点内
 * @param point 要检查的点
 * @param node 节点
 * @returns 如果点在节点内则为true，否则为false
 */
export function isPointInNode(point: Point, node: MindMapNode): boolean {
  return (
    point.x >= node.position.x &&
    point.x <= node.position.x + node.width &&
    point.y >= node.position.y &&
    point.y <= node.position.y + node.height
  );
}

/**
 * 屏幕坐标转换为世界坐标
 * @param screenPoint 屏幕坐标点
 * @param viewport 视口状态
 * @returns 世界坐标点
 */
export function screenToWorld(screenPoint: Point, viewport: Viewport): Point {
  return {
    x: (screenPoint.x - viewport.x) / viewport.zoom,
    y: (screenPoint.y - viewport.y) / viewport.zoom,
  };
}

/**
 * 世界坐标转换为屏幕坐标
 * @param worldPoint 世界坐标点
 * @param viewport 视口状态
 * @returns 屏幕坐标点
 */
export function worldToScreen(worldPoint: Point, viewport: Viewport): Point {
  return {
    x: worldPoint.x * viewport.zoom + viewport.x,
    y: worldPoint.y * viewport.zoom + viewport.y,
  };
}