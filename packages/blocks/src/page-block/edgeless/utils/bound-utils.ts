import type { EdgelessElement } from '../../../_common/utils/index.js';
import { Bound } from '../../../surface-block/index.js';

export function getGridBound(ele: EdgelessElement) {
  return ele.gridBound;
}

export function edgelessElementsBound(elements: EdgelessElement[]) {
  if (elements.length === 0) return new Bound();
  return elements.reduce((prev, element) => {
    return prev.unite(getGridBound(element));
  }, getGridBound(elements[0]));
}
