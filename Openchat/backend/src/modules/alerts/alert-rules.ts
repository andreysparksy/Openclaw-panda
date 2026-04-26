import { env } from '../../config/env.js';
import type { ContextSignal } from '../../types/message.js';

export interface AlertCandidate {
  dependencyType: string;
  count: number;
  summary: string;
}

export function evaluateAlertCandidates(signals: ContextSignal[]): AlertCandidate[] {
  const grouped = new Map<string, AlertCandidate>();

  for (const signal of signals) {
    if (!signal.isOwnerRelated || !signal.dependencyType) continue;

    const current = grouped.get(signal.dependencyType);
    if (current) {
      current.count += 1;
      continue;
    }

    grouped.set(signal.dependencyType, {
      dependencyType: signal.dependencyType,
      count: 1,
      summary: signal.summary,
    });
  }

  return Array.from(grouped.values()).filter((candidate) => candidate.count >= env.alertThreshold);
}
