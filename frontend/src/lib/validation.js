const MIN_DESCRIPTION_LENGTH = 20;
const MIN_CASE_COUNT = 1;
const MAX_CASE_COUNT = 10000;

const ok = () => ({ valid: true, errors: {} });

const fail = (errors) => ({ valid: false, errors });

export const validateProcess = (process = {}) => {
  const errors = {};

  if (process.mode === 'BPMN_BASED') {
    if (!process.bpmnFile) {
      errors.bpmnFile = 'A BPMN file is required when using BPMN-based mode.';
    }
  } else {
    const desc = (process.description || '').trim();
    if (desc.length < MIN_DESCRIPTION_LENGTH) {
      errors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
    }
  }

  return Object.keys(errors).length === 0 ? ok() : fail(errors);
};

export const validateAgents = (agents = []) => {
  const errors = {};

  if (!Array.isArray(agents) || agents.length === 0) {
    errors.agents = 'Add at least one agent.';
    return fail(errors);
  }

  const invalid = agents.find((agent) => {
    const name = (agent.name || '').trim();
    const role = (agent.role || '').trim();
    const actions = Array.isArray(agent.actions) ? agent.actions : [];
    return !name || !role || actions.length === 0;
  });

  if (invalid) {
    errors.agents = 'Every agent needs a name, a role, and at least one action.';
    return fail(errors);
  }

  return ok();
};

export const validateAttributes = () => ok();

export const validateSimulation = (simulation = {}) => {
  const errors = {};
  const caseCount = simulation.caseCount;

  if (
    typeof caseCount !== 'number' ||
    !Number.isFinite(caseCount) ||
    caseCount < MIN_CASE_COUNT ||
    caseCount > MAX_CASE_COUNT
  ) {
    errors.caseCount = `Number of cases must be between ${MIN_CASE_COUNT} and ${MAX_CASE_COUNT}.`;
  }


  return Object.keys(errors).length === 0 ? ok() : fail(errors);
};

export const validateAll = (config = {}) => {
  const perStep = {
    process: validateProcess(config.process),
    agents: validateAgents(config.agents),
    attributes: validateAttributes(config.attributes),
    simulation: validateSimulation(config.simulation),
  };
  const valid = Object.values(perStep).every((s) => s.valid);
  return { valid, perStep };
};
