# PyMentor — How to Launch & Use It

A plain-language guide: how to start the app, and what a learner can do in it.
For the technical detail behind each screen, see `frontend-spec.md` §3 and §6.

---

## Part 1 — Launching the app

There is no file to double-click. The app is a web page that a small local
server builds and serves, so you start the server, then open a browser.

### First time only
Open a terminal (PowerShell, or the VS Code terminal) and run:

```
cd D:\VSCode\Projects\agentic-python-tutor\V1\frontend
npm install
```

This downloads the libraries the app needs into `frontend\node_modules`. It
takes a minute or two.

### Every time
```
cd D:\VSCode\Projects\agentic-python-tutor\V1\frontend
npm run dev
```

Then open **http://localhost:5173** in your browser. You'll land on the
**Login** page.

To stop the app, press `Ctrl + C` in the terminal.

> **Demo mode.** There's no backend yet, so the app uses a pretend server
> inside your browser. A yellow "Demo mode" strip at the top reminds you of
> this. Your progress is saved in the browser, so it survives a page refresh.

---

## Part 2 — Who uses it, and the journey at a glance

The user is a **learner**: someone teaching themselves Python who wants a
course that adapts to them instead of a fixed one.

```
 New learner:       Sign up ──► Assessment ──► Home ──► Lesson ──► Home ...
 Returning learner: Log in  ─────────────────► Home ──► Lesson ──► Home ...
```

---

## Part 3 — The use cases, step by step

### 1. Try it right away with the demo account
- On the Login page, enter **`asha`** / **`python123`** and click **Log In**.
- You go straight to **Home**. Asha has already taken the assessment and
  finished three topics. "Functions" is her current topic.

### 2. Create an account (new learner)
- On the Login page, click **Sign up**.
- Pick any username and password and click **Create account**.
- You're logged in automatically and taken to the **Assessment**, because
  PyMentor doesn't know your level yet.
- If the username is already taken, a red message says so.

### 3. Take the skill assessment (once)
- You'll see 7 short questions, one per Python topic:
  - **Multiple choice:** click an answer.
  - **Short code:** type a small piece of Python in the code box. Leave it
    blank if you're not sure; that's useful information too.
- The counter at the bottom shows how many you've answered. The **Submit**
  button turns on once every multiple-choice question has an answer.
- After you submit, you'll see "Building your personalized curriculum…",
  then you land on **Home**.
- Topics you did worst on come first in your learning path.
- You can only take the assessment once. If you visit it again, you're sent
  back to Home.

### 4. See your progress (Home)
Home shows:
- **"Welcome to PyMentor"** with your name.
- Three numbers: topics completed, average mastery (0–5), and what's next.
- **Your learning path**, a list of every topic:
  - ✓ green **Completed**: done.
  - yellow **Current**: the one you're working on. It's the only one you
    can click.
  - grey **Locked**: comes later.
  - The dots show your **mastery** of that topic, from 0 to 5.

### 5. Start or continue a lesson
- Click **Continue Learning — <topic>**, or click the **Current** row.
- A lesson page opens with:
  - **Explanation** (top left): a short lesson on the topic.
  - **Exercise** (below it): what to write, plus a code editor that
    already has some starter code in it.
  - **Ask the Tutor** (right side, or below on a phone): a chat box.
- If you leave and come back, you resume the same lesson. You don't get a
  new one.

### 6. Submit your code and get feedback
- Write your answer in the editor and click **Submit**. You'll see
  "Grading your code…".
- The result card shows:
  - Each test with ✓ or ✗. For a failed test it also shows what was
    expected and what your code gave.
  - **Code review**: a comment on how you wrote it, not just whether it
    works.
  - Your **new mastery level** for the topic.
- **If it failed:** change your code and submit again, as many times as
  you like. **Reset** puts the starter code back.
- **If it passed:** the editor locks, the topic is marked completed, and
  the next topic unlocks. Click **Next Lesson →** to keep going.

> Try it on the "Functions" lesson: click **Submit** without changing
> anything and you'll see it fail. Then change `pass` to `return a + b` and
> submit again to see it pass.

### 7. Ask the tutor
- Type a question in **Ask the Tutor** and click **Send**.
- Your message appears right away, followed by "Thinking…" and then the reply.
- The chat belongs to this lesson, so each lesson has its own conversation.
- In demo mode the replies are simple canned answers. Try "why do I need
  return?" or "give me a hint".

### 8. Go back Home
From any page, click the **PyMentor** logo at the top. On a lesson page you
can also click **← Back to Curriculum**.

### 9. Log out
Click **Log out** at the top right. You go back to the Login page. Pages
other than Login and Signup can't be opened until you log in again.

### 10. Finish the whole course
When every topic is completed, Home says so and the Continue button goes away.

---

## Part 4 — Handy extras (demo mode only)

| You want to… | Do this |
|---|---|
| Start completely fresh | On the Login page, click **Reset demo data**. This removes any accounts you created and resets Asha. |
| Use a second learner | Log out and sign up with a different username |
| See it on a phone layout | In the browser press `F12`, then the phone/tablet icon |

---

## Part 5 — When the real backend exists

Nothing changes for the learner. The screens and steps above stay the same.
The difference is that explanations, grading, code reviews and tutor replies
will come from the real AI agents instead of the demo stand-ins. To switch,
create `frontend\.env.local` from `.env.example` and set
`VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL`.
