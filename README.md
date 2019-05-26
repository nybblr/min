# min

**Pure, immutable middleware framework for elegant backends.**

A minimal approach to middleware with an ambitious goal: to eliminate the need for statements by enabling powerful expressions.

## Style

*Expressions* over *statements*.

Expressions are an indicator of code quality: statements make it easy to mask side effects and poor design in plain sight. With the pure, limited flow of expressions, it coaxes the developer (and framework author) into smaller, cohesive functions and better design patterns.

If you can build a non-trivial backend where 95% of the code is written with implicit returning arrow functions, you're on track to a robust codebase.

- *Functions* over *classes*: everything is a function. Because middleware is invokable with the same signature, a strict type hierarchy becomes unnecessary.
- *Stacks* and *custom exceptions* over *custom flow control*: JavaScript already has fantastic flow control with returns and exceptions. Why reimplement it?
- *Immutability* over *object reuse*: forces code to phrase work solely in terms of return value.
- *Composition* over *inspection*: don't ask a middleware layer how it does its work so you can modify it: just invoke the layer and augment the return value.
- *Return values* over *mutation*: the response is simply the return value.
- 100% test driven: API design is based on easiest API style to test.

## Inspiration

- Express, particularly the terse API style.
- Koa, for leveraging async functions to create two-way middleware that handles exceptions robustly.
- Recompose, for the style of behavior composition with higher-order functions.