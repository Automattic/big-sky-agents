/**
 * WordPress dependencies
 */
import {
  BaseControl,
  Button,
  SelectControl,
  __experimentalVStack as VStack,
  __experimentalHStack as HStack,
} from "@wordpress/components";

const RunningIndicator = ({ running, enabled }) => {
  return (
    <span
      style={{
        paddingLeft: 8,
        opacity: enabled ? 1 : 0.5,
      }}
    >
      {running ? "🧠" : "💤"}
    </span>
  );
};

const AgentControls = ({ agent, toolkit, chat }) => {
  const { onReset: onResetChat, running, enabled, setEnabled, error } = chat;

  const {
    onReset: onResetToolkit,
    values: { agents, agentId, agentGoal },
    callbacks: { setAgent, setAgentGoal },
  } = toolkit;

  return (
    <div className="big-sky__agent-controls">
      <VStack>
        <BaseControl id={"status-control"} label="Status" labelPosition="side">
          <span className="big-sky__agent-running-indicator">
            <Button
              variant="secondary"
              size="small"
              style={{
                backgroundColor: enabled ? "#bbffbb" : "#ffbbbb",
                color: enabled ? "#000" : "#ff0000",
              }}
              onClick={() => setEnabled(!enabled)}
            >
              {enabled ? "Enabled" : "Disabled"}
            </Button>
            <RunningIndicator running={running} enabled={enabled} />
          </span>
        </BaseControl>
        <BaseControl id={"goal-control"} label="Goal" labelPosition="side">
          <span className="big-sky__goal-indicator">
            {agentGoal ?? "None"}
            {agentGoal && (
              <Button
                size="small"
                onClick={() => {
                  onResetChat();
                  onResetToolkit();
                  setAgentGoal({ goal: null });
                }}
              >
                Reset
              </Button>
            )}
          </span>
        </BaseControl>
        <SelectControl
          label="Agent"
          labelPosition="side"
          value={agentId}
          options={agents.map((anAgent) => {
            return {
              label: anAgent.name,
              value: anAgent.id,
            };
          })}
          onChange={(newAgentId) => {
            onResetChat();
            onResetToolkit();
            setAgent({ agentId: newAgentId });
          }}
        />
        <HStack align="center">
          <Button
            style={{ width: "100%" }}
            variant="primary"
            onClick={() => agent.onStart()}
          >
            Start
          </Button>
          <Button
            style={{ width: "100%" }}
            variant="secondary"
            onClick={() => onResetChat()}
          >
            Reset Chat
          </Button>
		  <Button
            style={{ width: "100%" }}
            variant="secondary"
            onClick={() => onResetToolkit()}
          >
            Reset Toolkit
          </Button>
        </HStack>
      </VStack>
    </div>
  );
};

export default AgentControls;
