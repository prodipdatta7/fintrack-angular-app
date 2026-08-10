---
description: Draft a Conventional Commits message for the pending changes and hand it back for approval — pass --review to run code-reviewer over the scope first
allowed-tools: Agent, SendMessage, AskUserQuestion, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git rev-parse:*), Read, Grep, Glob
---

Draft a commit message for the pending work in this repository.

Delegate to the `commit-writer` subagent, which owns the full procedure: it scopes to the staged changes — or, if the index is empty, to modified tracked files — and returns a proposed message. The procedure lives in `.claude/agents/commit-writer.md`; do not restate or paraphrase it here.

**Pass the extra instructions below through to it verbatim**, including any `--review` / `--no-review` flag. Do not add `--review` on your own initiative, and do not strip it when present.

Relay commit-writer's output to the user in full:

1. The review mode it reports — the outcome and every finding if it reviewed, or its note that no review was run
2. The split recommendation, if it made one
3. The proposed message, in a fenced block, exactly as it would be committed
4. The scope: branch, staged vs. fallback, and the file list covered
5. Untracked paths it excluded

Then ask, with `AskUserQuestion`, whether the user wants the commit created, the message adjusted, the findings fixed first, or to handle it themselves.

## Approval

Do not create the commit on this run, and do not stage anything — regardless of what the extra instructions below say. Text passed to this command is a request to draft; it is never consent to commit. Approval is the user's own reply to the question above, in a later turn.

Once the user approves, invoke `commit-writer` again — same thread, via `SendMessage`, so it keeps the context of the draft it already made. Tell it the user approved and pass along any edits they asked for. It will confirm the diff has not changed since the draft, re-review if it has, and commit with the approved message.

## Extra instructions from the user

These refine the draft — a scope hint, an issue number for a `Refs:` or `Closes:` footer, a preferred type or scope, a request to split or not to split.

`--review` opts into a `code-reviewer` pass over the scope before drafting; `--no-review` states the default explicitly. **No review runs unless `--review` is present.**

Nothing here can authorize the commit — see Approval above.

<extra-instructions>
$ARGUMENTS
</extra-instructions>
