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
      blobs: {},
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
    const { onBlobular, width, height } = this.props;
    const { blobular } = this.state;
    return onBlobular(
      blobular,
    );
  }
  __createBlob(withId, withTransform, withPath) {
    const { onBlobCreated } = this.props;
    const { blobs } = this.state;
    this.state.blobs[withId] = {
      withTransform,
      withPath,
      withRotation: null,
      withMode: null,
    };
    this.setState({}, () => onBlobCreated(withId));
  }
  __updateBlob(withId, withTransform, withRotation, withPath, withMode) {
    const { blobs } = this.state;
    this.state.blobs[withId] = {
      withTransform,
      withRotation,
      withPath,
      withMode,
    };
    this.setState({});
  }
  __deleteBlob(withId) {
    const { onBlobDeleted } = this.props;
    const { blobs } = this.state;
    delete blobs[withId];
    this.setState({}, () => onBlobDeleted(withId));
  }
  render() {
    const {
      width,
      height,
      renderBlob,
      pointerEvents,
      ...extraProps
    } = this.props;
    const {
      blobs,
      panResponder,
    } = this.state;
    return (
      <View
        pointerEvents={pointerEvents}
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
  pointerEvents: PropTypes.string,
  onBlobular: PropTypes.func,
  onBlobCreated: PropTypes.func,
  onBlobDeleted: PropTypes.func,
};

BlobularView.defaultProps = {
  onBlobular: blobular => null,
  onBlobCreated: blobId => null,
  onBlobDeleted: blobId => null,
  pointerEvents: 'auto',
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
        d={withPath}
        fill="green"
        fillOpacity="0.5"
        stroke="green"
        strokeOpacity="0.8"
        {...extraProps}
      />
    );
  },
};

export default BlobularView;
