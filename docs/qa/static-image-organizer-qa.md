# Static Image Organizer QA

## Import

- Select a folder with 10 JPG images.
- Confirm the image count appears.
- Select each strategy once.
- Confirm the estimate updates.

## Review

- Confirm every generated folder shows thumbnails.
- Move one image between folders.
- Move one image to low quality.
- Move one low-quality image back to a folder.
- Select one cover per folder.
- Confirm export is disabled before covers are selected.

## Export

- Export to an empty folder.
- Confirm original source names did not change.
- Confirm output files start with `01_封面`.

## Feishu

- Configure test Bitable tokens.
- Confirm first N folder-to-record matches display.
- For a record with existing images, choose skip.
- For a record without images, choose upload.
- Confirm failed uploads can be retried.
