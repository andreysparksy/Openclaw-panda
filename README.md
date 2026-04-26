# Openclaw Panda

Agent for detecting repeated owner-dependent context in conversations.

## Goal

Track conversation context across chats and topics, identify repeated patterns tied to a specific person, and send focused alerts when the same dependency pattern repeats.

## MVP

The first version should:
- ingest messages from selected chats/topics
- detect whether a message context is tied to the owner
- classify the dependency pattern
- cluster similar contexts
- count repetitions in a time window
- send an alert when a pattern repeats more than 3 times

## Repository structure

- `docs/` — architecture, roadmap, product notes
- `backend/` — ingestion, analysis, clustering, alerts
- `frontend/` — future dashboard
- `infra/` — deployment and environment config

## Initial focus

Build the backend pipeline first:
- message intake
- owner-context classification
- repeat detection
- alert routing
