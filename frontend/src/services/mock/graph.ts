import { AttackGraphData } from '@/types'

export const mockAttackGraph: AttackGraphData = {
  nodes: [
    // Shared Infrastructure (Center Hubs)
    {
      id: 'node-dev-1',
      type: 'entityNode',
      position: { x: 450, y: 220 },
      data: {
        id: 'node-dev-1',
        label: 'Hardware Fingerprint DEV-9102',
        entityType: 'DEVICE',
        identifier: 'DEV-9102-FP89 (Android 14 / SM-S918B)',
        isAdversarial: true,
        isShared: true,
        connectionCount: 4,
        riskLevel: 'CRITICAL',
        metadata: {
          os: 'Android 14',
          browser: 'Chrome Mobile 126.0',
          firstSeen: '2026-08-20 00:05:00',
          totalAccountsLinked: 4,
        },
      },
    },
    {
      id: 'node-addr-1',
      type: 'entityNode',
      position: { x: 450, y: 440 },
      data: {
        id: 'node-addr-1',
        label: 'Delivery Destination ADDR-77A',
        entityType: 'ADDRESS',
        identifier: 'Koramangala 4th Block, Bengaluru 560034',
        isAdversarial: true,
        isShared: true,
        connectionCount: 4,
        riskLevel: 'HIGH',
        metadata: {
          city: 'Bengaluru',
          pincode: '560034',
          totalOrdersDestined: 12,
        },
      },
    },
    {
      id: 'node-ip-1',
      type: 'entityNode',
      position: { x: 450, y: 30 },
      data: {
        id: 'node-ip-1',
        label: 'Synthetic IP 192.0.2.45',
        entityType: 'IP',
        identifier: '192.0.2.45 (Bangalore DC ASN)',
        isAdversarial: true,
        isShared: true,
        connectionCount: 4,
        riskLevel: 'MEDIUM',
        metadata: {
          isProxy: false,
          isVpn: false,
          country: 'IN',
        },
      },
    },

    // Synthetic Adversarial Accounts (Left Column)
    {
      id: 'node-acc-a',
      type: 'entityNode',
      position: { x: 80, y: 80 },
      data: {
        id: 'node-acc-a',
        label: 'Account SYNTH-ACC-101',
        entityType: 'ACCOUNT',
        identifier: 'rajesh.k.91@synthmail.in',
        isAdversarial: true,
        isShared: false,
        connectionCount: 3,
        riskLevel: 'HIGH',
        metadata: {
          accountAgeDays: 2,
          transactionsCount: 3,
          totalAmount: 28500,
          status: 'ACTIVE',
        },
      },
    },
    {
      id: 'node-acc-b',
      type: 'entityNode',
      position: { x: 80, y: 220 },
      data: {
        id: 'node-acc-b',
        label: 'Account SYNTH-ACC-102',
        entityType: 'ACCOUNT',
        identifier: 'anita.sharma.44@synthmail.in',
        isAdversarial: true,
        isShared: false,
        connectionCount: 3,
        riskLevel: 'HIGH',
        metadata: {
          accountAgeDays: 1,
          transactionsCount: 3,
          totalAmount: 26400,
          status: 'ACTIVE',
        },
      },
    },
    {
      id: 'node-acc-c',
      type: 'entityNode',
      position: { x: 80, y: 360 },
      data: {
        id: 'node-acc-c',
        label: 'Account SYNTH-ACC-103',
        entityType: 'ACCOUNT',
        identifier: 'manish.v.88@synthmail.in',
        isAdversarial: true,
        isShared: false,
        connectionCount: 3,
        riskLevel: 'HIGH',
        metadata: {
          accountAgeDays: 3,
          transactionsCount: 3,
          totalAmount: 33600,
          status: 'ACTIVE',
        },
      },
    },
    {
      id: 'node-acc-d',
      type: 'entityNode',
      position: { x: 80, y: 500 },
      data: {
        id: 'node-acc-d',
        label: 'Account SYNTH-ACC-104',
        entityType: 'ACCOUNT',
        identifier: 'kavita.r.22@synthmail.in',
        isAdversarial: true,
        isShared: false,
        connectionCount: 3,
        riskLevel: 'HIGH',
        metadata: {
          accountAgeDays: 1,
          transactionsCount: 3,
          totalAmount: 29700,
          status: 'ACTIVE',
        },
      },
    },

    // Payment Instruments & Orders (Right Column)
    {
      id: 'node-card-1',
      type: 'entityNode',
      position: { x: 820, y: 120 },
      data: {
        id: 'node-card-1',
        label: 'Virtual Card SYNTH-4242',
        entityType: 'PAYMENT_INSTRUMENT',
        identifier: 'Visa Virtual **** 4242',
        isAdversarial: true,
        isShared: false,
        connectionCount: 2,
        riskLevel: 'MEDIUM',
        metadata: {
          network: 'Visa',
          bank: 'HDFC (Synthetic)',
        },
      },
    },
    {
      id: 'node-card-2',
      type: 'entityNode',
      position: { x: 820, y: 260 },
      data: {
        id: 'node-card-2',
        label: 'UPI Handle user1@okhdfc',
        entityType: 'PAYMENT_INSTRUMENT',
        identifier: 'UPI / user1@okhdfc',
        isAdversarial: true,
        isShared: false,
        connectionCount: 2,
        riskLevel: 'MEDIUM',
        metadata: {
          type: 'UPI',
          psp: 'Google Pay',
        },
      },
    },
    {
      id: 'node-card-3',
      type: 'entityNode',
      position: { x: 820, y: 400 },
      data: {
        id: 'node-card-3',
        label: 'Virtual Card SYNTH-1190',
        entityType: 'PAYMENT_INSTRUMENT',
        identifier: 'Mastercard **** 1190',
        isAdversarial: true,
        isShared: false,
        connectionCount: 2,
        riskLevel: 'MEDIUM',
        metadata: {
          network: 'Mastercard',
          bank: 'ICICI (Synthetic)',
        },
      },
    },
    {
      id: 'node-card-4',
      type: 'entityNode',
      position: { x: 820, y: 530 },
      data: {
        id: 'node-card-4',
        label: 'Virtual Card SYNTH-7731',
        entityType: 'PAYMENT_INSTRUMENT',
        identifier: 'RuPay Debit **** 7731',
        isAdversarial: true,
        isShared: false,
        connectionCount: 2,
        riskLevel: 'MEDIUM',
        metadata: {
          network: 'RuPay',
          bank: 'SBI (Synthetic)',
        },
      },
    },
  ],
  edges: [
    // Account A connections
    { id: 'e-acc-a-ip', source: 'node-acc-a', target: 'node-ip-1', label: 'Login' },
    { id: 'e-acc-a-dev', source: 'node-acc-a', target: 'node-dev-1', label: 'Device Shared', animated: true },
    { id: 'e-acc-a-addr', source: 'node-acc-a', target: 'node-addr-1', label: 'Shipping' },
    { id: 'e-acc-a-card', source: 'node-acc-a', target: 'node-card-1', label: 'Paid with' },

    // Account B connections
    { id: 'e-acc-b-ip', source: 'node-acc-b', target: 'node-ip-1', label: 'Login' },
    { id: 'e-acc-b-dev', source: 'node-acc-b', target: 'node-dev-1', label: 'Device Shared', animated: true },
    { id: 'e-acc-b-addr', source: 'node-acc-b', target: 'node-addr-1', label: 'Shipping' },
    { id: 'e-acc-b-card', source: 'node-acc-b', target: 'node-card-2', label: 'Paid with' },

    // Account C connections
    { id: 'e-acc-c-ip', source: 'node-acc-c', target: 'node-ip-1', label: 'Login' },
    { id: 'e-acc-c-dev', source: 'node-acc-c', target: 'node-dev-1', label: 'Device Shared', animated: true },
    { id: 'e-acc-c-addr', source: 'node-acc-c', target: 'node-addr-1', label: 'Shipping' },
    { id: 'e-acc-c-card', source: 'node-acc-c', target: 'node-card-3', label: 'Paid with' },

    // Account D connections
    { id: 'e-acc-d-ip', source: 'node-acc-d', target: 'node-ip-1', label: 'Login' },
    { id: 'e-acc-d-dev', source: 'node-acc-d', target: 'node-dev-1', label: 'Device Shared', animated: true },
    { id: 'e-acc-d-addr', source: 'node-acc-d', target: 'node-addr-1', label: 'Shipping' },
    { id: 'e-acc-d-card', source: 'node-acc-d', target: 'node-card-4', label: 'Paid with' },
  ],
}
