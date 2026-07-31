import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppLayoutComponent } from './layout/app-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'transactions',
        pathMatch: 'full'
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transaction-list/transaction-list.component').then(m => m.TransactionListComponent)
      },
      {
        path: 'transactions/new',
        loadComponent: () => import('./features/transactions/transaction-editor/transaction-editor.component').then(m => m.TransactionEditorComponent)
      },
      {
        path: 'transactions/edit/:id',
        loadComponent: () => import('./features/transactions/transaction-editor/transaction-editor.component').then(m => m.TransactionEditorComponent)
      },
      {
        path: 'transactions/details/:id',
        loadComponent: () => import('./features/transactions/transaction-detail/transaction-detail.component').then(m => m.TransactionDetailComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/category-list/category-list.component').then(m => m.CategoryListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
