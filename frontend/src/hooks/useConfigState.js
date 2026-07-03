import { useCallback, useMemo } from 'react';
import { usePersistedState } from './usePersistedState.js';
import { generateId } from '../utils/id.js';
import {
  createEssentialAttributes,
  isEssentialId,
} from '../data/essentialAttributes.js';

const STORAGE_KEY = 'eventlogsim:configDraft';

const createInitialConfig = () => ({
  process: {
    mode: 'BPMN_BASED',
    description: '',
    bpmnFile: null,
    runName: '',
  },
  agents: [],
  attributes: createEssentialAttributes(),
  simulation: {
    caseCount: 100,
  },
});

const ensureEssentials = (attributes) => {
  const list = Array.isArray(attributes) ? attributes : [];
  const present = new Set(list.filter((a) => a?.locked).map((a) => a.id));
  const missing = createEssentialAttributes().filter(
    (a) => !present.has(a.id)
  );
  return missing.length === 0 ? list : [...missing, ...list];
};

const isMutable = (a) => !a.locked && !isEssentialId(a.id);

const hydrate = (raw) => {
  if (!raw || typeof raw !== 'object') return createInitialConfig();
  const base = createInitialConfig();
  return {
    process: { ...base.process, ...(raw.process || {}) },
    agents: Array.isArray(raw.agents) ? raw.agents : [],
    attributes: ensureEssentials(raw.attributes),
    simulation: { ...base.simulation, ...(raw.simulation || {}) },
  };
};

export const useConfigState = () => {
  const [stored, setStored] = usePersistedState(
    STORAGE_KEY,
    createInitialConfig()
  );

  const config = useMemo(() => hydrate(stored), [stored]);

  const update = useCallback(
    (updater) => {
      setStored((prev) => updater(hydrate(prev)));
    },
    [setStored]
  );

  const setProcessMode = useCallback(
    (mode) =>
      update((c) => ({ ...c, process: { ...c.process, mode } })),
    [update]
  );

  const setProcessDescription = useCallback(
    (description) =>
      update((c) => ({ ...c, process: { ...c.process, description } })),
    [update]
  );

  const setBpmnFile = useCallback(
    (bpmnFile) =>
      update((c) => ({ ...c, process: { ...c.process, bpmnFile } })),
    [update]
  );

  const addAgent = useCallback(
    (agentData) =>
      update((c) => ({
        ...c,
        agents: [
          ...c.agents,
          {
            id: generateId(),
            name: '',
            role: '',
            age: null,
            description: '',
            actions: [],
            ...agentData,
          },
        ],
      })),
    [update]
  );

  const updateAgent = useCallback(
    (id, changes) =>
      update((c) => ({
        ...c,
        agents: c.agents.map((a) => (a.id === id ? { ...a, ...changes } : a)),
      })),
    [update]
  );

  const removeAgent = useCallback(
    (id) =>
      update((c) => ({
        ...c,
        agents: c.agents.filter((a) => a.id !== id),
      })),
    [update]
  );

  const addAttribute = useCallback(
    (attrData = {}) =>
      update((c) => {
        const { name = '', type = 'string' } = attrData;
        return {
          ...c,
          attributes: [
            ...c.attributes,
            { id: generateId(), name, type, locked: false },
          ],
        };
      }),
    [update]
  );

  const updateAttribute = useCallback(
    (id, changes) =>
      update((c) => ({
        ...c,
        attributes: c.attributes.map((a) =>
          a.id === id && isMutable(a)
            ? { ...a, ...changes, locked: false }
            : a
        ),
      })),
    [update]
  );

  const removeAttribute = useCallback(
    (id) =>
      update((c) => ({
        ...c,
        attributes: c.attributes.filter(
          (a) => !(a.id === id && isMutable(a))
        ),
      })),
    [update]
  );

  const setCaseCount = useCallback(
    (caseCount) =>
      update((c) => ({
        ...c,
        simulation: { ...c.simulation, caseCount },
      })),
    [update]
  );

  const setRunName = useCallback(
    (runName) =>
      update((c) => ({
        ...c,
        process: { ...c.process, runName },
      })),
    [update]
  );


  const resetStep = useCallback(
    (stepName) => {
      const defaults = createInitialConfig();
      update((c) => {
        switch (stepName) {
          case 'process':
            return { ...c, process: defaults.process };
          case 'agents':
            return { ...c, agents: defaults.agents };
          case 'attributes':
            return { ...c, attributes: defaults.attributes };
          case 'simulation':
            return { ...c, simulation: defaults.simulation };
          default:
            return c;
        }
      });
    },
    [update]
  );

  const resetAll = useCallback(() => {
    setStored(createInitialConfig());
  }, [setStored]);

  return {
    config,
    setProcessMode,
    setProcessDescription,
    setBpmnFile,
    addAgent,
    updateAgent,
    removeAgent,
    addAttribute,
    updateAttribute,
    removeAttribute,
    setCaseCount,
    setRunName,
    resetStep,
    resetAll,
  };
};
