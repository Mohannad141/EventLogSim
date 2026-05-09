import { Link } from 'react-router-dom';
import Button from '../components/primitives/Button.jsx';

const HomePage = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          EventLogSim
        </h1>
        <p className="text-lg text-gray-600">
          Generate synthetic event logs using LLM agents.
        </p>
      </div>

      <p className="max-w-2xl text-sm leading-6 text-gray-700">
        EventLogSim helps researchers configure LLM-based agents, run
        simulations of business processes, and explore the resulting event
        logs. Use it to prototype process scenarios, evaluate agent behavior,
        and produce datasets for downstream process-mining experiments.
      </p>

      <div>
        <Link to="/configuration">
          <Button size="lg">Start Configuration</Button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
