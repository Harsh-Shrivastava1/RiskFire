import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'

// Public Landing Page
import { LandingPage } from '@/pages/LandingPage'

// Authenticated Application Pages
import { Dashboard } from '@/pages/Dashboard'
import { Policies } from '@/pages/Policies'
import { PolicyBuilder } from '@/pages/PolicyBuilder'
import { PolicyComparison } from '@/pages/PolicyComparison'
import { AttackLab } from '@/pages/AttackLab'
import { Simulations } from '@/pages/Simulations'
import { LiveSimulation } from '@/pages/LiveSimulation'
import { Vulnerabilities } from '@/pages/Vulnerabilities'
import { AttackGraph } from '@/pages/AttackGraph'
import { Patches } from '@/pages/Patches'
import { Benchmarks } from '@/pages/Benchmarks'
import { Reports } from '@/pages/Reports'
import { Incidents } from '@/pages/Incidents'
import { Datasets } from '@/pages/Datasets'
import { AuditLog } from '@/pages/AuditLog'
import { Settings } from '@/pages/Settings'

export const router = createBrowserRouter([
  // Public Landing Page at root
  {
    path: '/',
    element: <LandingPage />,
  },
  // Direct Login Route redirects to Dashboard
  {
    path: '/login',
    element: <Navigate to="/dashboard" replace />,
  },
  // Authenticated Application Layout
  {
    element: <AppShell />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'policies',
        element: <Policies />,
      },
      {
        path: 'policies/new',
        element: <PolicyBuilder />,
      },
      {
        path: 'policies/compare',
        element: <PolicyComparison />,
      },
      {
        path: 'compare',
        element: <PolicyComparison />,
      },
      {
        path: 'attacks',
        element: <AttackLab />,
      },
      {
        path: 'attack-lab',
        element: <AttackLab />,
      },
      {
        path: 'simulations',
        element: <Simulations />,
      },
      {
        path: 'simulations/live',
        element: <LiveSimulation />,
      },
      {
        path: 'vulnerabilities',
        element: <Vulnerabilities />,
      },
      {
        path: 'attack-graph',
        element: <AttackGraph />,
      },
      {
        path: 'patches',
        element: <Patches />,
      },
      {
        path: 'benchmarks',
        element: <Benchmarks />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'incidents',
        element: <Incidents />,
      },
      {
        path: 'datasets',
        element: <Datasets />,
      },
      {
        path: 'audit-log',
        element: <AuditLog />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
