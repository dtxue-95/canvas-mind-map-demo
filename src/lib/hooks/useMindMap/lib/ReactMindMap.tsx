const initialState: MindMapState = {
  // ...
  isReadOnly: true, // Default to read-only
};

function mindMapReducer(state: MindMapState, action: MindMapAction): MindMapState {
  switch (action.type) {
    // ...
    case 'TOGGLE_READ_ONLY': {
      // Allow forcing a state, or toggling
      const newReadOnlyState = typeof action.payload === 'boolean' ? action.payload : !state.isReadOnly;
      return { ...state, isReadOnly: newReadOnlyState, editingNodeId: null };
    }
    // ...
  }
}

export function useMindMap(/*...*/) {
  // ...
  const toggleReadOnlyMode = useCallback((forceState?: boolean) => {
    dispatch({ type: 'TOGGLE_READ_ONLY', payload: forceState });
  }, []);
  // ...
}

export interface ReactMindMapProps {
  // ...
  readOnly?: boolean;
}

export const ReactMindMap: React.FC<ReactMindMapProps> = ({
  // ...
  readOnly,
  showTopToolbar = true,
  showBottomToolbar = true,
}) => {
  const { state, toggleReadOnlyMode, /* ... */ } = useMindMap(canvasSize, initialData);

  useEffect(() => {
    const isExternallyControlled = readOnly !== undefined;
    if (isExternallyControlled) {
      if (state.isReadOnly !== readOnly) {
        toggleReadOnlyMode(readOnly);
      }
    } else {
      const shouldBeReadOnly = !showTopToolbar && !showBottomToolbar;
      if (state.isReadOnly !== shouldBeReadOnly) {
        toggleReadOnlyMode(shouldBeReadOnly);
      }
    }
  }, [readOnly, showTopToolbar, showBottomToolbar, state.isReadOnly, toggleReadOnlyMode]);

  // ...
} 