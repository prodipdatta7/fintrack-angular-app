import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'login']);
    authServiceSpy.login.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize register form', () => {
    expect(component).toBeTruthy();
    expect(component.registerForm.valid).toBeFalse();
  });

  it('should register successfully and navigate', () => {
    component.registerForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123'
    });

    authServiceSpy.register.and.returnValue(of({
      userId: 'u-1',
      email: 'john@example.com',
      token: 'tok',
      refreshToken: 'ref'
    }));

    component.onSubmit();
    expect(authServiceSpy.register).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
  });
});
