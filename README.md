# react-native-blobular
The [Man in Blue](https://www.themaninblue.com)'s awesome Blobular, ported to React Native.

<p align="center">
  <img src="./bin/out.gif" width="300" height="633">
</p>

You can find the original experiment [here](https://www.themaninblue.com/experiment/Blobular/)!

## 🚀 Getting Started

Using [`npm`]():

```sh
npm install --save react-native-blobular
```

Using [`yarn`]():

```sh
yarn add react-native-blobular
```

## ✍️ Example
It's pretty simple, just embed a `<Blobular />` inside your `render` method, then listen for the `onBlobular` callback, where you can allocate a number of `Blob`s for your user to play around with.

```javascript
import React from 'react';
import { Dimensions } from 'react-native';
import uuidv4 from 'uuid/v4';

import Blobular, { Blob } from 'react-native-blobular';

const { width, height } = Dimensions
  .get('window');

export default () => (
  <Blobular
    onBlobular={({ putBlob }) => putBlob(
      new Blob(
        uuidv4(), // unique id
        100, // radius
        75, // viscosity
        50, // min radius
      ),
      width * 0.5,
      height * 0.5,
    )}
  />
);
```

You can also suppress user interaction by supplying `pointerEvents="none"` to your `<Blobular />` component, and instead use the `blobular` instance returned in the callback to programmatically manipulate what's on screen.

## 📌 Props


## ✌️ License
[MIT](https://opensource.org/licenses/MIT)
