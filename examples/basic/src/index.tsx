import { Center, deck, Pad, Slide, slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "./slides.css";

const Cover = slide({ path: "intro" }, () => (
  <Center>
    <h1>Slides, written in JSX</h1>
    <p class="lead">
      No React, no virtual DOM. JSX becomes calls to suraido.js's own <code>jsx()</code>.
    </p>
    <img src="/logo.svg" alt="" width="160" height="160" />
  </Center>
));

const Agenda = slide({ path: "parts" }, () => (
  <Pad>
    <h2>What is inside</h2>
    <ul>
      <Step n={1}>
        <li>
          <code>jsx-runtime</code> — eight lines turning JSX into vnodes
        </li>
      </Step>
      <Step n={2}>
        <li>
          <code>dom.ts</code> — vnodes into DOM, and state on a class
        </li>
      </Step>
      <Step n={3}>
        <li>
          <code>deck.tsx</code> — scaling the fixed canvas, and the keys
        </li>
      </Step>
    </ul>
  </Pad>
));

/** State lives on the class. Leaving the slide unmounts it, and the state resets. */
class Demo extends Slide<{}, { count: number }> {
  static path = "state";
  state = { count: 0 };

  render() {
    return (
      <Pad>
        <h2>State on a class</h2>
        <button
          class="big"
          onClick={() => {
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

// List the classes themselves. Wrapping one drops its statics, and TypeScript says so.
deck([Cover, Agenda, Demo]);
