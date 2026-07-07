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
  commonMistake?: string;
  miniPrompt?: string;
  furtherReading?: { title: string; url: string }[];
  liveCoding: { title: string; starter: string; note?: string };
  challenges: Challenge[];
  demo?: {
    kind: "install-check" | "loop-visualizer" | "ds-visualizer" | "generic";
    description: string;
  };
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
    theory: `### How Computers Understand Code
A program is simply a set of instructions that a computer runs. Your computer's processor (CPU) can only execute raw "machine code" (1s and 0s). Writing machine code by hand is incredibly tedious, which is why we use high-level programming languages like Python. 

### Compilation vs Interpretation
Some languages (like C++ or Java) are "compiled" — translated into machine code all at once before you run them. Python, however, is an **interpreted** language. This means you write a \`.py\` file, and a program called the Python Interpreter reads and executes your code line-by-line, top to bottom.

\`\`\`python
# Example 1: Basic sequential execution
print("This runs first")
print("This runs second")
\`\`\`

### What is "Installing Python"?
When you "install Python," you are actually installing the Python Interpreter (specifically, the standard version called CPython). This interpreter acts as a translator between your readable Python code and the machine code your CPU understands.

\`\`\`python
# Example 2: Math and output
# The interpreter calculates the result and outputs it
print(10 + 5)
\`\`\`
`,
    commonMistake:
      "Confusing the text editor (where you type code) with the terminal/interpreter (where the code is executed). You must run the interpreter and point it at your file (e.g., `python my_script.py`) to actually see results.",
    miniPrompt:
      "Change the math in Example 2 to multiply two numbers using the `*` symbol instead of `+`.",
    furtherReading: [
      { title: "Python Official Setup Guide", url: "https://docs.python.org/3/using/index.html" },
      {
        title: "Python Tutorial: Invoking the Interpreter",
        url: "https://docs.python.org/3/tutorial/interpreter.html",
      },
    ],
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
        prompt:
          "Print three lines: your name, your favorite language, and why you're learning Python.",
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
      description:
        "Installation checker — verifies the sandboxed Python is available and prints its version.",
    },
    quiz: [
      {
        q: "Which of these is hardware?",
        choices: ["Operating System", "CPU", "Python", "Chrome"],
        answer: 1,
      },
      {
        q: "Python is primarily…",
        choices: ["Compiled ahead of time", "Interpreted", "Assembled", "Transpiled to Java"],
        answer: 1,
      },
      {
        q: "After installing Python, which command usually prints the version?",
        choices: ["python --version", "python show", "get python", "install python"],
        answer: 0,
      },
    ],
    notes:
      "Module 1 notes — installation checklist, first program, difference between compiler and interpreter.",
  }),

  m(2, "basics", "Python Basics", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory: `### Variables and Dynamic Typing
Variables are essentially sticky notes or labels that you attach to values so you can refer to them later. Unlike languages where you have to declare what *type* of data a variable holds (like C or Java), Python uses **dynamic typing**. This means the type belongs to the *value*, not the variable name itself. You can assign a number to a variable, and later assign a string to that exact same variable.

\`\`\`python
# Example 1: Dynamic Typing
my_data = 10         # It's an integer (int)
print(type(my_data))
my_data = "Hello"    # Now it's a string (str)
print(type(my_data))
\`\`\`

### Data Types and Operators
The most common core types are \`int\` (whole numbers), \`float\` (decimals), \`str\` (text strings), and \`bool\` (True or False). 
Python evaluates math using standard order of operations (PEMDAS). It calculates exponents (\`**\`) first, then multiplication/division (\`*\`, \`/\`, \`//\`, \`%\`), and finally addition/subtraction (\`+\`, \`-\`).

### f-strings (Formatted String Literals)
Whenever you need to mix text and variables together, use an **f-string**. By putting an \`f\` right before your opening quote, you can inject variables directly inside curly braces \`{}\`.

\`\`\`python
# Example 2: Math and f-strings
apples = 5
price = 1.20
total = apples * price
# Inject variables straight into the text
print(f"I bought {apples} apples for {total} dollars")
\`\`\`
`,
    commonMistake:
      "Forgetting to put the `f` in front of the string when trying to use `{variables}`. If you omit it, Python will literally print out the text '{variables}' instead of the actual value.",
    miniPrompt:
      "Try changing the `price` variable in Example 2 to 2.50 and watch how the f-string updates the total.",
    furtherReading: [
      { title: "Python Built-in Types", url: "https://docs.python.org/3/library/stdtypes.html" },
      {
        title: "f-strings (Formatted string literals)",
        url: "https://docs.python.org/3/tutorial/inputoutput.html#formatted-string-literals",
      },
    ],
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
        prompt:
          "Extend the profile card to also print the birth year (assume current year is 2026).",
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
      {
        q: "Which is a valid f-string?",
        choices: ['f"hi {name}"', "f'hi $name'", '"hi {name}".f', "format(hi, name)"],
        answer: 0,
      },
    ],
    notes: "Module 2 notes — variables, types, operators, f-strings.",
  }),

  m(3, "control-flow", "Control Flow", {
    tags: ["Theory", "Live Coding", "Demo", "Challenge", "Quiz"],
    theory: `### Branching with if, elif, and else
Programs need to make decisions. The \`if\` statement evaluates a boolean condition; if it is \`True\`, the indented block underneath runs. You can chain alternative conditions using \`elif\` (else-if), and provide a final catch-all fallback using \`else\`.

### Iteration: for vs while loops
Loops allow you to repeat a block of code. Python has two kinds of loops: **for loops** (used when you know exactly how many times to repeat, or have a specific collection to step through) and **while loops** (used when you just want to repeat *until* a condition becomes false).

Here is the exact same logic implemented using both loop styles so you can see the trade-offs:

\`\`\`python
# Example 1: The 'for' loop (cleaner for known ranges)
print("For loop countdown:")
for i in range(3, 0, -1):
    print(i)
print("Liftoff!")
\`\`\`

\`\`\`python
# Example 2: The 'while' loop (more manual control)
print("While loop countdown:")
count = 3
while count > 0:
    print(count)
    count -= 1  # Crucial: update the condition!
print("Liftoff!")
\`\`\`

Inside loops, you can use \`break\` to instantly shatter the loop and exit completely, or \`continue\` to abandon just the *current* iteration and jump immediately back to the top for the next one.
`,
    commonMistake:
      "Forgetting to update the variable inside a `while` loop (like omitting `count -= 1` in Example 2). This creates an infinite loop that runs forever until the program crashes.",
    miniPrompt:
      "Add a new `elif` condition to the FizzBuzz live coding block below to print 'Seven' when the number is divisible by 7.",
    furtherReading: [
      {
        title: "Python Tutorial: Control Flow Tools",
        url: "https://docs.python.org/3/tutorial/controlflow.html",
      },
      {
        title: "More on Conditions",
        url: "https://docs.python.org/3/tutorial/datastructures.html#more-on-conditions",
      },
    ],
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
        prompt:
          "Number-guessing game: use a fixed target of 42, guess list [10, 80, 42], print too high / too low / correct plus attempt count.",
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
      {
        prompt:
          "FizzBuzz Variant: Print numbers 1 through 15. If divisible by 2 print 'Ping', if divisible by 4 print 'Pong' (PingPong if both).",
        starter: `# Write a loop from 1 to 15
# Use if/elif/else and the modulo operator (%)
`,
        expectedOutputIncludes: ["PingPong", "Ping", "3"],
      },
    ],
    demo: {
      kind: "loop-visualizer",
      description:
        "Step-through visualizer highlighting which iteration is running and current variable values.",
    },
    quiz: [
      {
        q: "Which statement exits a loop entirely?",
        choices: ["continue", "pass", "break", "return"],
        answer: 2,
      },
      {
        q: "How many times does `for i in range(3)` iterate?",
        choices: ["2", "3", "4", "0"],
        answer: 1,
      },
      {
        q: "`continue` inside a loop…",
        choices: [
          "Ends the loop",
          "Skips to next iteration",
          "Restarts the program",
          "Raises an error",
        ],
        answer: 1,
      },
    ],
    notes: "Module 3 notes — conditionals, loops, break/continue.",
  }),

  m(4, "functions", "Functions", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory: `### What are Functions?
A function is a reusable block of code that only runs when it is explicitly called. You define a function using the \`def\` keyword. You can pass data, known as **parameters**, into a function. A function can do some work and then **return** data back to the caller as a result.

### Returning vs Printing
A very common beginner habit is to \`print()\` the result directly inside the function. While this is helpful for debugging, it limits the function's usefulness. If a function uses \`return\`, the code that called the function can capture the result and use it for further math, save it to a database, or display it however it wants.

\`\`\`python
# Example 1: Printing (less flexible)
def print_greeting(name):
    print(f"Hello {name}!")

# Example 2: Returning (more flexible)
def get_greeting(name):
    return f"Hello {name}!"

# The caller decides what to do with the returned value
message = get_greeting("Alice")
print(message.upper())
\`\`\`

### Variable Scope
Scope defines where a variable can be accessed. Variables created *inside* a function are **local** to that function. They are destroyed when the function finishes running, and cannot be accessed from outside. Variables created outside of all functions are **global**.

\`\`\`python
# Example 3: Scope in action
global_var = 10

def math_stuff():
    local_var = 5
    # Can read global_var from inside
    return global_var + local_var

print(math_stuff()) # 15
# print(local_var)  # Error! local_var doesn't exist out here
\`\`\`
`,
    commonMistake:
      "Forgetting to write the `return` keyword. If a function doesn't explicitly return a value, it silently returns a special object called `None`. If you see `None` showing up unexpectedly in your output, check your function's return statement!",
    miniPrompt:
      "Change Example 2 to return the greeting string in entirely uppercase letters directly from within the function.",
    furtherReading: [
      {
        title: "Python Tutorial: Defining Functions",
        url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions",
      },
      {
        title: "Default Argument Values",
        url: "https://docs.python.org/3/tutorial/controlflow.html#default-argument-values",
      },
    ],
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
        prompt:
          "Tip calculator: define tip(amount, percent) that RETURNS the tip (does not print). Print tip(50, 20).",
        starter: `def tip(amount, percent):
    # return the tip value
    return 0

print(tip(50, 20))`,
        expectedOutputIncludes: ["10"],
      },
    ],
    quiz: [
      {
        q: "A function without an explicit return returns…",
        choices: ["0", "None", "empty string", "error"],
        answer: 1,
      },
      {
        q: "Variables defined inside def are by default…",
        choices: ["Global", "Local", "Nonlocal", "Constants"],
        answer: 1,
      },
      {
        q: "Best practice: business logic in a function should…",
        choices: ["print results", "return results", "write to a file", "raise errors always"],
        answer: 1,
      },
    ],
    notes: "Module 4 notes — def, parameters, return, scope.",
  }),

  m(5, "files", "File Handling", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory: `### Persistent Storage
So far, every time your program stops running, all its data vanishes. To save data permanently (like high scores, user preferences, or logs), you need to write it to a file. 

### Reading and Writing
Python's built-in \`open()\` function gives you a "file object". You must specify a **mode**:
- \`"r"\`: Read-only (default). Fails if the file doesn't exist.
- \`"w"\`: Write-only. **Warning:** This instantly erases the existing file and starts fresh!
- \`"a"\`: Append. Adds new data to the very end of an existing file.

\`\`\`python
# Example 1: Writing and Appending
# 'w' creates the file or overwrites it
f = open("log.txt", "w")
f.write("System booted.\\n")
f.close() # Always close your files!
\`\`\`

### The \`with\` Context Manager
Manually calling \`.close()\` is tedious and easy to forget (especially if your program crashes before it reaches that line). Python provides the \`with\` statement to automatically handle closing the file for you, no matter what happens.

\`\`\`python
# Example 2: The modern 'with' block
# This is much safer!
with open("log.txt", "r") as file_obj:
    content = file_obj.read()
    print("File says:", content)
# The file is already safely closed here
\`\`\`
`,
    commonMistake:
      "Forgetting to close a file (or failing to use a `with` block). If you leave files open, your program can lock up system resources, cause memory leaks, or prevent other programs from reading the file.",
    miniPrompt:
      "Change the tiny journal example below to use 'w' mode instead of 'a' mode and run it twice. Notice how it erases the previous entry?",
    furtherReading: [
      {
        title: "Python Tutorial: Reading and Writing Files",
        url: "https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files",
      },
      {
        title: "Built-in open() Function",
        url: "https://docs.python.org/3/library/functions.html#open",
      },
    ],
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
        prompt:
          "Save a high score to 'score.txt' if it's better (lower attempts) than the existing value.",
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
      {
        q: "The `with` statement mainly ensures…",
        choices: ["Faster IO", "The file is closed automatically", "Encryption", "Async reads"],
        answer: 1,
      },
      { q: "Which mode APPENDS to a file?", choices: ["'r'", "'w'", "'a'", "'x'"], answer: 2 },
      {
        q: "readlines() returns…",
        choices: ["one string", "a list of strings", "bytes", "an iterator only"],
        answer: 1,
      },
    ],
    notes: "Module 5 notes — open/close, with, modes, read variants.",
  }),

  m(6, "exceptions", "Exception Handling", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory: `### Defensive Programming
When writing code, things *will* go wrong. Users will type letters instead of numbers, network connections will drop, and files will go missing. If your program doesn't anticipate these errors, it will crash abruptly with a "Traceback".

### The try/except Block
To prevent crashes, you can wrap risky code inside a \`try\` block. If an error occurs, Python immediately jumps down to the \`except\` block instead of crashing, allowing you to handle the error gracefully.

\`\`\`python
# Example 1: Handling a specific error
try:
    age = int(input("Enter age: "))
except ValueError:
    print("That's not a valid number!")
\`\`\`

### Else and Finally
You can extend this structure. The \`else\` block only runs if the \`try\` block succeeded *without* throwing any errors. The \`finally\` block runs absolutely no matter what (even if the program is about to crash or return early), making it perfect for crucial cleanup tasks like closing database connections.

\`\`\`python
# Example 2: The full structure
try:
    file = open("data.txt", "r")
    data = file.read()
except FileNotFoundError:
    print("File is missing!")
else:
    print("Read success!")
finally:
    print("Closing up.")
\`\`\`
`,
    commonMistake:
      "Using a 'bare except' (just writing `except:` without specifying the error type like `ValueError`). This catches literally everything, including KeyboardInterrupts (when you try to quit the program) or typo-related SyntaxErrors, making it impossible to debug real issues.",
    miniPrompt:
      "In the live coding block, try passing a string instead of a number to `safe_div` to see which exception block catches it.",
    furtherReading: [
      {
        title: "Python Tutorial: Errors and Exceptions",
        url: "https://docs.python.org/3/tutorial/errors.html",
      },
      {
        title: "Built-in Exceptions Hierarchy",
        url: "https://docs.python.org/3/library/exceptions.html",
      },
    ],
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
        prompt:
          "Given a list of inputs, keep the first one that parses as an int in [1,10]. Print it.",
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
      {
        q: "`finally` runs…",
        choices: ["only on error", "only on success", "always", "never"],
        answer: 2,
      },
      {
        q: "Best practice: catch…",
        choices: [
          "bare except",
          "specific exception type",
          "all exceptions and ignore",
          "SystemExit",
        ],
        answer: 1,
      },
      {
        q: "Which error for `int('abc')`?",
        choices: ["TypeError", "ValueError", "KeyError", "SyntaxError"],
        answer: 1,
      },
    ],
    notes: "Module 6 notes — try/except/else/finally, error hierarchy.",
  }),

  m(7, "data-structures", "Data Structures", {
    tags: ["Theory", "Live Coding", "Demo", "Challenge", "Quiz"],
    theory: `### Organizing Data
As your programs grow, you'll need to store more than just single variables. Python provides several core "Data Structures" to organize collections of data efficiently. 

### Lists and Tuples (Sequences)
A **list** is an ordered, mutable sequence of items. You can append, remove, or swap items inside a list. A **tuple** is almost exactly the same, but it is *immutable* — once created, it cannot be changed. Use lists for dynamic data, and tuples for fixed data that shouldn't accidentally be altered.

\`\`\`python
# Example 1: Lists vs Tuples
my_list = ["apple", "banana"]
my_list.append("cherry") # Works fine!

my_tuple = ("red", "green", "blue")
# my_tuple.append("yellow") # ERROR! Tuples are locked.
\`\`\`

### Dictionaries and Sets
A **dictionary (dict)** stores data in Key-Value pairs, allowing lightning-fast lookups by a name rather than a numerical index. A **set** is an unordered collection that automatically forces all items to be entirely unique (no duplicates).

\`\`\`python
# Example 2: Dicts and Sets
user = {"name": "Ada", "role": "Admin"}
print(user["role"]) # Fast lookup by key

unique_ids = {1, 2, 2, 3, 3, 3}
print(unique_ids) # Outputs: {1, 2, 3}
\`\`\`
`,
    commonMistake:
      "Modifying a list while you are looping over it. If you remove an item from a list while `for` looping through it, everything shifts backwards, causing the loop to skip the next item entirely!",
    miniPrompt:
      "In the contact book live code below, try adding a dictionary that includes an 'email' key in addition to 'name' and 'phone'.",
    furtherReading: [
      {
        title: "Python Tutorial: Data Structures",
        url: "https://docs.python.org/3/tutorial/datastructures.html",
      },
      {
        title: "Time Complexity of Python Data Structures",
        url: "https://wiki.python.org/moin/TimeComplexity",
      },
    ],
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
      {
        prompt:
          "Merge two lists of names, and return a single, alphabetically sorted list with NO duplicates.",
        starter: `list_a = ["Zack", "Alice", "Bob", "Alice"]
list_b = ["Charlie", "Bob", "Eve"]

# Combine them, remove duplicates, and sort
final_list = [] # TODO

print(final_list)`,
        expectedOutputIncludes: ["Alice", "Bob", "Charlie", "Eve", "Zack"],
      },
    ],
    demo: {
      kind: "ds-visualizer",
      description:
        "Interactive visualizer stepping through append, pop, insert, and dict key lookup.",
    },
    quiz: [
      { q: "Which is immutable?", choices: ["list", "tuple", "set", "dict"], answer: 1 },
      { q: "Which enforces uniqueness?", choices: ["list", "tuple", "set", "str"], answer: 2 },
      {
        q: "Dict access by missing key raises…",
        choices: ["IndexError", "KeyError", "ValueError", "TypeError"],
        answer: 1,
      },
    ],
    notes: "Module 7 notes — list, tuple, set, dict, when to use each.",
  }),

  m(8, "comprehensions", "Advanced Data Handling", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory: `### Elegance and Speed
Python is famous for being readable. One of its most powerful features for data transformation is the **Comprehension**. A comprehension allows you to build a brand new list, set, or dictionary from an existing iterable using a single, readable line of code.

### List Comprehensions
Instead of creating an empty list, looping over old data, checking a condition, and appending to the new list, you can compress all of that into one expression wrapped in square brackets.

\`\`\`python
# Example 1: The old way vs Comprehension
nums = [1, 2, 3, 4, 5]

# Old way
evens = []
for n in nums:
    if n % 2 == 0:
        evens.append(n * 2)

# New way: [expression for item in iterable if condition]
evens_comp = [n * 2 for n in nums if n % 2 == 0]
\`\`\`

### Dictionary Comprehensions
You can do the exact same thing with dictionaries by using curly braces and separating the key and value with a colon. It is incredibly efficient.

\`\`\`python
# Example 2: Dict Comprehension
names = ["Alice", "Bob"]
# Create a dictionary mapping names to their lengths
name_lengths = {name: len(name) for name in names}
print(name_lengths) # {'Alice': 5, 'Bob': 3}
\`\`\`
`,
    commonMistake:
      "Trying to cram too much logic into a single comprehension. If your comprehension wraps across three lines and has multiple `if/else` conditions, you've defeated the purpose. Fall back to a standard `for` loop for readability.",
    miniPrompt:
      "Use a list comprehension to generate a list of the squares of the numbers 1 through 5.",
    furtherReading: [
      {
        title: "Python Tutorial: List Comprehensions",
        url: "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions",
      },
      {
        title: "Functional Programming Modules",
        url: "https://docs.python.org/3/library/functional.html",
      },
    ],
    liveCoding: {
      title: "Word frequency, rewritten as a dict comprehension",
      starter: `text = "python is great python is fun learning python is a journey"
words = text.lower().split()
counts = {w: words.count(w) for w in set(words)}
print(sorted(counts.items(), key=lambda kv: -kv[1])[:3])`,
    },
    challenges: [
      {
        prompt:
          "Password strength: return True if len >= 8, has a digit, has an uppercase, has a symbol from !@#$.",
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
      {
        q: "Result of [x*x for x in range(3)]?",
        choices: ["[0,1,2]", "[0,1,4]", "[1,4,9]", "[]"],
        answer: 1,
      },
      {
        q: "zip([1,2],[3,4]) yields…",
        choices: ["[1,2,3,4]", "[(1,3),(2,4)]", "[(1,2),(3,4)]", "error"],
        answer: 1,
      },
      {
        q: 'enumerate(["a","b"]) first value?',
        choices: ["(0,'a')", "('a',0)", "'a'", "0"],
        answer: 0,
      },
    ],
    notes: "Module 8 notes — comprehensions and built-ins.",
  }),

  m(9, "oop", "Object-Oriented Programming", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory: `### What is OOP?
Object-Oriented Programming (OOP) is a way of organizing code by grouping related data and the functions that operate on that data into a single unit called an **Object**. 

### Classes and Instances
A **Class** is the blueprint. An **Instance** (or Object) is the actual house built from that blueprint. You can build as many houses as you want from one blueprint, and each house can have different colored paint or furniture (instance data).

The \`__init__\` method is a special "constructor" that runs automatically exactly once when the object is created. 

\`\`\`python
# Example 1: Defining a Class
class Dog:
    # Constructor sets up the initial state
    def __init__(self, name, age):
        self.name = name  # Instance attribute
        self.age = age
    
    # A method (a function belonging to the class)
    def bark(self):
        print(f"{self.name} says Woof!")

# Creating two distinct instances
fido = Dog("Fido", 3)
spot = Dog("Spot", 5)

fido.bark()
\`\`\`

### The Meaning of 'self'
Inside a class method, \`self\` refers to the specific instance calling the method. When \`fido.bark()\` is executed, Python secretly passes \`fido\` as the first argument, which lands in the \`self\` parameter.

\`\`\`python
# Example 2: Magic Methods
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    # __str__ controls what happens when you print the object
    def __str__(self):
        return f"Point({self.x}, {self.y})"

p = Point(10, 20)
print(p) # Point(10, 20) instead of <__main__.Point object at 0x...>
\`\`\`
`,
    commonMistake:
      "Forgetting to include `self` as the first parameter when defining a method inside a class. Without it, you'll get a confusing `TypeError` saying the method takes 0 positional arguments but 1 was given.",
    miniPrompt:
      "In Example 1, add a `have_birthday()` method that increases the dog's `self.age` by 1 and prints a happy birthday message.",
    furtherReading: [
      { title: "Python Tutorial: Classes", url: "https://docs.python.org/3/tutorial/classes.html" },
      {
        title: "Real Python: OOP in Python 3",
        url: "https://realpython.com/python3-object-oriented-programming/",
      },
    ],
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
        prompt:
          "Add update(name, new_phone) and delete(name) methods to ContactBook and demonstrate both.",
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
      {
        prompt:
          "Create a BankAccount class with a deposit(amount) and withdraw(amount) method. Prevent overdrawing.",
        starter: `class BankAccount:
    def __init__(self, initial_balance):
        self.balance = initial_balance
        
    # TODO: write deposit(amount) and withdraw(amount)
    # withdraw should return False if balance is insufficient

acct = BankAccount(100)
# acct.deposit(50)
# acct.withdraw(200) # Should fail
# print(acct.balance) # Should be 150`,
        expectedOutputIncludes: ["150"],
      },
    ],
    quiz: [
      {
        q: "Constructor method name?",
        choices: ["__new__", "__init__", "__call__", "__start__"],
        answer: 1,
      },
      {
        q: "`self` refers to…",
        choices: ["the class", "the module", "the current instance", "None"],
        answer: 2,
      },
      {
        q: "Class attribute is…",
        choices: ["shared across instances", "per-instance", "always private", "never overridable"],
        answer: 0,
      },
    ],
    notes: "Module 9 notes — classes, objects, methods, constructors.",
  }),

  m(10, "mini-project", "Mini Project — Contact Book App", {
    tags: ["Planning", "Implementation", "Testing"],
    theory: `### Bringing it Together
In this module, you'll combine everything you've learned to build a complete, functional app: Object-Oriented Programming (for the data model), File Handling (for persistent storage), and Exception Handling (to survive bad input).

### Architecture Planning
Before writing code, successful engineers plan their system boundaries.
1. **The Model**: \`Contact\` stores raw data. \`ContactBook\` manages a list of \`Contact\`s.
2. **Persistence Layer**: The \`ContactBook\` is responsible for loading from and saving to a JSON file whenever changes are made.
3. **The User Interface**: The \`while True\` loop that prompts the user with \`input()\`, routing their choices to the \`ContactBook\` methods.

\`\`\`python
# Example 1: Creating a tight Model loop
class AppState:
    def __init__(self):
        self.count = 0
        
    def increment(self):
        self.count += 1
        self.save() # Automatically save on change!
        
    def save(self):
        print(f"State saved: {self.count}!")
        
app = AppState()
app.increment()
\`\`\`

### Avoiding Spagetti Code
Keep your concerns separated. \`ContactBook\` should not be calling \`input()\`. It should receive data as arguments, and return data to the caller. The main CLI loop handles the \`input()\` and \`print()\` statements. This makes the \`ContactBook\` reusable in a GUI or web app later!
`,
    commonMistake:
      "Putting `input()` calls directly inside the `ContactBook` class methods. If you do this, your class is permanently tied to the terminal and cannot be reused in a web or desktop application.",
    miniPrompt:
      "In the live code below, change the ContactBook constructor so it creates a file named `my_friends.json` instead of `contacts.json`.",
    furtherReading: [
      {
        title: "Software Architecture: Separation of Concerns",
        url: "https://en.wikipedia.org/wiki/Separation_of_concerns",
      },
    ],
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
      {
        prompt:
          "Add an export_csv(filename) method to ContactBook that writes all contacts to a CSV file manually.",
        starter: `# Hint: loop over self.items and write "name,phone\\n" for each
# Call your method and read the file to verify
`,
      },
    ],
    quiz: [
      {
        q: "Persistence in this project uses…",
        choices: ["a database", "a JSON file", "environment vars", "nothing"],
        answer: 1,
      },
      {
        q: "Bad input is best handled via…",
        choices: ["ignoring it", "try/except", "print statements", "sys.exit"],
        answer: 1,
      },
    ],
    notes: "Module 10 notes — planning, implementation, testing.",
  }),

  m(11, "libraries", "Python Libraries", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz"],
    theory: `### Batteries Included
Python is famous for its "batteries included" philosophy. The **Standard Library** comes pre-installed with Python and contains hundreds of modules for doing everything from generating random numbers, to fetching web pages, to reading zip files.

### Imports
To use a library, you must \`import\` it at the top of your file. You can import the entire module, or just specific functions from it using \`from module import function\`.

\`\`\`python
# Example 1: The standard library
import math
import random
from datetime import datetime

print("Pi is roughly:", math.pi)
print("Random float:", random.random())
print("Time now:", datetime.now())
\`\`\`

### Third-Party Packages and PyPI
When the standard library isn't enough, you can turn to the Python Package Index (PyPI). PyPI hosts hundreds of thousands of packages created by the community (like \`requests\` for web APIs, or \`pandas\` for data science). You install these to your computer using a command line tool called **pip** (\`pip install package_name\`).

\`\`\`python
# Example 2: Assuming 'requests' was installed via pip
import requests

# Fetch the current astronaut count in space
response = requests.get("http://api.open-notify.org/astros.json")
data = response.json()
print(f"People in space right now: {data['number']}")
\`\`\`
`,
    commonMistake:
      "Naming your own file the same name as a library (e.g., naming your file `random.py`). When you type `import random` in your code, Python will import your file instead of the built-in library, causing chaotic errors.",
    miniPrompt: "Use the `math` module in the live code to print the square root of 225.",
    furtherReading: [
      { title: "The Python Standard Library", url: "https://docs.python.org/3/library/" },
      { title: "PyPI - The Python Package Index", url: "https://pypi.org/" },
    ],
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
        prompt:
          "Print a timestamp and a 3-second 'countdown' (print 3, 2, 1, go — no real sleep needed).",
        starter: `from datetime import datetime
print("started at:", datetime(2026, 1, 1, 12, 0, 0).isoformat())
for n in [3, 2, 1]:
    print(n)
print("go")`,
        expectedOutputIncludes: ["go"],
      },
    ],
    quiz: [
      {
        q: "Which module for random numbers?",
        choices: ["math", "random", "sys", "os"],
        answer: 1,
      },
      {
        q: "Which for current date/time?",
        choices: ["clock", "datetime", "chrono", "timeit"],
        answer: 1,
      },
      {
        q: "pip installs packages from…",
        choices: ["GitHub only", "PyPI", "the standard library", "your disk only"],
        answer: 1,
      },
    ],
    notes: "Module 11 notes — stdlib overview and pip basics.",
  }),

  m(12, "data-formats", "Working with Data — CSV, JSON, Capstone", {
    tags: ["Theory", "Live Coding", "Challenge", "Quiz", "Certificate"],
    theory: `### Data Serialization
Software rarely works alone. To pass data between different programs (like a Python backend and a React frontend, or Excel to a database), you need universal data formats. The two undisputed kings are **CSV** and **JSON**.

### CSV (Comma Separated Values)
CSV is perfect for tabular, flat data. It's essentially a lightweight spreadsheet format. Each line is a row, and columns are separated by commas. Python's built-in \`csv\` module handles all the messy edge cases (like when a column value itself contains a comma!).

\`\`\`python
# Example 1: Reading CSV
import csv

data = "Name,Age\\nAlice,25\\nBob,30"
reader = csv.DictReader(data.splitlines())
for row in reader:
    print(row["Name"]) # Alice, then Bob
\`\`\`

### JSON (JavaScript Object Notation)
JSON is perfect for hierarchical, deeply nested data. It looks almost exactly like a Python dictionary mixed with lists. Most modern web APIs communicate entirely via JSON.

\`\`\`python
# Example 2: Reading JSON
import json

json_string = '{"user": "Alice", "hobbies": ["reading", "coding"]}'
# json.loads() converts the string into a Python dictionary
parsed = json.loads(json_string)
print(parsed["hobbies"][1]) # coding
\`\`\`
`,
    commonMistake:
      "Forgetting to specify `encoding='utf-8'` when calling `open()` to read or write text files. Without it, Python uses your operating system's default encoding (often cp1252 on Windows), which will crash violently the second it encounters an emoji or a foreign character.",
    miniPrompt:
      "In the live coding window, convert the `buf.getvalue()` CSV string directly into a JSON string using `json.dumps()`.",
    furtherReading: [
      { title: "Python docs: csv module", url: "https://docs.python.org/3/library/csv.html" },
      { title: "Python docs: json module", url: "https://docs.python.org/3/library/json.html" },
    ],
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
      {
        q: "csv.DictReader gives you…",
        choices: ["lists", "dicts keyed by header", "tuples", "strings"],
        answer: 1,
      },
      { q: "json.dumps returns…", choices: ["dict", "bytes", "str", "None"], answer: 2 },
      {
        q: "Best encoding for text files?",
        choices: ["ascii", "latin-1", "utf-8", "utf-16 always"],
        answer: 2,
      },
    ],
    notes: "Module 12 notes — CSV, JSON, capstone, certificate.",
  }),
];

export const getModule = (slug: string) => modules.find((x) => x.slug === slug);
