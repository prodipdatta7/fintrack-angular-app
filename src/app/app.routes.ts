import { Routes } from '@angular/router';
import { authGuard, redirectIfAuth } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [redirectIfAuth],
        loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    },
    {
        path: 'register',
        canActivate: [redirectIfAuth],
        loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    },
    {
        path: '',
        component: AppLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full',
            },
            {
                path: 'dashboard',
                data: { title: 'Financial Overview' },
                loadComponent: () =>
                    import('./features/dashboard/dashboard/dashboard.component').then((m) => m.DashboardComponent),
            },
            {
                path: 'accounts',
                data: { title: 'Payment & Income Sources' },
                loadComponent: () =>
                    import('./features/accounts/account-list/account-list.component').then(
                        (m) => m.AccountListComponent,
                    ),
            },
            {
                path: 'accounts/:id',
                data: { title: 'Account Details' },
                loadComponent: () =>
                    import('./features/accounts/account-detail/account-detail.component').then(
                        (m) => m.AccountDetailComponent,
                    ),
            },
            {
                path: 'transactions',
                data: { title: 'Ledger & Transactions' },
                loadComponent: () =>
                    import('./features/transactions/transaction-list/transaction-list.component').then(
                        (m) => m.TransactionListComponent,
                    ),
            },
            {
                path: 'transactions/new',
                data: { title: 'Record Transaction' },
                loadComponent: () =>
                    import('./features/transactions/transaction-editor/transaction-editor.component').then(
                        (m) => m.TransactionEditorComponent,
                    ),
            },
            {
                path: 'transactions/edit/:id',
                data: { title: 'Record Transaction' },
                loadComponent: () =>
                    import('./features/transactions/transaction-editor/transaction-editor.component').then(
                        (m) => m.TransactionEditorComponent,
                    ),
            },
            {
                path: 'transactions/details/:id',
                data: { title: 'Transaction Details' },
                loadComponent: () =>
                    import('./features/transactions/transaction-detail/transaction-detail.component').then(
                        (m) => m.TransactionDetailComponent,
                    ),
            },
            {
                path: 'categories',
                data: { title: 'Budget Categories' },
                loadComponent: () =>
                    import('./features/categories/category-list/category-list.component').then(
                        (m) => m.CategoryListComponent,
                    ),
            },
            {
                path: 'plans',
                data: { title: 'Savings Goals & Planning' },
                loadComponent: () =>
                    import('./features/plans/plan-list/plan-list.component').then((m) => m.PlanListComponent),
            },
            {
                path: 'settings',
                data: { title: 'Profile & Settings' },
                loadComponent: () =>
                    import('./features/settings/settings/settings.component').then((m) => m.SettingsComponent),
            },
            {
                path: 'admin',
                data: { title: 'Developer & Data Studio' },
                canActivate: [adminGuard],
                loadComponent: () =>
                    import('./features/admin/admin-dashboard/admin-dashboard.component').then(
                        (m) => m.AdminDashboardComponent,
                    ),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];
