import React from 'react';
import { storiesOf } from '@storybook/react';
import { linkTo } from '@storybook/addon-links';
import { action } from '@storybook/addon-actions';
import Button from '../button';
import Card from '../card';

storiesOf('Welcome', module)
  .add('to Storybook', () => (
    <Welcome showApp={linkTo('Button')}/>
  ));

storiesOf('Button', module)
  .add('with text', () => (
    <Button onButtonClicked={action('clicked')}>Hello Button</Button>
  ))
  .add('with some emoji', () => (
    <Button onButtonClicked={action('clicked')}>😀 😎 👍 💯</Button>
  ));

  storiesOf('Card', module)
  .add('with test', () => (
    <Card>Text in a card</Card>
  ));
