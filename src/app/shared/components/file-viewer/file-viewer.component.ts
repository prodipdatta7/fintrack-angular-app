import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-viewer.component.html',
  styleUrl: './file-viewer.component.scss'
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
      case 'image': return 'image';
      case 'pdf': return 'picture_as_pdf';
      case 'docx': return 'description';
      default: return 'description';
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

      const mammoth = await import('mammoth');
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
      const rawHtml = result.value || '<p><em>(Empty document content)</em></p>';
      const sanitized = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
          'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'strong', 'b', 'em', 'i', 'u', 'mark', 'blockquote', 'a', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'target', 'class', 'style']
      });
      this.docxHtml = this.sanitizer.bypassSecurityTrustHtml(sanitized);
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
