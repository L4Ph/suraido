import { Center, deck, Pad, Slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/olivia.css";
import "./slides.css";

class Cover extends Slide {
  static path = "intro";

  render() {
    return (
      <Center>
        <h1>Title</h1>
        <p class="lead">Subtitle</p>
      </Center>
    );
  }
}

class Points extends Slide {
  render() {
    return (
      <Pad>
        <h2>What you want to say</h2>
        <ul>
          <Step n={1}>
            <li>First point</li>
          </Step>
          <Step n={2}>
            <li>Second point</li>
          </Step>
        </ul>
      </Pad>
    );
  }
}

// List the classes themselves. Wrapping one drops its static steps / path.
deck([Cover, Points]);
