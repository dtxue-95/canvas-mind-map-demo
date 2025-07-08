/**
 * @fileoverview Default configuration for the toolbars.
 * This file exports functions that return the default configurations for the top and bottom toolbars.
 * The configurations are arrays of command IDs, which are then used to build the toolbars.
 */

export const getDefaultTopToolbarConfig = () => [
  'undo',
  'redo',
  'add-sibling-node',
  'add-child-node',
  'delete-node',
  // 'review'
];

export const getDefaultBottomToolbarConfig = () => [
  'zoom-in',
  'zoom-out',
  'toggle-read-only',
  'fit-view',
  'center-view',
  'toggle-fullscreen',
  'toggle-search',
]; 