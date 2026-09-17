import { Center, deck, Pad, Slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "./slides.css";

class Cover extends Slide {
  static path = "intro";

  render() {
    return (
      <Center>
        <h1>Slides, written in JSX</h1>
        <p class="lead">
          No React, no virtual DOM. JSX becomes calls to suraido.js's own <code>jsx()</code>.
        </p>
        <img src="/logo.svg" alt="" width="160" height="160" />
      </Center>
    );
  }
}

class Agenda extends Slide {
  static path = "parts";
  static steps = 4;

  render() {
    return (
      <Pad>
        <h2>What is inside</h2>
        <ul>
          <Step n={1} as="li">
            <code>jsx-runtime</code> — eight lines turning JSX into vnodes
          </Step>
          <Step n={2} as="li">
            <code>dom.ts</code> — vnodes into DOM, and state on a class
          </Step>
          <Step n={3} as="li">
            <code>deck.tsx</code> — scaling the fixed canvas, and the keys
          </Step>
        </ul>
      </Pad>
    );
  }
}

/** State lives on the class. Leaving the slide unmounts it, and the state resets. */
class Demo extends Slide<{}, { count: number }> {
  static path = "state";
  static steps = 2;
  state = { count: 0 };

  render() {
    return (
      <Pad>
        <h2>State on a class</h2>
        <button
          class="big"
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            this.setState((s) => ({ count: s.count + 1 }));
          }}
        >
          Pressed {this.state.count} times
        </button>
        <Step n={1}>
          <p class="lead">This appears on the second key press</p>
        </Step>
      </Pad>
    );
  }
}

// List the classes themselves. Wrapping one drops its static steps / path.
deck([Cover, Agenda, Demo]);
