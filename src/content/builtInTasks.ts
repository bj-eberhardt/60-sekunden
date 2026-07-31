import type { BuiltInTask } from '../catalog/types';
import builtInCatalog from './builtInTasks.json';

export const builtInCatalogVersion = builtInCatalog.builtInCatalogVersion;
export const builtInTasks = builtInCatalog.builtInTasks as BuiltInTask[];
