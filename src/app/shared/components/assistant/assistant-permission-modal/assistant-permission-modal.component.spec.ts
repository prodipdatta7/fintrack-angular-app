import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AssistantPermissionModalComponent } from './assistant-permission-modal.component';
import { AssistantService } from '../../../../core/services/assistant.service';

describe('AssistantPermissionModalComponent', () => {
    let component: AssistantPermissionModalComponent;
    let fixture: ComponentFixture<AssistantPermissionModalComponent>;
    let assistantService: AssistantService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AssistantPermissionModalComponent],
            providers: [AssistantService, provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(AssistantPermissionModalComponent);
        component = fixture.componentInstance;
        assistantService = TestBed.inject(AssistantService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should resolve permission on grant', () => {
        spyOn(assistantService, 'resolvePermission');
        component.grant();
        expect(assistantService.resolvePermission).toHaveBeenCalledWith(true);
    });

    it('should resolve permission on deny', () => {
        spyOn(assistantService, 'resolvePermission');
        component.deny();
        expect(assistantService.resolvePermission).toHaveBeenCalledWith(false);
    });
});
