import React from 'react';
import { Dimensions } from 'react-native';
import uuidv4 from 'uuid/v4';

import BlobularView from './components/BlobularView';
import { Blob } from './lib/Blobular';

const { width, height } = Dimensions
  .get('window');

export default () => (
  <BlobularView
    onBlobular={({ putBlob }) => putBlob(
      new Blob(
        uuidv4(),
        100,
        75,
        50,
      ),
      width * 0.5,
      height * 0.5,
    )}
  />
);
