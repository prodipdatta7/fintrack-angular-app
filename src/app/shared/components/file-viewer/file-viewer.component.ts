import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import * as mammoth from 'mammoth';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal-container glass-card" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-title">
              <i [class]="typeIcon" class="file-type-icon"></i>
              <span class="file-name-text">{{ fileName || 'Document Viewer' }}</span>
              <span class="file-type-badge">{{ fileType.toUpperCase() }}</span>
            </div>
            <button class="btn-close" (click)="close()" title="Close Viewer">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Body / Content Previewer -->
          <div class="modal-body">
            @if (fileType === 'image') {
              <div class="image-viewer-container">
                <img [src]="fileUrl" [alt]="fileName || 'Attached Image'" class="preview-image" />
              </div>
            } @else if (fileType === 'pdf') {
              <div class="pdf-viewer-container">
                @if (safePdfUrl) {
                  <object [data]="safePdfUrl" type="application/pdf" class="preview-object">
                    <iframe [src]="safePdfUrl" class="preview-iframe"></iframe>
                  </object>
                }
              </div>
            } @else if (fileType === 'docx') {
              <div class="docx-inline-container">
                @if (isRenderingDocx) {
                  <div class="rendering-state">
                    <i class="pi pi-spin pi-spinner spinner-icon"></i>
                    <span>Converting Word document for inline view...</span>
                  </div>
                } @else if (docxHtml) {
                  <div class="docx-paper" [innerHTML]="docxHtml"></div>
                } @else {
                  <div class="docx-hero-card">
                    <i class="pi pi-file-word docx-icon"></i>
                    <h3>Word Document (.docx)</h3>
                    <p class="file-desc">{{ docxError || fileName || 'Attached Word Document' }}</p>
                    <div class="docx-actions">
                      @if (fileUrl) {
                        <a [href]="fileUrl" [download]="fileName || 'document.docx'" class="btn-action primary">
                          <i class="pi pi-download"></i> Download & Open in Word
                        </a>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="generic-viewer-container">
                <i class="pi pi-file generic-icon"></i>
                <h3>File Attachment</h3>
                <p>{{ fileName || 'Attached Document' }}</p>
                @if (fileUrl) {
                  <a [href]="fileUrl" [download]="fileName || 'file'" class="btn-action primary">
                    <i class="pi pi-download"></i> Download File
                  </a>
                }
              </div>
            }
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer">
            <span class="file-status-info">Viewing transcript / attachment</span>
            <div class="footer-buttons">
              @if (fileUrl) {
                <a [href]="fileUrl" [download]="fileName || 'attachment'" class="btn-footer">
                  <i class="pi pi-download"></i> Download
                </a>
                <a [href]="fileUrl" target="_blank" class="btn-footer primary">
                  <i class="pi pi-external-link"></i> Open Direct Link
                </a>
              }
              <button class="btn-footer danger" (click)="close()">Close</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(5, 10, 24, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-container {
      width: 100%;
      max-width: 920px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-lg, 16px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2);
      overflow: hidden;
    }

    .modal-header {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(30, 41, 59, 0.5);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #f8fafc;
      font-weight: 600;
      font-size: 1.1rem;
      overflow: hidden;
    }

    .file-type-icon {
      font-size: 1.3rem;
      color: #38bdf8;
    }

    .file-name-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 450px;
    }

    .file-type-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      text-transform: uppercase;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 50%;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-close:hover {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: rgba(10, 15, 30, 0.6);
    }

    /* Image Viewer */
    .image-viewer-container {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .preview-image {
      max-width: 100%;
      max-height: 65vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    /* PDF Viewer */
    .pdf-viewer-container {
      width: 100%;
      height: 65vh;
    }
    .preview-object, .preview-iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
    }

    /* DOCX Inline Viewer */
    .docx-inline-container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      max-height: 65vh;
      overflow-y: auto;
    }

    .rendering-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #38bdf8;
    }

    .spinner-icon {
      font-size: 2rem;
    }

    .docx-paper {
      width: 100%;
      max-width: 850px;
      background: #ffffff;
      color: #1e293b;
      padding: 3.5rem 4rem;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 1rem;
      line-height: 1.75;
      word-wrap: break-word;
      overflow-x: auto;
      text-align: left;
    }

    .docx-paper ::ng-deep p {
      margin-top: 0.5rem;
      margin-bottom: 1.35rem;
      line-height: 1.75;
    }

    .docx-paper ::ng-deep h1 {
      font-size: 2rem;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.6rem;
      margin-top: 2.25rem;
      margin-bottom: 1.25rem;
      font-weight: 700;
    }
    .docx-paper ::ng-deep h2 {
      font-size: 1.55rem;
      color: #1e3a8a;
      margin-top: 1.75rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    .docx-paper ::ng-deep h3 {
      font-size: 1.25rem;
      color: #1e293b;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-weight: 600;
    }
    .docx-paper ::ng-deep h4, .docx-paper ::ng-deep h5, .docx-paper ::ng-deep h6 {
      font-size: 1.1rem;
      color: #334155;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .docx-paper ::ng-deep strong, .docx-paper ::ng-deep b {
      font-weight: 700;
      color: #0f172a;
    }
    .docx-paper ::ng-deep em, .docx-paper ::ng-deep i {
      font-style: italic;
      color: #334155;
    }
    .docx-paper ::ng-deep u {
      text-decoration: underline;
    }
    .docx-paper ::ng-deep mark {
      background-color: #fef08a;
      padding: 0.1em 0.3em;
      border-radius: 3px;
    }

    .docx-paper ::ng-deep ul, .docx-paper ::ng-deep ol {
      padding-left: 2.25rem;
      margin-top: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .docx-paper ::ng-deep li {
      margin-bottom: 0.5rem;
      line-height: 1.65;
    }
    .docx-paper ::ng-deep li > p {
      margin-bottom: 0.35rem;
    }

    .docx-paper ::ng-deep table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.75rem 0;
      font-size: 0.92rem;
      border: 1px solid #cbd5e1;
    }
    .docx-paper ::ng-deep th, .docx-paper ::ng-deep td {
      border: 1px solid #cbd5e1;
      padding: 0.75rem 1rem;
      text-align: left;
    }
    .docx-paper ::ng-deep th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }
    .docx-paper ::ng-deep tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .docx-paper ::ng-deep blockquote {
      border-left: 4px solid #3b82f6;
      padding: 0.75rem 1.25rem;
      background: #eff6ff;
      margin: 1.5rem 0;
      font-style: italic;
      color: #1e40af;
      border-radius: 0 8px 8px 0;
    }

    /* Fallback DOCX & Generic Viewer */
    .generic-viewer-container, .docx-hero-card {
      text-align: center;
      padding: 2.5rem;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      max-width: 500px;
      width: 100%;
    }
    .docx-icon {
      font-size: 3.5rem;
      color: #2b579a;
      margin-bottom: 1rem;
    }
    .generic-icon {
      font-size: 3.5rem;
      color: #38bdf8;
      margin-bottom: 1rem;
    }
    .file-desc {
      color: #94a3b8;
      margin-bottom: 1.5rem;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-action.primary {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #fff;
    }
    .btn-action.primary:hover {
      box-shadow: 0 0 15px rgba(37, 99, 235, 0.4);
    }

    /* Modal Footer */
    .modal-footer {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(30, 41, 59, 0.5);
    }

    .file-status-info {
      font-size: 0.85rem;
      color: #64748b;
    }

    .footer-buttons {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-footer {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      color: #e2e8f0;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }
    .btn-footer:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .btn-footer.primary {
      background: #0284c7;
      border-color: #0369a1;
      color: #fff;
    }
    .btn-footer.primary:hover {
      background: #0369a1;
    }
    .btn-footer.danger {
      background: rgba(244, 63, 94, 0.2);
      border-color: rgba(244, 63, 94, 0.3);
      color: #f43f5e;
    }
    .btn-footer.danger:hover {
      background: rgba(244, 63, 94, 0.3);
    }
  `]
})
export class FileViewerComponent implements OnChanges {
  private sanitizer = inject(DomSanitizer);

  @Input() visible: boolean = false;
  @Input() fileUrl: string | null = null;
  @Input() fileName: string | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();

  docxHtml: SafeHtml | null = null;
  isRenderingDocx = false;
  docxError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['fileUrl'] || changes['visible']) && this.visible && this.fileType === 'docx') {
      this.renderDocxInline();
    }
  }

  get fileType(): 'image' | 'pdf' | 'docx' | 'other' {
    if (!this.fileUrl && !this.fileName) return 'other';
    const url = (this.fileUrl || '').toLowerCase();
    const name = (this.fileName || '').toLowerCase();

    if (url.startsWith('data:image/') || /\.(jpg|jpeg|jpe|png|gif|webp|svg)(\?.*)?$/i.test(name || url)) {
      return 'image';
    }
    if (url.startsWith('data:application/pdf') || /\.(pdf)(\?.*)?$/i.test(name || url)) {
      return 'pdf';
    }
    if (url.includes('wordprocessingml') || url.includes('msword') || /\.(docx|doc)(\?.*)?$/i.test(name || url)) {
      return 'docx';
    }
    return 'other';
  }

  get typeIcon(): string {
    switch (this.fileType) {
      case 'image': return 'pi pi-image';
      case 'pdf': return 'pi pi-file-pdf';
      case 'docx': return 'pi pi-file-word';
      default: return 'pi pi-file';
    }
  }

  get safePdfUrl(): SafeResourceUrl | null {
    if (!this.fileUrl) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl);
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private async renderDocxInline(): Promise<void> {
    if (!this.fileUrl) return;
    this.isRenderingDocx = true;
    this.docxError = null;
    this.docxHtml = null;

    try {
      let arrayBuffer: ArrayBuffer;

      if (this.fileUrl.startsWith('data:')) {
        const base64Index = this.fileUrl.indexOf(';base64,');
        if (base64Index !== -1) {
          const base64 = this.fileUrl.substring(base64Index + 8);
          arrayBuffer = this.base64ToArrayBuffer(base64);
        } else {
          throw new Error('Invalid Base64 Data URL format');
        }
      } else {
        const response = await fetch(this.fileUrl);
        arrayBuffer = await response.arrayBuffer();
      }

      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Title'] => h1.doc-title:fresh",
            "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
            "p[style-name='Quote'] => blockquote:fresh",
            "p[style-name='Intense Quote'] => blockquote.intense:fresh",
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em"
          ]
        }
      );
      const htmlContent = result.value || '<p><em>(Empty document content)</em></p>';
      this.docxHtml = this.sanitizer.bypassSecurityTrustHtml(htmlContent);
    } catch (err: any) {
      this.docxError = err?.message || 'Could not parse inline Word document content.';
    } finally {
      this.isRenderingDocx = false;
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
