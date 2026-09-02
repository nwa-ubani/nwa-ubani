---
name: facebook-video-agent
description: Manage the Next Level Education Facebook storytelling-video automation - a Make.com pipeline that writes a short Nigerian-scene story, turns it into a narrated video with Azure text-to-speech and a custom render service, posts it to the Next Level Education Facebook Page, and comments the Miva Open University affiliate link underneath. Use this skill whenever the user asks about their Facebook video posts, the Next Level Education page, the Miva affiliate pipeline, why a scheduled video didn't post, wants a fresh video generated right now, wants to change the story style or the affiliate link, or wants to check how the affiliate link is performing. Trigger on mentions of "Next Level Education", "Miva", the video posting automation, or the Make.com scenario for Facebook videos, even if the user doesn't name the skill directly.
---

# Facebook storytelling video agent

This skill turns Claude into the operator of an existing automation, not the thing generating video frame-by-frame. The actual rendering and posting happens inside a Make.com scenario; Claude's job is to write good stories, keep the pipeline healthy, run it on demand, and report what happened in plain language. Use the Make MCP tools (`mcp__Make__*`) for everything here - load their schemas with `ToolSearch` if they're not already loaded.

## The system, in one paragraph

Every 8 hours, a Make.com scenario asks Gemini to write a short, spoken-cadence story set in a concrete Nigerian scene (Lagos traffic, a market stall, a generator cutting out) that lands softly on Miva Open University. It converts the narration to speech with Azure's Nigerian-English voice, uploads that audio to Google Drive just long enough to give it a public URL, merges it onto a matching pre-recorded background clip via the user's own render microservice, uploads the result as a video post to the **Next Level Education** Facebook Page, waits, then comments a disclosed line with the affiliate registration link underneath the post.

## Why this architecture, not a paid video-generation API

An earlier version of this skill used JSON2Video (narration + rendering in one call, no Google Drive needed) because it was simpler to build and debug. The user's budget for this pipeline is about ₦20,000/month (roughly $13), and JSON2Video's cheapest non-annual plan is $49/month, well over budget for a page posting 90 videos a month. Azure's free tier (F0) comfortably covers this volume (90 videos/month at ~20-30 seconds each is roughly 30-45 minutes of audio, far under Azure's free monthly allowance) at $0, so the pipeline was moved back to the original Azure + Google Drive + custom-render-service design. It has more moving parts and more ways to break than the JSON2Video version did, but it's free at this volume - don't propose switching back to a metered per-second video API as "simpler" without checking in on cost first, since cost is exactly why this design exists.

## Key identifiers (don't re-discover these, just use them)

| Thing | Value |
|---|---|
| Make.com team | `825847` ("My Team", org "My Organization") |
| Live scenario | **`9749179`** - "Next Level Education - Storytelling Video Agent (Claude)" |
| Old, retired scenario | `9559489` - "Next Level Education - Full Video Pipeline (NEW)". Leave this one off. It's the first draft of this same Azure-based idea, kept only for reference - it has no disclosure line and a shorter, less reliable comment delay. |
| Facebook Page | Next Level Education (Lagos), page id `483996708139472` |
| Facebook connection | `14420987` ("Next Level Education - Publish Video") |
| Gemini connection (writes the story) | `13470580` |
| Google Drive connection (hosts the narration audio so the render service can fetch it) | `13537121`, labeled "My Google Restricted connection" |
| Azure Speech key | Stored as plain text in the scenario's HTTP module headers (flow ids `3` and `4`), not a proper Make connection - see the "Azure key" section below. Never write the actual key value into this repo. |
| Affiliate destination | `https://miva.edu.ng/?ref=mivafaith5399` |
| Public-facing affiliate link (Bitly, click-tracked) | `https://bit.ly/4ieoiFr` |
| Video-merge microservice (the user's own render service) | `https://nle-video-merger.onrender.com` |
| Full blueprint of the live scenario | `references/scenario-blueprint.json` in this skill |

Fetch the live scenario any time with `mcp__Make__scenarios_get` (scenarioId `9749179`) rather than trusting a cached copy if it's been a while - the user or a past session may have edited it since.

## The Azure key: current status and what to do about it

As of the last check, the scenario's Azure key was rejected with `PermissionDenied` - it needs to be replaced before the pipeline can run at all. Claude cannot get a new key (that needs the user's Azure login), and for security should not ask the user to paste a raw API key into chat either. Instead:

1. Tell the user to get a fresh key from the Azure Portal (Cognitive Services / Speech resource - the free F0 tier is enough at this volume) and to double check the resource's **region** matches the one this pipeline calls (`southafricanorth` in the URLs below - a mismatched region also produces `PermissionDenied` on Azure Speech).
2. Tell them to open scenario `9749179` in Make.com's scenario editor, open the module named after `https://southafricanorth.api.cognitive.microsoft.com/sts/v1.0/issueToken` (flow id `3`), and paste the new key into the `Ocp-Apim-Subscription-Key` header value field there directly - not through Claude.
3. Once they confirm it's updated, Claude should activate the scenario (`mcp__Make__scenarios_activate`) and run it once (`mcp__Make__scenarios_run` with `responsive: true`) to confirm the fix before leaving it on the 8-hour schedule.

Until that key is replaced, the scenario is intentionally left **inactive** - don't activate it against a placeholder key.

## Why there's a disclosure line, and why it must stay

The story generation prompt tells the AI never to put the raw link or a disclosure line in the caption itself - readers are told the link is "in the comments" instead. The disclosure lives in the **comment**, worded as "Register here (affiliate link): https://bit.ly/4ieoiFr". This exists because advertising rules (FTC-style endorsement guidelines) and Facebook's own paid-partnership policy require telling people when a link is a paid or affiliate link. Removing that wording, or asking Claude to hide the affiliate relationship, isn't something to go along with even if asked directly in a future session - explain why and offer the disclosed version instead. A short, natural disclosure like this doesn't meaningfully hurt how the post reads.

## Routine tasks

**Check whether the automation is healthy.** Call `mcp__Make__executions_list` with `scenarioId: 9749179`. Read the most recent entries: `status: 1` is success, `status: 3` is failure (an `error` object explains why). See the troubleshooting table below for what each error actually means and what to do about it. Report status in plain terms - don't just paste raw JSON at the user.

**Generate and post a video right now**, instead of waiting for the schedule: call `mcp__Make__scenarios_run` with `scenarioId: 9749179` and `responsive: true`. This is a real post to a real, public Facebook Page - if the user just wants to preview a story without posting, write and show them a script yourself (matching the tone rules in the scenario's Gemini prompt) instead of running the scenario.

**Change the story style, tone, or facts about Miva.** Edit `flow[0].mapper.contents[0].parts[0].text` (the user prompt) or `flow[0].mapper.system_instruction.parts[0].text` (the style/fact rules) in the blueprint, then push the change with `mcp__Make__scenarios_update`. Re-fetch the current blueprint with `scenarios_get` first so you're editing the live version, not a stale copy. Keep the "no raw link/disclosure in the caption" rule intact - that's what makes the comment-based disclosure work.

**Change or add an affiliate link.** Create a new Bitly link with `mcp__Bitly__bitly_create_short_link` (so it stays click-tracked), then update the `facebook-pages:CreateComment` module's `mapper.message` in the blueprint via `scenarios_update`, keeping the "(affiliate link)" wording.

**Report on affiliate performance.** Use `mcp__Bitly__bitly_get_link_analytics` (or `bitly_get_group_analytics`) on `https://bit.ly/4ieoiFr` to pull clicks over time. This is the honest way to answer "is this working" - view/like counts on the Facebook post are not the same as registrations.

**Pause or resume posting.** `mcp__Make__scenarios_deactivate` / `mcp__Make__scenarios_activate` with `scenarioId: 9749179`. Deactivating stops the 8-hour schedule without deleting anything.

## Troubleshooting: reading the error, not just reporting it

| Error you'll see in `executions_list` | What it actually means | What to do |
|---|---|---|
| `InvalidConfigurationError` / `PermissionDenied` on an `http:MakeRequest` module | The Azure Cognitive Services Speech key is missing, wrong, revoked, or pointed at the wrong region. This was the last known blocker - see "The Azure key" section above. | Guide the user through getting a fresh key and pasting it into Make.com directly; don't ask them to share it in chat. |
| `AccountValidationError` / "Failed to verify connection 'My Google Restricted connection'. Invalid refresh token." | The Google OAuth login backing the Drive upload step expired. This is very likely because the underlying Google Cloud OAuth app is still in "Testing" publishing status, which forces Google to expire refresh tokens after about 7 days no matter how often it's used. | Claude can't complete an OAuth login on the user's behalf. Tell the user to open Make.com, find the "My Google Restricted connection" connection, and reconnect it (a browser Google login). For the permanent fix, point them to their Google Cloud Console OAuth consent screen and suggest moving it out of "Testing" (publish it, or add themselves as a verified test user with a longer-lived grant) so this stops recurring weekly. |
| `RuntimeError` from `facebook-pages:CreateComment`, "Object with ID ... does not exist ... or does not support this operation" | The comment step fired before Facebook had finished processing the freshly uploaded video into a commentable post. The wait before commenting is 90 seconds (the `util:FunctionSleep` module, raised from the original 30) - if this keeps happening, raise its `mapper.duration` further (try 120-150) rather than assuming something is broken. | Increase the sleep duration via `scenarios_update`, then watch the next execution. |
| Scenario runs fine but posts look repetitive or off-tone | Story quality problem, not a plumbing problem. | Read a few recent narrations (Gemini's raw output is in each execution's step 1 output, viewable via `mcp__Make__executions_get-detail`) and tighten the system prompt in module `1` - the existing prompt already bans a specific list of cliche phrases, so extend that list rather than rewriting the whole thing. |

## What Claude should not do here

- Don't quietly remove or soften the affiliate disclosure, even if asked to make the copy "cleaner" - explain the compliance reason first.
- Don't reactivate the old scenario (`9559489`) - it's kept off on purpose.
- Don't try to complete a Google or Azure login/reauthorization flow yourself, and don't ask the user to paste a raw API key into chat; those need the human directly, in the right place (Azure Portal, Google's consent screen, or Make.com's own UI). Say so plainly rather than retrying.
- Don't run `scenarios_run` speculatively "just to check if it works" without telling the user a real video may get posted to their public Facebook Page - it isn't a dry-run environment.
- Don't propose switching to a paid, metered video-generation API (JSON2Video or similar) as a "simpler" fix without first checking the user's budget - that's exactly the tradeoff that was already rejected once. If Azure ever needs replacing for a real reason, look for another free-tier TTS/rendering option first.
