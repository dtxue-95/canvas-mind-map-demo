import { MindMapNode, Point, Viewport } from '../types';
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
 * 测量文本并计算宽度（主要用于createNode的初始估算）
 * 布局引擎将使用 calculateNodeDimensions 进行更准确的尺寸计算
 */
export function measureTextAndCalculateWidth(text: string): number {
  const ctx = getOffscreenContext();
  const metrics = ctx.measureText(text.trim() || " "); 
  let width = metrics.width + TEXT_PADDING_X * 2;
  width = Math.max(MIN_NODE_WIDTH, Math.min(width, MAX_NODE_WIDTH));
  return width;
}

/**
 * 将文本分割成多行以适应指定宽度
 * @param text 要分割的文本
 * @param maxWidth 最大宽度
 * @param ctx Canvas上下文（期望字体已设置）
 * @returns 分割后的文本行数组
 */
export function splitTextIntoLines(
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
 * @returns 节点的宽度和高度
 */
export function calculateNodeDimensions(text: string): { width: number; height: number } {
  const ctx = getOffscreenContext(); // 确保字体已设置
  
  // 首先基于最长不间断序列或最大宽度估算宽度
  const singleLineMetrics = ctx.measureText(text.trim() || " "); // 对空文本使用空格进行度量
  let width = singleLineMetrics.width + TEXT_PADDING_X * 2;
  width = Math.max(MIN_NODE_WIDTH, Math.min(width, MAX_NODE_WIDTH));

  const maxTextWidth = width - TEXT_PADDING_X * 2;
  const lines = splitTextIntoLines(text.trim(), maxTextWidth, ctx);
  
  const numLines = lines.length;
  const lineHeight = FONT_SIZE * 1.2; // 行高因子
  const calculatedHeight = numLines * lineHeight + TEXT_PADDING_Y * 2;
  const height = Math.max(NODE_DEFAULT_HEIGHT, calculatedHeight);

  return { width, height };
}

/**
 * 绘制节点
 * @param ctx Canvas上下文
 * @param node 要绘制的节点
 * @param isSelected 是否选中
 * @param isEditing 是否正在编辑
 * @param isHighlighted 是否高亮
 * @param isExactMatch 是否精确匹配
 * @param currentSearchTerm 当前搜索词
 */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: MindMapNode,
  isSelected: boolean,
  isEditing?: boolean,
  isHighlighted?: boolean,
  isExactMatch?: boolean,
  currentSearchTerm?: string
): void {
  // 如果是精确匹配，使用淡黄色背景
  if (isExactMatch) {
    ctx.fillStyle = NODE_EXACT_MATCH_BACKGROUND_COLOR;
  } else {
    ctx.fillStyle = node.color;
  }
  
  ctx.save();
  ctx.shadowColor = NODE_SHADOW_COLOR;
  ctx.shadowBlur = NODE_SHADOW_BLUR;
  ctx.shadowOffsetX = NODE_SHADOW_OFFSET_X;
  ctx.shadowOffsetY = NODE_SHADOW_OFFSET_Y;

  // 绘制圆角矩形路径
  ctx.beginPath();
  ctx.moveTo(node.position.x + NODE_BORDER_RADIUS, node.position.y);
  ctx.lineTo(node.position.x + node.width - NODE_BORDER_RADIUS, node.position.y);
  ctx.quadraticCurveTo(node.position.x + node.width, node.position.y, node.position.x + node.width, node.position.y + NODE_BORDER_RADIUS);
  ctx.lineTo(node.position.x + node.width, node.position.y + node.height - NODE_BORDER_RADIUS);
  ctx.quadraticCurveTo(node.position.x + node.width, node.position.y + node.height, node.position.x + node.width - NODE_BORDER_RADIUS, node.position.y + node.height);
  ctx.lineTo(node.position.x + NODE_BORDER_RADIUS, node.position.y + node.height);
  ctx.quadraticCurveTo(node.position.x, node.position.y + node.height, node.position.x, node.position.y + node.height - NODE_BORDER_RADIUS);
  ctx.lineTo(node.position.x, node.position.y + NODE_BORDER_RADIUS);
  ctx.quadraticCurveTo(node.position.x, node.position.y, node.position.x + NODE_BORDER_RADIUS, node.position.y);
  ctx.closePath();
  
  ctx.fill();
  ctx.restore(); 

  // 绘制高亮边框
  if (isHighlighted) {
    ctx.strokeStyle = NODE_HIGHLIGHT_BORDER_COLOR;
    ctx.lineWidth = NODE_HIGHLIGHT_BORDER_WIDTH / ctx.getTransform().a;
    ctx.stroke();
  }

  // 绘制选中边框
  if (isSelected) {
    ctx.strokeStyle = NODE_SELECTED_BORDER_COLOR;
    ctx.lineWidth = NODE_SELECTED_BORDER_WIDTH / ctx.getTransform().a;
    ctx.stroke();
  }

  // 绘制文本（非编辑状态）
  if (!isEditing) {
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'middle';

    const maxTextWidthInsideNode = node.width - TEXT_PADDING_X * 2;
    const linesToRender = splitTextIntoLines(node.text, maxTextWidthInsideNode, ctx);
    
    const lineHeight = FONT_SIZE * 1.2;
    const totalTextHeight = linesToRender.length * lineHeight;
    let startY = (node.position.y + node.height / 2) - (totalTextHeight / 2) + (lineHeight / 2); // 居中块然后添加半行高

    for (let i = 0; i < linesToRender.length; i++) {
      const lineText = linesToRender[i];
      const lineY = startY + i * lineHeight;
      
      // 简单裁剪：不绘制会开始得太靠下的行
      if (lineY - lineHeight/2 > node.position.y + node.height - TEXT_PADDING_Y) {
        break; 
      }
      
      // 高亮搜索匹配的文本
      if (isHighlighted && currentSearchTerm && currentSearchTerm.trim().length > 0) {
        ctx.textAlign = 'left';
        const searchTermLower = currentSearchTerm.toLowerCase().trim();
        const lineTextLower = lineText.toLowerCase();
        
        const totalLineWidth = ctx.measureText(lineText).width;
        let currentRenderX = node.position.x + (node.width - totalLineWidth) / 2;

        let lastIndex = 0;
        while(lastIndex < lineText.length) {
            const matchIndex = lineTextLower.indexOf(searchTermLower, lastIndex);
            if (matchIndex !== -1) {
                if (matchIndex > lastIndex) {
                    const preText = lineText.substring(lastIndex, matchIndex);
                    ctx.fillStyle = node.textColor;
                    ctx.fillText(preText, currentRenderX, lineY);
                    currentRenderX += ctx.measureText(preText).width;
                }
                const matchedText = lineText.substring(matchIndex, matchIndex + searchTermLower.length);
                ctx.fillStyle = NODE_SEARCH_TEXT_MATCH_COLOR;
                ctx.fillText(matchedText, currentRenderX, lineY);
                currentRenderX += ctx.measureText(matchedText).width;
                lastIndex = matchIndex + searchTermLower.length;
            } else {
                const remainingText = lineText.substring(lastIndex);
                ctx.fillStyle = node.textColor;
                ctx.fillText(remainingText, currentRenderX, lineY);
                break;
            }
        }
      } else {
        ctx.textAlign = 'center';
        ctx.fillStyle = node.textColor;
        ctx.fillText(lineText, node.position.x + node.width / 2, lineY);
      }
    }
  }
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