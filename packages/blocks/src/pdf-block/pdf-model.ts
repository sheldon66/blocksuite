import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

/**
 * When the attachment is uploading, the `sourceId` is `undefined`.
 * And we can query the upload status by the `isAttachmentLoading` function.
 *
 * Other collaborators will see an error attachment block when the blob has not finished uploading.
 * This issue can be resolve by sync the upload status through the awareness system in the future.
 *
 * When the attachment is uploaded, the `sourceId` is the id of the blob.
 *
 * If there are no `sourceId` and the `isAttachmentLoading` function returns `false`,
 * it means that the attachment is failed to upload.
 */

export const PdfBlockSchema = defineBlockSchema({
  flavour: 'affine:pdf',
  props: internal => ({
    text: internal.Text(),
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:database',
      'affine:paragraph',
      'affine:list',
    ],
  },
});

export type PdfBlockModel = SchemaToModel<typeof PdfBlockSchema>;
