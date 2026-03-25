# Multi-Model Adversarial Analysis System

Home Assistant automation for managing adversarial analysis between multiple LLM models with automated relay, drift detection, and debate quality tracking.

## What This Is

A Home Assistant-based tool for conducting structured adversarial analysis between Claude (Anthropic) and ChatGPT (OpenAI). The system automates message relay, tracks debate state, detects scope drift and argument loops, and provides signals for when debates have exhausted productive ground.

## The Problem

Conducting adversarial analysis between multiple AI models manually creates significant cognitive overhead. You must maintain continuous attention during async waiting periods, detect when models drift from the original question, identify when arguments start looping, interpret complex positions while managing relay mechanics, and recognize when debate quality degrades to the point where continuation provides diminishing returns.

Manual relay requires copying every message between models, tracking what's been established versus contested, maintaining debate structure across extended exchanges, and catching drift through constant vigilance. The start-stop rhythm of waiting for model responses fragments attention and makes it difficult to maintain focus on debate substance.

## How It Works

The system operates as a Home Assistant automation using official Anthropic and OpenAI APIs. The user triggers execution with a defined scope and round count. The automation sends prompts to both models sequentially, captures and analyzes responses for drift and loops, maintains persistent debate state, and presents results with analytical overlay at completion. The user remains the mandatory decision point between batches of rounds.

Architecture maintains user as hub with models never communicating directly. Communication flow is always User → Model A → User → Model B → User, never Model A ↔ Model B. Models only see responses from the other if the user explicitly includes them in prompts. The system executes bounded deterministic workflows defined by the user with no autonomous continuation or task generation.

## ToS Compliance

This architecture is designed to comply with both Anthropic and OpenAI terms of service. Both providers offer official Home Assistant integrations designed for automated workflows. The prohibition targets autonomous agent loops where models communicate without human control, not workflow automation with user oversight.

The system uses official APIs with proper authentication, maintains the user as mandatory intermediary between models, executes bounded deterministic workflows with explicit user triggers, includes no autonomous agent behavior or self-extension, and maintains responsible usage patterns with rate limiting and error handling.

This follows the same permitted architectural pattern as existing HA automations like camera analysis workflows where sensor triggers invoke API calls, AI analyzes content, results return to user, and user decides next action.

## Use Cases

Code scrutiny, refactoring, and creation with adversarial review. Testing plans and ideas for loopholes, edge cases, brittleness, and suboptimal approaches. Using AI-level debate capability to challenge model positions and arguments. Drafting, reviewing, and comparing different versions of formal documents including meeting minutes and reports.

## Technical Requirements

Home Assistant instance with API access to both Anthropic and OpenAI services. Official integration configurations for both providers. Storage for persistent debate state and transcripts. Python environment for analytical components if implementing advanced drift detection and loop identification features.

## Current Status

Project in initial planning and architecture phase. Core relay and single-round execution to be implemented first, followed by multi-round bounded execution, then advanced analytical features including drift detection, loop identification, scope tracking, and termination quality assessment.

## Implementation Philosophy

This project operates with an F1 approach to regulation: work right up to the letter of rules without crossing them. Understand what behavior rules target and ensure implementation doesn't exhibit those patterns while maximizing effectiveness within allowed bounds. The architecture is designed to be defensible if questioned while providing maximum utility for legitimate analytical work.

## Documentation

See the context document and project plan in the repository for comprehensive implementation details, problem definition, requirements specification, and development roadmap.

## License

TBD