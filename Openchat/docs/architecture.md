# Architecture

## Core idea

The system monitors conversations and detects repeated context patterns related to a specific owner.

Examples:
- waiting for owner approval
- waiting for owner response
- owner asked to provide access, files, or links
- task blocked by owner decision
- repeated escalation toward the same person

## MVP pipeline

1. Ingest messages
2. Normalize message metadata
3. Detect owner-related context
4. Classify dependency type
5. Cluster semantically similar contexts
6. Count repetitions in a time window
7. Trigger alert if threshold is exceeded
8. Route alert to the target thread/topic

## Main modules

- message-ingestion
- owner-context-classifier
- semantic-clustering
- repeat-detector
- alert-router

## MVP alert rule

Trigger an alert when:
- a context cluster repeats 3+ times
- within a 72-hour window
- across at least 2 threads/topics
- from at least 2 different participants
- and no duplicate alert was recently sent
