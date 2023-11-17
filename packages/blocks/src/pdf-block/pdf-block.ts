import { BlockElement } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { html, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { type PdfBlockModel } from './pdf-model.js';

@customElement('affine-pdf')
export class PdfBlockComponent extends BlockElement<PdfBlockModel> {
  override render() {
    return html`<p>hello world</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pdf-document': PdfBlockComponent;
  }
}
