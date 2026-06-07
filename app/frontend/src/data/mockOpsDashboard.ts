export type OpsMetric = {
    label: string
    value: string
    detail: string
}

export type OpsEvent = {
    time: string
    title: string
    detail: string
}

export const opsMetrics: OpsMetric[] = [
    {
        label: 'Service Health',
        value: 'Healthy',
        detail: 'Frontend simulation loop is responding normally.',
    },
    {
        label: 'Advance Day Workflow',
        value: 'Mocked',
        detail: 'Turn processing currently runs in local React state.',
    },
    {
        label: 'Average Turn Latency',
        value: '150 ms',
        detail: 'Placeholder value for future API Gateway and Lambda timing.',
    },
    {
        label: 'Error Rate',
        value: '0%',
        detail: 'No simulated frontend errors are currently active.',
    },
    {
        label: 'Alarm State',
        value: 'OK',
        detail: 'Placeholder for future CloudWatch alarm state.',
    },
    {
        label: 'Audit Trail',
        value: 'Planned',
        detail: 'Future CloudTrail evidence will track infrastructure and API changes.',
    },
]

export const opsEvents: OpsEvent[] = [
    {
        time: 'T+00:00',
        title: 'Frontend loaded',
        detail: 'React application initialized from seeded colony state.',
    },
    {
        time: 'T+00:01',
        title: 'Advance Day available',
        detail: 'User can trigger a local turn-processing action.',
    },
    {
        time: 'T+00:02',
        title: 'Turn outcome generated',
        detail: 'The app displays resource changes and a journal update after each turn.',
    },
    {
        time: 'Future',
        title: 'AWS telemetry integration',
        detail: 'CloudWatch metrics, logs, alarms, and audit evidence will replace mock data.',
    },
]