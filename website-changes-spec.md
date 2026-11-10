# Common Cents — Website Changes Spec

Nov 9, 2026 · @Norman

## Purpose

Four changes to the Common Cents reading site: drop the profile picker, add a title splash, turn the sidebar into a collapsible table of contents, and let readers post public questions the author can answer. This document is the handoff for the programmer and their AI assistant. Each change below states what to do, why, and how to confirm it works.

**Audience:** the programmer implementing the changes and the Claude assistant working alongside them.

**Guiding principle:** the site is a book first. Everything on screen should make reading easier or get out of the way.

| # | Change | Type | Priority |
| --- | --- | --- | --- |
| 1 | Remove the "select your profile" prompt and its dependencies | Removal | High |
| 2 | Title splash: "Common Cents" fades out after 3 seconds | New | Medium |
| 3 | Make every sidebar group collapsible, Chats especially | Small redesign | High |
| 4 | "Post a question" in Chats, with author answers | New feature | High |
| 5 | Remember the reader's place between visits | New | Medium |

## Change 1 — Remove the "select your profile" prompt

The profile picker shown on first load is no longer needed. Chats are already visible to everyone, and everyone can see the replies, so choosing a user at the start serves no purpose. Remove the prompt and everything that only exists to support it.

**What to do**

1. Delete the profile selection screen (component, route, modal, or overlay — whatever form it takes).
2. Remove the stored selection (cookie, localStorage key, session value, or database field) and every read of it.
3. Remove any code paths that branch on the selected profile: redirects, guards, "no profile selected" fallbacks, per-profile filters on Chats.
4. Remove profile-related UI elsewhere: a profile name in the header, a "switch profile" link, an avatar, per-profile settings.
5. Remove unused assets left behind: profile images, icons, styles, translations, test fixtures.
6. Search the codebase for the words profile, selectUser, currentUser, and persona, and review each hit before deleting.

**What to keep**

- Chat history and replies. Nothing already posted should disappear.
- Any author login or admin access that Change 4 will need. If the profile picker doubled as the author's way in, replace it with a simple author login (see Change 4) before removing it.

**Done when**

- Entering the site address goes straight to the title splash (Change 2), then the book. No prompt, no redirect.
- Clearing site data and reloading produces the same result.
- Chats and their replies still show for every visitor.
- No console errors or dead imports remain.

## Change 2 — Title splash on arrival

When a reader enters the site address, the first thing they see is the title "Common Cents" alone, in large type. After 3 seconds it fades away and the reading page is underneath. It works like the title page of a printed book: a moment of quiet before the text.

**Behavior**

1. Page loads. The splash covers the full viewport: the site background color, the words "Common Cents" centered, nothing else. No sidebar, no menu, no cursor change.
2. Hold for 3 seconds.
3. Fade the splash out over about 0.8 seconds (opacity to 0, then remove it from the DOM so it does not block clicks).
4. The reading page is already rendered beneath it, so the reader lands on content with no second load.

**Details**

- Type: the title at roughly 10 to 12 percent of viewport width, capped so it fits on one line on phones. Use the site's existing heading font.
- Timing: 3 seconds visible, measured from when the title is painted, not from when the request started. Fade duration about 800 ms, ease-out.
- Skip: a click, tap, or key press during the splash ends it early with the same fade. Nobody should feel trapped.
- Frequency: show the splash on every fresh load of the site root. Do not show it when navigating between sections inside the site. A reader who follows a direct link to a section (for example, a shared chapter link) should skip the splash and land on that section.
- Reduced motion: if the browser reports prefers-reduced-motion, show the splash and remove it without animation at 3 seconds.
- Accessibility: mark the splash aria-hidden once the fade begins. Keyboard focus should land in the main content after it closes.

**Done when**

- A fresh load shows only the title, then the book appears after about 3 seconds with a smooth fade.
- A click during the splash dismisses it early.
- A deep link to a section does not show the splash.
- The splash never sits invisibly over the page catching clicks after it has faded.

## Change 3 — Sidebar as a collapsible table of contents

The sidebar should read like the table of contents of the book. A reader sees every available section at a glance, in outline form, and can collapse or expand any group with one click. In particular, the Chats group must collapse so a reader can hide it and focus on the text.

**Structure**

Today the sidebar already does most of this. The Wiki group holds the book entry "Common Cents", which expands with a chevron to show its sections (The Question of Money, Legal or Lawful?, Religiosity or Rationality?, Permission or Prerogative?, Semantic Precision, Epilogue), then Glossary. The Chats group holds New Chat and past conversations but has no way to collapse. The change is to give the WIKI and CHATS group headers the same one-click collapse the book entry already has, so the whole sidebar behaves as one outline:

```markdown
Common Cents                      ← site title, fixed at top

▾ WIKI                            ← new: header toggles the group
    ▾ Common Cents                ← already works today, keep as is
          The Question of Money
          Legal or Lawful?
          Religiosity or Rationality?
          Permission or Prerogative?
          Semantic Precision
          Epilogue
      Glossary

▾ CHATS                           ← new: one click hides every chat
      + Post a question           ← new, see Change 4
      New Chat
      Hey Inkling, do you have…
      What is a token?
      What's the difference be…
      What's the definition of…
```

**What stays, what changes**

The book entry and its section list already work and should not be rebuilt. Reuse the same toggle component for the WIKI and CHATS headers rather than writing a second one. Section titles come from the existing Wiki structure, so new chapters or sections appear when they are added there; no separate list to maintain.

**Behavior**

1. Every group header (Contents, Chats, and the Common Cents book entry) is a toggle. One click collapses it; one click expands it. Use a small chevron that rotates to show state.
2. Clicking the header text toggles the group. Clicking a child item navigates. Do not make the reader hit a tiny arrow to collapse.
3. Nested items indent one level per depth, so the outline reads like a book's table of contents.
4. The current section is highlighted, and its parent groups are expanded on load so the reader can see where they are.
5. Remember each group's open or closed state in localStorage so it survives a reload. Default on first visit: Contents open, Chats open.
6. Long chat titles truncate with an ellipsis, as they do now.
7. Keyboard: Enter or Space toggles a focused group header; arrow keys move between items. Group headers carry aria-expanded.

**Mobile**

- Below about 768 px the sidebar is hidden behind the existing hamburger button and slides in as a drawer.
- Inside the drawer the same collapsible outline applies.
- Selecting a child item closes the drawer and navigates.

**Visual**

- Keep the current theme (light and dark), typography, and spacing. This is a structural change, not a restyle.
- Group headers: small caps or the current muted label style, with the chevron to the left.
- Collapse and expand animate over about 150 ms (height and opacity). Instant under prefers-reduced-motion.

**Done when**

- One click on Chats hides every chat entry; one click brings them back.
- The outline shows all sections of the book without scrolling into a separate page first.
- Open or closed state persists across reload.
- The sidebar works by keyboard and on a phone-width screen.

## Change 4 — "Post a question" in Chats

Any reader can post a question that every visitor can see. The author can answer it, and the answer shows directly under the question, marked as the author's. This turns Chats into a public Q&A page attached to the book, alongside the existing Inkling conversations.

**Reader flow**

1. In the Chats group of the sidebar, a first entry reads "Post a question" with a plus icon.
2. Clicking it opens a simple form in the main panel: a required question field (up to about 500 characters), an optional display name (defaults to "Anonymous"), and a Post button.
3. On submit the question is saved and appears at the top of a public Questions list, with the name, date, and status "Awaiting answer."
4. The reader is taken to their question's page so they can share its link.

**Author flow**

1. The author signs in through a simple author login (a single password or a single-account email login is enough; this is one author, not a user system). Hide the login behind a small link in the sidebar footer or at /admin.
2. When signed in, every question shows an "Answer" button. The author writes the answer in a text box that supports basic formatting (paragraphs, bold, links) and posts it.
3. The answer appears under the question in a visually distinct block labeled "Author's answer" with the date. Status changes to "Answered."
4. The author can edit or delete an answer, and can hide (not permanently delete) a question that is spam or off topic. Hidden questions remain in the database.

**Public Questions list**

- Reached from the Chats group as "Questions" (or by clicking Post a question, which shows the list beneath the form).
- Newest first. Each row: question text, name, date, status chip (Awaiting answer / Answered), and the answer if one exists.
- Each question has its own URL so it can be linked and so the author can find it from a notification.

**Rules and protections**

- Public posting with no login invites spam. Add at least: a per-IP rate limit (for example 3 questions per hour), a honeypot field, and the author's hide control. Add a CAPTCHA only if spam actually appears.
- Strip HTML from reader input and render it as plain text. The author's answer may allow a small safe subset of formatting.
- Store: question id, text, display name, created date, status, hidden flag, author answer text, answered date. Match the shape of the existing chat storage so one data layer serves both.
- Notify the author of new questions by email if an email service already exists in the project. If not, the author checks the list; do not build email infrastructure for this.

**Done when**

- A visitor with no login can post a question and see it in the public list within a page refresh.
- A second visitor on another device sees the same question.
- The author can sign in, answer, edit the answer, and hide a question; the public view reflects each change.
- Rapid repeat posting from one visitor is blocked after the limit.

## Change 5 — Remember the reader's place

A reader who returns to the site should reopen where they left off, the way a bookmark works in a printed book. This is local to the reader's browser; no login and no server storage.

**Behavior**

1. While reading, save the current section (the nearest heading id) and the scroll position inside it to localStorage. Save on scroll, debounced to about every 500 ms, and on page hide.
2. On a fresh load of the site root, after the title splash closes, scroll to the saved section and position. Do it before the content becomes visible so the reader does not see a jump.
3. Highlight the saved section in the sidebar outline (Change 3) so the reader sees where they are.
4. A direct link to a section always wins over the saved place.
5. If nothing is saved, start at the top of the chapter.

**Details**

- Store one small object per book: section id, scroll offset, and a timestamp. Clear it if the saved section id no longer exists in the content.
- Keep the key separate from the sidebar open/closed state so one can be cleared without the other.
- Do not save position while the splash is showing or during the automatic scroll on load.

**Done when**

- Read halfway down, close the tab, reopen the site: the splash plays, then the page is at the same spot.
- Following a shared section link lands on that section, not the saved one.
- Clearing site data returns the reader to the top.

## Acceptance checklist

Suggested build order: Change 1, then 3, then 4, then 5, then 2. The splash is last because it is cosmetic and easy to test once everything else is stable. Tick each item when it passes on desktop and on a phone.

- [ ] Fresh visit shows no profile prompt and goes straight to the title splash, then the book
- [ ] Chats and replies are visible to every visitor without choosing a profile
- [ ] Title splash fades after 3 seconds; a click dismisses it early; deep links skip it
- [ ] WIKI and CHATS headers collapse and expand with one click; the book entry still expands as before
- [ ] Each group's open or closed state survives a reload
- [ ] Sidebar works by keyboard and as a drawer on phone widths
- [ ] A visitor can post a question without logging in and see it publicly
- [ ] The author can log in, answer, edit the answer, and hide a question
- [ ] Rate limit blocks rapid repeat posting
- [ ] Reopening the site returns the reader to the last section and scroll position
- [ ] No console errors, no dead code or assets from the removed profile feature
- [ ] Existing Inkling chat behavior is unchanged

## Open questions for the author

These do not block starting. Answer them as they come up.

1. Does the profile picker currently serve as the author's login? If yes, Change 4's author login must ship before Change 1 removes it.
2. Should the book title "Common Cents" in the sidebar header be the only fixed element, or should the Inkling name appear too?
3. Should readers be able to reply to each other's questions, or is this strictly reader asks, author answers? This spec assumes author-only answers.
4. Should questions be tied to a specific chapter or page ("ask about this section") or stay general? Chapter-tagged questions would be more useful to future readers but add a field and a filter.
5. Where should new-question notifications go, and does the project already have an email sender?
6. Should the sidebar stop at section titles (as it does now), or should each section also expand to show the headings inside it? Stopping at sections is simpler and this spec assumes it.
