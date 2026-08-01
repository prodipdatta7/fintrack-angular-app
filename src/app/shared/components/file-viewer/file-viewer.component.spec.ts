import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileViewerComponent } from './file-viewer.component';

describe('FileViewerComponent', () => {
  let component: FileViewerComponent;
  let fixture: ComponentFixture<FileViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileViewerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FileViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect image file type correctly', () => {
    component.fileName = 'receipt.jpg';
    expect(component.fileType).toBe('image');
    expect(component.typeIcon).toBe('image');

    component.fileName = 'photo.png';
    expect(component.fileType).toBe('image');
  });

  it('should detect PDF file type correctly', () => {
    component.fileName = 'document.pdf';
    expect(component.fileType).toBe('pdf');
    expect(component.typeIcon).toBe('picture_as_pdf');
  });

  it('should detect DOCX file type correctly', () => {
    component.fileName = 'transcript.docx';
    expect(component.fileType).toBe('docx');
    expect(component.typeIcon).toBe('description');
  });

  it('should emit visibleChange on close', () => {
    spyOn(component.visibleChange, 'emit');
    component.close();
    expect(component.visible).toBeFalse();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });
});
