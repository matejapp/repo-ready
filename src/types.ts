export type CheckStatus = 'passed' | 'failed' | 'warning' | 'skipped';

export type CheckCategory =
    | 'runtime'
    | 'environment'
    | 'ports'
    | 'services'
    | 'binaries'
    | 'database'
    | 'setup-drift';

export interface CheckResult {
    name: string;
    category: CheckCategory;
    status: CheckStatus;
    message: string;
    suggestion?: string;
}