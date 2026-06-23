'use client';

import { useRouter } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import { ShellProvider } from '@/shared/context/shell.context';
import { AdminShell } from '@/shared/template/admin-shell.component';
import { AppSidebarNavigation } from '@/shared/navigation/app-sidebar-navigation.component';
import type { ModuleNavigationEntry } from '@/shared/components/ui/sidebar-menu.component';
import { AuthGuard, useAuth } from '@/modules/auth';

// ── Rotas ─────────────────────────────────────────────────────────────────────

const EXAMPLE_ROUTE = '/example';
const EXAMPLE_DASHBOARD_ROUTE = `${EXAMPLE_ROUTE}/dashboard`;

// ── Estrutura de navegação ─────────────────────────────────────────────────────

const APP_MODULES: ModuleNavigationEntry[] = [
  {
    item: {
      id: 'example',
      label: 'Exemplo',
      shortLabel: 'Ex',
      href: EXAMPLE_DASHBOARD_ROUTE,
      icon: LayoutDashboard,
    },
    sections: [
      {
        id: 'example-main',
        label: 'Exemplo',
        items: [
          {
            id: 'example-dashboard',
            label: 'Dashboard',
            href: EXAMPLE_DASHBOARD_ROUTE,
            icon: LayoutDashboard,
            match: 'exact',
          },
        ],
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────

function PrivateShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useAuth();

  return (
    <ShellProvider defaultOpen>
      <AdminShell
        sidebar={<AppSidebarNavigation modules={APP_MODULES} defaultModuleId="example" />}
        userName={auth.user?.name}
        userEmail={auth.user?.email}
        onLogout={() => {
          auth.logout();
          router.push('/join');
        }}
      >
        {children}
      </AdminShell>
    </ShellProvider>
  );
}

export default function PrivateGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PrivateShell>{children}</PrivateShell>
    </AuthGuard>
  );
}
