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
    },

    {
        id: "channel_wizard", // route + logical app id
        name: "Channel Wizard",
        badge: "Channel",
        shortDescription:
            "Interactive experiment setup wizard using channels, approvals, and validation.",
        longDescription:
            "A guided experiment setup flow powered entirely by AetherGraph’s channel service. The wizard asks for basic and advanced options, validates inputs, uses approval-style prompts, and then saves the final configuration as an artifact. Great for showcasing send_text, ask_text, and ask_approval all in one place.",
        graphId: "channel_wizard",        // matches @graphify(name="channel_wizard")
        category: "Core",                 // shows up under Core examples
        status: "available",              // fully wired and runnable
        iconKey: "chat",                  // will render with the chat/message icon in the gallery
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
