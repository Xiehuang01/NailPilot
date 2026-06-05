import { analyzeNailPreferenceSkill } from './analyzeNailPreference.js';
import { prepareTryOnFlowSkill } from './prepareTryOnFlow.js';
import { styleCatalogSkill } from './styleCatalog.js';
import type { ConsumerAgentSkill } from '../types.js';

export const consumerAgentSkills: ConsumerAgentSkill[] = [
  styleCatalogSkill,
  analyzeNailPreferenceSkill,
  prepareTryOnFlowSkill,
];
