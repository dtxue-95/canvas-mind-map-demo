import React, { useState, useImperativeHandle, forwardRef } from 'react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

export interface ExportControllerRef {
  open: () => void;
}

interface ExportControllerProps {
  visibleTypes?: string[];
  getData: () => any;
  getCanvas: () => HTMLCanvasElement | null;
  getSvg: () => SVGSVGElement | null;
}

const EXPORT_TYPES = [
  { key: 'image', label: '图片', exts: ['.png', '.jpg'] },
  { key: 'svg', label: 'SVG', exts: ['.svg'] },
  { key: 'pdf', label: 'PDF', exts: ['.pdf'] },
  { key: 'markdown', label: 'Markdown', exts: ['.md'] },
  { key: 'xmind', label: 'XMind', exts: ['.xmind'] },
  { key: 'txt', label: 'Txt', exts: ['.txt'] },
  { key: 'json', label: 'JSON', exts: ['.json'] },
  { key: 'pure', label: '纯净数据', exts: ['.json'] },
];

const defaultOptions: Record<string, any> = {
  fileName: '思维导图',
  imageFormat: '.png',
  pdfMarginH: 10,
  pdfMarginV: 10,
  pdfTransparent: true,
};

function pureNodeData(node: any): any {
  if (!node) return node;
  const { id, text, nodeType, priority, children } = node;
  const result: any = { id, text };
  if (nodeType) result.nodeType = nodeType;
  if (priority !== undefined) result.priority = priority;
  if (children && Array.isArray(children) && children.length > 0) {
    result.children = children.map(pureNodeData);
  }
  return result;
}

function nodeToMarkdown(node: any, level = 0): string {
  let line = `${'  '.repeat(level)}- ${node.text}`;
  if (node.nodeType) line += ` [${node.nodeType}]`;
  if (node.priority !== undefined) line += ` [P${node.priority}]`;
  let children = '';
  if (node.children && node.children.length > 0) {
    children = '\n' + node.children.map((c: any) => nodeToMarkdown(c, level + 1)).join('\n');
  }
  return line + children;
}

function nodeToTxt(node: any, level = 0): string {
  let line = `${'  '.repeat(level)}${node.text}`;
  let children = '';
  if (node.children && node.children.length > 0) {
    children = '\n' + node.children.map((c: any) => nodeToTxt(c, level + 1)).join('\n');
  }
  return line + children;
}

// XMind 8/Zen 兼容导出（极简实现，真实项目建议用 xmind-sdk 或更完整的 XML 结构）
async function exportXMind(node: any, fileName: string) {
  const zip = new JSZip();
  // 这里只做极简 XMind 结构，实际可参考 XMind Zen/8 格式
  const content = `<?xml version="1.0" encoding="UTF-8"?><xmap-content><sheet><topic id="root" text="${node.text}"></topic></sheet></xmap-content>`;
  zip.file('content.xml', content);
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName + '.xmind';
  a.click();
  URL.revokeObjectURL(url);
}

const ExportController = forwardRef<ExportControllerRef, ExportControllerProps>(
  ({ visibleTypes, getData, getCanvas, getSvg }, ref) => {
    const [visible, setVisible] = useState(false);
    const [type, setType] = useState('pdf');
    const [options, setOptions] = useState({ ...defaultOptions });

    useImperativeHandle(ref, () => ({
      open: () => {
        console.log('ExportController open called');
        setVisible(true);
      },
    }));

    console.log('ExportController visible:', visible);

    const typesToShow = visibleTypes
      ? EXPORT_TYPES.filter(t => visibleTypes.includes(t.key))
      : EXPORT_TYPES;

    const handleExport = async () => {
      const data = getData();
      const fileName = options.fileName || '思维导图';
      if (type === 'image') {
        const canvas = getCanvas();
        if (canvas) {
          const url = canvas.toDataURL(options.imageFormat === '.jpg' ? 'image/jpeg' : 'image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName + options.imageFormat;
          a.click();
        }
      } else if (type === 'svg') {
        const svg = getSvg();
        if (svg) {
          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(svg);
          const blob = new Blob([svgStr], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName + '.svg';
          a.click();
          URL.revokeObjectURL(url);
        }
      } else if (type === 'pdf') {
        const canvas = getCanvas();
        if (canvas) {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'landscape' });
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          pdf.addImage(imgData, 'PNG', options.pdfMarginH, options.pdfMarginV, pageWidth - 2 * options.pdfMarginH, pageHeight - 2 * options.pdfMarginV);
          pdf.save(fileName + '.pdf');
        }
      } else if (type === 'markdown') {
        const md = nodeToMarkdown(data);
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + '.md';
        a.click();
        URL.revokeObjectURL(url);
      } else if (type === 'xmind') {
        await exportXMind(data, fileName);
      } else if (type === 'txt') {
        const txt = nodeToTxt(data);
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + '.txt';
        a.click();
        URL.revokeObjectURL(url);
      } else if (type === 'json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + '.json';
        a.click();
        URL.revokeObjectURL(url);
      } else if (type === 'pure') {
        const pure = JSON.stringify(pureNodeData(data), null, 2);
        const blob = new Blob([pure], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + '-pure.json';
        a.click();
        URL.revokeObjectURL(url);
      }
      setVisible(false);
    };

    const renderOptions = () => {
      if (type === 'image') {
        return (
          <div className="mb-2">格式：
            <select value={options.imageFormat} onChange={e => setOptions(o => ({ ...o, imageFormat: e.target.value }))}>
              <option value=".png">PNG</option>
              <option value=".jpg">JPG</option>
            </select>
          </div>
        );
      } else if (type === 'pdf') {
        return (
          <>
            <div className="mb-2">格式：PDF（.pdf）</div>
            <div className="mb-2">选项：</div>
            <div className="mb-2 flex gap-2">
              <label>水平内边距 <input type="number" value={options.pdfMarginH} min={0} max={100} style={{width: 60}} onChange={e => setOptions(o => ({ ...o, pdfMarginH: +e.target.value }))} /></label>
              <label>垂直内边距 <input type="number" value={options.pdfMarginV} min={0} max={100} style={{width: 60}} onChange={e => setOptions(o => ({ ...o, pdfMarginV: +e.target.value }))} /></label>
            </div>
          </>
        );
      }
      return null;
    };

    if (!visible) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded shadow-lg p-0 min-w-[600px] flex" style={{minHeight: 400}}>
          {/* 左侧类型列表 */}
          <div className="w-40 border-r flex flex-col py-4 bg-gray-50">
            {typesToShow.map(item => (
              <button
                key={item.key}
                className={`px-4 py-3 text-left hover:bg-blue-100 rounded-r transition-all ${type === item.key ? 'bg-white font-bold text-blue-600' : 'text-gray-700'}`}
                style={{background: type === item.key ? '#fff' : undefined}}
                onClick={() => setType(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* 右侧选项区 */}
          <div className="flex-1 p-6">
            <div className="mb-4 flex items-center">
              <label className="mr-2">导出文件名称</label>
              <input
                className="border rounded px-2 py-1"
                style={{width: 200}}
                value={options.fileName}
                onChange={e => setOptions(o => ({ ...o, fileName: e.target.value }))}
              />
              <span className="ml-2 text-gray-500">{typesToShow.find(t => t.key === type)?.exts[0]}</span>
            </div>
            {renderOptions()}
            <div className="flex justify-end gap-2 mt-8">
              <button className="px-4 py-1 rounded bg-gray-200" onClick={() => setVisible(false)}>取消</button>
              <button className="px-4 py-1 rounded bg-blue-600 text-white" onClick={handleExport}>导出</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ExportController; 