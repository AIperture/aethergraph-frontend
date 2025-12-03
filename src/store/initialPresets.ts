import type { AppPreset } from "../lib/types";

export const initialPresets: AppPreset[] = [
    // --- Core / basic demos ---

    {
        id: "chat_with_memory_demo",
        name: "Chat with Memory",
        badge: "Channel",
        shortDescription:
            "Interactive chat agent that remembers prior sessions and summarizes the conversation.",
        longDescription:
            "This preset demonstrates AetherGraph’s built-in memory + channel services. It seeds a few prior chat turns, then runs an interactive chat agent, and finally summarizes the session into an artifact.",
        graphId: "chat_with_memory_demo",
        category: "Core",
        status: "available",
        iconKey: "chat",
        features: [
            "Seeds prior chat turns so the agent can recall past context on first run.",
            "Streams an interactive chat loop over the Channel service.",
            "Logs every turn into Memory for later inspection and analysis.",
            "Generates an LLM-based session summary and saves it as an artifact.",
        ],
        demoSteps: [
            "Click \"Configure & Start\" to launch a new run.",
            "Open the Channel panel and chat with the agent as you normally would.",
            "Ask questions like \"What have we talked about so far?\" to test memory.",
            "After the session ends, open the Artifacts tab to view the saved summary, and the Memory tab to inspect stored chat turns.",
        ],
    },

    {
        id: "channel_wizard",
        name: "Channel Wizard",
        badge: "Core",
        shortDescription:
            "Interactive experiment setup wizard using channels, approvals, and validation.",
        longDescription:
            "A guided experiment setup flow powered entirely by AetherGraph’s channel service. The wizard asks for basic and advanced options, validates inputs, uses approval-style prompts, and then saves the final configuration as an artifact.",
        graphId: "channel_wizard",
        category: "Core",
        status: "available",
        iconKey: "chat",
        features: [
            "Fully channel-driven wizard flow (ask_text + ask_approval).",
            "Validates user input and allows restarting safely.",
            "Saves the final configuration as a reusable artifact.",
        ],
        demoSteps: [
            "Click “Configure & Start” to launch a new run.",
            "Open the Channel panel and answer the wizard’s questions.",
            "Toggle advanced mode and play with learning rate / debug flags.",
            "After completion, open the Artifacts tab to inspect the saved config.",
        ],
    },

    {
        id: "toy_optimization_loop",
        name: "Toy Optimization Loop",
        badge: "Artifacts",
        shortDescription:
            "Simple iterative optimizer with metrics and artifacts over a toy objective.",
        longDescription:
            "Runs a lightweight optimization loop over a toy function, logging metrics and artifacts at each step. Great to showcase iterative graphs and artifact tracking without heavy simulation.",
        graphId: "toy_optimization_loop",     // placeholder graph_id
        category: "Core",
        status: "available",                // you’ll flip this once implemented
        iconKey: "sparkles",
        features: [
            "Iterative optimization loop with per-step metrics and gradient updates.",
            "Saves checkpoints and final parameters as artifacts, including loss metrics.",
            "Uses an LLM to summarize the optimization trajectory into a human-readable report.",
            "Optionally generates a loss-vs-step plot and saves it as an artifact for visualization.",
        ],
        demoSteps: [
            "Click \"Configure & Start\" to launch the toy optimization run.",
            "Open the Channel panel to watch the optimization progress messages.",
            "After completion, open the Artifacts tab to inspect checkpoints, final parameters, metrics, and the loss plot.",
            "Optionally open the Memory tab to see logged optimization_step events for each iteration.",
        ],
    },
    {
        id: "simple_copilot",
        name: "Simple Copilot",
        badge: "LLM",
        shortDescription:
            "A small copilot that routes queries between calculator, summarizer, and direct LLM answers.",
        longDescription:
            "This preset demonstrates a routing-based copilot. Each user message is classified by an LLM into calculator, summarize, or direct answer mode, and the decision is logged to memory. It’s a minimal pattern for building richer copilots that orchestrate multiple tools.",
        graphId: "simple_copilot",
        category: "Core",
        status: "available",
        iconKey: "sparkles",
        features: [
            "LLM-based router that classifies each query into calculator, summarize, or direct_answer modes.",
            "Calculator tool evaluates simple arithmetic expressions in a sandboxed way.",
            "Summarizer tool uses the LLM to compress longer text into a short summary.",
            "Direct answer mode uses the LLM as a normal chat assistant, with routing decisions recorded in Memory.",
        ],
        demoSteps: [
            "Click \"Configure & Start\" to launch the copilot.",
            "Open the Channel panel and ask a few normal questions to see direct answer mode.",
            "Ask a math question like \"What is (10 - 3) * 4?\" to trigger calculator mode.",
            "Paste a longer paragraph and ask for a summary to trigger summarizer mode.",
            "Open the Memory tab and look for copilot_routing events to see how queries were classified.",
        ],
    },
    {
        id: "toy_concurrency_demo",
        name: "Toy Concurrency Demo",
        badge: "Concurrency",
        shortDescription:
            "Map–reduce style graph that fans out work in parallel and reduces the results.",
        longDescription:
            "This preset demonstrates how AetherGraph runs nodes concurrently using max_concurrency. The graph fans out through pick() and work() nodes, processes items in parallel, then fans back in with a reduce_sum() node. You don’t change the graph to toggle parallelism—just adjust max_concurrency on the run.",
        graphId: "toy_concurrency_demo", // matches @graphify(name="toy_concurrency_demo")
        category: "Core",
        status: "available",
        iconKey: "bolt",
        features: [
            "Static map–reduce style graph built from small tool nodes.",
            "Fan-out across multiple pick and work nodes to process items in parallel.",
            "Fan-in through a single reduce_sum node to aggregate results.",
            "Concurrency is controlled at run time via max_concurrency without changing the graph definition.",
        ],
        demoSteps: [
            "Click \"Configure & Start\" to launch the concurrency demo.",
            "In the Run Workspace, watch how multiple worker nodes execute concurrently.",
            "Inspect the node logs to see overlapping pick() and work() activity.",
            "Rerun this preset later with different max_concurrency settings (e.g. 1 vs 5) to compare sequential vs parallel behavior.",
        ],
    },

    {
        id: "job_monitor_demo",
        name: "Mock Job Monitor",
        badge: "Infra",
        shortDescription:
            "Fake long-running jobs with status polling and log artifacts.",
        longDescription:
            "Simulates a batch/job system using sleep + fake statuses. AetherGraph orchestrates job submission, polling, and result collection, while exporting logs as artifacts.",
        graphId: "job_monitor_demo",          // placeholder graph_id
        category: "Infra",
        status: "coming-soon",
        iconKey: "cpu",
    },

    // --- R&D / advanced demos ---

    {
        id: "rnd_orchestrator",
        name: "R&D Orchestrator",
        badge: "Preset",
        shortDescription:
            "Coordinate multi-step simulation + analysis workflows with resumable runs.",
        longDescription:
            "Demonstrates how AetherGraph orchestrates a multi-stage R&D pipeline: ingest config, launch simulations, track runs, and summarize results with LLM-backed analysis.",
        graphId: "rnd_orchestrator",
        category: "R&D Lab",
        status: "available",
        iconKey: "microscope",
    },
    {
        id: "metalens_design",
        name: "Metalens Design Loop",
        badge: "Optics",
        shortDescription:
            "Spec → meta-atoms → surrogate model → lens → image analysis.",
        longDescription:
            "Designed for optics-focused demos. Walks through a simplified metalens pipeline, from specification to final image quality metrics, with resumable stages and artifact tracking.",
        graphId: "metalens_design",
        category: "R&D Lab",
        status: "coming-soon",               // demo / replay mode later
        iconKey: "aperture",
    },
    {
        id: "game_agent_loop",
        name: "Game Agent Loop",
        badge: "Experimental",
        shortDescription:
            "Env simulation → agent reaction → user feedback → agent refinement.",
        longDescription:
            "An experimental loop for game/NPC behavior, stitching together environment ticks, agent decisions, and user feedback as a single orchestrated run.",
        graphId: "game_agent_loop",
        category: "Experimental",
        status: "coming-soon",
        iconKey: "gamepad",
    },
];
