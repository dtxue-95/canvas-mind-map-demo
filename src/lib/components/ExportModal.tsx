import React, { useState } from 'react';

const EXPORT_TYPES = [
  { key: 'image', label: '图片', exts: ['.png', '.jpg'] },
  { key: 'svg', label: 'SVG', exts: ['.svg'] },
  { key: 'pdf', label: 'PDF', exts: ['.pdf'] },
  { key: 'markdown', label: 'Markdown', exts: ['.md'] },
  { key: 'xmind', label: 'XMind', exts: ['.xmind'] },
  { key: 'txt', label: 'Txt', exts: ['.txt'] },
  { key: 'json', label: 'JSON', exts: ['.json'] },
];

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (type: string, options: any) => void;
}

const defaultOptions: Record<string, any> = {
  fileName: '思维导图',
  imageFormat: '.png',
  svgFormat: '.svg',
  pdfFormat: '.pdf',
  pdfMarginH: 10,
  pdfMarginV: 10,
  pdfTransparent: true,
  markdownFormat: '.md',
  xmindFormat: '.xmind',
  txtFormat: '.txt',
  jsonFormat: '.json',
};

const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose, onExport }) => {
  const [type, setType] = useState('pdf');
  const [options, setOptions] = useState({ ...defaultOptions });

  if (!visible) return null;

  // 右侧选项区渲染
  const renderOptions = () => {
    switch (type) {
      case 'image':
        return (
          <>
            <div className="mb-2">格式：
              <select value={options.imageFormat} onChange={e => setOptions(o => ({ ...o, imageFormat: e.target.value }))}>
                <option value=".png">PNG</option>
                <option value=".jpg">JPG</option>
              </select>
            </div>
          </>
        );
      case 'svg':
        return <div className="mb-2">格式：SVG（.svg）</div>;
      case 'pdf':
        return (
          <>
            <div className="mb-2">格式：PDF（.pdf）</div>
            <div className="mb-2">说明：适合查看浏览和打印</div>
            <div className="mb-2">选项：</div>
            <div className="mb-2 flex gap-2">
              <label>水平内边距 <input type="number" value={options.pdfMarginH} min={0} max={100} style={{width: 60}} onChange={e => setOptions(o => ({ ...o, pdfMarginH: +e.target.value }))} /></label>
              <label>垂直内边距 <input type="number" value={options.pdfMarginV} min={0} max={100} style={{width: 60}} onChange={e => setOptions(o => ({ ...o, pdfMarginV: +e.target.value }))} /></label>
            </div>
            <div className="mb-2">
              <label><input type="checkbox" checked={options.pdfTransparent} onChange={e => setOptions(o => ({ ...o, pdfTransparent: e.target.checked }))} /> 背景是否透明</label>
            </div>
          </>
        );
      case 'markdown':
        return <div className="mb-2">格式：Markdown（.md）</div>;
      case 'xmind':
        return <div className="mb-2">格式：XMind（.xmind）</div>;
      case 'txt':
        return <div className="mb-2">格式：Txt（.txt）</div>;
      case 'json':
        return <div className="mb-2">格式：JSON（.json）</div>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded shadow-lg p-0 min-w-[600px] flex" style={{minHeight: 400}}>
        {/* 左侧类型列表 */}
        <div className="w-40 border-r flex flex-col py-4 bg-gray-50">
          {EXPORT_TYPES.map(item => (
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
            <span className="ml-2 text-gray-500">{EXPORT_TYPES.find(t => t.key === type)?.exts[0]}</span>
          </div>
          {renderOptions()}
          <div className="flex justify-end gap-2 mt-8">
            <button className="px-4 py-1 rounded bg-gray-200" onClick={onClose}>取消</button>
            <button className="px-4 py-1 rounded bg-blue-600 text-white" onClick={() => onExport(type, options)}>导出</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 