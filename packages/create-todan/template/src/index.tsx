import { Slide, Step, Center, Pad, deck } from 'todan'
import 'todan/deck.css'
import 'todan/themes/olivia.css'
import './slides.css'

class Cover extends Slide {
  static path = 'intro'

  render() {
    return (
      <Center>
        <h1>タイトル</h1>
        <p class="lead">サブタイトル</p>
      </Center>
    )
  }
}

class Points extends Slide {
  static steps = 3

  render() {
    return (
      <Pad>
        <h2>言いたいこと</h2>
        <ul>
          <Step n={1} as="li">ひとつめ</Step>
          <Step n={2} as="li">ふたつめ</Step>
        </ul>
      </Pad>
    )
  }
}

// クラスをそのまま並べる。ラップすると static steps / path が失われるので注意。
deck([Cover, Points])
