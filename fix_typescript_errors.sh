
# 1. Fix the import/export errors in ReactMindMap.tsx
# from: import { Toolbar } from './components/Toolbar';
# to:   import Toolbar from './components/Toolbar';
sed -i '' 's/import { Toolbar } from/import Toolbar from/' src/lib/ReactMindMap.tsx
sed -i '' 's/import { MindMapCanvas } from/import MindMapCanvas from/' src/lib/ReactMindMap.tsx
sed -i '' 's/import { BottomViewportToolbar } from/import BottomViewportToolbar from/' src/lib/ReactMindMap.tsx
sed -i '' 's/import { SearchWidget } from/import SearchWidget from/' src/lib/ReactMindMap.tsx
# Remove unused imports
sed -i '' "/import { CommandDescriptor, MindMapNodeAST, Point } from/s/, MindMapNodeAST//g" src/lib/ReactMindMap.tsx
sed -i '' "/import { findNodeInAST, findNodeAndParentInAST } from/s/, findNodeAndParentInAST//g" src/lib/ReactMindMap.tsx
sed -i '' "/const { state, addNode, deleteNode, zoom, setViewport, setSearchTerm, toggleReadOnlyMode, pan, fitView } = mindMapHook;/s/, setViewport//g" src/lib/ReactMindMap.tsx
sed -i '' "/const parentHeight = canvasContainerRef.current?.clientHeight ?? window.innerHeight;/d" src/lib/ReactMindMap.tsx


# 2. Fix App.tsx unused React import
sed -i '' "/import React from 'react';/d" src/App.tsx

# 3. Fix unused imports in hooks/useMindMap.ts
sed -i '' "/import React, { useReducer, useCallback, useEffect } from 'react';/s/React, //" src/lib/hooks/useMindMap.ts
sed -i '' "/import { MindMapNodeAST, Point, Viewport, MindMapState, MindMapAction, AddNodeCommandArgs, DeleteNodeCommandArgs } from/s/, AddNodeCommandArgs//g" src/lib/hooks/useMindMap.ts
sed -i '' "/import { MindMapNodeAST, Point, Viewport, MindMapState, MindMapAction, DeleteNodeCommandArgs } from/s/, DeleteNodeCommandArgs//g" src/lib/hooks/useMindMap.ts
sed -i '' "/import { createNode, countAllDescendants, deepCopyAST, findNodeInAST, findNodeAndParentInAST, transformToMindMapNode } from/s/createNode, //" src/lib/hooks/useMindMap.ts
sed -i '' "/import { countAllDescendants, deepCopyAST, findNodeInAST, findNodeAndParentInAST, transformToMindMapNode } from/s/, findNodeAndParentInAST//g" src/lib/hooks/useMindMap.ts


# 4. Fix unused imports in components
sed -i '' "/import { MindMapNodeAST, Viewport } from/d" src/lib/components/NodeEditInput.tsx
sed -i '' "/import { FONT_SIZE, FONT_FAMILY, TEXT_PADDING_X, TEXT_PADDING_Y, NODE_BORDER_RADIUS } from/d" src/lib/components/NodeEditInput.tsx
sed -i '' "/, worldToScreen/s///" src/lib/components/MindMapCanvas.tsx

# 5. Fix implicit any in nodeUtils.ts
sed -i '' "s/(child): child is MindMapNodeAST/(child: MindMapNodeAST | null): child is MindMapNodeAST/" src/lib/utils/nodeUtils.ts

# 6. Fix vite config files by removing now-unnecessary imports (with @types/node installed)
# and fixing the __dirname issue. We will use process.cwd() as a reliable alternative.
sed -i '' "s/import path from 'path';//" vite.config.ts
sed -i '' "s|path.resolve(__dirname, '.')|process.cwd()|" vite.config.ts

sed -i '' "s/import { resolve } from 'path';/import { resolve } from 'path';/" vite.lib.config.ts # Keep this one for resolve
# No change needed for vite.lib.config.ts's resolve, it should work fine with @types/node

# 7. Create a declaration file for CSS modules
cat << 'EOT' > src/vite-env.d.ts
/// <reference types="vite/client" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
EOT

# 8. Fix import in index.ts which points to a non-existent CSS file
sed -i '' "s|import './styles.css';|// Import styles if you have them, e.g., import './styles.css';|" src/lib/index.ts

