import { Cover, deck, Pad, slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/olivia.css";
import "./slides.css";

const Intro = slide({ path: "intro" }, () => (
  <Cover title="Title" byline="Subtitle" align="center" />
));

const Content = slide({ path: "content" }, () => (
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
deck([Intro, Content]);
