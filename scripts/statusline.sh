#!/usr/bin/env bash
# Statusline for Claude Code — inspired by Trail of Bits
# Shows: model, branch, context %, cost, time, cache hit

# Git branch
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no-git")

# Context usage (from environment if available)
context_pct="${CLAUDE_CONTEXT_USAGE:-?}"

# Cost tracking
cost="${CLAUDE_SESSION_COST:-$0.00}"

# Session duration
if [ -n "$CLAUDE_SESSION_START" ]; then
    now=$(date +%s)
    elapsed=$((now - CLAUDE_SESSION_START))
    mins=$((elapsed / 60))
    duration="${mins}m"
else
    duration="--"
fi

echo "branch:${branch} | ctx:${context_pct}% | cost:${cost} | ${duration}"
