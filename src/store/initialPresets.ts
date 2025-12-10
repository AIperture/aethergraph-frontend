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
        githubUrl: "https://github.com/AIperture/aethergraph-examples/blob/main/demo_examples/1_chat_with_memory.py"
    },

    {
        id: "channel_wizard",
        name: "Channel Wizard",
        badge: "Channel",
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
        githubUrl: "https://github.com/AIperture/aethergraph-examples/blob/main/demo_examples/2_channel_wizard_interactive_workflow.py"
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
        githubUrl: "https://github.com/AIperture/aethergraph-examples/blob/main/demo_examples/5_simple_copilot_tool_using_router.py"
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
        githubUrl: "https://github.com/AIperture/aethergraph-examples/blob/main/method_showcase/7_concurrency/1_graphify_concurrency.py"
    },
    {
        id: "viz_demo_complete",
        name: "Vis Demo",
        badge: "Viz",
        shortDescription:
            "Interactive visualization tool for exploring complex data.",
        longDescription:
            "This preset demonstrates AetherGraph’s visualization capabilities. It allows users to explore and interact with complex data through a visual interface.",
        graphId: "viz_demo_complete",
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
        githubUrl: "https://github.com/AIperture/aethergraph-examples/blob/main/demo_examples/1_chat_with_memory.py"
    },
    {
        id: "mock_job_monitor",
        name: "Mock Job Monitor",
        badge: "Infra",
        shortDescription:
            "Simulated HPC/job queue monitor that shows how AetherGraph tracks long-running jobs.",
        longDescription:
            "This preset uses a fake job backend to demonstrate how AetherGraph can submit, poll, and track long-running jobs. It focuses on the orchestration layer: queued → running → failed/succeeded, with channel-driven Retry/Abort decisions and error artifacts, without needing a real cluster.",
        graphId: "mock_job_monitor",
        category: "Infra",
        status: "available",
        iconKey: "server",
        features: [
            "Demonstrates job submission, status polling, and completion handling via a JobManagerService.",
            "Simulates failures and lets you choose Retry or Abort through the Channel panel.",
            "Automatically saves error reports as artifacts when jobs fail (no URIs exposed in chat).",
            "Provides a drop-in template for wiring AetherGraph into real batch or HPC job systems.",
        ],
        demoSteps: [
            "Click \"Configure & Start\" to launch the mock job monitor.",
            "Open the Channel panel to watch the job being submitted and polled over time.",
            "When the job fails, use the Channel buttons to choose Retry or Abort.",
            "After failure, open the Artifacts tab to inspect the saved error report for the job.",
        ],
        githubUrl: "https://github.com/AIperture/aethergraph-examples/blob/main/pattern_examples/1_state_resumption/2_long_job_monitor.py",
    },


    {
        id: "resume_long_job_demo",
        name: "Resume Long Job Demo",
        badge: "Infra",
        shortDescription:
            "Shows how a single node can checkpoint and resume after crashes or restarts.",
        longDescription:
            "This preset demonstrates node-level checkpointing. The fast node recomputes quickly, while the slow node writes periodic checkpoints under Artifacts. If the process crashes or is canceled in the mid-run, restarting with the same run_id resumes the slow node from its last checkpoint instead of starting over.",
        graphId: "resume_long_job_demo",
        category: "Infra",
        status: "available",
        iconKey: "rotate-ccw", // or any icon you pick
        features: [
            "Node-level checkpointing using run_id + node_id to persist state.",
            "Resumes the slow node from its last checkpoint after a crash or restart.",
            "Demonstrates that cheap nodes can be recomputed while expensive ones resume.",
            "Integrates with the Channel panel to show progress and checkpoints.",
        ],
        demoSteps: [
            "Start a run and open the Channel panel to watch checkpoints being written.",
            "Optionally cancel the run while it's in progress.",
            "Restart the same run and see the slow node resume from its checkpoint.",
            "Inspect the Artifacts tab to understand how node-level state is persisted.",
        ],
        githubUrl: "https://github.com/AIperture/aethergraph-examples/blob/main/demo_examples/6_crash_resume_static_graph.py",
    },



    // --- R&D / advanced demos ---
    // Toy Optimization Loop
    {
        id: "toy_optimization_loop",
        name: "Toy Optimization Loop",
        badge: "R&D",
        shortDescription:
            "Simple iterative optimizer with metrics and artifacts over a toy objective.",
        longDescription:
            "Runs a lightweight optimization loop over a toy function, logging metrics and artifacts at each step. Great to showcase iterative graphs and artifact tracking without heavy simulation.",
        graphId: "toy_optimization_loop",     // placeholder graph_id
        category: "R&D Lab",
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
        githubUrl: "https://github.com/AIperture/aethergraph-examples/blob/main/demo_examples/3_optimization_loop_with_artifacts.py"
    },

    // Surrogate Modeling
    {
        id: "surrogate_modeling_pipeline",
        name: "Surrogate Modeling Pipeline",
        badge: "R&D",
        shortDescription:
            "Template of an automated end-to-end pipeline for training a surrogate model on simulation data with AI choosing the best model.",
        longDescription:
            "Planned preset: a full surrogate modeling pipeline that ingests simulation data, trains a regression or Gaussian process model, evaluates error, and exports a reusable model artifact. This is not enabled in the hosted demo because it typically requires heavier compute and simulation infrastructure, but it illustrates how AetherGraph can orchestrate real-world modeling workflows.",
        graphId: "surrogate_modeling_pipeline",
        category: "R&D Lab",
        status: "coming-soon",
        iconKey: "line-chart",
        features: [
            "Ingest raw simulation results and normalize/clean them.",
            "Train a surrogate model (e.g., regression, GP, or neural net) with tracked metrics.",
            "Evaluate model accuracy and save the trained model as an artifact.",
            "Designed to sit in front of heavier simulation backends or data lakes.",
        ],
        demoSteps: [
            "This preset is not available in the hosted demo due to compute and hosting constraints.",
            "In the full version, you would connect it to your simulation data store and run the pipeline locally or on your own infrastructure.",
        ],
    },

    // Generative Design
    {
        id: "generative_design_loop",
        name: "Generative Design Loop",
        badge: "R&D",
        shortDescription:
            "Demo of high-throughput RL/gradient-based loop that proposes new designs, evaluates them, and iterates.",
        longDescription:
            "Planned preset: a generative design loop that proposes new designs, evaluates them via simulation or scoring functions, and updates its policy or search strategy. Think Bayesian optimization or RL over design parameters, orchestrated as a reusable AetherGraph workflow. Disabled in the hosted demo because the evaluation steps are typically expensive to run online.",
        graphId: "generative_design_loop",
        category: "R&D Lab",
        status: "coming-soon",
        iconKey: "repeat",
        features: [
            "Generates candidate designs from a search or policy model.",
            "Evaluates candidates using simulation or surrogate models.",
            "Updates search strategy based on observed performance.",
            "Intended to plug into real simulation engines or HPC clusters.",
        ],
        demoSteps: [
            "This preset is a placeholder and is not executed in the hosted demo.",
            "Use it as a conceptual example of how AetherGraph can orchestrate generative design loops across simulations and models.",
        ],
    },

    // Simple Optical Design
    {
        id: "simple_optical_design",
        name: "Simple Optical Design",
        badge: "Optics",
        shortDescription:
            "Toy optical design flow from spec → design parameters → evaluation with feedback loops from human.",
        longDescription:
            "Planned preset: a simplified optical design workflow that goes from high-level spec to a toy lens or element, then evaluates basic metrics (e.g., PSF, MTF, or spot size). The real version would integrate with ray-tracing or wave-optics solvers, which are too heavy to host for a public demo, but this shows how an optics workflow fits into the AetherGraph model.",
        graphId: "simple_optical_design",
        category: "R&D Lab",
        status: "coming-soon",
        iconKey: "aperture",
        features: [
            "Captures optical specifications as structured inputs and artifacts.",
            "Runs a design step to propose candidate geometries or parameters.",
            "Evaluates basic image or field quality metrics.",
            "Designed to interface with real optical solvers in a local or on-prem setup.",
        ],
        demoSteps: [
            "This preset is a placeholder and cannot be run in the hosted environment.",
            "In a full environment, it would talk to your optical solvers and store design and evaluation artifacts per run.",
        ],
    },

    // Inverse Design Template
    {
        id: "inverse_design_template",
        name: "Inverse Design Template",
        badge: "R&D",
        shortDescription:
            "Template for inverse design workflows using differentiable or black-box solvers with auto-selection of termina",
        longDescription:
            "Planned preset: a generic inverse design template for physics problems (optics, materials, etc.). It connects a forward simulator, an optimizer (gradient-based or Bayesian), and artifact/memory tracking, so you can search over design parameters to meet target specs. Not enabled in this demo due to solver/compute requirements, but intended as a reusable pattern.",
        graphId: "inverse_design_template",
        category: "R&D Lab",
        status: "coming-soon",
        iconKey: "target",
        features: [
            "Abstracts the pattern of forward simulation + optimization + checkpointing.",
            "Supports both differentiable and black-box optimization loops.",
            "Tracks design candidates, objective metrics, and best-so-far solutions as artifacts.",
            "Meant to be specialized per domain (optics, RF, structures, etc.).",
        ],
        demoSteps: [
            "This preset is not active in the hosted demo; it represents a template for future inverse-design workflows.",
            "Clone the repo and adapt this pattern locally to your own simulator and optimizer stack.",
        ],
    },

    // Interactive Data Analyzer
    {
        id: "interactive_data_analyzer",
        name: "Interactive Data Analyzer",
        badge: "R&D",
        shortDescription:
            "Conversational interface for exploring experiment or simulation data with AI.",
        longDescription:
            "Planned preset: an interactive data analysis app that lets you upload datasets, run quick statistics, generate plots, and ask natural-language questions about your results. Under the hood, it combines AetherGraph’s artifact management, LLM tools, and plotting utilities. Not enabled in the hosted demo to keep storage and compute costs manageable.",
        graphId: "interactive_data_analyzer",
        category: "R&D Lab",
        status: "coming-soon",
        iconKey: "bar-chart-2",
        features: [
            "Loads and indexes experiment or simulation datasets as artifacts.",
            "Provides built-in tools for quick stats, plots, and aggregations.",
            "Uses LLM tools to answer questions and suggest follow-up analyses.",
            "Bridges raw files, structured tables, plots, and chat in a single workflow.",
        ],
        demoSteps: [
            "This preset is a conceptual placeholder and is not available in the hosted demo.",
            "In a full setup, you would upload your own data and explore it conversationally, with plots and summaries generated by the graph.",
        ],
    },


    // 1) Research Companion
    {
        id: "research_companion",
        name: "Research Companion",
        badge: "Companion",
        shortDescription:
            "Long-lived assistant that tracks ideas, TODOs, and experiments across sessions.",
        longDescription:
            "Planned preset: a research companion that remembers your questions, ideas, and experiment notes over time. It uses AetherGraph’s memory, artifacts, and channels to stitch together multiple sessions into a persistent workspace. Not enabled in the hosted demo yet, but representative of the “agent-as-OS” direction for individual researchers and builders.",
        graphId: "research_companion",
        category: "Productivity",
        status: "coming-soon",
        iconKey: "brain",
        features: [
            "Stores research questions, hypotheses, and notes as memory and artifacts across sessions.",
            "Surfaces past context automatically when you revisit a topic or project.",
            "Tracks simple TODOs and follow-ups linked to runs or documents.",
            "Acts as a long-lived workspace agent rather than a single ephemeral chat.",
        ],
        demoSteps: [
            "This preset is not active in the hosted demo; it represents a longer-lived, stateful agent.",
            "In a full deployment, you would use it as your persistent research/work OS, revisiting it across days or weeks.",
        ],
    },

    // 2) Paper Tracker
    {
        id: "paper_tracker",
        name: "Paper Tracker",
        badge: "Productivity",
        shortDescription:
            "Tracks papers you read, summaries, and follow-up actions in a structured workflow.",
        longDescription:
            "Planned preset: a paper tracking workflow that ingests PDFs or links, summarizes papers, extracts key points, and tracks follow-up tasks (experiments, citations, code to try). It uses AetherGraph to orchestrate ingestion, summarization, tagging, and memory. Not enabled in this demo to keep storage and hosting light, but illustrates a high-leverage cross-domain reading workflow.",
        graphId: "paper_tracker",
        category: "Productivity",
        status: "coming-soon",
        iconKey: "book-open",
        features: [
            "Ingests and summarizes new papers or articles into concise, structured notes.",
            "Tags papers by topic, project, and priority for later retrieval.",
            "Tracks TODOs and follow-up actions linked to each paper or article.",
            "Combines artifacts, memory, and channels into a single reading + follow-up workflow.",
        ],
        demoSteps: [
            "This preset is a placeholder and not available in the hosted demo.",
            "In a full setup, you would connect it to your PDF folder or reference manager and let AetherGraph automate summaries and tracking.",
        ],
    },

    // 3) Project Proposal Sketcher
    {
        id: "project_proposal_sketcher",
        name: "Project Proposal Sketcher",
        badge: "Productivity",
        shortDescription:
            "Turns existing data, notes, and runs into structured project or grant proposals.",
        longDescription:
            "Planned preset: a proposal sketcher that looks at your existing artifacts (plots, CSVs, reports) and notes, then drafts structured project briefs, grant proposals, or internal design docs. It showcases how AetherGraph can tie together data, memory, and LLM tools to produce narrative documents grounded in real results. Not enabled in the hosted demo, since it assumes you bring your own data/artifacts.",
        graphId: "project_proposal_sketcher",
        category: "Productivity",
        status: "coming-soon",
        iconKey: "file-pen",
        features: [
            "Scans existing artifacts (metrics, plots, reports) and notes for a chosen project.",
            "Builds a structured outline: background, objectives, methods, results, and next steps.",
            "Uses LLM tools to draft readable project briefs or proposal sections from that outline.",
            "Saves drafts as artifacts you can refine in your normal writing tools.",
        ],
        demoSteps: [
            "This preset is a conceptual placeholder and is not executable in the hosted demo.",
            "In a full environment, you would point it at your workspace artifacts and let it draft project briefs or proposals as a starting point.",
        ],
    },


];
