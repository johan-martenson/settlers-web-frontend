import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';
import React from 'react';
import Button from '../button';
import MapInformationCard from '../screens/create_game/map_information_card';
import OnOffSlider from '../on_off_slider';
import { Player } from '../screens/create_game/player';
import Slider from '../slider';
import GradientTriangleDemo from '../gradient_triangle_demo';
import RotatingTriangle from '../rotating_triangle';
import TypeControlDemo from '../type_control_demo';
import { SMALL_HOUSES, MEDIUM_HOUSES, LARGE_HOUSES } from '../api';

storiesOf('Button', module)
  .add('with text', () => (
    <Button onButtonClick={action('clicked')}>Hello Button</Button>
  ))
  .add('with some emoji', () => (
    <Button onButtonClick={action('clicked')}>😀 😎 👍 💯</Button>
  ));

storiesOf('Card', module)
  .add('with test', () => (
    <Card>Text in a card</Card>
  ))
  .add('with text and button', () => (
    <Card>Some text <Button onButtonClicked={action('clicked')}>Click</Button></Card>
  ));

const player = {
  type: 'HUMAN',
  name: 'Eric'
}

const computerPlayer = {
  type: 'COMPUTER',
  name: 'Ann'
}

storiesOf('Player', module)
  .add('Human player without id', () => (
    <Player player={player} />
  ))

  .add('Computer player without id', () => (
    <Player player={computerPlayer} />
  ))

  .add('Self player', () => (
    <Player player={player} isSelf={true} />
  ))

storiesOf('Slider', module)
  .add('Slider from 0 to 10', () => (
    <Slider min={0} max={10} initialValue={3} less="-" more="+" onValue={action('changed value')} step={1} />
  ))

const maps = [
  {
    title: "A mysterious map",
    id: "3",
    maxPlayers: 7,
    author: "A. Thour",
    width: 100,
    height: 100,
    startingPoints: [
      { x: 2, y: 2 },
      { x: 23, y: 23 },
      { x: 75, y: 75 },
      { x: 70, y: 20 },
      { x: 20, y: 70 },
      { x: 2, y: 15 },
      { x: 40, y: 5 },
    ]
  }
]

storiesOf('Mapentry', module)
  .add('Standard', () => (
    <MapInformationCard map={maps[0]} />
  )
  )

storiesOf('GradientTriangle', module)
  .add('Start',
    () => (
      <GradientTriangleDemo />
    ));

storiesOf('RotatingTriangle', module)
  .add('1 1 0',
    () => (<div>
      <RotatingTriangle intensities={[1, 1, 0]} />
      <RotatingTriangle intensities={[1, 0, 0]} />
      <RotatingTriangle intensities={[1, 0.2, 0]} />
    </div>
    ));

const commands = new Map();

SMALL_HOUSES.forEach((building) => commands.set(building, () => { console.log("Building medium building: " + building) }));
MEDIUM_HOUSES.forEach((building) => commands.set(building, () => { console.log("Building medium building: " + building) }));
LARGE_HOUSES.forEach((building) => commands.set(building, () => { console.log("Building large building: " + building) }));

commands.set("road", () => { console.log("Building road") })
commands.set("flag", () => { console.log("Raising flag") })
commands.set("remove", () => { console.log("Remove building")})


storiesOf('TypeControl', module)
  .add('Typing',
    () => (
      <TypeControlDemo commands={commands} />
    ));



