import React from 'react';
import PropTypes from 'prop-types';
import {
  PanResponder,
  View,
  Dimensions,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import uuidv4 from 'uuid/v4';

import { Blobular, Blob } from '../lib/Blobular';

const {
  width: screenWidth,
  height: screenHeight,
} = Dimensions.get('window');

class BlobularView extends React.Component {
  constructor(props) {
    super(props);
    this.__createBlob = this.__createBlob.bind(this);
    this.__updateBlob = this.__updateBlob.bind(this);
    this.__deleteBlob = this.__deleteBlob.bind(this);
    this.__onPanResponderGrant = this.__onPanResponderGrant.bind(this);
    this.__onPanResponderMove = this.__onPanResponderMove.bind(this);
    this.__onPanResponderFinish = this.__onPanResponderFinish.bind(this);
    this.state = {
      blobs: {
        // [id], component (with key)
      },
      blobular: new Blobular(
        {
          createBlob: this.__createBlob,
          updateBlob: this.__updateBlob,
          deleteBlob: this.__deleteBlob,
        },
      ),
      panResponder: PanResponder
        .create(
          {
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderTerminationRequest: () => true,
            onPanResponderGrant: this.__onPanResponderGrant,
            onPanResponderMove: this.__onPanResponderMove,
            onPanResponderRelease: this.__onPanResponderFinish,
            onPanResponderTerminate: this.__onPanResponderFinish,
          },
        ),
    };
  }
  __onPanResponderGrant(e, gestureState) {
    const { locationX, locationY } = e.nativeEvent;
    const { blobular } = this.state;
    blobular
      .onPointerDown(
        locationX,
        locationY,
      );
  }
  __onPanResponderMove(e, gestureState) {
    const { locationX, locationY } = e.nativeEvent;
    const { blobular } = this.state;
    blobular
      .onPointerMoved(
        locationX,
        locationY,
      );
  }
  __onPanResponderFinish(e, gestureState) {
    const { locationX, locationY } = e.nativeEvent;
    const { blobular } = this.state;
    blobular
      .onPointerUp(
        locationX,
        locationY,
      );

  }
  componentDidMount() {
    const { width, height } = this.props;
    const { blobular } = this.state;
    blobular
      .putBlob(
        new Blob(
          uuidv4(),
          200,
          75,
          50,
        ),
        width * 0.5,
        height * 0.5,
      );
  }
  __createBlob(withId, withTransform, withPath) {
    const { blobs } = this.state;
    this.setState(
      {
        blobs: {
          ...blobs,
          [withId]: {
            withTransform,
            withPath,
            withRotation: null, // TODO: experiment with delegation @html
            withMode: null,
          },
        },
      },
    );
  }
  __updateBlob(withId, withTransform, withRotation, withPath, withMode) {
    const { blobs } = this.state;
    this.setState(
      {
        blobs: {
          ...blobs,
          [withId]: {
            withTransform,
            withRotation,
            withPath,
            withMode,
          },
        },
      },
    );
  }
  __deleteBlob(withId) {
    const { blobs } = this.state;
    this.setState(
      {
        blobs: Object.entries(blobs)
          .reduce(
            (obj, [key, value]) => {
              if (key !== withId) {
                return {
                  ...obj,
                  [key]: value,
                };
              }
              return obj;
            },
            {},
          ),
      },
    );
  }
  render() {
    const {
      width,
      height,
      renderBlob,
      ...extraProps
    } = this.props;
    const {
      blobs,
      panResponder,
    } = this.state;
    return (
      <View
        {...panResponder.panHandlers}
        style={{
          width,
          height,
        }}
      >
        <Svg
          width={`${width}`}
          height={`${height}`}
          viewBox={`0 0 ${width} ${height}`}
          {...extraProps}
        >
          {Object.entries(blobs).map(
            ([withId, { withTransform, withRotation, withPath, withMode }]) => (
              renderBlob(
                withId,
                withTransform,
                withRotation,
                withPath,
                withMode,
              )
            ),
          )}
        </Svg>
      </View>
    );
  }
}

BlobularView.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  renderBlob: PropTypes.func,
};

BlobularView.defaultProps = {
  width: screenWidth,
  height: screenHeight,
  renderBlob: (withId, withTransform, withRotation, withPath, withMode) => {
    const extraProps = {
      ...(
        (!!withTransform) ? {
          x: `${withTransform[0]}`,
          y: `${withTransform[1]}`,
        } : {}
      ),
      ...(
        (!!withRotation) ? {
          rotation: withRotation,
        } : {}
      )
    };
    return (
      <Path
        key={withId}
        ref={withId}
        d={withPath}
        fill="red"
        stroke="blue"
        {...extraProps}
      />
    );
  },
};

export default BlobularView;
