import { Center, deck, Pad, slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/olivia.css";
import "./slides.css";

const Cover = slide({ path: "intro" }, () => (
  <Center>
    <h1>Title</h1>
    <p class="lead">Subtitle</p>
  </Center>
));

const Points = slide(() => (
  <Pad>
    <h2>What you want to say</h2>
    <ul>
      <Step>
        <li>First point</li>
      </Step>
      <Step>
        <li>Second point</li>
      </Step>
    </ul>
  </Pad>
));

// The order here is the order they are shown in.
deck([Cover, Points]);
