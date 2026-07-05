export type Challenge = {
  prompt: string;
  starter: string;
  expectedOutputIncludes?: string[];
};

export type QuizQuestion = {
  q: string;
  choices: string[];
  answer: number;
  explain?: string;
};

export type Module = {
  id: number;
  slug: string;
  title: string;
  tags: string[];
  theory: string;
  liveCoding: { title: string; starter: string; note?: string };
  challenges: Challenge[];
  demo?: { kind: "install-check" | "loop-visualizer" | "ds-visualizer" | "generic"; description: string };
  quiz: QuizQuestion[];
  notes: string;
};

const m = (
  id: number,
  slug: string,
  title: string,
  data: Omit<Module, "id" | "slug" | "title">,
): Module => ({ id, slug, title, ...data });

export const modules: Module[] = [
  m(1, "intro", "Introduction to Computers, Programming & Python Installation", {
    tags: ["Theory", "Live Coding", "Demo", "Challenge", "Quiz"],
    theory:
      "A program is a set of instructions a computer runs. The CPU executes machine code; source code you write in Python is translated to that code by the Python interpreter (CPython). You don't compile Python ahead of time — you run a .py file and the interpreter reads it top to bottom. Installing Python means putting that interpreter (and the standard library) on your machine so `python` works from the terminal.",
    liveCoding: {
      title: "Hello, world — then greet a name",
      starter: `# Classic Hello World
print("Hello, world!")

# Now personalize it
name = "Ada"
print(f"Hello, {name}!")`,
    },
    challenges: [
      {
        prompt: "Print three lines: your name, your favorite language, and why you're learning Python.",
        starter: `# Replace the values, then Run
name = "your name"
language = "your favorite language"
reason = "why you're learning Python"

print(name)
print(language)
print(reason)`,
      },
    ],
    demo: {
      kind: "install-check",
      description: "Installation checker — verifies the sandboxed Python is available and prints its version.",
    },
    quiz: [
      { q: "Which of these is hardware?", choices: ["Operating System", "CPU", "Python", "Chrome"], answer: 1 },
      { q: "Python is primarily…", choices: ["Compiled ahead of time", "Interpreted", "Assembled", "Transpiled to Java"], answer: 1 },
      { q: "After installing Python, which command usually prints the version?", choices: ["python --version", "python show", "get python", "install python"], answer: 0 },
    ],
    notes: "Module 1 notes — installation checklist, first program, difference between compiler and interpreter.",
  }),

  m(2, "basics", "Python Basics", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory:
      "Variables are labels bound to values. Python is dynamically typed: the type belongs to the value, not the name. Common types: int, float, str, bool. Operators follow standard precedence: **, then unary -, then * / // %, then + -. f-strings (f\"...{name}...\") are the readable way to format output.",
    liveCoding: {
      title: "Profile card generator",
      starter: `name = "Ada Lovelace"
age = 28
city = "London"

print("=" * 30)
print(f"Name : {name}")
print(f"Age  : {age}")
print(f"City : {city}")
print("=" * 30)`,
    },
    challenges: [
      {
        prompt: "Extend the profile card to also print the birth year (assume current year is 2026).",
        starter: `name = "Ada Lovelace"
age = 28
city = "London"
current_year = 2026

# Compute birth_year and print the extended card
birth_year = 0  # TODO
print(f"{name} — born {birth_year}, lives in {city}")`,
        expectedOutputIncludes: ["1998"],
      },
    ],
    quiz: [
      { q: "Type of 3 / 2 in Python 3?", choices: ["int", "float", "str", "error"], answer: 1 },
      { q: "Value of 2 + 3 * 4?", choices: ["20", "14", "24", "9"], answer: 1 },
      { q: "Which is a valid f-string?", choices: ['f"hi {name}"', 'f\'hi $name\'', '"hi {name}".f', 'format(hi, name)'], answer: 0 },
    ],
    notes: "Module 2 notes — variables, types, operators, f-strings.",
  }),

  m(3, "control-flow", "Control Flow", {
    tags: ["Theory", "Live Coding", "Demo", "Challenge", "Quiz"],
    theory:
      "if/elif/else lets programs branch. for loops iterate a sequence, while loops repeat while a condition is true. break exits the loop, continue skips to the next iteration.",
    liveCoding: {
      title: "FizzBuzz",
      starter: `for n in range(1, 21):
    if n % 15 == 0:
        print("FizzBuzz")
    elif n % 3 == 0:
        print("Fizz")
    elif n % 5 == 0:
        print("Buzz")
    else:
        print(n)`,
    },
    challenges: [
      {
        prompt: "Number-guessing game: use a fixed target of 42, guess list [10, 80, 42], print too high / too low / correct plus attempt count.",
        starter: `target = 42
guesses = [10, 80, 42]
attempts = 0

for g in guesses:
    attempts += 1
    if g < target:
        print(f"{g}: too low")
    elif g > target:
        print(f"{g}: too high")
    else:
        print(f"{g}: correct in {attempts} attempts")
        break`,
        expectedOutputIncludes: ["correct in 3 attempts"],
      },
      {
        prompt: "Leap year checker for the year 2024.",
        starter: `year = 2024
is_leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)
print(f"{year} leap? {is_leap}")`,
        expectedOutputIncludes: ["True"],
      },
    ],
    demo: {
      kind: "loop-visualizer",
      description: "Step-through visualizer highlighting which iteration is running and current variable values.",
    },
    quiz: [
      { q: "Which statement exits a loop entirely?", choices: ["continue", "pass", "break", "return"], answer: 2 },
      { q: "How many times does `for i in range(3)` iterate?", choices: ["2", "3", "4", "0"], answer: 1 },
      { q: "`continue` inside a loop…", choices: ["Ends the loop", "Skips to next iteration", "Restarts the program", "Raises an error"], answer: 1 },
    ],
    notes: "Module 3 notes — conditionals, loops, break/continue.",
  }),

  m(4, "functions", "Functions", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory:
      "def defines a function. Parameters are inputs, return sends a value back. Scope: names created inside a function are local unless declared global. Prefer returning values over printing inside the function — the caller decides what to do with the result.",
    liveCoding: {
      title: "Refactor the guessing game into functions",
      starter: `import random

def get_guess(guesses, i):
    return guesses[i]

def check_guess(guess, target):
    if guess < target: return "low"
    if guess > target: return "high"
    return "hit"

def play_game(target, guesses):
    for i, g in enumerate(guesses, start=1):
        result = check_guess(g, target)
        print(f"attempt {i}: {g} -> {result}")
        if result == "hit":
            return i
    return None

play_game(42, [10, 80, 42])`,
    },
    challenges: [
      {
        prompt: "Tip calculator: define tip(amount, percent) that RETURNS the tip (does not print). Print tip(50, 20).",
        starter: `def tip(amount, percent):
    # return the tip value
    return 0

print(tip(50, 20))`,
        expectedOutputIncludes: ["10"],
      },
    ],
    quiz: [
      { q: "A function without an explicit return returns…", choices: ["0", "None", "empty string", "error"], answer: 1 },
      { q: "Variables defined inside def are by default…", choices: ["Global", "Local", "Nonlocal", "Constants"], answer: 1 },
      { q: "Best practice: business logic in a function should…", choices: ["print results", "return results", "write to a file", "raise errors always"], answer: 1 },
    ],
    notes: "Module 4 notes — def, parameters, return, scope.",
  }),

  m(5, "files", "File Handling", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory:
      "Use `with open(path, mode) as f:` — the file closes automatically. Modes: 'r' read, 'w' write (truncates), 'a' append. read() returns the whole file, readline() one line, readlines() a list.",
    liveCoding: {
      title: "Tiny journal (in-memory sandbox file)",
      starter: `from datetime import datetime

path = "journal.txt"
entry = "Started learning Python file handling."

with open(path, "a") as f:
    f.write(f"[{datetime.now().isoformat(timespec='seconds')}] {entry}\\n")

with open(path, "r") as f:
    print(f.read())`,
    },
    challenges: [
      {
        prompt: "Save a high score to 'score.txt' if it's better (lower attempts) than the existing value.",
        starter: `path = "score.txt"
new_score = 3

try:
    with open(path, "r") as f:
        best = int(f.read().strip())
except (FileNotFoundError, ValueError):
    best = None

if best is None or new_score < best:
    with open(path, "w") as f:
        f.write(str(new_score))
    print(f"new best: {new_score}")
else:
    print(f"kept old best: {best}")`,
        expectedOutputIncludes: ["new best: 3"],
      },
    ],
    quiz: [
      { q: "The `with` statement mainly ensures…", choices: ["Faster IO", "The file is closed automatically", "Encryption", "Async reads"], answer: 1 },
      { q: "Which mode APPENDS to a file?", choices: ["'r'", "'w'", "'a'", "'x'"], answer: 2 },
      { q: "readlines() returns…", choices: ["one string", "a list of strings", "bytes", "an iterator only"], answer: 1 },
    ],
    notes: "Module 5 notes — open/close, with, modes, read variants.",
  }),

  m(6, "exceptions", "Exception Handling", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory:
      "try runs risky code, except handles specific error types, else runs if no error, finally always runs. Catch the narrowest exception you can — bare `except:` hides bugs.",
    liveCoding: {
      title: "Harden the calculator",
      starter: `def safe_div(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        return "cannot divide by zero"
    except TypeError:
        return "numbers only, please"
    else:
        return result
    finally:
        pass  # cleanup would go here

print(safe_div(10, 2))
print(safe_div(10, 0))
print(safe_div(10, "x"))`,
    },
    challenges: [
      {
        prompt: "Given a list of inputs, keep the first one that parses as an int in [1,10]. Print it.",
        starter: `inputs = ["abc", "99", "3", "7"]

def first_valid(vals, lo, hi):
    for v in vals:
        try:
            n = int(v)
        except ValueError:
            continue
        if lo <= n <= hi:
            return n
    return None

print(first_valid(inputs, 1, 10))`,
        expectedOutputIncludes: ["3"],
      },
    ],
    quiz: [
      { q: "`finally` runs…", choices: ["only on error", "only on success", "always", "never"], answer: 2 },
      { q: "Best practice: catch…", choices: ["bare except", "specific exception type", "all exceptions and ignore", "SystemExit"], answer: 1 },
      { q: "Which error for `int('abc')`?", choices: ["TypeError", "ValueError", "KeyError", "SyntaxError"], answer: 1 },
    ],
    notes: "Module 6 notes — try/except/else/finally, error hierarchy.",
  }),

  m(7, "data-structures", "Data Structures", {
    tags: ["Theory", "Live Coding", "Demo", "Challenge", "Quiz"],
    theory:
      "list — ordered, mutable. tuple — ordered, immutable. set — unordered, unique. dict — key/value pairs. Choose by access pattern: lookup by key → dict; unique membership → set; ordered sequence → list.",
    liveCoding: {
      title: "Contact book with a list of dicts",
      starter: `contacts = []

def add(name, phone):
    contacts.append({"name": name, "phone": phone})

def find(name):
    return [c for c in contacts if c["name"].lower() == name.lower()]

def delete(name):
    global contacts
    contacts = [c for c in contacts if c["name"].lower() != name.lower()]

add("Ada", "555-0100")
add("Linus", "555-0101")
print(find("ada"))
delete("linus")
print(contacts)`,
    },
    challenges: [
      {
        prompt: "Word frequency counter — return the top 3 most common words in a paragraph.",
        starter: `text = "python is great python is fun learning python is a journey"

from collections import Counter
counts = Counter(text.lower().split())
print(counts.most_common(3))`,
        expectedOutputIncludes: ["python"],
      },
    ],
    demo: {
      kind: "ds-visualizer",
      description: "Interactive visualizer stepping through append, pop, insert, and dict key lookup.",
    },
    quiz: [
      { q: "Which is immutable?", choices: ["list", "tuple", "set", "dict"], answer: 1 },
      { q: "Which enforces uniqueness?", choices: ["list", "tuple", "set", "str"], answer: 2 },
      { q: "Dict access by missing key raises…", choices: ["IndexError", "KeyError", "ValueError", "TypeError"], answer: 1 },
    ],
    notes: "Module 7 notes — list, tuple, set, dict, when to use each.",
  }),

  m(8, "comprehensions", "Advanced Data Handling", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory:
      "Comprehensions build lists/dicts/sets from expressions: [f(x) for x in xs if cond]. Built-ins: map, filter, zip, enumerate, sorted, any, all. Prefer comprehensions for clarity, generators for large data.",
    liveCoding: {
      title: "Word frequency, rewritten as a dict comprehension",
      starter: `text = "python is great python is fun learning python is a journey"
words = text.lower().split()
counts = {w: words.count(w) for w in set(words)}
print(sorted(counts.items(), key=lambda kv: -kv[1])[:3])`,
    },
    challenges: [
      {
        prompt: "Password strength: return True if len >= 8, has a digit, has an uppercase, has a symbol from !@#$.",
        starter: `def strong(pw):
    return (
        len(pw) >= 8
        and any(c.isdigit() for c in pw)
        and any(c.isupper() for c in pw)
        and any(c in "!@#$" for c in pw)
    )

print(strong("Abc12345!"))`,
        expectedOutputIncludes: ["True"],
      },
    ],
    quiz: [
      { q: "Result of [x*x for x in range(3)]?", choices: ["[0,1,2]", "[0,1,4]", "[1,4,9]", "[]"], answer: 1 },
      { q: "zip([1,2],[3,4]) yields…", choices: ["[1,2,3,4]", "[(1,3),(2,4)]", "[(1,2),(3,4)]", "error"], answer: 1 },
      { q: "enumerate([\"a\",\"b\"]) first value?", choices: ["(0,'a')", "('a',0)", "'a'", "0"], answer: 0 },
    ],
    notes: "Module 8 notes — comprehensions and built-ins.",
  }),

  m(9, "oop", "Object-Oriented Programming", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory:
      "A class is a blueprint; an object is an instance. __init__ is the constructor. self is the current instance. Instance attributes live on self; class attributes are shared. __str__ controls print() output.",
    liveCoding: {
      title: "Contact + ContactBook classes",
      starter: `class Contact:
    def __init__(self, name, phone):
        self.name = name
        self.phone = phone
    def __str__(self):
        return f"{self.name} <{self.phone}>"

class ContactBook:
    def __init__(self):
        self.items = []
    def add(self, c):
        self.items.append(c)
    def find(self, name):
        return [c for c in self.items if c.name.lower() == name.lower()]

book = ContactBook()
book.add(Contact("Ada", "555-0100"))
book.add(Contact("Linus", "555-0101"))
for c in book.items:
    print(c)`,
    },
    challenges: [
      {
        prompt: "Add update(name, new_phone) and delete(name) methods to ContactBook and demonstrate both.",
        starter: `class Contact:
    def __init__(self, name, phone):
        self.name, self.phone = name, phone
    def __str__(self):
        return f"{self.name} <{self.phone}>"

class ContactBook:
    def __init__(self):
        self.items = []
    def add(self, c): self.items.append(c)
    def update(self, name, new_phone):
        for c in self.items:
            if c.name == name:
                c.phone = new_phone
    def delete(self, name):
        self.items = [c for c in self.items if c.name != name]

b = ContactBook()
b.add(Contact("Ada","000"))
b.update("Ada","999")
print(b.items[0])
b.delete("Ada")
print(len(b.items))`,
        expectedOutputIncludes: ["Ada <999>"],
      },
    ],
    quiz: [
      { q: "Constructor method name?", choices: ["__new__", "__init__", "__call__", "__start__"], answer: 1 },
      { q: "`self` refers to…", choices: ["the class", "the module", "the current instance", "None"], answer: 2 },
      { q: "Class attribute is…", choices: ["shared across instances", "per-instance", "always private", "never overridable"], answer: 0 },
    ],
    notes: "Module 9 notes — classes, objects, methods, constructors.",
  }),

  m(10, "mini-project", "Mini Project — Contact Book App", {
    tags: ["Planning", "Implementation", "Testing"],
    theory:
      "Bring it together: OOP for the model, file handling for persistence, exception handling for bad input, functions for the CLI. Plan the features and data model on paper first.",
    liveCoding: {
      title: "Full Contact Book — add / list / search / save / load",
      starter: `import json, os

class Contact:
    def __init__(self, name, phone): self.name, self.phone = name, phone
    def to_dict(self): return {"name": self.name, "phone": self.phone}

class ContactBook:
    def __init__(self, path="contacts.json"):
        self.path = path
        self.items = []
        self.load()
    def add(self, name, phone):
        self.items.append(Contact(name, phone))
        self.save()
    def search(self, name):
        return [c for c in self.items if name.lower() in c.name.lower()]
    def save(self):
        with open(self.path, "w") as f:
            json.dump([c.to_dict() for c in self.items], f)
    def load(self):
        if not os.path.exists(self.path): return
        try:
            data = json.load(open(self.path))
            self.items = [Contact(**d) for d in data]
        except Exception:
            self.items = []

b = ContactBook()
b.add("Ada", "555-0100")
b.add("Linus", "555-0101")
print([c.name for c in b.search("a")])`,
    },
    challenges: [
      {
        prompt: "Add a delete_by_name method and confirm it removes the correct contact.",
        starter: `# reuse the class above — write delete_by_name and test it
# expected: after delete, len == 1
`,
      },
    ],
    quiz: [
      { q: "Persistence in this project uses…", choices: ["a database", "a JSON file", "environment vars", "nothing"], answer: 1 },
      { q: "Bad input is best handled via…", choices: ["ignoring it", "try/except", "print statements", "sys.exit"], answer: 1 },
    ],
    notes: "Module 10 notes — planning, implementation, testing.",
  }),

  m(11, "libraries", "Python Libraries", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory:
      "The standard library is huge: math for numerics, random for randomness, datetime for dates, os/sys for the environment. pip installs third-party packages from PyPI.",
    liveCoding: {
      title: "Dice roller and password generator",
      starter: `import random, string

def roll(sides=6, n=1):
    return [random.randint(1, sides) for _ in range(n)]

def password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$"
    return "".join(random.choice(alphabet) for _ in range(length))

random.seed(42)
print("rolls:", roll(6, 3))
print("pw:", password(10))`,
    },
    challenges: [
      {
        prompt: "Print a timestamp and a 3-second 'countdown' (print 3, 2, 1, go — no real sleep needed).",
        starter: `from datetime import datetime
print("started at:", datetime(2026, 1, 1, 12, 0, 0).isoformat())
for n in [3, 2, 1]:
    print(n)
print("go")`,
        expectedOutputIncludes: ["go"],
      },
    ],
    quiz: [
      { q: "Which module for random numbers?", choices: ["math", "random", "sys", "os"], answer: 1 },
      { q: "Which for current date/time?", choices: ["clock", "datetime", "chrono", "timeit"], answer: 1 },
      { q: "pip installs packages from…", choices: ["GitHub only", "PyPI", "the standard library", "your disk only"], answer: 1 },
    ],
    notes: "Module 11 notes — stdlib overview and pip basics.",
  }),

  m(12, "data-formats", "Working with Data — CSV, JSON, Capstone", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz", "Certificate"],
    theory:
      "CSV is tabular text — good for spreadsheets. JSON is nested — good for structured objects. Use csv and json from the standard library. Always specify encoding='utf-8' when working with text.",
    liveCoding: {
      title: "Export contacts to CSV and read them back",
      starter: `import csv, io

rows = [
    {"name": "Ada", "phone": "555-0100"},
    {"name": "Linus", "phone": "555-0101"},
]

buf = io.StringIO()
writer = csv.DictWriter(buf, fieldnames=["name", "phone"])
writer.writeheader()
writer.writerows(rows)

print(buf.getvalue())

buf.seek(0)
reader = csv.DictReader(buf)
for row in reader:
    print(row)`,
    },
    challenges: [
      {
        prompt: "Serialize a list of dicts to JSON and back — round-trip must be equal.",
        starter: `import json
data = [{"name": "Ada", "phone": "555-0100"}]
s = json.dumps(data)
back = json.loads(s)
print(back == data)`,
        expectedOutputIncludes: ["True"],
      },
    ],
    quiz: [
      { q: "csv.DictReader gives you…", choices: ["lists", "dicts keyed by header", "tuples", "strings"], answer: 1 },
      { q: "json.dumps returns…", choices: ["dict", "bytes", "str", "None"], answer: 2 },
      { q: "Best encoding for text files?", choices: ["ascii", "latin-1", "utf-8", "utf-16 always"], answer: 2 },
    ],
    notes: "Module 12 notes — CSV, JSON, capstone, certificate.",
  }),
];

export const getModule = (slug: string) => modules.find(x => x.slug === slug);
