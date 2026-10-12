// Seed content for the in-browser mock API. Stands in for the backend's
// seeded Topic/Exercise catalog (backend-spec.md §9) until the real API exists.
// Grading here is pattern-matching on the code text, NOT real execution.

export interface MockTopic {
  id: string;
  name: string;
  explanation: string;
  hint: string;
}

export interface MockTestCase {
  input: string;
  expected_output: string;
  check: (code: string) => boolean;
}

export interface MockExercise {
  id: string;
  topic_id: string;
  prompt: string;
  starter_code: string;
  test_cases: MockTestCase[];
}

export interface MockQuestion {
  id: string;
  topic_id: string;
  type: 'mcq' | 'code';
  prompt: string;
  options: string[] | null;
  isCorrect: (answer: string) => boolean;
}

const has = (code: string, re: RegExp) => re.test(code);
const returns = (code: string) => /\breturn\b/.test(code);

export const TOPICS: MockTopic[] = [
  {
    id: 'topic-variables',
    name: 'Variables & Data Types',
    explanation:
      'A variable is a name that points at a value. Python figures out the type for you: `age = 30` is an int, `name = "Asha"` is a str. f-strings like `f"{name} is {age}"` let you drop values straight into text without converting them by hand.',
    hint: 'Try an f-string: `return f"{name} is {age} years old"`.',
  },
  {
    id: 'topic-conditionals',
    name: 'Conditionals',
    explanation:
      '`if` / `elif` / `else` let your code choose a path. Python checks each condition top to bottom and runs the first block whose condition is true — so order matters when conditions overlap.',
    hint: 'You need three branches: `if n > 0`, `elif n < 0`, and `else` for zero.',
  },
  {
    id: 'topic-for-loops',
    name: 'For Loops',
    explanation:
      'A `for` loop walks through every item of a sequence: `for x in nums:`. A common pattern is the accumulator — start a variable at 0 before the loop and add to it inside the loop.',
    hint: 'Start with `result = 0`, add each item inside the loop, and `return result` after it.',
  },
  {
    id: 'topic-functions',
    name: 'Functions',
    explanation:
      'A function lets you package up a block of code to reuse. `def` names it and lists its parameters; `return` sends a value back to whoever called it. Without `return`, a function quietly gives back `None`.',
    hint: 'Your function just needs one line: `return a + b`.',
  },
  {
    id: 'topic-list-comprehensions',
    name: 'List Comprehensions',
    explanation:
      'A list comprehension builds a list in a single line: `[expression for item in items if condition]`. It reads like a sentence — "give me x squared for every x in nums, if x is even".',
    hint: 'Shape: `[x ** 2 for x in nums if x % 2 == 0]`.',
  },
  {
    id: 'topic-dictionaries',
    name: 'Dictionaries',
    explanation:
      'A dictionary maps keys to values: `counts = {"a": 2}`. `counts.get(key, 0)` returns a default when the key is missing — perfect for counting things.',
    hint: 'Loop over `text.split()` and do `counts[word] = counts.get(word, 0) + 1`.',
  },
  {
    id: 'topic-classes',
    name: 'Classes & Objects',
    explanation:
      'A class is a blueprint for objects. `__init__` runs when you create one and usually stores data on `self`. Methods are functions defined inside the class that take `self` as their first parameter.',
    hint: 'Store the name with `self.name = name`, then `return f"{self.name} says woof"` in `speak`.',
  },
];

export const EXERCISES: MockExercise[] = [
  {
    id: 'ex-variables',
    topic_id: 'topic-variables',
    prompt: 'Write `describe(name, age)` that returns a sentence like `"Asha is 30 years old"`.',
    starter_code: 'def describe(name, age):\n    pass\n',
    test_cases: [
      {
        input: 'describe("Asha", 30)',
        expected_output: "'Asha is 30 years old'",
        check: (c) => returns(c) && has(c, /name/) && has(c, /age/) && has(c, /years old/),
      },
    ],
  },
  {
    id: 'ex-conditionals',
    topic_id: 'topic-conditionals',
    prompt: 'Write `sign(n)` that returns `"positive"`, `"negative"`, or `"zero"`.',
    starter_code: 'def sign(n):\n    pass\n',
    test_cases: [
      { input: 'sign(5)', expected_output: "'positive'", check: (c) => returns(c) && has(c, /["']positive["']/) },
      { input: 'sign(-2)', expected_output: "'negative'", check: (c) => returns(c) && has(c, /["']negative["']/) },
      { input: 'sign(0)', expected_output: "'zero'", check: (c) => returns(c) && has(c, /["']zero["']/) },
    ],
  },
  {
    id: 'ex-for-loops',
    topic_id: 'topic-for-loops',
    prompt: 'Write `total(nums)` that adds up a list of numbers using a `for` loop.',
    starter_code: 'def total(nums):\n    pass\n',
    test_cases: [
      { input: 'total([1, 2, 3])', expected_output: '6', check: (c) => returns(c) && has(c, /for\s+\w+\s+in\s+nums/) },
      { input: 'total([])', expected_output: '0', check: (c) => returns(c) && has(c, /=\s*0\b/) },
    ],
  },
  {
    id: 'ex-functions',
    topic_id: 'topic-functions',
    prompt: 'Write a function `add(a, b)` that returns the sum of its two arguments.',
    starter_code: 'def add(a, b):\n    pass\n',
    test_cases: [
      { input: 'add(2, 3)', expected_output: '5', check: (c) => has(c, /return\s+(a\s*\+\s*b|b\s*\+\s*a)/) },
      { input: 'add(-1, 1)', expected_output: '0', check: (c) => has(c, /return\s+(a\s*\+\s*b|b\s*\+\s*a)/) },
    ],
  },
  {
    id: 'ex-list-comprehensions',
    topic_id: 'topic-list-comprehensions',
    prompt: 'Write a list comprehension that squares every even number in `nums`.',
    starter_code: 'def square_evens(nums):\n    pass\n',
    test_cases: [
      {
        input: 'square_evens([1, 2, 3, 4])',
        expected_output: '[4, 16]',
        check: (c) => returns(c) && has(c, /\[.*for\s+\w+\s+in\s+nums.*if.*%\s*2\s*==\s*0.*\]/),
      },
      {
        input: 'square_evens([])',
        expected_output: '[]',
        check: (c) => returns(c) && has(c, /\[.*(\*\*\s*2|(\w+)\s*\*\s*\2).*for/),
      },
    ],
  },
  {
    id: 'ex-dictionaries',
    topic_id: 'topic-dictionaries',
    prompt: 'Write `count_words(text)` that returns a dict mapping each word to how many times it appears.',
    starter_code: 'def count_words(text):\n    pass\n',
    test_cases: [
      {
        input: 'count_words("a b a")',
        expected_output: "{'a': 2, 'b': 1}",
        check: (c) => returns(c) && has(c, /\.split\(/) && has(c, /\.get\(|Counter|\bin\b/),
      },
      { input: 'count_words("")', expected_output: '{}', check: (c) => returns(c) && has(c, /\{\s*\}|dict\(\)|Counter/) },
    ],
  },
  {
    id: 'ex-classes',
    topic_id: 'topic-classes',
    prompt: 'Write a `Dog` class whose `__init__` stores `name` and whose `speak()` returns `"<name> says woof"`.',
    starter_code: 'class Dog:\n    def __init__(self, name):\n        pass\n\n    def speak(self):\n        pass\n',
    test_cases: [
      { input: 'Dog("Rex").name', expected_output: "'Rex'", check: (c) => has(c, /self\.name\s*=\s*name/) },
      { input: 'Dog("Rex").speak()', expected_output: "'Rex says woof'", check: (c) => returns(c) && has(c, /says woof/) },
    ],
  },
];

export const QUESTIONS: MockQuestion[] = [
  {
    id: 'q-variables',
    topic_id: 'topic-variables',
    type: 'mcq',
    prompt: 'What is the type of `x` after `x = "42"`?',
    options: ['int', 'str', 'float', 'bool'],
    isCorrect: (a) => a === 'str',
  },
  {
    id: 'q-conditionals',
    topic_id: 'topic-conditionals',
    type: 'mcq',
    prompt: 'Which keyword checks a second condition after an `if`?',
    options: ['else if', 'elif', 'elseif', 'then'],
    isCorrect: (a) => a === 'elif',
  },
  {
    id: 'q-for-loops',
    topic_id: 'topic-for-loops',
    type: 'mcq',
    prompt: 'What does `range(3)` produce?',
    options: ['0, 1, 2', '1, 2, 3', '0, 1, 2, 3'],
    isCorrect: (a) => a === '0, 1, 2',
  },
  {
    id: 'q-functions',
    topic_id: 'topic-functions',
    type: 'code',
    prompt: 'Write a function `square(x)` that returns the square of its input.',
    options: null,
    isCorrect: (a) => /def\s+\w+\s*\(\s*\w+\s*\)/.test(a) && /return\s+\w+\s*(\*\*\s*2|\*\s*\w+)/.test(a),
  },
  {
    id: 'q-list-comprehensions',
    topic_id: 'topic-list-comprehensions',
    type: 'mcq',
    prompt: 'What does `[n * 2 for n in [1, 2, 3]]` evaluate to?',
    options: ['[1, 2, 3]', '[2, 4, 6]', '[1, 4, 9]', '6'],
    isCorrect: (a) => a === '[2, 4, 6]',
  },
  {
    id: 'q-dictionaries',
    topic_id: 'topic-dictionaries',
    type: 'mcq',
    prompt: 'What does `{"a": 1}.get("b", 0)` return?',
    options: ['None', 'KeyError', '0', '1'],
    isCorrect: (a) => a === '0',
  },
  {
    id: 'q-classes',
    topic_id: 'topic-classes',
    type: 'code',
    prompt: 'Write a class `Point` whose `__init__` stores `x` and `y` on the instance.',
    options: null,
    isCorrect: (a) => /class\s+Point/.test(a) && /self\.x\s*=\s*x/.test(a) && /self\.y\s*=\s*y/.test(a),
  },
];

export const DEMO_USER = { username: 'asha', password: 'python123' };

/** Demo learner: assessment done, first three topics completed, "Functions" current. */
export const DEMO_MASTERY: Record<string, number> = {
  'topic-variables': 5,
  'topic-conditionals': 4,
  'topic-for-loops': 5,
  'topic-functions': 1,
  'topic-list-comprehensions': 0,
  'topic-dictionaries': 0,
  'topic-classes': 0,
};
