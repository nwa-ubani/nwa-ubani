---
name: facebook-video-agent
description: Manage the Next Level Education Facebook storytelling-video automation - a Make.com pipeline that writes a short Nigerian-scene story, turns it into a narrated video via JSON2Video, posts it to the Next Level Education Facebook Page, and comments the Miva Open University affiliate link underneath. Use this skill whenever the user asks about their Facebook video posts, the Next Level Education page, the Miva affiliate pipeline, why a scheduled video didn't post, wants a fresh video generated right now, wants to change the story style or the affiliate link, or wants to check how the affiliate link is performing. Trigger on mentions of "Next Level Education", "Miva", the video posting automation, or the Make.com scenario for Facebook videos, even if the user doesn't name the skill directly.
---

# Facebook storytelling video agent

This skill turns Claude into the operator of an existing automation, not the thing generating video frame-by-frame. The actual rendering and posting happens inside a Make.com scenario; Claude's job is to write good stories, keep the pipeline healthy, run it on demand, and report what happened in plain language. Use the Make MCP tools (`mcp__Make__*`) for everything here - load their schemas with `ToolSearch` if they're not already loaded.

## The system, in one paragraph

Every 8 hours, a Make.com scenario asks Gemini to write a short, spoken-cadence story set in a concrete Nigerian scene (Lagos traffic, a market stall, a generator cutting out) that lands softly on Miva Open University. It hands that script to JSON2Video, which narrates it with a Nigerian-English AI voice over a matching pre-recorded background clip and renders a finished video in one step. The video gets uploaded as a post to the **Next Level Education** Facebook Page, then, after a short wait, the scenario comments a disclosed line with the affiliate registration link underneath the post.

This is the second version of this pipeline. The first version (still visible in Make.com's history) chained together an Azure Cognitive Services token fetch, a separate Azure text-to-speech call, a Google Drive upload just to give the audio a public URL, and a custom video-merge microservice - four fragile steps, each with its own way to break. JSON2Video does the narration and the merge in a single API call and removes the Google Drive dependency entirely, which is why this version is simpler and has fewer failure points.

## Key identifiers (don't re-discover these, just use them)

| Thing | Value |
|---|---|
| Make.com team | `825847` ("My Team", org "My Organization") |
| Live scenario | **`9749179`** - "Next Level Education - Storytelling Video Agent (Claude)" |
| Old, retired scenario | `9559489` - "Next Level Education - Full Video Pipeline (NEW)". Leave this one off. It's kept only as a reference for what was tried before (Azure TTS + Google Drive + a custom merge service). Don't reactivate it - it also has no disclosure line. |
| Facebook Page | Next Level Education (Lagos), page id `483996708139472` |
| Facebook connection | `14420987` ("Next Level Education - Publish Video") |
| Gemini connection (writes the story) | `13470580` |
| JSON2Video connection (narrates + renders the video) | `14454403` |
| Affiliate destination | `https://miva.edu.ng/?ref=mivafaith5399` |
| Public-facing affiliate link (Bitly, click-tracked) | `https://bit.ly/4ieoiFr` |
| Background clip library (the user's own asset host - JSON2Video pulls clips straight from here by URL) | `https://nle-video-merger.onrender.com/static/c01.mp4` through `c19.mp4` |
| Full blueprint of the live scenario | `references/scenario-blueprint.json` in this skill |

Fetch the live scenario any time with `mcp__Make__scenarios_get` (scenarioId `9749179`) rather than trusting a cached copy if it's been a while - the user or a past session may have edited it since.

## Why there's a disclosure line, and why it must stay

The story generation prompt tells the AI never to put the raw link or a disclosure line in the caption itself - readers are told the link is "in the comments" instead. The disclosure lives in the **comment**, worded as "Register here (affiliate link): https://bit.ly/4ieoiFr". This exists because advertising rules (FTC-style endorsement guidelines) and Facebook's own paid-partnership policy require telling people when a link is a paid or affiliate link. Removing that wording, or asking Claude to hide the affiliate relationship, isn't something to go along with even if asked directly in a future session - explain why and offer the disclosed version instead. A short, natural disclosure like this doesn't meaningfully hurt how the post reads.

## Routine tasks

**Check whether the automation is healthy.** Call `mcp__Make__executions_list` with `scenarioId: 9749179`. Read the most recent entries: `status: 1` is success, `status: 3` is failure (an `error` object explains why). See the troubleshooting table below for what each error actually means and what to do about it. Report status in plain terms - don't just paste raw JSON at the user.

**Generate and post a video right now**, instead of waiting for the schedule: call `mcp__Make__scenarios_run` with `scenarioId: 9749179` and `responsive: true`. This is a real post to a real, public Facebook Page, and it spends real JSON2Video render credits - if the user just wants to preview a story without posting or spending credits, write and show them a script yourself (matching the tone rules in the scenario's Gemini prompt) instead of running the scenario.

**Change the story style, tone, or facts about Miva.** Edit `flow[0].mapper.contents[0].parts[0].text` (the user prompt) or `flow[0].mapper.system_instruction.parts[0].text` (the style/fact rules) in the blueprint, then push the change with `mcp__Make__scenarios_update`. Re-fetch the current blueprint with `scenarios_get` first so you're editing the live version, not a stale copy. Keep the "no raw link/disclosure, no quotation marks" rules intact - the no-quotes rule exists because Make's own formula language can't cleanly represent a literal `"` inside a string (see the gotcha below), so the pipeline avoids the problem at the source instead of trying to sanitize it out later.

**Change or add an affiliate link.** Create a new Bitly link with `mcp__Bitly__bitly_create_short_link` (so it stays click-tracked), then update `flow[6].mapper.message` (the `facebook-pages:CreateComment` module) in the blueprint via `scenarios_update`, keeping the "(affiliate link)" wording.

**Report on affiliate performance.** Use `mcp__Bitly__bitly_get_link_analytics` (or `bitly_get_group_analytics`) on `https://bit.ly/4ieoiFr` to pull clicks over time. This is the honest way to answer "is this working" - view/like counts on the Facebook post are not the same as registrations.

**Pause or resume posting.** `mcp__Make__scenarios_deactivate` / `mcp__Make__scenarios_activate` with `scenarioId: 9749179`. Deactivating stops the 8-hour schedule without deleting anything.

**Change the background clip library, resolution, or video length.** The clip selection is a long nested `if(contains(...))` formula in `flow[2].mapper.movie_json` (module `json2video:createmovie`) that matches keywords in the story's scene description against clips `c01.mp4`-`c19.mp4`. Adding a new clip means adding another `if(contains(...))` branch with its keywords, mirroring the existing pattern - don't restructure the whole formula for one addition. Width/height/quality are the `movie_json` object's top-level `width`, `height`, and `quality` fields (currently `1080x1920`, a vertical format).

## A Make formula gotcha worth knowing before editing `movie_json`

Make's expression language does not support backslash-escaping a double-quote inside a string literal the way most languages do (`"\""` does not produce a literal `"` - it silently breaks the formula and the scenario fails validation with an unhelpful "1 problem(s) found" error at run time, even though `scenarios_update` will report `isinvalid: false` when you save it). If you ever need a formula to search for or emit a literal `"` character, don't guess at escape syntax - test it in isolation first with `scenarios_run` on a throwaway on-demand scenario before trusting it in the live pipeline. This is exactly why the Gemini prompt bans quotation marks in the narration outright, rather than trying to strip them out downstream.

## Troubleshooting: reading the error, not just reporting it

| Error you'll see in `executions_list` | What it actually means | What to do |
|---|---|---|
| `RuntimeError` from `waitForAMovieToRender`, "Your account doesn't have enough credits" | The JSON2Video account has run out of render credits (a free-trial allotment or a monthly quota). Every successful render, including test runs, spends credits. | Claude can't buy credits on the user's behalf. Tell the user to open their JSON2Video dashboard and add credits or upgrade the plan. |
| `AccountValidationError` mentioning a Facebook or JSON2Video connection needing reauthorization | An OAuth-backed connection's login expired. | Claude can't complete a login on the user's behalf. Tell the user which connection name to reconnect in Make.com. |
| `RuntimeError` from `facebook-pages:UploadVideo` or `CreateComment`, "Object with ID ... does not exist ... or does not support this operation" | The comment step fired before Facebook had finished processing the freshly uploaded video into a commentable post. The wait before commenting is 90 seconds (`flow[5]`, `util:FunctionSleep`). | If this keeps happening, raise that module's `mapper.duration` further (try 120-150) via `scenarios_update`, then watch the next execution. |
| A `json2video:createmovie` or `waitForAMovieToRender` step fails right after an edit to `movie_json`, with a vague or missing error | Almost always a formula syntax problem in the `movie_json` template (see the gotcha above), not an account or credits issue. | Bisect it: copy the affected modules into a throwaway on-demand scenario (`scenarios_create` with `scheduling: {"type": "on-demand"}`), simplify the formula piece by piece, and use `scenarios_run` to find exactly which piece breaks it before reapplying the fix to the live scenario. Delete the throwaway scenario with `scenarios_delete` when done. |
| Scenario runs fine but posts look repetitive or off-tone | Story quality problem, not a plumbing problem. | Read a few recent narrations (Gemini's raw output is in each execution's step 1 output, viewable via `mcp__Make__executions_get-detail`) and tighten the system prompt in module `1` - the existing prompt already bans a specific list of cliche phrases, so extend that list rather than rewriting the whole thing. |

## What Claude should not do here

- Don't quietly remove or soften the affiliate disclosure, even if asked to make the copy "cleaner" - explain the compliance reason first.
- Don't reactivate the old scenario (`9559489`) - it's kept off on purpose.
- Don't try to complete an OAuth login/reauthorization flow yourself, and don't buy credits or upgrade a paid plan on the user's behalf; those need the human directly. Say so plainly rather than retrying.
- Don't run `scenarios_run` speculatively "just to check if it works" without telling the user a real video may get posted to their public Facebook Page and real render credits will be spent - it isn't a free dry-run environment.
