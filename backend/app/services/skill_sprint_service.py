import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.career import (
    SkillSprintQuestion,
    SkillSprintAttempt,
    ProofTask,
    RoadmapMilestone,
    CareerProfile,
)
from app.models.job import Job

# 10 Core Skill Sprint tracks with 5 high-quality deterministic questions each (50 curated questions total)
QUESTION_BANK: List[Dict[str, Any]] = [
    # ---------- 1. Python ----------
    {
        "id": "py-01",
        "skill": "Python",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "Python List Comprehensions & Scope",
        "prompt": "What does the following Python snippet evaluate to?",
        "code_snippet": "funcs = [lambda x, i=i: x + i for i in range(3)]\nprint([f(10) for f in funcs])",
        "options": ["[10, 11, 12]", "[12, 12, 12]", "[10, 10, 10]", "SyntaxError"],
        "correct_answer": "[10, 11, 12]",
        "explanation": "Default argument `i=i` binds the value of `i` at function definition time (early binding), preventing the late-binding closure bug where all lambdas would otherwise reference the final value of `i` (2).",
        "concept_tag": "Closures & Scoping",
        "version": 1,
    },
    {
        "id": "py-02",
        "skill": "Python",
        "question_type": "debugging",
        "difficulty": "intermediate",
        "title": "Mutable Default Arguments Bug",
        "prompt": "Identify the bug in this cache function and choose the correct fix:",
        "code_snippet": "def append_metric(val, metrics_log=[]):\n    metrics_log.append(val)\n    return metrics_log",
        "options": [
            "Use `metrics_log=None` as default, then initialize `metrics_log = []` inside the function body if None.",
            "Cast `metrics_log` to a tuple before returning.",
            "Use `metrics_log=()` in the function signature.",
            "Declare `global metrics_log` inside the function.",
        ],
        "correct_answer": "Use `metrics_log=None` as default, then initialize `metrics_log = []` inside the function body if None.",
        "explanation": "In Python, default parameter expressions are evaluated once when the function definition is executed, creating a shared mutable list across all invocations that omit the argument.",
        "concept_tag": "Mutable Defaults",
        "version": 1,
    },
    {
        "id": "py-03",
        "skill": "Python",
        "question_type": "code_reading",
        "difficulty": "intermediate",
        "title": "Generator vs List Memory Efficiency",
        "prompt": "Why is using a generator expression preferred when processing a 10GB telemetry log stream?",
        "code_snippet": "records = (parse_line(line) for line in open('huge_access.log') if is_valid(line))",
        "options": [
            "It yields items lazily on demand (O(1) memory) without materializing all records into RAM.",
            "It automatically executes across multiple CPU threads simultaneously.",
            "It compiles Python bytecode into C extensions at runtime.",
            "Generators bypass the Python Global Interpreter Lock (GIL).",
        ],
        "correct_answer": "It yields items lazily on demand (O(1) memory) without materializing all records into RAM.",
        "explanation": "Generator expressions produce items one at a time via the iterator protocol (`__next__`), using O(1) heap memory rather than loading the entire 10GB dataset into a list.",
        "concept_tag": "Generators & Memory",
        "version": 1,
    },
    {
        "id": "py-04",
        "skill": "Python",
        "question_type": "multiple_choice",
        "difficulty": "advanced",
        "title": "Python GIL & Concurrency",
        "prompt": "For a CPU-bound image filtering workload in CPython, which concurrency model achieves true multi-core CPU parallelism?",
        "code_snippet": None,
        "options": [
            "`multiprocessing` or `concurrent.futures.ProcessPoolExecutor` with separate process address spaces.",
            "`threading.Thread` with 8 worker threads.",
            "`asyncio` event loop using `async def` tasks.",
            "Greenlet co-routines.",
        ],
        "correct_answer": "`multiprocessing` or `concurrent.futures.ProcessPoolExecutor` with separate process address spaces.",
        "explanation": "The CPython Global Interpreter Lock (GIL) restricts execution of Python bytecode to one thread at a time. Separate OS processes have separate Python runtimes and GILs, utilizing multiple CPU cores.",
        "concept_tag": "Concurrency & GIL",
        "version": 1,
    },
    {
        "id": "py-05",
        "skill": "Python",
        "question_type": "short_answer",
        "difficulty": "intermediate",
        "title": "Context Managers & Dunder Protocol",
        "prompt": "Which two magic dunder methods must a Python class implement to support the `with` statement protocol?",
        "code_snippet": "class ManagedResource:\n    def __???__(self): pass\n    def __???__(self, exc_type, exc_val, exc_tb): pass",
        "options": [
            "__enter__ and __exit__",
            "__open__ and __close__",
            "__init__ and __del__",
            "__start__ and __stop__",
        ],
        "correct_answer": "__enter__ and __exit__",
        "explanation": "The context manager protocol requires `__enter__()` which acquires resources and optionally returns a context target, and `__exit__(exc_type, exc_val, exc_tb)` which guarantees cleanup.",
        "concept_tag": "Context Managers",
        "version": 1,
    },

    # ---------- 2. Java ----------
    {
        "id": "java-01",
        "skill": "Java",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "String Immutability and Pool",
        "prompt": "What is the output of the following Java snippet?",
        "code_snippet": "String s1 = \"proof\";\nString s2 = new String(\"proof\");\nSystem.out.println((s1 == s2) + \" \" + s1.equals(s2));",
        "options": ["false true", "true true", "false false", "true false"],
        "correct_answer": "false true",
        "explanation": "`==` checks reference equality in memory. `s1` references a literal in the string intern pool, while `new String(\"proof\")` allocates a distinct object on the heap. `.equals()` checks character sequence equality.",
        "concept_tag": "Memory & Strings",
        "version": 1,
    },
    {
        "id": "java-02",
        "skill": "Java",
        "question_type": "debugging",
        "difficulty": "advanced",
        "title": "ConcurrentHashMap vs HashMap",
        "prompt": "Why can multiple worker threads mutating a standard `java.util.HashMap` concurrently cause production failures?",
        "code_snippet": None,
        "options": [
            "`HashMap` is unsynchronized; concurrent rehash/resizing can cause race conditions, data loss, or corrupt linked buckets.",
            "`HashMap` throws a checked `ThreadDeadlockException` during compile time.",
            "`HashMap` automatically terminates the JVM on second thread access.",
            "`HashMap` only accepts immutable primitive keys.",
        ],
        "correct_answer": "`HashMap` is unsynchronized; concurrent rehash/resizing can cause race conditions, data loss, or corrupt linked buckets.",
        "explanation": "Standard `HashMap` provides no thread safety. Under concurrent modification, bucket structural changes (or resizing) can corrupt node pointers. `ConcurrentHashMap` uses segmented or CAS bucket locks.",
        "concept_tag": "Thread Safety",
        "version": 1,
    },
    {
        "id": "java-03",
        "skill": "Java",
        "question_type": "code_reading",
        "difficulty": "intermediate",
        "title": "Optional Handling",
        "prompt": "What is the cleanest idiomatic Java 17 idiom to safely return a default user profile if absent?",
        "code_snippet": "Optional<UserProfile> profileOpt = repo.findById(id);",
        "options": [
            "profileOpt.orElseGet(() -> createDefaultProfile());",
            "if (profileOpt.isPresent()) return profileOpt.get(); else return createDefaultProfile();",
            "profileOpt.orElse(createDefaultProfile()); // executes eagerly even if present",
            "profileOpt.get();",
        ],
        "correct_answer": "profileOpt.orElseGet(() -> createDefaultProfile());",
        "explanation": "`orElseGet` accepts a `Supplier` lambda which is evaluated lazily only when the Optional is empty, avoiding unnecessary object instantiation overhead.",
        "concept_tag": "Modern Java Idioms",
        "version": 1,
    },
    {
        "id": "java-04",
        "skill": "Java",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "Garbage Collection Roots",
        "prompt": "Which of the following is considered a GC Root in the JVM hotspot collector?",
        "code_snippet": None,
        "options": [
            "Local variables on active thread call stacks and active thread objects.",
            "Any object stored in the survivor space S0.",
            "Unreferenced objects in old generation.",
            "Null pointer assignments.",
        ],
        "correct_answer": "Local variables on active thread call stacks and active thread objects.",
        "explanation": "GC roots include local variables and parameters on stack frames of active threads, JNI global/local references, and static class fields loaded by system classloaders.",
        "concept_tag": "JVM & Memory Management",
        "version": 1,
    },
    {
        "id": "java-05",
        "skill": "Java",
        "question_type": "code_reading",
        "difficulty": "intermediate",
        "title": "Streams Parallelism Pitfall",
        "prompt": "When invoking `.parallelStream()` in Java, which common thread pool is used by default?",
        "code_snippet": "List<String> results = items.parallelStream().map(this::fetchRemote).toList();",
        "options": [
            "The shared common `ForkJoinPool.commonPool()`, which can starve the entire JVM if blocked by I/O.",
            "A newly spawned dedicated executor pool per stream call.",
            "The OS kernel scheduler pool.",
            "The main thread only.",
        ],
        "correct_answer": "The shared common `ForkJoinPool.commonPool()`, which can starve the entire JVM if blocked by I/O.",
        "explanation": "Parallel streams run on the global `ForkJoinPool.commonPool()`. Performing blocking I/O inside it starves all other parallel tasks in the JVM unless a custom ForkJoinPool is used.",
        "concept_tag": "Streams & Concurrency",
        "version": 1,
    },

    # ---------- 3. JavaScript and TypeScript ----------
    {
        "id": "ts-01",
        "skill": "JavaScript and TypeScript",
        "question_type": "code_reading",
        "difficulty": "intermediate",
        "title": "TypeScript Discriminated Unions",
        "prompt": "Given this TypeScript union, what enables TypeScript to narrow the type inside the switch?",
        "code_snippet": "type Action =\n  | { type: 'FETCH_SUCCESS'; payload: Item[] }\n  | { type: 'FETCH_ERROR'; error: Error };\n\nfunction handle(a: Action) {\n  if (a.type === 'FETCH_SUCCESS') { console.log(a.payload.length); }\n}",
        "options": [
            "The common literal property `type` acts as a discriminator tag for control-flow type narrowing.",
            "A runtime `instanceof` check executed by the V8 JIT compiler.",
            "Dynamic reflection metadata emitted into the JS bundle.",
            "TypeScript transpiles the union into a C++ struct.",
        ],
        "correct_answer": "The common literal property `type` acts as a discriminator tag for control-flow type narrowing.",
        "explanation": "TypeScript uses the common discriminant property (`type`) with literal types to narrow the union to the specific subtype within the conditional block.",
        "concept_tag": "Type Narrowing",
        "version": 1,
    },
    {
        "id": "ts-02",
        "skill": "JavaScript and TypeScript",
        "question_type": "debugging",
        "difficulty": "intermediate",
        "title": "Event Loop Microtask Queues",
        "prompt": "In what exact order will the numbers log to console in Node.js / Modern Browsers?",
        "code_snippet": "console.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);",
        "options": ["1, 4, 3, 2", "1, 2, 3, 4", "1, 4, 2, 3", "1, 3, 4, 2"],
        "correct_answer": "1, 4, 3, 2",
        "explanation": "Synchronous code runs first (1, 4). Microtasks (`Promise.then`) run immediately after the current call stack completes (3). Macrotasks (`setTimeout`) run on subsequent event loop ticks (2).",
        "concept_tag": "Event Loop & Microtasks",
        "version": 1,
    },
    {
        "id": "ts-03",
        "skill": "JavaScript and TypeScript",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "TypeScript `unknown` vs `any`",
        "prompt": "Why is `unknown` preferred over `any` when accepting untrusted external API responses in TypeScript?",
        "code_snippet": None,
        "options": [
            "`unknown` is type-safe: TypeScript forces you to perform narrowing or type assertion before using any properties.",
            "`unknown` automatically validates JSON schemas at runtime.",
            "`unknown` reduces the transpiled JavaScript file size.",
            "`any` disables strict null checks globally across the entire project.",
        ],
        "correct_answer": "`unknown` is type-safe: TypeScript forces you to perform narrowing or type assertion before using any properties.",
        "explanation": "`unknown` is the type-safe counterpart of `any`. Any value can be assigned to `unknown`, but operations on it are disallowed until proven safe through type guards or narrowing.",
        "concept_tag": "Type Safety",
        "version": 1,
    },
    {
        "id": "ts-04",
        "skill": "JavaScript and TypeScript",
        "question_type": "code_reading",
        "difficulty": "advanced",
        "title": "Generics & Keyof Operator",
        "prompt": "What does the return type of `getProperty(obj, 'title')` resolve to?",
        "code_snippet": "function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}",
        "options": [
            "The exact indexed type `T['title']` matching the property's declared type.",
            "Always `any`.",
            "A Promise of `T`.",
            "String.",
        ],
        "correct_answer": "The exact indexed type `T['title']` matching the property's declared type.",
        "explanation": "`K extends keyof T` constrains `K` to valid property keys of `T`, and `T[K]` accesses the specific type of that property at compile-time.",
        "concept_tag": "Advanced Generics",
        "version": 1,
    },
    {
        "id": "ts-05",
        "skill": "JavaScript and TypeScript",
        "question_type": "short_answer",
        "difficulty": "intermediate",
        "title": "Nullish Coalescing vs Logical OR",
        "prompt": "What is the output of `0 ?? 42` and `0 || 42` in JavaScript?",
        "code_snippet": "console.log(0 ?? 42, 0 || 42);",
        "options": ["0 42", "42 42", "0 0", "42 0"],
        "correct_answer": "0 42",
        "explanation": "`??` only falls back on `null` or `undefined`. `||` falls back on any falsy value, including `0`, `\"\"`, and `false`.",
        "concept_tag": "Operators & Coercion",
        "version": 1,
    },

    # ---------- 4. React ----------
    {
        "id": "react-01",
        "skill": "React",
        "question_type": "debugging",
        "difficulty": "intermediate",
        "title": "Stale Closure in useEffect",
        "prompt": "Why does this counter interval print `1` indefinitely instead of incrementing every second?",
        "code_snippet": "function Counter() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => { setCount(count + 1); }, 1000);\n    return () => clearInterval(id);\n  }, []); // empty dependency array\n}",
        "options": [
            "The effect closure captured `count = 0` on initial render; using functional update `setCount(prev => prev + 1)` fixes it.",
            "`setInterval` is not supported inside React effects.",
            "`useState` cannot store integer numbers.",
            "The cleanup function `clearInterval` prevents the timer from starting.",
        ],
        "correct_answer": "The effect closure captured `count = 0` on initial render; using functional update `setCount(prev => prev + 1)` fixes it.",
        "explanation": "Because `[]` has no dependencies, the interval callback captures `count` from the initial render. Using the functional updater form `setCount(prev => prev + 1)` accesses the fresh state.",
        "concept_tag": "Stale Closures & State",
        "version": 1,
    },
    {
        "id": "react-02",
        "skill": "React",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "React Keys & Reconciliation",
        "prompt": "Why should array indices never be used as `key` props for dynamic lists where items can be reordered, inserted, or filtered?",
        "code_snippet": "{items.map((item, index) => <EvidenceCard key={index} data={item} />)}",
        "options": [
            "Index keys cause React to mismatch internal component state and DOM inputs when elements shift positions.",
            "React throws a runtime SyntaxError if `index` is passed to `key`.",
            "Indices cause network re-fetching on every keystroke.",
            "Index keys force React to re-render in synchronous legacy mode.",
        ],
        "correct_answer": "Index keys cause React to mismatch internal component state and DOM inputs when elements shift positions.",
        "explanation": "React's diffing algorithm uses `key` to match subtrees across renders. If keys are array indices, shifting or inserting items preserves the wrong local component state (like focused inputs).",
        "concept_tag": "Reconciliation & Keys",
        "version": 1,
    },
    {
        "id": "react-03",
        "skill": "React",
        "question_type": "code_reading",
        "difficulty": "advanced",
        "title": "useCallback & Referential Equality",
        "prompt": "When is wrapping a callback in `useCallback` truly beneficial in React?",
        "code_snippet": "const handleSelect = useCallback((id) => { setSelected(id); }, []);",
        "options": [
            "When passing the callback to a child component memoized with `React.memo` or into dependency arrays of downstream effects.",
            "For all functions everywhere in all components regardless of memoization.",
            "To make the function run asynchronously on a Web Worker.",
            "To prevent garbage collection of old closures.",
        ],
        "correct_answer": "When passing the callback to a child component memoized with `React.memo` or into dependency arrays of downstream effects.",
        "explanation": "`useCallback` preserves referential equality across re-renders. It provides performance gains when preventing unnecessary re-renders of memoized children (`React.memo`) or avoiding triggering effect runs.",
        "concept_tag": "Performance Optimization",
        "version": 1,
    },
    {
        "id": "react-04",
        "skill": "React",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "React Batching in React 18+",
        "prompt": "How does React 18 handle multiple state updates triggered inside a native Promise or `setTimeout` callback?",
        "code_snippet": "setTimeout(() => {\n  setLoading(false);\n  setData(result);\n  setCount(c => c + 1);\n}, 100);",
        "options": [
            "Automatic batching groups all updates into a single re-render.",
            "React triggers three separate synchronous DOM re-renders.",
            "React throws an `UnhandledBatchException`.",
            "React cancels the third update.",
        ],
        "correct_answer": "Automatic batching groups all updates into a single re-render.",
        "explanation": "React 18 introduced Automatic Batching for all updates by default, whether inside promises, timeouts, or native event handlers.",
        "concept_tag": "Automatic Batching",
        "version": 1,
    },
    {
        "id": "react-05",
        "skill": "React",
        "question_type": "short_answer",
        "difficulty": "intermediate",
        "title": "Custom Hook Rules",
        "prompt": "What naming convention MUST a function follow to be recognized by React's linter as a Custom Hook?",
        "code_snippet": None,
        "options": [
            "Must start with lowercase 'use' followed by a capital letter (e.g., `useAssessment`)",
            "Must start with 'get' (e.g., `getAssessment`)",
            "Must be decorated with `@Hook`",
            "Must end with 'Provider'",
        ],
        "correct_answer": "Must start with lowercase 'use' followed by a capital letter (e.g., `useAssessment`)",
        "explanation": "The `eslint-plugin-react-hooks` rule identifies custom hooks by the `use` prefix, enforcing the Rules of Hooks (must not be called inside loops or conditionals).",
        "concept_tag": "Custom Hooks",
        "version": 1,
    },

    # ---------- 5. SQL and databases ----------
    {
        "id": "sql-01",
        "skill": "SQL and databases",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "B-Tree Index Composite Prefix Rule",
        "prompt": "Given a table with composite index `idx_user_status (user_id, status, created_at)`, which query CANNOT effectively utilize the index?",
        "code_snippet": "-- Index: (user_id, status, created_at)",
        "options": [
            "SELECT * FROM audits WHERE status = 'COMPLETED' AND created_at > '2026-01-01';",
            "SELECT * FROM audits WHERE user_id = 'u123';",
            "SELECT * FROM audits WHERE user_id = 'u123' AND status = 'COMPLETED';",
            "SELECT * FROM audits WHERE user_id = 'u123' AND status = 'COMPLETED' AND created_at > '2026-01-01';",
        ],
        "correct_answer": "SELECT * FROM audits WHERE status = 'COMPLETED' AND created_at > '2026-01-01';",
        "explanation": "B-Tree composite indexes follow the leftmost prefix rule. A query filtering only on `status` and `created_at` skips the leading index column (`user_id`), forcing a full table scan.",
        "concept_tag": "Indexes & Leftmost Prefix",
        "version": 1,
    },
    {
        "id": "sql-02",
        "skill": "SQL and databases",
        "question_type": "code_reading",
        "difficulty": "advanced",
        "title": "ACID Isolation Levels & Phantom Reads",
        "prompt": "Which SQL transaction isolation level guarantees prevention of Dirty Reads, Non-Repeatable Reads, AND Phantom Reads?",
        "code_snippet": None,
        "options": [
            "SERIALIZABLE",
            "REPEATABLE READ",
            "READ COMMITTED",
            "READ UNCOMMITTED",
        ],
        "correct_answer": "SERIALIZABLE",
        "explanation": "`SERIALIZABLE` is the highest isolation level. It emulates serial transaction execution, using range locks or multiversion serializable snapshot isolation (SSI) to prevent phantom insertions.",
        "concept_tag": "ACID & Isolation",
        "version": 1,
    },
    {
        "id": "sql-03",
        "skill": "SQL and databases",
        "question_type": "debugging",
        "difficulty": "intermediate",
        "title": "N+1 Query Problem Detection",
        "prompt": "What is the standard architectural fix when an ORM triggers 101 queries to fetch 100 students and their target jobs?",
        "code_snippet": "# Python / SQLAlchemy\nstudents = db.query(Student).all()\nfor s in students:\n    print(s.target_job.title) # triggers separate SELECT per iteration",
        "options": [
            "Use eager loading (`joinedload` or `selectinload` in SQLAlchemy, or JOIN with `IN (...)`).",
            "Increase database connection pool size from 10 to 1000.",
            "Run queries inside a multi-threaded while loop.",
            "Switch the database column from VARCHAR to TEXT.",
        ],
        "correct_answer": "Use eager loading (`joinedload` or `selectinload` in SQLAlchemy, or JOIN with `IN (...)`).",
        "explanation": "The N+1 problem occurs when lazy-loading traverses relationships. Eager loading loads related entities in a single JOIN or secondary `WHERE id IN (...)` query.",
        "concept_tag": "ORM & N+1 Queries",
        "version": 1,
    },
    {
        "id": "sql-04",
        "skill": "SQL and databases",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "HAVING vs WHERE Clause",
        "prompt": "What is the key difference between `WHERE` and `HAVING` in SQL?",
        "code_snippet": None,
        "options": [
            "`WHERE` filters individual rows before aggregation; `HAVING` filters grouped rows after `GROUP BY` aggregate functions.",
            "`WHERE` only works on numbers; `HAVING` only works on strings.",
            "`HAVING` is executed by the client; `WHERE` is executed by the database engine.",
            "There is no difference; they are interchangeable aliases.",
        ],
        "correct_answer": "`WHERE` filters individual rows before aggregation; `HAVING` filters grouped rows after `GROUP BY` aggregate functions.",
        "explanation": "`WHERE` filters input rows prior to aggregation and cannot evaluate aggregate functions like `COUNT(*)`. `HAVING` filters groups produced by `GROUP BY`.",
        "concept_tag": "Aggregations & Filtering",
        "version": 1,
    },
    {
        "id": "sql-05",
        "skill": "SQL and databases",
        "question_type": "short_answer",
        "difficulty": "intermediate",
        "title": "Foreign Key Cascade Constraints",
        "prompt": "Which foreign key action automatically deletes child proof tasks when the parent assessment row is deleted?",
        "code_snippet": "FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE ???",
        "options": ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"],
        "correct_answer": "CASCADE",
        "explanation": "`ON DELETE CASCADE` instructs the relational engine to automatically propagate parent row deletions to all referencing child rows.",
        "concept_tag": "Constraints & Cascades",
        "version": 1,
    },

    # ---------- 6. REST APIs ----------
    {
        "id": "api-01",
        "skill": "REST APIs",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "HTTP Idempotency Semantics",
        "prompt": "Which HTTP methods are required by the HTTP/1.1 specification to be idempotent?",
        "code_snippet": None,
        "options": [
            "GET, PUT, DELETE, HEAD, OPTIONS",
            "POST and PATCH only",
            "POST, PUT, and GET",
            "All HTTP methods are idempotent by definition",
        ],
        "correct_answer": "GET, PUT, DELETE, HEAD, OPTIONS",
        "explanation": "An idempotent method produces the same server state whether executed once or multiple times consecutively. `POST` and `PATCH` are non-idempotent by default.",
        "concept_tag": "HTTP Idempotency",
        "version": 1,
    },
    {
        "id": "api-02",
        "skill": "REST APIs",
        "question_type": "debugging",
        "difficulty": "intermediate",
        "title": "HTTP 401 vs 403 Status Codes",
        "prompt": "A student attempts to delete a recruiter's job posting with a valid signed JWT. Which HTTP status code MUST the API return?",
        "code_snippet": None,
        "options": [
            "403 Forbidden (authenticated identity lacks required role permission)",
            "401 Unauthorized (unauthenticated or invalid token)",
            "404 Not Found",
            "500 Internal Server Error",
        ],
        "correct_answer": "403 Forbidden (authenticated identity lacks required role permission)",
        "explanation": "`401 Unauthorized` specifically indicates missing or invalid authentication credentials. `403 Forbidden` indicates the client identity is authenticated, but lacks permission to access the resource.",
        "concept_tag": "Authentication vs Authorization",
        "version": 1,
    },
    {
        "id": "api-03",
        "skill": "REST APIs",
        "question_type": "code_reading",
        "difficulty": "intermediate",
        "title": "REST Resource URL Design",
        "prompt": "Which URL conforms to RESTful resource-oriented naming best practices?",
        "code_snippet": None,
        "options": [
            "`GET /api/v1/students/{id}/proof-tasks`",
            "`GET /api/v1/getStudentProofTasksById?id=123`",
            "`POST /api/v1/doFetch_tasks_for_student`",
            "`POST /api/v1/taskAction/delete/{id}`",
        ],
        "correct_answer": "`GET /api/v1/students/{id}/proof-tasks`",
        "explanation": "RESTful URIs identify resources using plural nouns and sub-collections (`/students/{id}/proof-tasks`) and use HTTP verbs (`GET`, `POST`, `DELETE`) for actions rather than embedding verbs in URIs.",
        "concept_tag": "Resource URI Design",
        "version": 1,
    },
    {
        "id": "api-04",
        "skill": "REST APIs",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "CORS Preflight Mechanism",
        "prompt": "When a web browser sends a `POST` request with `Content-Type: application/json` to a different domain, what preflight request is dispatched first?",
        "code_snippet": None,
        "options": [
            "An `OPTIONS` HTTP request with `Access-Control-Request-Method` headers.",
            "A `HEAD` request checking DNS resolution.",
            "A `GET /ping` health request.",
            "Browsers never preflight JSON POST requests.",
        ],
        "correct_answer": "An `OPTIONS` HTTP request with `Access-Control-Request-Method` headers.",
        "explanation": "Cross-Origin requests with non-simple headers (like `application/json`) trigger an `OPTIONS` preflight request where the browser checks if the server permits the origin and headers.",
        "concept_tag": "CORS & Security",
        "version": 1,
    },
    {
        "id": "api-05",
        "skill": "REST APIs",
        "question_type": "short_answer",
        "difficulty": "intermediate",
        "title": "Rate Limiting HTTP Header",
        "prompt": "Which standard HTTP response code signals that a client has exhausted their API rate limit quota?",
        "code_snippet": None,
        "options": ["429", "503", "400", "408"],
        "correct_answer": "429",
        "explanation": "HTTP `429 Too Many Requests` indicates the user has sent too many requests in a given amount of time (rate limited), often paired with a `Retry-After` header.",
        "concept_tag": "Rate Limiting & Resilience",
        "version": 1,
    },

    # ---------- 7. Git and GitHub ----------
    {
        "id": "git-01",
        "skill": "Git and GitHub",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "Git Rebase vs Merge",
        "prompt": "What is the primary difference between `git merge main` and `git rebase main` on a feature branch?",
        "code_snippet": None,
        "options": [
            "`rebase` replays feature commits on top of the tip of main to create a linear history; `merge` creates a new merge commit preserving exact chronological branch shape.",
            "`rebase` deletes all commit messages permanently.",
            "`merge` cannot be performed if conflicts exist.",
            "`rebase` pushes code directly to GitHub production servers.",
        ],
        "correct_answer": "`rebase` replays feature commits on top of the tip of main to create a linear history; `merge` creates a new merge commit preserving exact chronological branch shape.",
        "explanation": "`git rebase` rewrites commit SHAs by re-applying commits one by one on the target base, producing a clean linear project history. `git merge` records a two-parent merge commit.",
        "concept_tag": "Branching Strategies",
        "version": 1,
    },
    {
        "id": "git-02",
        "skill": "Git and GitHub",
        "question_type": "debugging",
        "difficulty": "intermediate",
        "title": "Recovering Lost Commits with Reflog",
        "prompt": "A developer accidentally ran `git reset --hard HEAD~2` and lost unpushed commits. What Git tool inspects recent HEAD history to recover them?",
        "code_snippet": None,
        "options": [
            "`git reflog` followed by `git reset --hard HEAD@{n}`",
            "`git status --restore`",
            "`git log --deleted-all`",
            "It is mathematically impossible to recover reset commits in Git.",
        ],
        "correct_answer": "`git reflog` followed by `git reset --hard HEAD@{n}`",
        "explanation": "`git reflog` records updates to branch tips and HEAD locally. As long as unreferenced commits haven't been garbage-collected (`git gc`), their SHAs can be inspected and restored.",
        "concept_tag": "Git Reflog & Recovery",
        "version": 1,
    },
    {
        "id": "git-03",
        "skill": "Git and GitHub",
        "question_type": "code_reading",
        "difficulty": "intermediate",
        "title": "Git Internal Objects",
        "prompt": "Which four fundamental object types comprise the Git internal object database?",
        "code_snippet": None,
        "options": [
            "blob, tree, commit, tag",
            "file, folder, branch, remote",
            "index, stage, stash, diff",
            "head, origin, upstream, master",
        ],
        "correct_answer": "blob, tree, commit, tag",
        "explanation": "Git stores content as content-addressable SHA objects: `blob` (file contents), `tree` (directories and filenames), `commit` (commit metadata + root tree pointer), and annotated `tag`.",
        "concept_tag": "Git Internals",
        "version": 1,
    },
    {
        "id": "git-04",
        "skill": "Git and GitHub",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "GitHub Pull Request Workflows",
        "prompt": "What is the security hazard of enabling `pull_request_target` trigger in GitHub Actions on public open-source repos?",
        "code_snippet": None,
        "options": [
            "It runs in the context of the base repository with access to production secrets, allowing malicious PRs to exfiltrate secrets if untrusted PR code is checked out.",
            "It automatically approves all PRs without human review.",
            "It blocks git pushes from authorized maintainers.",
            "It corrupts git commit author signatures.",
        ],
        "correct_answer": "It runs in the context of the base repository with access to production secrets, allowing malicious PRs to exfiltrate secrets if untrusted PR code is checked out.",
        "explanation": "`pull_request_target` executes in the context of the target repository and has access to repository secrets. Checking out and running untrusted fork code in this trigger leads to secret leakage.",
        "concept_tag": "CI/CD & Security",
        "version": 1,
    },
    {
        "id": "git-05",
        "skill": "Git and GitHub",
        "question_type": "short_answer",
        "difficulty": "intermediate",
        "title": "Stashing Untracked Files",
        "prompt": "Which flag must you pass to `git stash` to also include untracked new files created in your workspace?",
        "code_snippet": "git stash -???",
        "options": [
            "-u (or --include-untracked)",
            "-a (or --all)",
            "-f (or --force)",
            "-m (or --message)",
        ],
        "correct_answer": "-u (or --include-untracked)",
        "explanation": "`git stash` by default only saves tracked modifications. Passing `-u` (or `--include-untracked`) instructs Git to stash untracked files as well.",
        "concept_tag": "Workspace & Stash",
        "version": 1,
    },

    # ---------- 8. Data structures and algorithms ----------
    {
        "id": "dsa-01",
        "skill": "Data structures and algorithms",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "Hash Table Collisions & Time Complexity",
        "prompt": "What is the worst-case time complexity of lookup in a hash table where all N elements collide into the same bucket (without treeification)?",
        "code_snippet": None,
        "options": ["O(N)", "O(1)", "O(log N)", "O(N log N)"],
        "correct_answer": "O(N)",
        "explanation": "If all keys hash to the same bucket and collisions are resolved via chaining with a linked list, searching for a key degrades to traversing the entire list of N items: O(N).",
        "concept_tag": "Hash Tables & Complexity",
        "version": 1,
    },
    {
        "id": "dsa-02",
        "skill": "Data structures and algorithms",
        "question_type": "code_reading",
        "difficulty": "intermediate",
        "title": "Two-Pointer Technique for Sorted Arrays",
        "prompt": "Given a sorted array of numbers, what is the optimal time and auxiliary space complexity to find two numbers that sum to target T?",
        "code_snippet": "def two_sum_sorted(arr, target):\n    left, right = 0, len(arr) - 1\n    while left < right:\n        s = arr[left] + arr[right]\n        if s == target: return (left, right)\n        elif s < target: left += 1\n        else: right -= 1",
        "options": [
            "Time: O(N), Space: O(1)",
            "Time: O(N^2), Space: O(N)",
            "Time: O(log N), Space: O(1)",
            "Time: O(N log N), Space: O(N)",
        ],
        "correct_answer": "Time: O(N), Space: O(1)",
        "explanation": "Because the array is already sorted, the two pointers traverse inward at most N times total (O(N) time) using only two integer pointer variables (O(1) extra space).",
        "concept_tag": "Two Pointers",
        "version": 1,
    },
    {
        "id": "dsa-03",
        "skill": "Data structures and algorithms",
        "question_type": "debugging",
        "difficulty": "intermediate",
        "title": "Binary Search Midpoint Overflow",
        "prompt": "In languages like Java or C++, why is `int mid = (low + high) / 2;` prone to a critical bug when `low` and `high` are large positive integers?",
        "code_snippet": None,
        "options": [
            "Integer overflow: `low + high` can exceed 2^31 - 1, producing a negative number and triggering an `ArrayIndexOutOfBoundsException`.",
            "Floating point division generates non-terminating decimals.",
            "It produces uneven partitions in even-length arrays.",
            "Compilers reject the division operator on integer variables.",
        ],
        "correct_answer": "Integer overflow: `low + high` can exceed 2^31 - 1, producing a negative number and triggering an `ArrayIndexOutOfBoundsException`.",
        "explanation": "If `low + high > Integer.MAX_VALUE`, signed 32-bit integer overflow wraps around to a negative number. Writing `low + (high - low) / 2` safely avoids overflow.",
        "concept_tag": "Binary Search & Overflow",
        "version": 1,
    },
    {
        "id": "dsa-04",
        "skill": "Data structures and algorithms",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "BFS vs DFS for Shortest Path",
        "prompt": "Which graph traversal algorithm guarantees finding the shortest path (minimum number of edges) in an unweighted directed graph?",
        "code_snippet": None,
        "options": [
            "Breadth-First Search (BFS) using a FIFO queue",
            "Depth-First Search (DFS) using a LIFO stack",
            "A* with a constant heuristic",
            "Topological Sort",
        ],
        "correct_answer": "Breadth-First Search (BFS) using a FIFO queue",
        "explanation": "BFS explores vertices level by level in order of their distance from the source. The first time a target vertex is reached, the path is guaranteed to have minimum edge count.",
        "concept_tag": "Graph Algorithms",
        "version": 1,
    },
    {
        "id": "dsa-05",
        "skill": "Data structures and algorithms",
        "question_type": "short_answer",
        "difficulty": "intermediate",
        "title": "Heap Insert & Extract Min Complexity",
        "prompt": "What is the time complexity to insert an element into a binary min-heap with N elements?",
        "code_snippet": None,
        "options": ["O(log N)", "O(1)", "O(N)", "O(N^2)"],
        "correct_answer": "O(log N)",
        "explanation": "Inserting adds the node at the next available leaf position and percolates it up along the tree height, which is bounded by O(log N) in a complete binary tree.",
        "concept_tag": "Heaps & Priority Queues",
        "version": 1,
    },

    # ---------- 9. Testing and debugging ----------
    {
        "id": "test-01",
        "skill": "Testing and debugging",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "Testing Pyramid Principles",
        "prompt": "According to the canonical Testing Pyramid, which tier should comprise the largest volume of tests in a well-tested service?",
        "code_snippet": None,
        "options": [
            "Fast, isolated unit tests at the base",
            "Manual end-to-end browser tests",
            "Heavy staging integration tests",
            "Smoke tests executed only in production",
        ],
        "correct_answer": "Fast, isolated unit tests at the base",
        "explanation": "Unit tests are fast to execute, deterministic, cheap to maintain, and isolate failures to specific units of logic, forming the broad foundation of the pyramid.",
        "concept_tag": "Testing Pyramid",
        "version": 1,
    },
    {
        "id": "test-02",
        "skill": "Testing and debugging",
        "question_type": "debugging",
        "difficulty": "intermediate",
        "title": "Test Flakiness & Time Mocks",
        "prompt": "Why is testing timestamp expiry with `time.sleep(2)` or `Date.now()` an antipattern, and what is the robust remedy?",
        "code_snippet": None,
        "options": [
            "Real sleeps cause slow CI builds and non-deterministic race conditions; mock or inject a controllable clock interface (e.g. `freezegun` or fake timers).",
            "Tests must only run on UTC leap years.",
            "`time.sleep` crashes testing frameworks.",
            "Timestamps can never be tested in unit tests.",
        ],
        "correct_answer": "Real sleeps cause slow CI builds and non-deterministic race conditions; mock or inject a controllable clock interface (e.g. `freezegun` or fake timers).",
        "explanation": "Wall-clock sleeps make test suites slow and prone to timing jitter in busy CI runners. Injecting or mocking the clock provider ensures instant and deterministic time advancement.",
        "concept_tag": "Flaky Tests & Clock Mocks",
        "version": 1,
    },
    {
        "id": "test-03",
        "skill": "Testing and debugging",
        "question_type": "code_reading",
        "difficulty": "intermediate",
        "title": "Mocks vs Stubs vs Spies",
        "prompt": "What is the specific definition of a Test Spy in test double terminology?",
        "code_snippet": None,
        "options": [
            "A test double that wraps a real object or stub and records interactions (invocations, arguments, call counts) for later assertion.",
            "A double that only provides pre-canned answers to calls without recording anything.",
            "A complete dummy that is passed but never used.",
            "A full database replica running in memory.",
        ],
        "correct_answer": "A test double that wraps a real object or stub and records interactions (invocations, arguments, call counts) for later assertion.",
        "explanation": "Spies record information about how they were called (e.g., `jest.spyOn`, `unittest.mock`). Stubs return fixed answers. Mocks verify behavioral expectations.",
        "concept_tag": "Test Doubles",
        "version": 1,
    },
    {
        "id": "test-04",
        "skill": "Testing and debugging",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "Code Coverage Caveats",
        "prompt": "Why does achieving 100% line coverage NOT guarantee that software is free of bugs?",
        "code_snippet": None,
        "options": [
            "Line coverage measures executed lines, but does not verify all logical branch permutations, edge case inputs (null, overflow), or concurrency race conditions.",
            "Coverage tools report false positives for comments.",
            "Coverage is only valid if written in C++.",
            "Compilers discard coverage reports at runtime.",
        ],
        "correct_answer": "Line coverage measures executed lines, but does not verify all logical branch permutations, edge case inputs (null, overflow), or concurrency race conditions.",
        "explanation": "Executing every line once does not test combinations of conditions, missing boundaries, null inputs, unexpected exceptions, or architectural race conditions.",
        "concept_tag": "Coverage Metrics & Limits",
        "version": 1,
    },
    {
        "id": "test-05",
        "skill": "Testing and debugging",
        "question_type": "short_answer",
        "difficulty": "intermediate",
        "title": "Property-Based Testing",
        "prompt": "What testing paradigm tests code by automatically generating hundreds of randomized inputs to assert invariants (e.g., Hypothesis, fast-check)?",
        "code_snippet": None,
        "options": [
            "Property-based testing",
            "Regression testing",
            "Manual exploratory testing",
            "Snapshot testing",
        ],
        "correct_answer": "Property-based testing",
        "explanation": "Property-based testing specifies universal invariants that must hold true for all valid inputs, while the framework generates and shrinks edge-case inputs.",
        "concept_tag": "Property-Based Testing",
        "version": 1,
    },

    # ---------- 10. Cloud and deployment fundamentals ----------
    {
        "id": "cloud-01",
        "skill": "Cloud and deployment fundamentals",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "Containers vs Virtual Machines",
        "prompt": "What is the fundamental architectural difference between Docker containers and traditional Virtual Machines?",
        "code_snippet": None,
        "options": [
            "Containers share the host operating system kernel and isolate processes via namespaces and cgroups; VMs virtualize hardware and run a full guest OS.",
            "Containers require hypervisor BIOS support; VMs do not.",
            "VMs cannot connect to TCP/IP networks.",
            "Containers can only run Python programs.",
        ],
        "correct_answer": "Containers share the host operating system kernel and isolate processes via namespaces and cgroups; VMs virtualize hardware and run a full guest OS.",
        "explanation": "Containers are lightweight process trees sharing the host Linux kernel, isolated via namespaces (pid, net, mnt) and bounded by cgroups. VMs run full independent guest kernels over a hypervisor.",
        "concept_tag": "Containerization",
        "version": 1,
    },
    {
        "id": "cloud-02",
        "skill": "Cloud and deployment fundamentals",
        "question_type": "debugging",
        "difficulty": "intermediate",
        "title": "Zero-Downtime Blue-Green Deployment",
        "prompt": "In a Blue-Green deployment strategy, what step ensures zero downtime when switching production traffic to the newly deployed release?",
        "code_snippet": None,
        "options": [
            "The router / load balancer switches incoming traffic from the active Blue environment to the fully verified Green environment in one atomic route update.",
            "All Blue servers are immediately hard-killed before Green is launched.",
            "The database schema is dropped and recreated while users are shopping.",
            "DNS TTL is set to 7 days.",
        ],
        "correct_answer": "The router / load balancer switches incoming traffic from the active Blue environment to the fully verified Green environment in one atomic route update.",
        "explanation": "Blue-Green keeps two identical production environments. The Green environment is warmed up and verified while Blue serves users. Switching the router/load balancer instantly routes traffic with zero downtime.",
        "concept_tag": "Deployment Strategies",
        "version": 1,
    },
    {
        "id": "cloud-03",
        "skill": "Cloud and deployment fundamentals",
        "question_type": "code_reading",
        "difficulty": "intermediate",
        "title": "12-Factor App Config Rule",
        "prompt": "According to the 12-Factor App methodology, where should application configuration (API keys, DB URLs) strictly be stored?",
        "code_snippet": None,
        "options": [
            "In environment variables injected into the execution process, completely separated from application code.",
            "Hardcoded directly in Git repository source files for version control.",
            "In unencrypted public S3 buckets.",
            "In local browser LocalStorage.",
        ],
        "correct_answer": "In environment variables injected into the execution process, completely separated from application code.",
        "explanation": "Factor III of The Twelve-Factor App specifies that config must be strictly separated from code and stored in environment variables, allowing the same build artifact to deploy across staging and production.",
        "concept_tag": "12-Factor Configuration",
        "version": 1,
    },
    {
        "id": "cloud-04",
        "skill": "Cloud and deployment fundamentals",
        "question_type": "multiple_choice",
        "difficulty": "intermediate",
        "title": "Kubernetes Liveness vs Readiness Probes",
        "prompt": "What happens when a pod fails its Kubernetes `readinessProbe` versus failing its `livenessProbe`?",
        "code_snippet": None,
        "options": [
            "Failed readiness probe removes the pod from service endpoints (stops traffic); failed liveness probe kills and restarts the container.",
            "Failed readiness probe deletes the cluster; failed liveness probe sends an email.",
            "Both probes perform identical container restart actions.",
            "Kubernetes ignores probe failures in production.",
        ],
        "correct_answer": "Failed readiness probe removes the pod from service endpoints (stops traffic); failed liveness probe kills and restarts the container.",
        "explanation": "A readiness probe signals if the pod is prepared to accept network traffic. A liveness probe catches deadlocks or hung processes and restarts the container if it fails.",
        "concept_tag": "Kubernetes Health Probes",
        "version": 1,
    },
    {
        "id": "cloud-05",
        "skill": "Cloud and deployment fundamentals",
        "question_type": "short_answer",
        "difficulty": "intermediate",
        "title": "Infrastructure as Code (IaC)",
        "prompt": "Which declarative open-source tool enables provisioning multi-cloud infrastructure using HashiCorp Configuration Language (HCL)?",
        "code_snippet": None,
        "options": ["Terraform", "Docker", "Git", "Jenkins"],
        "correct_answer": "Terraform",
        "explanation": "Terraform is an industry-standard declarative Infrastructure as Code tool that manages cloud resources across AWS, GCP, Azure, and others via state files and provider APIs.",
        "concept_tag": "Infrastructure as Code",
        "version": 1,
    },
]


class SkillSprintService:
    """
    Manages deterministic, versioned question bank, test-taking,
    backend grading, attempt history, and automatic career actions.
    """

    @staticmethod
    def seed_question_bank(db: Session) -> int:
        """Seed all 50 curated questions into SQLite database idempotently."""
        count = 0
        for q_data in QUESTION_BANK:
            existing = db.query(SkillSprintQuestion).filter(SkillSprintQuestion.id == q_data["id"]).first()
            if not existing:
                new_q = SkillSprintQuestion(
                    id=q_data["id"],
                    skill=q_data["skill"],
                    question_type=q_data["question_type"],
                    difficulty=q_data["difficulty"],
                    title=q_data["title"],
                    prompt=q_data["prompt"],
                    code_snippet=q_data.get("code_snippet"),
                    options_json=json.dumps(q_data.get("options", [])),
                    correct_answer=q_data["correct_answer"],
                    explanation=q_data["explanation"],
                    rubric_json=json.dumps({"concept": q_data.get("concept_tag", "general")}),
                    concept_tag=q_data.get("concept_tag", "general"),
                    version=q_data.get("version", 1),
                )
                db.add(new_q)
                count += 1
        if count > 0:
            db.commit()
        return count

    @staticmethod
    def get_supported_skills() -> List[Dict[str, Any]]:
        """Return list of supported searchable skills with question counts."""
        skills_summary = [
            {"skill": "Java", "category": "Backend & OOP", "icon": "Coffee", "questions_count": 5},
            {"skill": "Python", "category": "Backend & AI", "icon": "Terminal", "questions_count": 5},
            {"skill": "JavaScript and TypeScript", "category": "Full-Stack Core", "icon": "Code2", "questions_count": 5},
            {"skill": "React", "category": "Frontend Frameworks", "icon": "Layers", "questions_count": 5},
            {"skill": "SQL and databases", "category": "Data Systems", "icon": "Database", "questions_count": 5},
            {"skill": "REST APIs", "category": "Distributed Systems", "icon": "Globe", "questions_count": 5},
            {"skill": "Git and GitHub", "category": "DevOps & Collaboration", "icon": "GitBranch", "questions_count": 5},
            {"skill": "Data structures and algorithms", "category": "Core CS", "icon": "Cpu", "questions_count": 5},
            {"skill": "Testing and debugging", "category": "Quality Engineering", "icon": "CheckCircle2", "questions_count": 5},
            {"skill": "Cloud and deployment fundamentals", "category": "Cloud & Infra", "icon": "Cloud", "questions_count": 5},
        ]
        return skills_summary

    @staticmethod
    def get_questions_for_skill(db: Session, skill: str) -> List[Dict[str, Any]]:
        """
        Retrieve 5 questions for a sprint.
        CRITICAL SECURITY REQUIREMENT:
        Do NOT include `correct_answer` or `explanation` in the delivered payload!
        """
        SkillSprintService.seed_question_bank(db)
        questions = (
            db.query(SkillSprintQuestion)
            .filter(
                (SkillSprintQuestion.skill == skill) | (SkillSprintQuestion.skill.ilike(skill))
            )
            .order_by(SkillSprintQuestion.id)
            .limit(10)
            .all()
        )

        out = []
        for q in questions:
            options = json.loads(q.options_json) if q.options_json else []
            out.append({
                "id": q.id,
                "skill": q.skill,
                "question_type": q.question_type,
                "difficulty": q.difficulty,
                "title": q.title,
                "prompt": q.prompt,
                "code_snippet": q.code_snippet,
                "options": options,
                "concept_tag": q.concept_tag,
                "version": q.version,
            })
        return out

    @staticmethod
    def grade_sprint(
        db: Session,
        user_id: str,
        skill: str,
        answers: List[Dict[str, str]],
        target_job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Grade sprint on the backend.
        1. Validate each answer against the backend answer key.
        2. Skipped questions get 0 points.
        3. Identify strengths and weak concepts.
        4. Auto-generate or recommend a ProofTask to close the weakest gap.
        5. Update user's roadmap milestone.
        6. Persist attempt record.
        """
        SkillSprintService.seed_question_bank(db)
        user_answer_map = {a["question_id"]: a.get("answer", "").strip() for a in answers}

        questions = (
            db.query(SkillSprintQuestion)
            .filter(
                (SkillSprintQuestion.skill == skill) | (SkillSprintQuestion.skill.ilike(skill))
            )
            .order_by(SkillSprintQuestion.id)
            .limit(10)
            .all()
        )

        total_questions = len(questions)
        correct_count = 0
        review_details = []
        strengths = []
        weak_concepts = []

        for q in questions:
            user_ans = user_answer_map.get(q.id)
            is_correct = False
            if user_ans:
                # Case-insensitive or normalized check
                if user_ans.strip().lower() == q.correct_answer.strip().lower():
                    is_correct = True
                    correct_count += 1
                    strengths.append(q.concept_tag)
                else:
                    weak_concepts.append(q.concept_tag)
            else:
                weak_concepts.append(q.concept_tag)

            options = json.loads(q.options_json) if q.options_json else []
            review_details.append({
                "question_id": q.id,
                "title": q.title,
                "prompt": q.prompt,
                "code_snippet": q.code_snippet,
                "options": options,
                "user_answer": user_ans,
                "correct_answer": q.correct_answer,
                "is_correct": is_correct,
                "explanation": q.explanation,
                "concept_tag": q.concept_tag,
            })

        score_percent = int((correct_count / total_questions) * 100) if total_questions > 0 else 0

        # Unique strengths and weaknesses
        strengths = list(dict.fromkeys(strengths))
        weak_concepts = list(dict.fromkeys(weak_concepts))

        # 4. Automatic Career Action: recommend or generate a proof task for the weakest concept
        recommended_task = None
        if weak_concepts:
            primary_weakness = weak_concepts[0]
            task_title = f"Implement Practical Evidence for {skill} ({primary_weakness})"
            
            # Avoid duplicate pending task
            existing_task = (
                db.query(ProofTask)
                .filter(
                    ProofTask.user_id == user_id,
                    ProofTask.skill == skill,
                    ProofTask.status == "pending"
                )
                .first()
            )

            if not existing_task:
                target_filename = f"src/modules/{skill.lower().replace(' ', '_')}_handler.py" if "python" in skill.lower() else f"src/{skill.lower().replace(' ', '_')}.ts"
                new_task = ProofTask(
                    user_id=user_id,
                    requirement_id=f"REQ-{skill[:3].upper()}-SPRINT",
                    skill=skill,
                    title=task_title,
                    description=(
                        f"Targeted practice task generated from Skill Sprint result ({score_percent}%). "
                        f"Implement comprehensive unit tests and deterministic handling for {primary_weakness}."
                    ),
                    why_it_matters=(
                        f"Recruiter review identified {primary_weakness} as a critical requirement. "
                        f"Completing this task demonstrates repository code implementation rather than just quiz knowledge."
                    ),
                    target_file=target_filename,
                    acceptance_criteria_json=json.dumps([
                        f"Implement clean, modular functions addressing {primary_weakness}",
                        "Write isolated unit tests with >80% branch coverage",
                        "Verify deterministic error handling and edge cases",
                        "Commit changes with descriptive conventional commit messages"
                    ]),
                    test_scenarios_json=json.dumps([
                        f"Verify {primary_weakness} edge-case handling under stress",
                        "Confirm zero memory leaks or unhandled promise rejections"
                    ]),
                    estimated_hours=3,
                    status="pending"
                )
                db.add(new_task)
                db.commit()
                db.refresh(new_task)
                recommended_task = {
                    "id": new_task.id,
                    "title": new_task.title,
                    "skill": new_task.skill,
                    "target_file": new_task.target_file,
                    "status": new_task.status,
                    "action": "created_new_proof_task",
                }
            else:
                recommended_task = {
                    "id": existing_task.id,
                    "title": existing_task.title,
                    "skill": existing_task.skill,
                    "target_file": existing_task.target_file,
                    "status": existing_task.status,
                    "action": "linked_existing_proof_task",
                }

        # 5. Update Roadmap progress
        milestones = db.query(RoadmapMilestone).filter(RoadmapMilestone.user_id == user_id).all()
        for m in milestones:
            skills_list = json.loads(m.skills_json) if m.skills_json else []
            if any(s.lower() in skill.lower() for s in skills_list) and m.status == "not_started":
                m.status = "in_progress"
                db.commit()
                break

        # 6. Save attempt
        attempt_id = str(uuid.uuid4())
        attempt = SkillSprintAttempt(
            id=attempt_id,
            user_id=user_id,
            skill=skill,
            target_job_id=target_job_id,
            total_questions=total_questions,
            correct_answers=correct_count,
            score_percent=score_percent,
            strengths_json=json.dumps(strengths),
            weak_concepts_json=json.dumps(weak_concepts),
            user_answers_json=json.dumps(user_answer_map),
            review_details_json=json.dumps(review_details),
            created_at=datetime.now(timezone.utc),
        )
        db.add(attempt)
        db.commit()

        return {
            "id": attempt_id,
            "skill": skill,
            "target_job_id": target_job_id,
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "score_percent": score_percent,
            "strengths": strengths,
            "weak_concepts": weak_concepts,
            "recommended_task": recommended_task,
            "review_details": review_details,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def get_attempt_history(db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Return history of all past sprint attempts for a student."""
        attempts = (
            db.query(SkillSprintAttempt)
            .filter(SkillSprintAttempt.user_id == user_id)
            .order_by(SkillSprintAttempt.created_at.desc())
            .all()
        )
        results = []
        for a in attempts:
            results.append({
                "id": a.id,
                "skill": a.skill,
                "score_percent": a.score_percent,
                "total_questions": a.total_questions,
                "correct_answers": a.correct_answers,
                "strengths": json.loads(a.strengths_json) if a.strengths_json else [],
                "weak_concepts": json.loads(a.weak_concepts_json) if a.weak_concepts_json else [],
                "created_at": a.created_at.isoformat() if a.created_at else "",
            })
        return results
