import React from 'react';
import { storiesOf } from '@storybook/react';
import { linkTo } from '@storybook/addon-links';
import { action } from '@storybook/addon-actions';
import Button from '../button';
import Welcome from './Welcome';
import Card from '../card'
import OnOffSlider from '../on_off_slider'
import { Player } from '../player'
import Slider from '../slider'
import { MapList } from '../map_list';
import MapInformationCard from '../map_information_card';

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

storiesOf('OnOffSlider', module)
  .add('On', () => (
    <OnOffSlider initialValue={true} onValueChange={action('changed value')} />
  ))
  .add('Off', () => (
    <OnOffSlider initialValue={false} onValueChange={action('changed value')} />
  ))
  .add('Default', () => (
    <OnOffSlider onValueChange={action('changed value')} />
  ))

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
      {x: 2, y: 2},
      {x: 23, y: 23},
      {x: 75, y: 75},
      {x: 70, y: 20},
      {x: 20, y: 70},
      {x: 2, y: 15},
      {x: 40, y: 5},
    ]
  }
]

storiesOf('Mapentry', module)
  .add('Standard', () => (
    <MapInformationCard map={maps[0]} />
  )
  )